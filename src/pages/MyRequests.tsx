import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Car, MapPin, Calendar, Package, Home, Building2, Edit, Trash2, Eye, RotateCcw, Download, X, CheckCircle } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { QuotesList } from '@/components/customer/QuotesList';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getServiceNamesByIds } from '@/utils/serviceHelpers';

interface ServiceRequest {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  trim?: string;
  mileage?: number;
  service_category: string[] | null;
  appointment_type?: string;
  zip: string;
  address?: string;
  preferred_time?: string;
  status: string;
  urgency?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  service_categories?: {
    name: string;
  };
}

const MyRequests = () => {
  const { user, loading: authLoading } = useAuth();
  const { isCustomer, loading: roleLoading } = useRole();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && isCustomer) {
      fetchRequests();
    }
  }, [user, isCustomer]);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, serviceTypeFilter]);

  if (!authLoading && !roleLoading && (!user || !isCustomer)) {
    return <Navigate to="/" replace />;
  }

  const fetchRequests = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service_categories (
            name
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: "Error",
          description: "Failed to fetch service requests",
          variant: "destructive",
        });
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(req => req.appointment_type === serviceTypeFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('customer_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request cancelled successfully",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel request",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      // Just delete the service request record
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', requestId)
        .eq('customer_id', user?.id);

      if (error) throw error;

      toast({
        title: "Request Deleted",
        description: "The completed request has been removed from your history.",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    }
  };

  const handleRebook = (request: ServiceRequest) => {
    // Navigate to service request flow with pre-filled data
    navigate('/request-service-flow', { state: { rebookData: request } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote_requested': return 'bg-yellow-100 text-yellow-800';
      case 'pending_confirmation': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'cancelled_by_customer':
      case 'cancelled_after_requote': 
      case 'cancelled_off_platform': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'quote_requested': return '🟡';
      case 'pending_confirmation': return '⏳';
      case 'confirmed': return '🟢';
      case 'completed': return '✅';
      case 'expired': return '⏰';
      case 'cancelled_by_customer':
      case 'cancelled_after_requote':
      case 'cancelled_off_platform': return '🔴';
      default: return '⚪';
    }
  };

  const getUrgencyLabel = (urgency?: string) => {
    switch (urgency) {
      case 'immediate': return 'Immediate (1-2 days)';
      case 'week': return 'Within 1 week';
      case 'month': return 'Within 1 month';
      default: return urgency || 'Not specified';
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleDownloadImage = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage;
      link.download = `service-request-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
          <h1 className="text-3xl font-bold mb-2">My Service Requests</h1>
          <p className="text-muted-foreground">
            View and manage all your service requests
          </p>
        </div>

        {/* Filters Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="quote_requested">Awaiting Quotes</SelectItem>
                    <SelectItem value="pending_confirmation">Pending Confirmation</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled_by_customer">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Service Type</label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="shop">Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStatusFilter('all');
                    setServiceTypeFilter('all');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Cards */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {requests.length === 0 
                  ? "No service requests yet. Create your first request to get started!"
                  : "No requests match your current filters."}
              </p>
              {requests.length === 0 && (
                <Button className="mt-4" onClick={() => navigate('/request-service-flow')}>
                  Create Service Request
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        {request.year} {request.vehicle_make} {request.model}
                        {request.trim && ` ${request.trim}`}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Submitted {format(new Date(request.created_at), 'PPP')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)} {request.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {/* Vehicle Info */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Vehicle Details
                      </h4>
                      {request.mileage && (
                        <p className="text-sm text-muted-foreground">
                          Mileage: {request.mileage.toLocaleString()} miles
                        </p>
                      )}
                      {request.urgency && (
                        <p className="text-sm text-muted-foreground">
                          Urgency: {getUrgencyLabel(request.urgency)}
                        </p>
                      )}
                    </div>

                    {/* Services */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Services Requested
                      </h4>
                      {request.service_category && request.service_category.length > 0 ? (
                        <div className="space-y-2">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {request.service_category.length} {request.service_category.length === 1 ? 'Service' : 'Services'}
                              </Badge>
                            </div>
                            <div className="space-y-1.5">
                              {getServiceNamesByIds(request.service_category).map((serviceName, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                  <p className="text-sm text-foreground leading-relaxed">
                                    {serviceName}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : request.service_categories ? (
                        <p className="text-sm text-muted-foreground">{request.service_categories.name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not specified</p>
                      )}
                    </div>

                    {/* Location & Type */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location & Type
                      </h4>
                      <p className="text-sm text-muted-foreground">ZIP: {request.zip}</p>
                      {request.address && (
                        <p className="text-sm text-muted-foreground truncate">{request.address}</p>
                      )}
                      {request.appointment_type && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          {request.appointment_type === 'mobile' ? (
                            <><Home className="h-3 w-3" /> Mobile Service</>
                          ) : (
                            <><Building2 className="h-3 w-3" /> In-Shop Service</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Appointment Time */}
                  {request.preferred_time && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Preferred Appointment Time
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(request.preferred_time), 'PPP p')}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {request.description && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-1 text-sm">Notes</h4>
                      <p className="text-sm text-blue-700">{request.description}</p>
                    </div>
                  )}

                  {/* Uploaded Image */}
                  {request.image_url && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-sm">Uploaded Image</h4>
                      <img 
                        src={request.image_url} 
                        alt="Vehicle issue" 
                        className="w-full max-w-md rounded-lg border shadow-sm object-contain max-h-64 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(request.image_url!)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Click to enlarge</p>
                    </div>
                  )}

                  {/* Quotes Section */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-3">Quotes Received</h4>
                    <QuotesList requestId={request.id} />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {request.status === 'quote_requested' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleCancelRequest(request.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Request
                        </Button>
                      </>
                    )}

                    {request.status === 'confirmed' && (
                      <Button variant="outline" size="sm" onClick={() => navigate('/appointments')}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Appointment
                      </Button>
                    )}

                    {request.status === 'completed' && (
                      <>
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleRebook(request)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rebook
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this completed request from your history. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteRequest(request.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}

                    {request.status === 'cancelled' && (
                      <Button variant="outline" size="sm" onClick={() => handleRebook(request)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rebook
                      </Button>
                    )}

                    <div className="text-xs text-muted-foreground ml-auto self-center">
                      Request ID: {request.id.slice(0, 8)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Image Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Service Request Image</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleDownloadImage}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="relative">
                <img 
                  src={selectedImage} 
                  alt="Vehicle issue full size" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyRequests;
