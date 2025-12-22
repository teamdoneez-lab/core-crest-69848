import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { usePhotoNotifications } from '@/hooks/usePhotoNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { Car, MapPin, Calendar, Package, Home, Building2, Edit, Trash2, Eye, RotateCcw, Download, X, CheckCircle, Camera, Upload, AlertCircle } from 'lucide-react';
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
import { QuotesSection } from '@/components/customer/QuotesSection';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getServiceNamesByIds } from '@/utils/serviceHelpers';
import { AppointmentCountdownTimer } from '@/components/customer/AppointmentCountdownTimer';
import { useAppointmentUpdates } from '@/hooks/useAppointmentUpdates';

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
  additional_photos_requested?: boolean;
  photos_requested_at?: string;
  service_categories?: {
    name: string;
  };
  appointments?: Array<{
    id: string;
    status: string;
    confirmation_expires_at: string;
  }>;
}

const MyRequests = () => {
  const { user, loading: authLoading } = useAuth();
  const { isCustomer, loading: roleLoading } = useRole();
  const { clearNotification, addNotification } = usePhotoNotifications();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});
  const [newPhotos, setNewPhotos] = useState<Record<string, File[]>>({});
  const itemsPerPage = 10;
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchRequests = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Build base query
      let query = (supabase as any)
        .from('service_requests')
        .select(`
          *,
          service_categories (
            name
          ),
          appointments (
            id,
            status,
            confirmation_expires_at
          )
        `, { count: 'exact' })
        .eq('customer_id', user.id);

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (serviceTypeFilter !== 'all') {
        query = query.eq('appointment_type', serviceTypeFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: "Error",
          description: "Failed to fetch service requests",
          variant: "destructive",
        });
        return;
      }

      setRequests((data || []) as unknown as ServiceRequest[]);
      setFilteredRequests((data || []) as unknown as ServiceRequest[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time appointment updates
  useAppointmentUpdates({
    userId: user?.id,
    onUpdate: fetchRequests,
  });

  useEffect(() => {
    if (user && isCustomer) {
      fetchRequests();
    }
  }, [user, isCustomer, currentPage, statusFilter, serviceTypeFilter]);


  if (!authLoading && !roleLoading && (!user || !isCustomer)) {
    return <Navigate to="/" replace />;
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await (supabase as any)
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
      const { error } = await (supabase as any)
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
    navigate('/request-service', { state: { rebookData: request } });
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

  const handlePhotoSelection = (requestId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setNewPhotos(prev => ({ ...prev, [requestId]: fileArray }));
  };

  const handleSubmitPhotos = async (requestId: string, currentImageUrl?: string) => {
    const files = newPhotos[requestId];
    if (!files || files.length === 0) return;

    setUploadingPhotos(prev => ({ ...prev, [requestId]: true }));

    try {
      // Upload each file to storage
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${requestId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('service-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('service-images')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      
      // Combine with existing image_url if it exists
      const allUrls = currentImageUrl 
        ? [currentImageUrl, ...newUrls].join(',')
        : newUrls.join(',');

      // Update service request with new photos and clear photo request flag
      const { error: updateError } = await (supabase as any)
        .from('service_requests')
        .update({ 
          image_url: allUrls,
          additional_photos_requested: false,
          photos_requested_at: null
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add notification for pro
      addNotification(requestId, 'photos_uploaded');
      
      toast({
        title: "Photos Uploaded",
        description: "Your photos have been sent to the service professional.",
      });

      // Clear the file selection
      setNewPhotos(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      // Refresh the requests
      fetchRequests();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [requestId]: false }));
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
                    setCurrentPage(1);
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
                <Button className="mt-4" onClick={() => navigate('/request-service')}>
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

                  {/* Additional Photos Request Banner */}
                  {request.additional_photos_requested && (
                    <Alert className="mb-4 border-yellow-500 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <div className="font-semibold mb-2">🟡 Additional Photos Requested</div>
                        <p className="text-sm mb-3">
                          Your service professional has asked for more photos to help prepare an accurate estimate. 
                          Please upload 2–3 more images of the damaged area.
                        </p>
                        
                        {/* Upload Interface */}
                        <div className="mt-3 p-4 bg-white rounded-lg border border-yellow-200">
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Upload More Photos
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handlePhotoSelection(request.id, e.target.files)}
                                className="hidden"
                                id={`photo-upload-${request.id}`}
                              />
                              <label htmlFor={`photo-upload-${request.id}`} className="cursor-pointer">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-600">
                                  {newPhotos[request.id]?.length 
                                    ? `${newPhotos[request.id].length} photo(s) selected` 
                                    : 'Click to select photos or drag and drop'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                              </label>
                            </div>
                            
                            {newPhotos[request.id] && newPhotos[request.id].length > 0 && (
                              <Button 
                                onClick={() => handleSubmitPhotos(request.id, request.image_url)}
                                disabled={uploadingPhotos[request.id]}
                                className="w-full"
                              >
                                {uploadingPhotos[request.id] ? 'Uploading...' : 'Submit Photos'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
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

                  {/* Pending Confirmation Timer */}
                  {request.appointments && request.appointments.length > 0 && request.appointments[0]?.status === 'pending_confirmation' && request.appointments[0]?.confirmation_expires_at && (
                    <AppointmentCountdownTimer
                      expiresAt={request.appointments[0].confirmation_expires_at}
                      onExpired={async () => {
                        // Auto-update appointment to expired
                        await (supabase as any)
                          .from('appointments')
                          .update({ status: 'expired' })
                          .eq('id', request.appointments![0].id);
                        fetchRequests();
                      }}
                    />
                  )}

                  {/* Quotes Section */}
                  <QuotesSection requestId={request.id} />

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

        {/* Pagination */}
        {totalCount > itemsPerPage && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1).map((page) => {
                  const totalPages = Math.ceil(totalCount / itemsPerPage);
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <PaginationItem key={page}><span className="px-4">...</span></PaginationItem>;
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / itemsPerPage), prev + 1))}
                    className={currentPage === Math.ceil(totalCount / itemsPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
