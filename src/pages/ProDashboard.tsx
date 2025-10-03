import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  DollarSign, 
  CheckCircle, 
  Star,
  Clock, 
  MapPin, 
  Car, 
  Phone,
  MessageCircle,
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import { EarningsTab } from '@/components/pro/EarningsTab';
import { QuoteConfirmation } from '@/components/pro/QuoteConfirmation';

interface ServiceRequest {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  address: string;
  zip: string;
  contact_email: string;
  contact_phone: string;
  appointment_pref: string;
  notes?: string;
  status: string;
  urgency?: string;
  service_categories: {
    name: string;
  };
}

interface Lead {
  id: string;
  status: 'new' | 'accepted' | 'declined';
  created_at: string;
  service_requests: ServiceRequest;
}

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

interface Job {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  status: string;
  service_categories: {
    name: string;
  };
  created_at: string;
}

interface EarningsData {
  totalEarnings: number;
  completedJobs: number;
  averageRating: number;
  totalFeesPaid: number;
  netEarnings: number;
}

export default function ProDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const [activeTab, setActiveTab] = useState('new-requests');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pendingQuotes, setPendingQuotes] = useState<PendingQuote[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    completedJobs: 0,
    averageRating: 0,
    totalFeesPaid: 0,
    netEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check if profile is complete
  useEffect(() => {
    if (user && isPro) {
      checkProfileComplete();
    }
  }, [user, isPro]);

  const checkProfileComplete = async () => {
    try {
      const { data, error } = await supabase
        .from('pro_profiles')
        .select('profile_complete')
        .eq('pro_id', user?.id)
        .single();

      if (error) {
        setProfileComplete(false);
        return;
      }

      setProfileComplete(data?.profile_complete || false);
    } catch (error) {
      console.error('Error checking profile:', error);
      setProfileComplete(false);
    }
  };

  useEffect(() => {
    if (user && isPro) {
      fetchDashboardData();
    }
  }, [user, isPro]);

  // Check email verification
  const emailVerified = user?.email_confirmed_at !== null;

  // Redirect if not authenticated or not a pro
  if (!authLoading && !roleLoading && (!user || !isPro)) {
    return <Navigate to="/" replace />;
  }

  // Redirect to onboarding if email not verified or profile incomplete
  if (!authLoading && !roleLoading && user && isPro) {
    if (!emailVerified || profileComplete === false) {
      return <Navigate to="/pro-onboarding" replace />;
    }
  }

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchLeads(),
        fetchJobs(),
        fetchPendingQuotes(),
        fetchEarnings()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingQuotes = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        id,
        estimated_price,
        description,
        status,
        confirmation_timer_expires_at,
        confirmation_timer_minutes,
        request_id,
        service_requests (
          vehicle_make,
          model,
          year,
          urgency
        )
      `)
      .eq('pro_id', user?.id)
      .eq('status', 'pending_confirmation')
      .order('confirmation_timer_expires_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending quotes:', error);
      return;
    }

    setPendingQuotes(data || []);
  };

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        id,
        status,
        created_at,
        service_requests (
          id,
          vehicle_make,
          model,
          year,
          address,
          zip,
          contact_email,
          contact_phone,
          appointment_pref,
          notes,
          status,
          service_categories (
            name
          )
        )
      `)
      .eq('status', 'new')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return;
    }

    setLeads(data || []);
  };

  const fetchJobs = async () => {
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
        )
      `)
      .eq('accepted_pro_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      return;
    }

    setJobs(data || []);
  };

  const fetchEarnings = async () => {
    // Mock earnings data - replace with actual query
    setEarnings({
      totalEarnings: 325,
      completedJobs: 1,
      averageRating: 5.0,
      totalFeesPaid: 16.25,
      netEarnings: 308.75
    });
  };

  const handleAcceptLead = async (leadId: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_lead_and_lock_job', {
        lead_id: leadId
      });

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!result.success) {
        toast({
          title: 'Cannot Accept',
          description: result.error,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Lead Accepted!',
        description: 'Job locked for 24 hours'
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error accepting lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept lead',
        variant: 'destructive'
      });
    }
  };

  const handleDeclineLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'declined' })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: 'Lead Declined',
        description: 'The lead has been declined'
      });

      fetchLeads();
    } catch (error) {
      console.error('Error declining lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline lead',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'new': { color: 'bg-blue-100 text-blue-800', text: 'New' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'accepted': { color: 'bg-green-100 text-green-800', text: 'Accepted' },
      'scheduled': { color: 'bg-purple-100 text-purple-800', text: 'Scheduled' },
      'in_progress': { color: 'bg-orange-100 text-orange-800', text: 'In Progress' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
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
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pro Dashboard</h1>
            <p className="text-muted-foreground">Manage your jobs and grow your business</p>
          </div>
          <Link to="/pro-profile">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Profile Settings
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new-requests">New Requests</TabsTrigger>
            <TabsTrigger value="my-jobs">My Jobs</TabsTrigger>
            <TabsTrigger value="earnings">Earnings & Fees</TabsTrigger>
          </TabsList>

          {/* New Requests Tab */}
          <TabsContent value="new-requests" className="mt-6">
            {/* Pending Quote Confirmations */}
            {pendingQuotes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">🎉 Quotes Selected by Customers</h2>
                <div className="space-y-4">
                  {pendingQuotes.map((quote) => (
                    <QuoteConfirmation 
                      key={quote.id} 
                      quote={quote} 
                      onConfirmed={fetchDashboardData}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Job Requests</h2>
            </div>

            {leads.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No new requests available. Make sure your profile is complete and verified.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => {
                  const request = lead.service_requests;
                  return (
                    <Card key={lead.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {request.service_categories.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Car className="h-4 w-4" />
                              {request.year} {request.vehicle_make} {request.model}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge('new')}
                            <div className="text-sm text-muted-foreground">
                              Budget: $200-400
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Posted {format(new Date(lead.created_at), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Location</p>
                              <p className="text-sm text-muted-foreground">
                                {request.address} - {request.appointment_pref === 'mobile' ? 'Mobile Service' : 'Shop Service'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Urgency</p>
                              <p className="text-sm text-muted-foreground">
                                {request.appointment_pref === 'asap' ? 'Immediate (ASAP)' : '1-2 days'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mb-4">
                            <p className="text-sm">
                              {request.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t">
                          <Button 
                            onClick={() => handleDeclineLead(lead.id)}
                            variant="outline"
                          >
                            Decline
                          </Button>
                          <Button 
                            onClick={() => handleAcceptLead(lead.id)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Send Quote
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Jobs Tab */}
          <TabsContent value="my-jobs" className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">My Jobs</h2>
            </div>

            {jobs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No active jobs. Accept some leads to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {job.service_categories.name}
                          </CardTitle>
                          <CardDescription>
                            Customer: {job.status === 'completed' ? 'Mike R.' : 'Lisa K.'}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(job.status)}
                          <div className="text-lg font-semibold text-green-600">
                            +${job.status === 'completed' ? '$45' : '$280'}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium">Date</p>
                          <p className="text-sm text-muted-foreground">
                            {job.status === 'completed' ? '12/7/2024' : '12/9/2024'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Earnings</p>
                          <p className="text-sm text-green-600">
                            ${job.status === 'completed' ? '$45' : '$280'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Referral Fee</p>
                          <p className="text-sm text-red-600">
                            -${job.status === 'completed' ? '$2.25' : '$14'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">
                              {job.status === 'completed' ? '5/5' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Net Earnings: ${job.status === 'completed' ? '$42.75' : '$266.00'}
                      </div>

                      {job.status === 'in_progress' && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button variant="outline" className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Message Customer
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="mt-6">
            <EarningsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}