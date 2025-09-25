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
            address,
            zip,
            contact_email,
            contact_phone,
            appointment_pref,
            notes,
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

  const updateLeadStatus = async (leadId: string, status: 'accepted' | 'declined') => {
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
        description: `Lead ${status === 'accepted' ? 'accepted' : 'declined'} successfully`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            {leads.map((lead) => (
              <Card key={lead.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {lead.service_requests.service_categories.name}
                      </CardTitle>
                      <CardDescription>
                        {lead.service_requests.year} {lead.service_requests.vehicle_make} {lead.service_requests.model}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold mb-1">Location</h4>
                      <p className="text-sm text-muted-foreground">
                        {lead.service_requests.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ZIP: {lead.service_requests.zip}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Contact</h4>
                      <p className="text-sm text-muted-foreground">
                        {lead.service_requests.contact_email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lead.service_requests.contact_phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold mb-1">Appointment Preference</h4>
                    <p className="text-sm text-muted-foreground">
                      {lead.service_requests.appointment_pref}
                    </p>
                  </div>

                  {lead.service_requests.notes && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {lead.service_requests.notes}
                      </p>
                    </div>
                  )}

                  {lead.status === 'new' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        onClick={() => updateLeadStatus(lead.id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept Lead
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => updateLeadStatus(lead.id, 'declined')}
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mt-2">
                    Received: {new Date(lead.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProInbox;