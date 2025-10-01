import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Calendar, ExternalLink, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralFee {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  stripe_session_id?: string;
  service_requests: {
    id: string;
    vehicle_make: string;
    model: string;
    year: number;
    status: string;
  } | null;
}

interface EarningsSummary {
  totalJobs: number;
  completedJobs: number;
  totalFeesPaid: number;
  totalFeesOwed: number;
  netEarnings: number;
}

export const EarningsTab = () => {
  const [fees, setFees] = useState<ReferralFee[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalJobs: 0,
    completedJobs: 0,
    totalFeesPaid: 0,
    totalFeesOwed: 0,
    netEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      // Fetch referral fees
      const { data: feesData, error: feesError } = await supabase
        .from('referral_fees')
        .select(`
          *,
          service_requests (id, vehicle_make, model, year, status)
        `)
        .order('created_at', { ascending: false });

      if (feesError) throw feesError;

      setFees(feesData || []);

      // Calculate summary
      const paidFees = (feesData || []).filter(f => f.status === 'paid');
      const owedFees = (feesData || []).filter(f => f.status === 'owed');
      const totalFeesPaid = paidFees.reduce((sum, f) => sum + f.amount, 0);
      const totalFeesOwed = owedFees.reduce((sum, f) => sum + f.amount, 0);

      // Fetch job stats
      const { data: jobsData } = await supabase
        .from('service_requests')
        .select('status')
        .eq('accepted_pro_id', (await supabase.auth.getUser()).data.user?.id);

      const completedJobs = (jobsData || []).filter(j => j.status === 'completed').length;
      const estimatedEarnings = completedJobs * 300; // Rough estimate

      setSummary({
        totalJobs: jobsData?.length || 0,
        completedJobs,
        totalFeesPaid,
        totalFeesOwed,
        netEarnings: estimatedEarnings - totalFeesPaid - totalFeesOwed
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load earnings data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayFee = async (fee: ReferralFee) => {
    if (!fee.stripe_session_id) {
      toast({
        title: 'Error',
        description: 'No payment session found',
        variant: 'destructive'
      });
      return;
    }

    // Reconstruct Stripe Checkout URL
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${fee.stripe_session_id}`;
    window.open(checkoutUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'owed': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading earnings data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {summary.completedJobs} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.totalFeesPaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Referral fees paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${summary.totalFeesOwed.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Fees owed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.netEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              After fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fee History */}
      <Card>
        <CardHeader>
          <CardTitle>Fee History</CardTitle>
          <CardDescription>
            Your referral fee payments and pending charges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {fee.service_requests 
                        ? `${fee.service_requests.year} ${fee.service_requests.vehicle_make} ${fee.service_requests.model}`
                        : 'Service Request'}
                    </span>
                    <Badge className={getStatusColor(fee.status)}>
                      {fee.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {format(new Date(fee.created_at), 'PPP')}
                    {fee.paid_at && ` • Paid: ${format(new Date(fee.paid_at), 'PPP')}`}
                  </div>
                  {fee.stripe_session_id && fee.status === 'paid' && (
                    <a 
                      href={`https://dashboard.stripe.com/test/payments`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      View Receipt <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold">
                    ${fee.amount.toFixed(2)}
                  </span>
                  {fee.status === 'owed' && (
                    <Button 
                      size="sm" 
                      onClick={() => handlePayFee(fee)}
                      className="gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {fees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No fees yet. Accept jobs to start earning!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>
            Your earnings and fees by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Coming soon: Monthly earnings reports and analytics
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
