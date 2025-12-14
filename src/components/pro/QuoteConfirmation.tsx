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
  const handlePayReferralFee = async () => {
    try {
      const res = await fetch("https://<replit>/api/referral-fee/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointment_id: quote.id }),
      });

      if (!res.ok) {
        console.error("Failed to create referral fee checkout session:", await res.text());
        return;
      }

      const data = await res.json();
      const checkoutUrl = data?.checkout_url;

      if (!checkoutUrl || typeof checkoutUrl !== "string") {
        console.error("Missing checkout_url in response:", data);
        return;
      }

      // iframe-safe redirect
      if (typeof window !== "undefined" && window.top && window.top !== window.self) {
        window.top.location.href = checkoutUrl;
      } else {
        window.location.href = checkoutUrl;
      }

      // optional local callback (won't run if redirect happens immediately, but harmless)
      onConfirmed();
    } catch (err) {
      console.error("Error starting referral fee checkout:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Quote Confirmation
        </CardTitle>
        <CardDescription>Confirm your quote for this service request</CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={handlePayReferralFee}
          className="w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Pay referral fee
        </button>
      </CardContent>
    </Card>
  );
}
