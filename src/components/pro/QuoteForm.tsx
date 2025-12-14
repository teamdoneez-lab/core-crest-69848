import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { QuoteFormFields } from "./QuoteFormFields";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuoteFormProps {
  requestId: string;
  onSuccess: () => void;
}

export function QuoteForm({ requestId, onSuccess }: QuoteFormProps) {
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a quote",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("quotes" as any)
        .insert({
          service_request_id: requestId,
          pro_id: user.id,
          estimated_price: parseFloat(estimatedPrice),
          description,
          notes: notes || null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Quote Submitted",
        description: "Your quote has been sent to the customer",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Quote submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit quote",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPhotos = async () => {
    toast({
      title: "Photo Request Sent",
      description: "Customer will be notified to upload more photos",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submit Quote
        </CardTitle>
        <CardDescription>
          Create a quote for this service request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QuoteFormFields
          estimatedPrice={estimatedPrice}
          setEstimatedPrice={setEstimatedPrice}
          description={description}
          setDescription={setDescription}
          notes={notes}
          setNotes={setNotes}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onRequestPhotos={handleRequestPhotos}
        />
      </CardContent>
    </Card>
  );
}
