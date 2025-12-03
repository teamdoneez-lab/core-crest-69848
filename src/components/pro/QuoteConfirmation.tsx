import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface PendingQuote {
  id: string;
  estimated_price: number;
  description: string;
  status: string;
  confirmation_timer_expires_at: string | null;
  confirmation_timer_minutes: number | null;
  request_id: string;
  service_requests: {
    vehicle_make: string;
    model: string;
    year: number;
    urgency: string;
  };
}

interface QuoteConfirmationProps {
  quote: PendingQuote;
  onConfirmed: () => void;
}

export function QuoteConfirmation({ quote, onConfirmed }: QuoteConfirmationProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quote Confirmation</CardTitle>
      </CardHeader>
      <CardContent className="py-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Quote confirmation requires additional database setup.
        </p>
        <p className="text-xs text-muted-foreground">
          Quote ID: {quote.id}
        </p>
      </CardContent>
    </Card>
  );
}
