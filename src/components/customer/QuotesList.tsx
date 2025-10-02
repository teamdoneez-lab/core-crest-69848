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
      const { error } = await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", quoteId);

      if (error) throw error;

      toast({
        title: "Quote Accepted",
        description: "The professional will be notified to complete payment",
      });

      fetchQuotes();
    } catch (error) {
      console.error("Error accepting quote:", error);
      toast({
        title: "Error",
        description: "Failed to accept quote",
        variant: "destructive",
      });
    }
  };

  const handleDeclineQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "declined" })
        .eq("id", quoteId);

      if (error) throw error;

      toast({
        title: "Quote Declined",
        description: "The professional has been notified",
      });

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      accepted: { variant: "default", label: "Accepted" },
      declined: { variant: "destructive", label: "Declined" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
              <CardTitle className="text-lg">
                {quote.profiles?.name || "Unknown Pro"}
              </CardTitle>
              {getStatusBadge(quote.status)}
            </div>
            <CardDescription>
              Submitted {new Date(quote.created_at).toLocaleDateString()}
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
                    Accept Quote
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Accept this quote?</AlertDialogTitle>
                    <AlertDialogDescription>
                      By accepting this quote, the professional will be notified to pay the referral fee and proceed with the service.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAcceptQuote(quote.id)}>
                      Accept
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
        </Card>
      ))}
    </div>
  );
}
