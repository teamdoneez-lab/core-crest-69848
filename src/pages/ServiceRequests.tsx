import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/RoleGuard';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Filter, X, FileText, Download, Search } from 'lucide-react';
import { QuoteForm } from '@/components/pro/QuoteForm';
import { QuoteConfirmation } from '@/components/pro/QuoteConfirmation';

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
  image_url?: string;
  created_at: string;
  service_categories: {
    name: string;
  };
  quotes?: Array<{
    id: string;
    status: string;
    pro_id: string;
  }>;
}

export default function ServiceRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [pendingQuotes, setPendingQuotes] = useState<PendingQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filters
  const [filters, setFilters] = useState({
    location: '',
    status: 'pending',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Quote modal
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  
  // Details modal
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Image modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPendingQuotes();
    }
  }, [user]);

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Get pro's profile to find their location
      const { data: proProfile } = await supabase
        .from('pro_profiles')
        .select('latitude, longitude')
        .eq('pro_id', user.id)
        .single();

      // Build query with filters - only show pending requests
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          service_categories (
            name
          ),
          quotes!quotes_request_id_fkey (
            id,
            status,
            pro_id
          )
        `, { count: 'exact' })
        .eq('status', 'pending'); // Always filter for pending requests

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('created_at', new Date(filters.dateFrom).toISOString());
      }
      
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      // Fetch all results
      const { data: allData, error, count } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching service requests:', error);
        setLoading(false);
        return;
      }

      let filteredData = allData || [];

      // Apply radius filtering if pro has location and location filter is provided
      if (filters.location && proProfile?.latitude && proProfile?.longitude) {
        const radiusMiles = 100;
        
        filteredData = filteredData.filter(request => {
          if (!request.latitude || !request.longitude) return false;
          
          // Calculate distance using Haversine formula
          const R = 3959; // Earth's radius in miles
          const dLat = (request.latitude - proProfile.latitude) * Math.PI / 180;
          const dLon = (request.longitude - proProfile.longitude) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(proProfile.latitude * Math.PI / 180) * 
            Math.cos(request.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          
          return distance <= radiusMiles;
        });
      }

      // Apply pagination to filtered results
      const totalFiltered = filteredData.length;
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage;
      const paginatedData = filteredData.slice(from, to);

      setRequests(paginatedData);
      setTotalCount(totalFiltered);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchServiceRequests();
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      status: 'pending',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
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

  const handleQuoteClick = (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRequestId(requestId);
    setIsQuoteModalOpen(true);
  };

  const handleQuoteSuccess = () => {
    setIsQuoteModalOpen(false);
    setSelectedRequestId(null);
    fetchServiceRequests();
    fetchPendingQuotes();
  };

  const fetchPendingQuotes = async () => {
    if (!user?.id) return;
    
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
      .eq('pro_id', user.id)
      .eq('status', 'pending_confirmation')
      .order('confirmation_timer_expires_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending quotes:', error);
      return;
    }

    // Filter and auto-expire quotes that are past their expiration time
    const now = new Date();
    const validQuotes = [];
    const expiredQuotes = [];

    for (const quote of data || []) {
      if (quote.confirmation_timer_expires_at) {
        const expiresAt = new Date(quote.confirmation_timer_expires_at);
        if (expiresAt <= now) {
          expiredQuotes.push(quote);
        } else {
          validQuotes.push(quote);
        }
      } else {
        validQuotes.push(quote);
      }
    }

    // Update expired quotes in the database
    if (expiredQuotes.length > 0) {
      for (const expiredQuote of expiredQuotes) {
        await supabase
          .from('quotes')
          .update({ status: 'expired' })
          .eq('id', expiredQuote.id);

        // Update referral fee if exists
        await supabase
          .from('referral_fees')
          .update({ status: 'expired' })
          .eq('quote_id', expiredQuote.id);
      }
    }

    setPendingQuotes(validQuotes);
  };

  const handleCardClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Service Requests</h1>
                <p className="text-muted-foreground">
                  Available service requests in your area ({totalCount} total)
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location Search (100 mile radius)</Label>
                      <Input
                        id="location"
                        placeholder="Enter any text to search..."
                        value={filters.location}
                        onChange={(e) => {
                          setFilters({ ...filters, location: e.target.value });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => {
                          setFilters({ ...filters, status: value });
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFrom">From Date</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => {
                          setFilters({ ...filters, dateFrom: e.target.value });
                          setCurrentPage(1);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateTo">To Date</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => {
                          setFilters({ ...filters, dateTo: e.target.value });
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      onClick={handleSearch}
                      className="flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Search
                    </Button>
                    {(filters.location || filters.status !== 'all' || filters.dateFrom || filters.dateTo) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pending Quote Confirmations */}
          {pendingQuotes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">🎉 Quotes Selected by Customers</h2>
              <p className="text-muted-foreground mb-6">
                Customers have selected your quotes! Confirm now to secure these appointments.
              </p>
              <div className="space-y-4">
                {pendingQuotes.map((quote) => (
                  <QuoteConfirmation 
                    key={quote.id} 
                    quote={quote} 
                    onConfirmed={() => {
                      fetchServiceRequests();
                      fetchPendingQuotes();
                    }}
                  />
                ))}
              </div>
            </div>
          )}

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
              {requests.map((request) => {
                // Check if the current pro has already sent a quote for this request
                const hasQuote = request.quotes?.some(q => q.pro_id === user?.id);
                
                return (
                  <Card 
                    key={request.id} 
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => handleCardClick(request)}
                  >
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
                          <Badge className={hasQuote ? '' : getStatusColor(request.status)} variant={hasQuote ? 'default' : undefined}>
                            {hasQuote ? 'Sent Quote' : request.status}
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

                      {request.image_url && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Uploaded Image</h4>
                          <img 
                            src={request.image_url} 
                            alt="Vehicle issue" 
                            className="w-full max-w-sm rounded-lg border shadow-sm object-contain max-h-48 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(request.image_url!);
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Click to enlarge</p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                        </p>
                        {!hasQuote && (
                          <Button 
                            onClick={(e) => handleQuoteClick(request.id, e)}
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Send Quote
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Details Modal */}
          <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Service Request Details</DialogTitle>
                <DialogDescription>
                  Complete information about this repair request
                </DialogDescription>
              </DialogHeader>
              {selectedRequest && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Vehicle Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Make & Model</p>
                        <p className="font-medium">{selectedRequest.vehicle_make} {selectedRequest.model}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year</p>
                        <p className="font-medium">{selectedRequest.year}</p>
                      </div>
                      {selectedRequest.trim && (
                        <div>
                          <p className="text-muted-foreground">Trim</p>
                          <p className="font-medium">{selectedRequest.trim}</p>
                        </div>
                      )}
                      {selectedRequest.mileage && (
                        <div>
                          <p className="text-muted-foreground">Mileage</p>
                          <p className="font-medium">{selectedRequest.mileage.toLocaleString()} miles</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Service Details</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Service Category</p>
                        <p className="font-medium">{selectedRequest.service_categories.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(selectedRequest.status)}>
                          {selectedRequest.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Appointment Preference</p>
                        <p className="font-medium">{getAppointmentPrefLabel(selectedRequest.appointment_pref)}</p>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Repair Description</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.notes}</p>
                    </div>
                  )}

                  {selectedRequest.image_url && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Uploaded Image</h3>
                      <img 
                        src={selectedRequest.image_url} 
                        alt="Vehicle issue" 
                        className="w-full rounded-lg border max-h-96 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(selectedRequest.image_url!)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Click to enlarge</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Customer Contact</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedRequest.contact_email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedRequest.contact_phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Address</p>
                        <p className="font-medium">{selectedRequest.address}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ZIP Code</p>
                        <p className="font-medium">{selectedRequest.zip}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Request Timeline</h3>
                    <p className="text-sm text-muted-foreground">
                      Submitted on {new Date(selectedRequest.created_at).toLocaleDateString()} at {new Date(selectedRequest.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="pt-4 border-t flex justify-end">
                    {selectedRequest && !selectedRequest.quotes?.some(q => q.pro_id === user?.id) && (
                      <Button 
                        onClick={(e) => {
                          setIsDetailsModalOpen(false);
                          handleQuoteClick(selectedRequest.id, e);
                        }}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Send Quote
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Quote Modal */}
          <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Quote</DialogTitle>
                <DialogDescription>
                  Send your quote to the customer
                </DialogDescription>
              </DialogHeader>
              {selectedRequestId && (
                <QuoteForm 
                  requestId={selectedRequestId} 
                  onSuccess={handleQuoteSuccess}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

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
    </RoleGuard>
  );
}