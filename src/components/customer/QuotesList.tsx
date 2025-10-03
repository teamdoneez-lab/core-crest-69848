import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DollarSign, CheckCircle, XCircle } from "lucide-react";
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

interface Quote {
  id: string;
  estimated_price: number;
  description: string;
  notes: string | null;
  status: string;
  created_at: string;
  pro_id: string;
  confirmation_timer_expires_at: string | null;
  confirmation_timer_minutes: number | null;
  is_revised: boolean;
  profiles: {
    name: string | null;
  } | null;
}

interface QuotesListProps {
  requestId: string;
}

export function QuotesList({ requestId }: QuotesListProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();

    // Subscribe to real-time updates for new quotes
    const channel = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `request_id=eq.${requestId}`
        },
        () => {
          fetchQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          profiles:pro_id (name)
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      const { data, error } = await supabase.rpc("accept_quote_with_timer", {
        quote_id_input: quoteId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; timer_minutes?: number };
      
      if (!result.success) {
        throw new Error(result.error || "Failed to accept quote");
      }

      toast({
        title: "Quote Selected",
        description: `The professional has ${result.timer_minutes} minutes to confirm. You'll be notified once they accept.`,
      });

      fetchQuotes();
    } catch (error) {
      console.error("Error accepting quote:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept quote",
        variant: "destructive",
      });
    }
  };

  const handleDeclineQuote = async (quoteId: string) => {
    try {
      // Update quote status to declined
      const { error } = await supabase
        .from("quotes")
        .update({ status: "declined" })
        .eq("id", quoteId);

      if (error) throw error;

      // Get the referral fee for this quote to trigger refund
      const { data: referralFee } = await supabase
        .from("referral_fees")
        .select("id, status")
        .eq("quote_id", quoteId)
        .eq("status", "paid")
        .single();

      // If there's a paid referral fee, trigger refund
      if (referralFee) {
        const { error: refundError } = await supabase.functions.invoke("refund-referral-fee", {
          body: { referral_fee_id: referralFee.id },
        });

        if (refundError) {
          console.error("Error refunding fee:", refundError);
          toast({
            title: "Quote Declined",
            description: "Quote declined but refund may need manual processing",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Quote Declined",
            description: "The professional has been notified and the fee has been refunded",
          });
        }
      } else {
        toast({
          title: "Quote Declined",
          description: "The professional has been notified",
        });
      }

      fetchQuotes();
    } catch (error) {
      console.error("Error declining quote:", error);
      toast({
        title: "Error",
        description: "Failed to decline quote",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, isRevised: boolean = false) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "outline", label: isRevised ? "Revised Quote" : "Pending" },
      pending_confirmation: { variant: "secondary", label: "Awaiting Confirmation" },
      confirmed: { variant: "default", label: "Confirmed" },
      accepted: { variant: "default", label: "Accepted" },
      declined: { variant: "destructive", label: "Declined" },
      expired: { variant: "destructive", label: "Expired" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min remaining`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m remaining`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading quotes...</div>;
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No quotes received yet. Professionals will submit quotes soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <Card key={quote.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {quote.profiles?.name || "Unknown Professional"}
                </CardTitle>
                <Badge variant="secondary" className="mt-1">
                  ✓ Verified Professional
                </Badge>
              </div>
              {getStatusBadge(quote.status, quote.is_revised)}
            </div>
            <CardDescription>
              Submitted {new Date(quote.created_at).toLocaleDateString()}
              {quote.status === "pending_confirmation" && quote.confirmation_timer_expires_at && (
                <span className="ml-2 text-orange-600 font-semibold">
                  • {getTimeRemaining(quote.confirmation_timer_expires_at)}
                </span>
              )}
              {quote.status === "expired" && (
                <span className="ml-2 text-red-600">
                  • Professional didn't confirm in time. Please choose another quote.
                </span>
              )}
              {quote.status === "declined" && (
                <span className="ml-2 text-red-600">
                  • Professional declined. Please choose another quote.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
              <DollarSign className="h-6 w-6" />
              {quote.estimated_price.toFixed(2)}
            </div>
            <div>
              <h4 className="font-semibold mb-1">Service Description:</h4>
              <p className="text-sm text-muted-foreground">{quote.description}</p>
            </div>
            {quote.notes && (
              <div>
                <h4 className="font-semibold mb-1">Additional Notes:</h4>
                <p className="text-sm text-muted-foreground">{quote.notes}</p>
              </div>
            )}
          </CardContent>
          {quote.status === "pending" && (
            <CardFooter className="gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex-1">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Select Quote
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Select this quote?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The professional will be notified to confirm your appointment. They must confirm within the time limit based on your service urgency.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAcceptQuote(quote.id)}>
                      Select
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" className="flex-1" onClick={() => handleDeclineQuote(quote.id)}>
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </CardFooter>
          )}
          {quote.status === "pending_confirmation" && (
            <CardFooter>
              <div className="w-full text-center text-sm text-muted-foreground">
                Awaiting confirmation from professional...
              </div>
            </CardFooter>
          )}
          {quote.status === "confirmed" && (
            <CardFooter>
              <div className="w-full text-center text-sm font-semibold text-green-600">
                ✓ Confirmed! Check your appointments for details.
              </div>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
