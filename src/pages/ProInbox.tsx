import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, MapPin, Calendar, User, Phone, Mail, Car } from 'lucide-react';

interface ServiceRequest {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  trim?: string;
  mileage?: number;
  address: string;
  zip: string;
  contact_email: string;
  contact_phone: string;
  appointment_pref: string;
  notes?: string;
  accepted_pro_id?: string;
  accept_expires_at?: string;
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

interface CountdownTimerProps {
  expiresAt: string;
}

const CountdownTimer = ({ expiresAt }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const distance = expiry - now;

      if (distance > 0) {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Expired');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
      <Clock className="h-4 w-4" />
      {timeLeft}
    </div>
  );
};

const ProInbox = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isPro) {
      fetchLeads();
    }
  }, [user, isPro]);

  // Redirect if not authenticated or not a pro
  if (!authLoading && !roleLoading && (!user || !isPro)) {
    return <Navigate to="/" replace />;
  }

  const fetchLeads = async () => {
    try {
      const { data: leadsData, error } = await supabase
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
            trim,
            mileage,
            address,
            zip,
            contact_email,
            contact_phone,
            appointment_pref,
            notes,
            accepted_pro_id,
            accept_expires_at,
            service_categories (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Error",
          description: "Failed to fetch leads",
          variant: "destructive",
        });
        return;
      }

      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptLead = async (leadId: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_lead_and_lock_job', {
        lead_id: leadId
      });

      if (error) {
        console.error('Error accepting lead:', error);
        toast({
          title: 'Error',
          description: 'Failed to accept lead. Please try again.',
          variant: 'destructive'
        });
        return;
      }

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
        description: `Job locked for 24 hours until ${new Date(result.expires_at).toLocaleString()}`
      });

      fetchLeads();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    }
  };

  const updateLeadStatus = async (leadId: string, status: 'declined') => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status } : lead
      ));

      toast({
        title: "Success",
        description: `Lead declined successfully`,
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (lead: Lead) => {
    if (lead.status === 'accepted') return 'bg-green-100 text-green-800';
    if (lead.status === 'declined') return 'bg-red-100 text-red-800';
    
    // Check if job is locked by someone else
    const request = lead.service_requests;
    if (request.accepted_pro_id && request.accept_expires_at) {
      const isExpired = new Date(request.accept_expires_at) <= new Date();
      if (!isExpired && request.accepted_pro_id !== user?.id) {
        return 'bg-gray-100 text-gray-800';
      }
    }
    
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (lead: Lead) => {
    if (lead.status === 'accepted') return 'Accepted';
    if (lead.status === 'declined') return 'Declined';
    
    // Check if job is locked by someone else
    const request = lead.service_requests;
    if (request.accepted_pro_id && request.accept_expires_at) {
      const isExpired = new Date(request.accept_expires_at) <= new Date();
      if (!isExpired && request.accepted_pro_id !== user?.id) {
        return 'Locked';
      }
    }
    
    return 'Available';
  };

  const canAcceptLead = (lead: Lead) => {
    if (lead.status !== 'new') return false;
    
    const request = lead.service_requests;
    if (request.accepted_pro_id && request.accept_expires_at) {
      const isExpired = new Date(request.accept_expires_at) <= new Date();
      return isExpired;
    }
    
    return true;
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
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lead Inbox</h1>
          <p className="text-muted-foreground">
            Manage your service request leads
          </p>
        </div>

        {leads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No leads available at the moment. Make sure your profile is complete and verified.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => {
              const request = lead.service_requests;
              const isLocked = request.accepted_pro_id && request.accept_expires_at && new Date(request.accept_expires_at) > new Date();
              const isMyLock = request.accepted_pro_id === user?.id;
              
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
                          {request.trim && ` ${request.trim}`}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(lead)}>
                          {getStatusText(lead)}
                        </Badge>
                        {isLocked && request.accept_expires_at && (
                          <CountdownTimer expiresAt={request.accept_expires_at} />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ZIP: {request.zip}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.contact_email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.contact_phone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Appointment Preference
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {request.appointment_pref}
                      </p>
                    </div>

                    {request.mileage && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Vehicle Mileage
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.mileage.toLocaleString()} miles
                        </p>
                      </div>
                    )}

                    {request.notes && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-1">Notes</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      {canAcceptLead(lead) && (
                        <Button 
                          onClick={() => handleAcceptLead(lead.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Accept Lead
                        </Button>
                      )}
                      {lead.status === 'new' && !canAcceptLead(lead) && (
                        <Button disabled className="opacity-50">
                          {isMyLock ? 'Job Locked by You' : 'Locked by Another Pro'}
                        </Button>
                      )}
                      {lead.status === 'accepted' && isMyLock && (
                        <Button disabled className="bg-green-600">
                          Accepted - Job Locked
                        </Button>
                      )}
                      {lead.status === 'new' && (
                        <Button 
                          variant="outline"
                          onClick={() => updateLeadStatus(lead.id, 'declined')}
                        >
                          Decline
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      Received: {new Date(lead.created_at).toLocaleDateString()}
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
};

export default ProInbox;