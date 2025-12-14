import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface RevisedQuoteFormProps {
  originalQuoteId: string;
  requestId: string;
  originalPrice: number;
  onSuccess: () => void;
}

export function RevisedQuoteForm({ originalQuoteId, requestId, originalPrice, onSuccess }: RevisedQuoteFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Submit Revised Quote
        </CardTitle>
        <CardDescription>
          Update your original quote of ${originalPrice.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p>Revised quote form requires database setup.</p>
          <p className="text-sm mt-2">The quotes table needs to be created.</p>
        </div>
      </CardContent>
    </Card>
  );
}