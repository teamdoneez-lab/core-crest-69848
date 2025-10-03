import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, MapPin, Car, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Job {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  status: string;
  address: string;
  zip: string;
  contact_email: string;
  contact_phone: string;
  notes?: string;
  created_at: string;
  service_categories: {
    name: string;
  };
  referral_fees: {
    amount: number;
    status: string;
    paid_at: string | null;
  };
  appointments: {
    starts_at: string;
    status: string;
  };
}

export default function MyJobs() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isPro) {
      fetchMyJobs();
    }
  }, [user, isPro]);

  if (!authLoading && !roleLoading && (!user || !isPro)) {
    return <Navigate to="/" replace />;
  }

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      
      // Fetch jobs with paid referral fees and in_progress status
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          vehicle_make,
          model,
          year,
          status,
          address,
          zip,
          contact_email,
          contact_phone,
          notes,
          created_at,
          service_categories (
            name
          ),
          referral_fees (
            amount,
            status,
            paid_at
          ),
          appointments (
            starts_at,
            status
          )
        `)
        .eq('accepted_pro_id', user?.id)
        .in('status', ['confirmed', 'in_progress', 'scheduled'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load jobs',
          variant: 'destructive'
        });
        return;
      }

      // Filter jobs where referral fee is paid
      const jobsWithPaidFees = (data || []).filter(job => 
        job.referral_fees && job.referral_fees.status === 'paid'
      );

      setJobs(jobsWithPaidFees);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'confirmed': { color: 'bg-green-100 text-green-800', text: 'Confirmed' },
      'scheduled': { color: 'bg-purple-100 text-purple-800', text: 'Scheduled' },
      'in_progress': { color: 'bg-orange-100 text-orange-800', text: 'In Progress' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', text: status };
    
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Jobs</h1>
          <p className="text-muted-foreground">Jobs with confirmed payment - ready to work on</p>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No active jobs yet. Jobs will appear here after customers confirm payment.
              </p>
              <Link to="/service-requests">
                <Button>View New Requests</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const referralFee = job.referral_fees;
              const appointment = job.appointments;
              
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
                        {getStatusBadge(job.status)}
                        {referralFee && (
                          <Badge variant="outline" className="text-green-600">
                            Fee Paid: ${referralFee.amount}
                          </Badge>
                        )}
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
                            {job.address}, {job.zip}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Contact</p>
                          <p className="text-sm text-muted-foreground">
                            {job.contact_phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {job.contact_email}
                          </p>
                        </div>
                      </div>
                      {appointment && (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="font-medium">Appointment</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(appointment.starts_at), 'PPp')}
                            </p>
                          </div>
                        </div>
                      )}
                      {referralFee?.paid_at && (
                        <div className="flex items-start gap-2">
                          <div>
                            <p className="font-medium">Payment Confirmed</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(referralFee.paid_at), 'PPp')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {job.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Customer Notes:</p>
                        <p className="text-sm text-muted-foreground">{job.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Contact Customer
                      </Button>
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
