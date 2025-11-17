import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SelectProButtonProps {
  quoteId: string;
  requestId: string;
  proName: string;
  amount: number;
  onSuccess: () => void;
}

export function SelectProButton({ quoteId, requestId, proName, amount, onSuccess }: SelectProButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectPro = async () => {
    setIsSelecting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('select-pro', {
        body: {
          request_id: requestId,
          quote_id: quoteId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "Pro Selected!",
        description: `${proName} has been selected. They'll be notified to confirm by paying the referral fee.`,
      });

      setShowConfirmDialog(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error selecting pro:", error);
      toast({
        title: "Selection Failed",
        description: error.message || "Failed to select pro. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setShowConfirmDialog(true)}
        className="w-full"
      >
        Select This Pro
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select {proName}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You're about to select this professional for your service request.</p>
              <p className="font-semibold text-foreground">Quote Amount: ${amount.toFixed(2)}</p>
              <p>Once you confirm, {proName} will be notified and must pay a referral fee to confirm the appointment. You'll be able to schedule your appointment once they confirm.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSelecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSelectPro}
              disabled={isSelecting}
            >
              {isSelecting ? "Selecting..." : "Confirm Selection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
