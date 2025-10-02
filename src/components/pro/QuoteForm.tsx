import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";

interface QuoteFormProps {
  requestId: string;
  onSuccess: () => void;
}

export function QuoteForm({ requestId, onSuccess }: QuoteFormProps) {
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create Stripe checkout session for quote payment
      const { data, error } = await supabase.functions.invoke("create-quote-checkout", {
        body: {
          request_id: requestId,
          estimated_price: parseFloat(estimatedPrice),
          description,
          notes,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment Required",
          description: "Please complete payment to submit your quote. The page will open in a new tab.",
        });
      }
    } catch (error) {
      console.error("Error creating quote checkout:", error);
      toast({
        title: "Error",
        description: "Failed to initiate quote submission",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="estimatedPrice">Estimated Price ($)</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="estimatedPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={estimatedPrice}
            onChange={(e) => setEstimatedPrice(e.target.value)}
            required
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Service Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the work to be performed..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional information..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Processing..." : "Pay Fee & Submit Quote"}
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        A 10% referral fee (${(parseFloat(estimatedPrice || "0") * 0.10).toFixed(2)}) is required to submit this quote
      </p>
    </form>
  );
}
