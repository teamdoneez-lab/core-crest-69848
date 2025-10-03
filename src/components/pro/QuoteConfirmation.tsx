import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);

  const getTimeRemaining = () => {
    if (!quote.confirmation_timer_expires_at) return null;
    const now = new Date();
    const expires = new Date(quote.confirmation_timer_expires_at);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // Store checkout info for callback
      sessionStorage.setItem('pending_checkout', JSON.stringify({
        request_id: quote.request_id,
        quote_id: quote.id
      }));

      // Create referral fee checkout
      const { data, error } = await supabase.functions.invoke("create-referral-checkout", {
        body: { 
          quote_id: quote.id 
        },
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error confirming quote:", error);
      toast({
        title: "Error",
        description: "Failed to confirm quote. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      sessionStorage.removeItem('pending_checkout');
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "declined" })
        .eq("id", quote.id);

      if (error) throw error;

      setIsDeclined(true);
      
      toast({
        title: "Quote Declined",
        description: "Customer has been notified to select another quote.",
      });

      onConfirmed();
    } catch (error) {
      console.error("Error declining quote:", error);
      toast({
        title: "Error",
        description: "Failed to decline quote",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const timeRemaining = getTimeRemaining();
  const isExpired = timeRemaining === "Expired";

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            🎉 Customer Selected Your Quote!
          </CardTitle>
          <Badge variant="secondary" className="font-semibold">
            <Clock className="h-3 w-3 mr-1" />
            {timeRemaining}
          </Badge>
        </div>
        <CardDescription>
          {quote.service_requests.year} {quote.service_requests.vehicle_make} {quote.service_requests.model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-semibold text-lg">${quote.estimated_price.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{quote.description}</p>
          <p className="text-sm font-semibold text-orange-700">
            {isExpired 
              ? "⏰ Time expired! Quote will be declined automatically."
              : `⚡ Confirm now to secure this appointment. ${timeRemaining} remaining.`
            }
          </p>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="flex-1" disabled={isProcessing || isExpired || isDeclined}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm & Pay Fee
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm this appointment?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be redirected to pay the referral fee (${quote.estimated_price * 0.1}). Once paid, the appointment will be confirmed and customer contact details will be shared with you.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm}>
                Continue to Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="outline" className="flex-1" onClick={handleDecline} disabled={isProcessing || isDeclined}>
          <XCircle className="mr-2 h-4 w-4" />
          {isDeclined ? "Declined" : "Decline"}
        </Button>
      </CardFooter>
    </Card>
  );
}
