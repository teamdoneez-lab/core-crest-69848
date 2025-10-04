import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Award, CheckCircle, Car, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CompletedJob {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  status: string;
  created_at: string;
  service_categories: {
    name: string;
  };
  referral_fees: {
    id: string;
    amount: number;
    status: string;
    paid_at: string | null;
    stripe_payment_intent: string | null;
  };
  quotes: Array<{
    estimated_price: number;
    status: string;
  }>;
  appointments: {
    starts_at: string;
    status: string;
    final_price: number | null;
  };
}

interface EarningsSummary {
  totalJobs: number;
  totalRevenue: number;
  totalFees: number;
  netEarnings: number;
}

export default function Earnings() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalJobs: 0,
    totalRevenue: 0,
    totalFees: 0,
    netEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isPro) {
      fetchCompletedJobs();
    }
  }, [user, isPro]);

  if (!authLoading && !roleLoading && (!user || !isPro)) {
    return <Navigate to="/" replace />;
  }

  const fetchCompletedJobs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          vehicle_make,
          model,
          year,
          status,
          created_at,
          service_categories (
            name
          ),
          referral_fees (
            id,
            amount,
            status,
            paid_at,
            stripe_payment_intent
          ),
          quotes (
            estimated_price,
            status
          ),
          appointments (
            starts_at,
            status,
            final_price
          )
        `)
        .eq('accepted_pro_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed jobs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load earnings data',
          variant: 'destructive'
        });
        return;
      }

      setCompletedJobs(data || []);

      // Calculate summary
      let totalRevenue = 0;
      let totalFees = 0;
      
      (data || []).forEach(job => {
        const appointment = job.appointments;
        const referralFee = job.referral_fees;
        const confirmedQuote = job.quotes?.find(q => q.status === 'confirmed');
        
        // Use final_price if available, otherwise use estimated_price from quote
        const revenue = appointment?.final_price || confirmedQuote?.estimated_price || 0;
        totalRevenue += Number(revenue);
        
        // Use stored referral fee amount
        if (referralFee?.amount) {
          totalFees += Number(referralFee.amount);
        }
      });

      setSummary({
        totalJobs: data?.length || 0,
        totalRevenue,
        totalFees,
        netEarnings: totalRevenue - totalFees
      });

    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Earnings</h1>
          <p className="text-muted-foreground">Track your completed jobs and earnings</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalJobs}</div>
              <p className="text-xs text-muted-foreground">Completed successfully</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Before fees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referral Fees</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-${summary.totalFees.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Platform fees paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${summary.netEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Your take-home</p>
            </CardContent>
          </Card>
        </div>

        {/* Completed Jobs List */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Completed Jobs History</h2>
        </div>

        {completedJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No completed jobs yet. Complete your first job to see earnings here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {completedJobs.map((job) => {
              const appointment = job.appointments;
              const referralFee = job.referral_fees;
              const confirmedQuote = job.quotes?.find(q => q.status === 'confirmed');
              
              // Use final_price if available, otherwise use estimated_price from quote
              const revenue = appointment?.final_price || confirmedQuote?.estimated_price || 0;
              // Use stored referral fee amount from database
              const fee = referralFee?.amount || 0;
              const netEarning = revenue - fee;
              
              return (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {job.service_categories.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Car className="h-4 w-4" />
                          {job.year} {job.vehicle_make} {job.model}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                        {appointment?.starts_at && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(appointment.starts_at), 'PP')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Request & Payment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Request ID</p>
                          <p className="text-sm font-mono mt-1 break-all">{job.id}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Payment ID</p>
                          <p className="text-sm font-mono mt-1 break-all">
                            {referralFee?.stripe_payment_intent || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Completed Date</p>
                          <p className="text-sm mt-1">{format(new Date(job.created_at), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>

                      {/* Financial Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                          <p className="text-lg font-semibold">${revenue.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Referral Fee (10%)</p>
                          <p className="text-lg font-semibold text-red-600">-${fee.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Net Earnings</p>
                          <p className="text-lg font-semibold text-green-600">${netEarning.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fee Status</p>
                          <Badge variant={referralFee?.status === 'paid' ? 'default' : 'secondary'}>
                            {referralFee?.status || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
