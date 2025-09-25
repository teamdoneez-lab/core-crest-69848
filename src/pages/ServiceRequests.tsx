import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/RoleGuard';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ServiceRequest {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  trim?: string;
  mileage?: number;
  appointment_pref: string;
  address: string;
  zip: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  notes?: string;
  created_at: string;
  service_categories: {
    name: string;
  };
}

export default function ServiceRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchServiceRequests();
    }
  }, [user]);

  const fetchServiceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service_categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching service requests:', error);
        return;
      }

      if (data) {
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentPrefLabel = (pref: string) => {
    switch (pref) {
      case 'asap': return 'ASAP';
      case 'scheduled': return 'Scheduled';
      case 'flexible': return 'Flexible';
      default: return pref;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['pro']}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Service Requests</h1>
            <p className="text-muted-foreground">
              Available service requests in your area
            </p>
          </div>

          {requests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">No service requests found</h3>
                  <p className="text-muted-foreground">
                    Check back later for new requests in your service area.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {request.vehicle_make} {request.model} {request.year}
                          {request.trim && ` ${request.trim}`}
                        </CardTitle>
                        <CardDescription>
                          {request.service_categories.name} • {request.zip}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge variant="outline">
                          {getAppointmentPrefLabel(request.appointment_pref)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Vehicle Details</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {request.mileage && <p>Mileage: {request.mileage.toLocaleString()}</p>}
                          <p>Contact: {request.contact_email}</p>
                          <p>Phone: {request.contact_phone}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Location</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.address}
                        </p>
                      </div>
                    </div>
                    
                    {request.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Additional Notes</h4>
                        <p className="text-sm text-muted-foreground">{request.notes}</p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}