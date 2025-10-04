import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, Calendar, Car, FileText, DollarSign, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerDetailModalProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  created_at: string;
  violation_flags: number;
  last_violation_at: string | null;
}

interface ServiceRequest {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  status: string;
  created_at: string;
  zip: string;
  service_categories: {
    name: string;
  } | null;
}

export function CustomerDetailModal({ customerId, open, onOpenChange }: CustomerDetailModalProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    activeRequests: 0,
    cancelledRequests: 0
  });

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetail();
    }
  }, [open, customerId]);

  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      
      // Get customer profile
      const { data: customerData, error: customerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;

      setCustomer(customerData);

      // Get customer's service requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('service_requests')
        .select(`
          id,
          vehicle_make,
          model,
          year,
          status,
          created_at,
          zip,
          service_categories (name)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      setServiceRequests(requestsData || []);

      // Calculate stats
      const total = requestsData?.length || 0;
      const completed = requestsData?.filter(r => r.status === 'completed').length || 0;
      const active = requestsData?.filter(r => ['pending', 'accepted', 'scheduled', 'in_progress'].includes(r.status)).length || 0;
      const cancelled = requestsData?.filter(r => r.status === 'cancelled').length || 0;

      setStats({
        totalRequests: total,
        completedRequests: completed,
        activeRequests: active,
        cancelledRequests: cancelled
      });

    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            Detailed information about the customer and their service history
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : !customer ? (
          <div className="py-8 text-center text-muted-foreground">
            Customer not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">Customer ID: {customer.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <Badge>{customer.role}</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p className="font-medium">{format(new Date(customer.created_at), 'PP')}</p>
                    </div>
                  </div>

                  {customer.violation_flags > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-muted-foreground">Violations</p>
                        <p className="font-medium text-red-600">{customer.violation_flags}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Statistics */}
            <div>
              <h4 className="font-semibold mb-4">Service Request Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{stats.totalRequests}</p>
                      <p className="text-xs text-muted-foreground">Total Requests</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-green-600">{stats.completedRequests}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Car className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-blue-600">{stats.activeRequests}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2 text-red-600" />
                      <p className="text-2xl font-bold text-red-600">{stats.cancelledRequests}</p>
                      <p className="text-xs text-muted-foreground">Cancelled</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Service Requests History */}
            <div>
              <h4 className="font-semibold mb-4">Service Request History</h4>
              {serviceRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No service requests yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {serviceRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium">
                                {request.service_categories?.name || 'Unknown Service'}
                              </h5>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p className="flex items-center gap-2">
                                <Car className="h-3 w-3" />
                                {request.year} {request.vehicle_make} {request.model}
                              </p>
                              <p className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                ZIP: {request.zip}
                              </p>
                              <p className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(request.created_at), 'PPP')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
