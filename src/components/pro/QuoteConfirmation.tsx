import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Quote Confirmation
        </CardTitle>
        <CardDescription>
          Confirm your quote for this service request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p>Quote confirmation requires database setup.</p>
          <p className="text-sm mt-2">The quotes table needs to be created.</p>
        </div>
      </CardContent>
    </Card>
  );
}