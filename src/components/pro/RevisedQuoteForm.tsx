import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RevisedQuoteFormProps {
  originalQuoteId: string;
  requestId: string;
  originalPrice: number;
  onSuccess: () => void;
}

export function RevisedQuoteForm({ originalQuoteId, requestId, originalPrice, onSuccess }: RevisedQuoteFormProps) {
  const [revisedPrice, setRevisedPrice] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert revised quote
      const { error: quoteError } = await supabase
        .from("quotes")
        .insert({
          request_id: requestId,
          pro_id: user.id,
          estimated_price: parseFloat(revisedPrice),
          description: reason,
          notes: `Revised quote after inspection. Original price: $${originalPrice.toFixed(2)}`,
          status: "pending",
          is_revised: true,
          original_quote_id: originalQuoteId,
          revised_at: new Date().toISOString(),
        });

      if (quoteError) throw quoteError;

      toast({
        title: "Revised Quote Submitted",
        description: "Customer will be notified of the updated price.",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting revised quote:", error);
      toast({
        title: "Error",
        description: "Failed to submit revised quote",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Revised Quote</CardTitle>
        <CardDescription>
          After inspecting the vehicle, provide an updated price if needed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            If the customer declines the revised quote, your referral fee will be refunded.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Original Price</Label>
            <div className="text-2xl font-bold text-muted-foreground">
              ${originalPrice.toFixed(2)}
            </div>
          </div>

          <div>
            <Label htmlFor="revisedPrice">Revised Price ($) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="revisedPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={revisedPrice}
                onChange={(e) => setRevisedPrice(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Price Change *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why the price changed (e.g., additional parts needed, more labor required...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Revised Quote"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
