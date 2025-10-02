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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("quotes").insert({
        request_id: requestId,
        pro_id: user.id,
        estimated_price: parseFloat(estimatedPrice),
        description,
        notes,
        status: "pending",
      });

      if (error) throw error;

      // Send email notification to customer
      const { data: insertedQuote } = await supabase
        .from("quotes")
        .select("id")
        .eq("request_id", requestId)
        .eq("pro_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (insertedQuote) {
        await supabase.functions.invoke("send-quote-email", {
          body: { quoteId: insertedQuote.id },
        });
      }

      toast({
        title: "Quote Submitted",
        description: "Your quote has been sent to the customer via email",
      });

      onSuccess();
    } catch (error) {
      console.error("Error submitting quote:", error);
      toast({
        title: "Error",
        description: "Failed to submit quote",
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
        {isSubmitting ? "Submitting..." : "Submit Quote"}
      </Button>
    </form>
  );
}
