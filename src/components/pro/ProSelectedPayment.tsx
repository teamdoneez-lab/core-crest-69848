import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { DollarSign, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReferralFee {
  id: string;
  amount: number;
  status: string;
  quote_id: string;
  quotes: {
    estimated_price: number;
    description: string;
    service_requests: {
      vehicle_make: string;
      model: string;
      year: number;
      address: string;
    };
  };
}

export function ProSelectedPayment() {
  const [referralFees, setReferralFees] = useState<ReferralFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<ReferralFee | null>(null);

  useEffect(() => {
    fetchPendingPayments();

    // Real-time updates
    const channel = supabase
      .channel("referral-fees-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "referral_fees",
        },
        () => {
          fetchPendingPayments();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("referral_fees")
        .select(
          `
          id,
          amount,
          status,
          quote_id,
          quotes (
            estimated_price,
            description,
            service_requests (
              vehicle_make,
              model,
              year,
              address
            )
          )
        `,
        )
        .eq("pro_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReferralFees(data || []);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayReferralFee = async (fee: ReferralFee) => {
    setProcessingPayment(fee.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-referral-checkout", {
        body: { quote_id: fee.quote_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setProcessingPayment(null);
    }
  };

  const calculateFeeBreakdown = (quoteAmount: number, feeAmount: number) => {
    const percentage = ((feeAmount / quoteAmount) * 100).toFixed(1);
    const netEarnings = quoteAmount - feeAmount;

    let tierInfo = "";
    if (quoteAmount < 1000) tierInfo = "5% (Min $5, Max $50)";
    else if (quoteAmount < 5000) tierInfo = "3% (Min $50, Max $150)";
    else if (quoteAmount < 10000) tierInfo = "2% (Min $150, Max $200)";
    else tierInfo = "1% (Min $200, Max $300)";

    return { percentage, netEarnings, tierInfo };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No pending fees → do not show component
  if (referralFees.length === 0) return null;

  return (
    <div className="space-y-4">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          🎉 Congratulations! You've been selected for {referralFees.length} job
          {referralFees.length > 1 ? "s" : ""}. Pay the referral fee below to confirm.
        </AlertDescription>
      </Alert>

      {referralFees.map((fee) => {
        const request = fee.quotes?.service_requests;
        const { percentage, netEarnings, tierInfo } = calculateFeeBreakdown(
          fee.quotes?.estimated_price || 0,
          fee.amount,
        );

        return (
          <Card key={fee.id} className="border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Selected for Job!</CardTitle>
                  <CardDescription>
                    {request?.year} {request?.vehicle_make} {request?.model}
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800">Selected</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Your Quote</p>
                  <p className="text-2xl font-bold text-foreground">${fee.quotes?.estimated_price.toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Referral Fee ({percentage}%)</p>
                  <p className="text-2xl font-bold text-primary">${fee.amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee Tier:</span>
                  <span className="font-medium">{tierInfo}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Your Net Earnings:</span>
                  <span className="text-green-600">${netEarnings.toFixed(2)}</span>
                </div>
              </div>

              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Location:</strong> {request?.address || "Address not provided"}
                </AlertDescription>
              </Alert>

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setSelectedFee(fee);
                  setShowPaymentDialog(true);
                }}
                disabled={!!processingPayment}
              >
                {processingPayment === fee.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Pay ${fee.amount.toFixed(2)} to Confirm
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You're about to pay the referral fee to confirm this job.</p>
              {selectedFee && (
                <>
                  <p className="font-semibold text-foreground">Referral Fee: ${selectedFee.amount.toFixed(2)}</p>
                  <p className="text-sm">
                    After payment, the customer will be notified to schedule the appointment with you.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedFee) {
                  handlePayReferralFee(selectedFee);
                  setShowPaymentDialog(false);
                }
              }}
            >
              Continue to Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
