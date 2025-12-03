import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface QuoteFormProps {
  requestId: string;
  onSuccess: () => void;
}

export function QuoteForm({ requestId, onSuccess }: QuoteFormProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Submit Quote</CardTitle>
      </CardHeader>
      <CardContent className="py-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Quote submission requires additional database setup.
        </p>
        <p className="text-xs text-muted-foreground">
          Request ID: {requestId}
        </p>
      </CardContent>
    </Card>
  );
}
