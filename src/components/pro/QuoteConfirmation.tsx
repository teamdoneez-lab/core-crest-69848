import { useState, useEffect } from "react";
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
  const [hasExpired, setHasExpired] = useState(false);

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
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Store checkout info for callback
      sessionStorage.setItem('pending_checkout', JSON.stringify({
        request_id: quote.request_id,
        quote_id: quote.id
      }));

      // Create referral fee checkout with auth header
      const { data, error } = await supabase.functions.invoke("create-referral-checkout", {
        body: { 
          quote_id: quote.id 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
      // Update quote status to declined - MUST complete before hiding
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ 
          status: "declined",
          updated_at: new Date().toISOString()
        })
        .eq("id", quote.id);

      if (quoteError) {
        console.error("Error updating quote:", quoteError);
        throw quoteError;
      }

      // Update referral fee status
      const { error: feeError } = await supabase
        .from("referral_fees")
        .update({ 
          status: "declined",
          updated_at: new Date().toISOString()
        })
        .eq("quote_id", quote.id);

      if (feeError) {
        console.error("Error updating referral fee:", feeError);
      }

      // Verify the update completed successfully
      const { data: verifyData } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quote.id)
        .single();

      if (verifyData?.status !== "declined") {
        throw new Error("Quote status update verification failed");
      }

      // Only hide and refresh after successful database update
      setIsDeclined(true);

      toast({
        title: "Quote Declined",
        description: "Customer has been notified to select another quote.",
      });

      // Refresh the list
      onConfirmed();
    } catch (error) {
      console.error("Error declining quote:", error);
      toast({
        title: "Error",
        description: "Failed to decline quote. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const timeRemaining = getTimeRemaining();
  const isExpired = timeRemaining === "Expired";

  // Auto-update expired quotes
  useEffect(() => {
    const updateExpiredQuote = async () => {
      if (isExpired && !hasExpired) {
        setHasExpired(true);
        try {
          // Update quote status to expired
          const { error } = await supabase
            .from("quotes")
            .update({ status: "expired" })
            .eq("id", quote.id);

          if (error) {
            console.error("Error updating expired quote:", error);
            return;
          }

          // Update referral fee if exists
          const { error: feeError } = await supabase
            .from("referral_fees")
            .update({ status: "expired" })
            .eq("quote_id", quote.id);

          if (feeError) {
            console.error("Error updating referral fee:", feeError);
          }

          // Notify parent to refresh
          setTimeout(() => {
            onConfirmed();
          }, 2000);
        } catch (error) {
          console.error("Error processing expired quote:", error);
        }
      }
    };

    updateExpiredQuote();
  }, [isExpired, hasExpired, quote.id, onConfirmed]);

  // Hide immediately if declined
  if (isDeclined) {
    return null;
  }

  // Don't show anything if already expired
  if (isExpired) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 pb-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-red-700">⏰ Quote Expired</p>
            <p className="text-sm text-red-600">
              Time limit exceeded. Customer has been notified to select another quote.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
            <p className="text-sm font-semibold text-orange-800">
              ⚡ Confirm now to secure this appointment
            </p>
            <p className="text-xs text-orange-700 mt-1">
              {timeRemaining} remaining • Referral fee: ${(quote.estimated_price * 0.1).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="flex-1" disabled={isProcessing}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm & Pay Fee
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm this appointment?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be redirected to pay the referral fee (${(quote.estimated_price * 0.1).toFixed(2)}). Once paid, the appointment will be confirmed and customer contact details will be shared with you.
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="flex-1" disabled={isProcessing}>
              <XCircle className="mr-2 h-4 w-4" />
              Decline
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline this quote?</AlertDialogTitle>
              <AlertDialogDescription>
                The customer will be notified to select another quote. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDecline} className="bg-red-600 hover:bg-red-700">
                Decline Quote
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
