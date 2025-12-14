import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProDetailWithReviewsModal } from '@/components/customer/ProDetailWithReviewsModal';
import { SelectProButton } from '@/components/customer/SelectProButton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Calendar, DollarSign, CheckCircle, XCircle, User, Clock, Award } from "lucide-react";
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
  pro_profiles: {
    business_name: string | null;
    description: string | null;
    phone: string | null;
    website: string | null;
    is_verified: boolean | null;
  } | null;
  pro_service_categories?: Array<{
    service_categories: {
      name: string;
    };
  }>;
}

interface QuotesListProps {
  requestId: string;
}

export function QuotesList({ requestId }: QuotesListProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [proDetailModalOpen, setProDetailModalOpen] = useState(false);
  const [selectedProId, setSelectedProId] = useState<string | null>(null);

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
      // Fetch quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (quotesError) throw quotesError;

      // Fetch pro profiles and service categories for each quote
      if (quotesData && quotesData.length > 0) {
        const proIds = [...new Set(quotesData.map(q => q.pro_id))];
        
        // Get pro profiles with more details
        const { data: proProfilesData } = await supabase
          .from("pro_profiles")
          .select("pro_id, business_name, description, phone, website, is_verified")
          .in("pro_id", proIds);

        // Get service categories for each pro
        const { data: serviceCategoriesData } = await supabase
          .from("pro_service_categories")
          .select(`
            pro_id,
            service_categories (
              name
            )
          `)
          .in("pro_id", proIds);

        // Merge the data
        const quotesWithProfiles = quotesData.map(quote => {
          const profile = proProfilesData?.find(p => p.pro_id === quote.pro_id);
          const categories = serviceCategoriesData?.filter(c => c.pro_id === quote.pro_id) || [];
          
          return {
            ...quote,
            pro_profiles: profile || null,
            pro_service_categories: categories
          };
        });

        setQuotes(quotesWithProfiles);
      } else {
        setQuotes([]);
      }
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

      // Send email notification to professional
      try {
        const { error: emailError } = await supabase.functions.invoke('send-quote-selected-email', {
          body: { quoteId }
        });
        
        if (emailError) {
          console.error('Email notification error:', emailError);
          // Don't fail the quote acceptance if email fails
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
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
        .maybeSingle();

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

  const handleCancelQuote = async (quoteId: string) => {
    try {
      // Update quote status to cancelled
      const { error } = await supabase
        .from("quotes")
        .update({ status: "declined" })
        .eq("id", quoteId);

      if (error) throw error;

      toast({
        title: "Quote Cancelled",
        description: "The professional has been notified",
      });

      fetchQuotes();
    } catch (error) {
      console.error("Error cancelling quote:", error);
      toast({
        title: "Error",
        description: "Failed to cancel quote",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, isRevised: boolean = false) => {
    if (status === 'submitted' || status === 'pending') {
      return (
        <Badge variant="secondary">
          {isRevised ? "Revised Quote Available" : "Available to Select"}
        </Badge>
      );
    }
    if (status === 'selected' || status === 'pending_confirmation') {
      return (
        <Badge className="bg-orange-100 text-orange-800">
          ⏳ Awaiting Pro Payment
        </Badge>
      );
    }
    if (status === 'confirmed') {
      return (
        <Badge className="bg-green-100 text-green-800">
          ✓ Confirmed - Job Secured
        </Badge>
      );
    }
    if (status === 'not_selected') {
      return (
        <Badge variant="outline" className="text-gray-500">
          Not Selected
        </Badge>
      );
    }
    if (status === 'declined') {
      return (
        <Badge variant="outline" className="text-gray-500">
          Declined by Pro
        </Badge>
      );
    }
    if (status === 'expired') {
      return (
        <Badge variant="outline" className="text-red-500">
          ⏰ Expired - Choose Another
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
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

  const getCompactStatusBadge = (status: string) => {
    if (status === 'submitted' || status === 'pending') return <Badge variant="secondary" className="text-xs">✓ Available</Badge>;
    if (status === 'selected' || status === 'pending_confirmation') return <Badge className="bg-orange-100 text-orange-800 text-xs">⏳ Awaiting Payment</Badge>;
    if (status === 'confirmed') return <Badge className="bg-green-100 text-green-800 text-xs">✓ Confirmed</Badge>;
    if (status === 'not_selected') return <Badge variant="outline" className="text-gray-500 text-xs">Not Selected</Badge>;
    if (status === 'declined') return <Badge variant="outline" className="text-gray-500 text-xs">✗ Declined</Badge>;
    if (status === 'expired') return <Badge variant="outline" className="text-red-500 text-xs">⏰ Expired</Badge>;
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quotes.map((quote) => (
        <Card key={quote.id} className="flex flex-col hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {(quote.pro_profiles?.business_name || "U").charAt(0).toUpperCase()}
              </div>
              {getCompactStatusBadge(quote.status)}
            </div>
            <CardTitle className="text-base line-clamp-1">
              {quote.pro_profiles?.business_name || "Unknown Professional"}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {quote.pro_profiles?.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  ✓ Verified
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 pb-3">
            <div className="space-y-3">
              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">
                  ${quote.estimated_price.toFixed(0)}
                </span>
                <span className="text-sm text-muted-foreground">.{(quote.estimated_price % 1).toFixed(2).slice(2)}</span>
              </div>

              {/* Short Description */}
              {quote.pro_profiles?.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {quote.pro_profiles.description}
                </p>
              )}

              {/* Service Description */}
              <div className="text-xs text-muted-foreground line-clamp-3 bg-muted/30 p-2 rounded">
                {quote.description}
              </div>

              {/* Status Messages */}
              {quote.status === "selected" && (
                <div className="text-xs p-2 bg-orange-50 border border-orange-200 rounded">
                  <span className="text-orange-700 font-semibold">
                    Waiting for pro to confirm payment
                  </span>
                </div>
              )}
              {quote.status === "confirmed" && (
                <div className="text-xs p-2 bg-green-50 border border-green-200 rounded">
                  <span className="text-green-700 font-semibold">✅ Confirmed</span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setSelectedProId(quote.pro_id);
                setProDetailModalOpen(true);
              }}
            >
              <User className="h-3 w-3 mr-1" />
              View Profile
            </Button>
            
            {(quote.status === "submitted" || quote.status === "pending") && (
              <SelectProButton 
                quoteId={quote.id}
                requestId={requestId}
                proName={quote.pro_profiles?.business_name || "Unknown Professional"}
                amount={quote.estimated_price}
                onSuccess={fetchQuotes}
              />
            )}

            {(quote.status === "selected" || quote.status === "pending_confirmation") && (
              <Button 
                size="sm" 
                className="w-full" 
                variant="outline"
                disabled
              >
                <Clock className="mr-1 h-3 w-3" />
                Awaiting Pro Confirmation
              </Button>
            )}

            {quote.status === "confirmed" && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => window.location.href = '/appointments'}
              >
                <Calendar className="mr-1 h-3 w-3" />
                Book Appointment
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
    {selectedProId && (
      <ProDetailWithReviewsModal
        open={proDetailModalOpen}
        onOpenChange={setProDetailModalOpen}
        proId={selectedProId}
      />
    )}
    </>
  );
}
