import { Card, CardContent } from "@/components/ui/card";

interface QuoteFormFieldsProps {
  estimatedPrice: string;
  setEstimatedPrice: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onRequestPhotos: () => void;
}

export function QuoteFormFields(props: QuoteFormFieldsProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm">Quote form coming soon.</p>
      </CardContent>
    </Card>
  );
}

export default QuoteFormFields;
