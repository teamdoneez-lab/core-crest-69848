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
import { ChevronLeft, ChevronRight, Filter, X, FileText } from 'lucide-react';
import { QuoteForm } from '@/components/pro/QuoteForm';

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
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filters
  const [filters, setFilters] = useState({
    location: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Quote modal
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchServiceRequests();
    }
  }, [user, currentPage, filters]);

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      
      // Build query with filters
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          service_categories (
            name
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.location) {
        query = query.or(`zip.ilike.%${filters.location}%,address.ilike.%${filters.location}%`);
      }
      
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', new Date(filters.dateFrom).toISOString());
      }
      
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching service requests:', error);
        return;
      }

      if (data) {
        setRequests(data);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      status: 'all',
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

  const handleQuoteClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsQuoteModalOpen(true);
  };

  const handleQuoteSuccess = () => {
    setIsQuoteModalOpen(false);
    setSelectedRequestId(null);
    fetchServiceRequests();
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
                      <Label htmlFor="location">Location (ZIP/Address)</Label>
                      <Input
                        id="location"
                        placeholder="Search location..."
                        value={filters.location}
                        onChange={(e) => {
                          setFilters({ ...filters, location: e.target.value });
                          setCurrentPage(1);
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

                  {(filters.location || filters.status !== 'all' || filters.dateFrom || filters.dateTo) && (
                    <div className="mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                      <Button 
                        onClick={() => handleQuoteClick(request.id)}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Send Quote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quote Modal */}
          <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Quote</DialogTitle>
                <DialogDescription>
                  Send your quote to the customer. A 10% referral fee will be charged.
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
      </div>
    </RoleGuard>
  );
}