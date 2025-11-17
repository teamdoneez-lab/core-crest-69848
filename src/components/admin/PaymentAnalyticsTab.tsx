import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Users,
  FileText,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsData {
  totalQuotes: number;
  quotesSelected: number;
  paymentsCompleted: number;
  paymentsFailed: number;
  totalRevenue: number;
  averageFee: number;
  conversionRate: number;
  paymentSuccessRate: number;
}

interface PaymentFailure {
  id: string;
  created_at: string;
  pro_name: string;
  amount: number;
  service_type: string;
  attempt_count: number;
}

interface RecentPayment {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  pro_name: string;
  service_type: string;
}

export const PaymentAnalyticsTab = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalQuotes: 0,
    quotesSelected: 0,
    paymentsCompleted: 0,
    paymentsFailed: 0,
    totalRevenue: 0,
    averageFee: 0,
    conversionRate: 0,
    paymentSuccessRate: 0,
  });
  const [paymentFailures, setPaymentFailures] = useState<PaymentFailure[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    const ranges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      'all': new Date(0),
    };
    return ranges[timeRange].toISOString();
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Fetch all quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('id, status, estimated_price, created_at')
        .gte('created_at', dateFilter);

      if (quotesError) throw quotesError;

      // Fetch referral fees
      const { data: feesData, error: feesError } = await supabase
        .from('referral_fees')
        .select(`
          id,
          amount,
          status,
          created_at,
          paid_at,
          stripe_payment_intent,
          profiles!referral_fees_pro_id_fkey (full_name),
          service_requests!referral_fees_request_id_fkey (service_type)
        `)
        .gte('created_at', dateFilter);

      if (feesError) throw feesError;

      // Calculate analytics
      const totalQuotes = quotesData?.length || 0;
      const quotesSelected = quotesData?.filter(q => q.status === 'selected' || q.status === 'confirmed').length || 0;
      
      const paidFees = feesData?.filter(f => f.status === 'paid') || [];
      const failedFees = feesData?.filter(f => f.status === 'failed') || [];
      
      const paymentsCompleted = paidFees.length;
      const paymentsFailed = failedFees.length;
      
      const totalRevenue = paidFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
      const averageFee = paymentsCompleted > 0 ? totalRevenue / paymentsCompleted : 0;
      
      const conversionRate = totalQuotes > 0 ? (quotesSelected / totalQuotes) * 100 : 0;
      const totalPaymentAttempts = paymentsCompleted + paymentsFailed;
      const paymentSuccessRate = totalPaymentAttempts > 0 ? (paymentsCompleted / totalPaymentAttempts) * 100 : 0;

      setAnalytics({
        totalQuotes,
        quotesSelected,
        paymentsCompleted,
        paymentsFailed,
        totalRevenue,
        averageFee,
        conversionRate,
        paymentSuccessRate,
      });

      // Format payment failures
      const failures = failedFees.slice(0, 10).map(fee => ({
        id: fee.id,
        created_at: fee.created_at,
        pro_name: (fee.profiles as any)?.full_name || 'Unknown',
        amount: fee.amount || 0,
        service_type: (fee.service_requests as any)?.service_type || 'Unknown',
        attempt_count: 1,
      }));
      setPaymentFailures(failures);

      // Format recent payments
      const recent = paidFees.slice(0, 10).map(fee => ({
        id: fee.id,
        amount: fee.amount || 0,
        status: fee.status || 'pending',
        paid_at: fee.paid_at,
        pro_name: (fee.profiles as any)?.full_name || 'Unknown',
        service_type: (fee.service_requests as any)?.service_type || 'Unknown',
      }));
      setRecentPayments(recent);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Analytics</h2>
          <p className="text-muted-foreground">
            Track conversion rates, revenue, and payment performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {analytics.paymentsCompleted} completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.quotesSelected} of {analytics.totalQuotes} quotes selected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.paymentSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.paymentsCompleted} successful / {analytics.paymentsFailed} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Fee</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averageFee.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per successful payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalQuotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Selected</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.quotesSelected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Failures</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{analytics.paymentsFailed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Failures Table */}
      {paymentFailures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Recent Payment Failures
            </CardTitle>
            <CardDescription>
              Pros who failed to complete referral fee payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentFailures.map((failure) => (
                <div
                  key={failure.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{failure.pro_name}</p>
                    <p className="text-sm text-muted-foreground">{failure.service_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(failure.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">${failure.amount.toFixed(2)}</p>
                    <Badge variant="destructive" className="mt-1">Failed</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Successful Payments */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Recent Successful Payments
            </CardTitle>
            <CardDescription>
              Latest completed referral fee payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{payment.pro_name}</p>
                    <p className="text-sm text-muted-foreground">{payment.service_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.paid_at && format(new Date(payment.paid_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${payment.amount.toFixed(2)}</p>
                    <Badge variant="default" className="mt-1 bg-green-600">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
