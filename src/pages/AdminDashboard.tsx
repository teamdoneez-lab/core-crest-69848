import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Car, DollarSign, FileText, Download, CheckCircle, Calendar, Phone, Mail, MapPin, Search, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Customer {
  id: string;
  name: string;
  role: string;
  created_at: string;
  phone?: string;
}

interface Pro {
  id: string;
  name: string;
  role: string;
  created_at: string;
  phone?: string;
  pro_profiles?: {
    pro_id: string;
    business_name: string;
    is_verified: boolean;
    radius_km: number;
  }[];
}

interface ServiceRequest {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  address: string;
  zip: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  created_at: string;
  service_categories: {
    name: string;
  } | null;
  profiles: {
    name: string;
  } | null;
}

interface Fee {
  id: string;
  amount: number;
  fee_type: string;
  status: string;
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  created_at: string;
  service_requests: {
    id: string;
    vehicle_make: string;
    model: string;
    year: number;
  } | null;
  profiles: {
    name: string;
  } | null;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pros, setPros] = useState<Pro[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllData();
    }
  }, [user, isAdmin]);

  // Redirect if not authenticated or not an admin
  if (!authLoading && !roleLoading && (!user || !isAdmin)) {
    return <Navigate to="/" replace />;
  }

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCustomers(),
        fetchPros(),
        fetchRequests(),
        fetchFees()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }
    setCustomers(data || []);
  };

  const fetchPros = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'pro')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pros:', error);
      return;
    }

    // Fetch pro profiles separately
    const proIds = data?.map(p => p.id) || [];
    const { data: proProfilesData } = await supabase
      .from('pro_profiles')
      .select('*')
      .in('pro_id', proIds);

    // Combine the data
    const prosWithProfiles = data?.map(pro => ({
      ...pro,
      pro_profiles: proProfilesData?.filter(pp => pp.pro_id === pro.id) || []
    }));

    setPros(prosWithProfiles || []);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        service_categories (name),
        profiles (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }
    setRequests(data || []);
  };

  const fetchFees = async () => {
    const { data, error } = await supabase
      .from('fees')
      .select(`
        *,
        service_requests (id, vehicle_make, model, year),
        profiles (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fees:', error);
      return;
    }
    setFees(data || []);
  };

  const handleMarkFeePaid = async (feeId: string, paymentMethod: string) => {
    try {
      const { data, error } = await supabase.rpc('mark_fee_paid', {
        fee_id: feeId,
        payment_method_input: paymentMethod
      });

      if (error) {
        console.error('Error marking fee as paid:', error);
        toast({
          title: 'Error',
          description: 'Failed to mark fee as paid',
          variant: 'destructive'
        });
        return;
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Fee marked as paid'
      });

      fetchFees(); // Refresh fees data
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'object' && value !== null 
            ? JSON.stringify(value).replace(/"/g, '""')
            : `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterData = (data: any[], type: string) => {
    let filtered = [...data];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(item => new Date(item.created_at) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(item => new Date(item.created_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(item => new Date(item.created_at) >= filterDate);
          break;
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        switch (type) {
          case 'customers':
          case 'pros':
            return (
              item?.name?.toLowerCase().includes(query) ||
              item?.phone?.toLowerCase().includes(query) ||
              item?.id?.toLowerCase().includes(query) ||
              (item?.pro_profiles?.[0]?.business_name?.toLowerCase().includes(query))
            );
          case 'requests':
            return (
              item?.vehicle_make?.toLowerCase().includes(query) ||
              item?.model?.toLowerCase().includes(query) ||
              item?.year?.toString().includes(query) ||
              item?.profiles?.name?.toLowerCase().includes(query) ||
              item?.service_categories?.name?.toLowerCase().includes(query) ||
              item?.address?.toLowerCase().includes(query) ||
              item?.zip?.includes(query) ||
              item?.contact_email?.toLowerCase().includes(query)
            );
          case 'fees':
            return (
              item?.profiles?.name?.toLowerCase().includes(query) ||
              item?.service_requests?.vehicle_make?.toLowerCase().includes(query) ||
              item?.service_requests?.model?.toLowerCase().includes(query) ||
              item?.amount?.toString().includes(query) ||
              item?.fee_type?.toLowerCase().includes(query)
            );
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage customers, professionals, service requests, and fees
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Professionals</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pros.length}</div>
              <p className="text-xs text-muted-foreground">
                {pros.filter(p => p.pro_profiles && p.pro_profiles.length > 0 && p.pro_profiles[0].is_verified).length} verified
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">
                {requests.filter(r => r.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {fees.filter(f => f.status === 'pending').length} unpaid
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4" />
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Search by name, email, vehicle, business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-4">
                <div>
                  <Label htmlFor="status-filter" className="flex items-center gap-2 mb-2">
                    <Filter className="h-4 w-4" />
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-filter" className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4" />
                    Actions
                  </Label>
                  <Button 
                    onClick={fetchAllData} 
                    variant="outline"
                    className="w-[120px]"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="pros">Professionals</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Customers</h2>
                <p className="text-sm text-muted-foreground">
                  {filterData(customers, 'customers').length} customers found
                </p>
              </div>
              <Button onClick={() => exportToCSV(filterData(customers, 'customers'), 'customers')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="grid gap-4">
              {filterData(customers, 'customers').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No customers found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterData(customers, 'customers').map((customer) => (
                <Card key={customer.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{customer?.name || 'Unknown Customer'}</h3>
                        <p className="text-sm text-muted-foreground">ID: {customer.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined: {format(new Date(customer.created_at), 'PPP')}
                        </p>
                        {customer.phone && (
                          <p className="text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 inline mr-1" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                      <Badge>{customer.role}</Badge>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Professionals Tab */}
          <TabsContent value="pros" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Professionals</h2>
                <p className="text-sm text-muted-foreground">
                  {filterData(pros, 'pros').length} professionals found
                </p>
              </div>
              <Button onClick={() => exportToCSV(filterData(pros, 'pros'), 'professionals')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="grid gap-4">
              {filterData(pros, 'pros').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No professionals found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterData(pros, 'pros').map((pro) => (
                <Card key={pro.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{pro?.name || 'Unknown Professional'}</h3>
                        {pro.pro_profiles && pro.pro_profiles.length > 0 && (
                          <p className="text-sm font-medium">{pro.pro_profiles[0].business_name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">ID: {pro.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined: {format(new Date(pro.created_at), 'PPP')}
                        </p>
                        {pro.phone && (
                          <p className="text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 inline mr-1" />
                            {pro.phone}
                          </p>
                        )}
                        {pro.pro_profiles && pro.pro_profiles.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Service radius: {pro.pro_profiles[0].radius_km}km
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge>{pro.role}</Badge>
                        {pro.pro_profiles && pro.pro_profiles.length > 0 && (
                          <Badge className={pro.pro_profiles[0].is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {pro.pro_profiles[0].is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Service Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Service Requests</h2>
                <p className="text-sm text-muted-foreground">
                  {filterData(requests, 'requests').length} requests found
                </p>
              </div>
              <Button onClick={() => exportToCSV(filterData(requests, 'requests'), 'service_requests')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="grid gap-4">
              {filterData(requests, 'requests').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No service requests found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterData(requests, 'requests').map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                       <div>
                         <h3 className="font-semibold">{request.service_categories?.name || 'Unknown Service'}</h3>
                         <p className="text-sm font-medium">
                           {request.year} {request.vehicle_make} {request.model}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           Customer: {request.profiles?.name || 'Unknown Customer'}
                         </p>
                        <p className="text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {request.address}, {request.zip}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 inline mr-1" />
                          {request.contact_email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(request.created_at), 'PPP')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Fees & Payments</h2>
                <p className="text-sm text-muted-foreground">
                  {filterData(fees, 'fees').length} fees found
                </p>
              </div>
              <Button onClick={() => exportToCSV(filterData(fees, 'fees'), 'fees')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="grid gap-4">
              {filterData(fees, 'fees').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No fees found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterData(fees, 'fees').map((fee) => (
                <Card key={fee.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">${fee.amount.toFixed(2)} - {fee.fee_type.replace('_', ' ')}</h3>
                        <p className="text-sm text-muted-foreground">
                          Pro: {fee.profiles?.name || 'Unknown Professional'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vehicle: {fee.service_requests?.year || 'N/A'} {fee.service_requests?.vehicle_make || 'Unknown'} {fee.service_requests?.model || 'Vehicle'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {format(new Date(fee.due_date), 'PPP')}
                        </p>
                        {fee.paid_at && (
                          <p className="text-sm text-muted-foreground">
                            Paid: {format(new Date(fee.paid_at), 'PPP')}
                          </p>
                        )}
                        {fee.payment_method && (
                          <p className="text-sm text-muted-foreground">
                            Method: {fee.payment_method}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={getStatusColor(fee.status)}>
                          {fee.status.toUpperCase()}
                        </Badge>
                        {fee.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Paid
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mark Fee as Paid</DialogTitle>
                                <DialogDescription>
                                  Mark this ${fee.amount.toFixed(2)} fee as paid
                                </DialogDescription>
                              </DialogHeader>
                              <div>
                                <Label htmlFor="payment-method">Payment Method</Label>
                                <Select onValueChange={(value) => handleMarkFeePaid(fee.id, value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;