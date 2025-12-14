import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AppointmentCancellationProps {
  appointmentId: string;
  requestId: string;
  status: string;
  hasRevisedQuote: boolean;
  onCancelled: () => void;
}

export function AppointmentCancellation({ 
  appointmentId, 
  requestId,
  status, 
  hasRevisedQuote,
  onCancelled 
}: AppointmentCancellationProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  // PHASE 4: Anti-bypass logic - Only allow cancellation during inspection or after declining revised quote
  const canCancel = status === "pending_inspection" || (status === "confirmed" && hasRevisedQuote);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const cancellationReason = hasRevisedQuote ? "cancelled_after_requote" : "cancelled_by_customer";

      // Call edge function to process cancellation and refund
      const { data, error } = await supabase.functions.invoke("process-appointment-cancellation", {
        body: {
          appointment_id: appointmentId,
          cancellation_reason: cancellationReason,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Failed to cancel appointment");
      }

      toast({
        title: "Appointment Cancelled",
        description: hasRevisedQuote 
          ? "The revised quote was declined. The professional's referral fee has been refunded."
          : "Your appointment has been cancelled and the professional's fee has been refunded.",
      });

      onCancelled();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel appointment",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Show warning if trying to cancel confirmed job without declined revised quote
  if (status === "confirmed" && !canCancel) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Cancellations are only allowed if the mechanic has submitted a revised quote that you declined.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isCancelling}>
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Appointment
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasRevisedQuote 
              ? "You are declining the revised quote. The professional's referral fee will be refunded. You can create a new service request if needed."
              : "Are you sure you want to cancel this appointment? This action cannot be undone."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
            Yes, Cancel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
