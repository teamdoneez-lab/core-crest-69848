import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { RoleGuard } from '@/components/RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Lead {
  id: string;
  status: 'new' | 'accepted' | 'declined';
  created_at: string;
  service_requests: {
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
  };
}

const ProInbox = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

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
        .eq('pro_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Error",
          description: "Failed to fetch leads. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
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
        console.error('Error updating lead:', error);
        toast({
          title: "Error",
          description: "Failed to update lead status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, status } : lead
        )
      );

      toast({
        title: "Success",
        description: `Lead ${status} successfully.`,
      });
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div>Loading leads...</div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['pro']}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Lead Inbox</h1>
            <p className="text-muted-foreground">
              Manage incoming service requests and opportunities
            </p>
          </div>

          <div className="grid gap-6">
            {leads.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No leads available. Complete your profile and set up your service areas to start receiving leads.
                  </p>
                </CardContent>
              </Card>
            ) : (
              leads.map((lead) => (
                <Card key={lead.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {lead.service_requests.service_categories.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Received {format(new Date(lead.created_at), 'MMM d, yyyy at h:mm a')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="font-medium mb-2">Vehicle Information</h4>
                      <p className="text-sm text-muted-foreground">
                        {lead.service_requests.year} {lead.service_requests.vehicle_make} {lead.service_requests.model}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Location</h4>
                      <p className="text-sm text-muted-foreground">
                        {lead.service_requests.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lead.service_requests.zip}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Contact Information</h4>
                      <p className="text-sm text-muted-foreground">
                        Email: {lead.service_requests.contact_email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Phone: {lead.service_requests.contact_phone}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Appointment Preference</h4>
                      <p className="text-sm text-muted-foreground">
                        {lead.service_requests.appointment_pref}
                      </p>
                    </div>
                  </div>

                  {lead.service_requests.notes && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Additional Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {lead.service_requests.notes}
                      </p>
                    </div>
                  )}

                  {lead.status === 'new' && (
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => updateLeadStatus(lead.id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Accept Lead
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => updateLeadStatus(lead.id, 'declined')}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {lead.status === 'accepted' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ You accepted this lead. Contact the customer to discuss the service details.
                      </p>
                    </div>
                  )}

                  {lead.status === 'declined' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 font-medium">
                        ✗ You declined this lead.
                      </p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default ProInbox;