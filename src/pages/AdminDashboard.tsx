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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Car, DollarSign, FileText, Download, CheckCircle, Calendar, Phone, Mail, MapPin, Search, Filter, RefreshCw, UserCheck, UserX, ShieldCheck, ShieldOff, UserCog, Info, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ReferralFeesTab } from '@/components/admin/ReferralFeesTab';
import { ProDetailModal } from '@/components/admin/ProDetailModal';
import { CustomerDetailModal } from '@/components/admin/CustomerDetailModal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  }[];
  auth_users?: {
    email: string;
  };
}

const addProSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100),
  name: z.string().trim().min(1, { message: "Name is required" }).max(100),
  phone: z.string().trim().optional(),
  businessName: z.string().trim().min(1, { message: "Business name is required" }).max(200),
  address: z.string().trim().min(1, { message: "Address is required" }).max(300),
  city: z.string().trim().min(1, { message: "City is required" }).max(100),
  state: z.string().trim().min(2, { message: "State is required" }).max(50),
  zipCode: z.string().trim().min(5, { message: "Valid zip code required" }).max(10),
  serviceRadius: z.number().min(1).max(200).default(25),
});

type AddProFormData = z.infer<typeof addProSchema>;

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
  status: string;
  created_at: string;
  paid_at?: string;
  quote_id?: string;
  pro_id: string;
  request_id: string;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  refundable?: boolean;
  cancellation_reason?: string;
  updated_at: string;
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
  const [customersPage, setCustomersPage] = useState(1);
  const [prosPage, setProsPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isProDetailOpen, setIsProDetailOpen] = useState(false);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [isAddProDialogOpen, setIsAddProDialogOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const customersPerPage = 10;
  const prosPerPage = 10;
  const requestsPerPage = 10;
  const { toast } = useToast();

  const addProForm = useForm<AddProFormData>({
    resolver: zodResolver(addProSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      phone: '',
      businessName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      serviceRadius: 25,
    },
  });

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

    // Fetch emails from auth.users
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const users = usersData?.users || [];
    
    // Combine the data
    const prosWithProfiles = data?.map(pro => ({
      ...pro,
      pro_profiles: proProfilesData?.filter(pp => pp.pro_id === pro.id) || [],
      auth_users: { email: users?.find(u => u.id === pro.id)?.email || 'N/A' }
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
      .from('referral_fees')
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

  const handleToggleProVerification = async (proId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('pro_profiles')
        .update({ is_verified: !currentStatus })
        .eq('pro_id', proId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Professional ${!currentStatus ? 'verified' : 'unverified'} successfully`
      });

      fetchPros();
    } catch (error) {
      console.error('Error toggling verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive'
      });
    }
  };

  const handleAssignProToRequest = async (requestId: string, proId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ 
          accepted_pro_id: proId,
          status: 'accepted',
          accept_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update leads status
      await supabase
        .from('leads')
        .update({ status: 'accepted' })
        .eq('request_id', requestId)
        .eq('pro_id', proId);

      toast({
        title: 'Success',
        description: 'Professional assigned to request successfully'
      });

      fetchRequests();
    } catch (error) {
      console.error('Error assigning pro:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign professional',
        variant: 'destructive'
      });
    }
  };

  const handleAddPro = async (data: AddProFormData) => {
    try {
      // Call edge function to create pro user
      const { data: result, error } = await supabase.functions.invoke('create-pro-user', {
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone || null,
          businessName: data.businessName,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          serviceRadius: data.serviceRadius
        }
      });

      if (error) throw error;

      if (!result.success) {
        throw new Error(result.error || 'Failed to create professional');
      }

      toast({
        title: 'Success',
        description: 'Professional added successfully'
      });

      setIsAddProDialogOpen(false);
      addProForm.reset();
      fetchPros();
    } catch (error: any) {
      console.error('Error adding professional:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add professional',
        variant: 'destructive'
      });
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditCustomerName(customer.name || '');
    setEditCustomerPhone(customer.phone || '');
    setIsEditCustomerOpen(true);
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editCustomerName.trim(),
          phone: editCustomerPhone.trim() || null,
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer updated successfully'
      });

      setIsEditCustomerOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteCustomerOpen(true);
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      // Get all service requests for this customer
      const { data: requests, error: requestsError } = await supabase
        .from('service_requests')
        .select('id')
        .eq('customer_id', selectedCustomer.id);

      if (requestsError) throw requestsError;

      if (requests && requests.length > 0) {
        const requestIds = requests.map(r => r.id);

        // Delete all related data in correct order to avoid foreign key issues
        
        // 1. Delete chat messages
        await supabase
          .from('chat_messages')
          .delete()
          .in('request_id', requestIds);

        // 2. Delete leads
        await supabase
          .from('leads')
          .delete()
          .in('request_id', requestIds);

        // 3. Delete quotes
        await supabase
          .from('quotes')
          .delete()
          .in('request_id', requestIds);

        // 4. Delete appointments
        await supabase
          .from('appointments')
          .delete()
          .in('request_id', requestIds);

        // 5. Delete referral fees
        await supabase
          .from('referral_fees')
          .delete()
          .in('request_id', requestIds);

        // 6. Delete service fees
        await supabase
          .from('fees')
          .delete()
          .in('request_id', requestIds);

        // 7. Delete service requests
        await supabase
          .from('service_requests')
          .delete()
          .in('id', requestIds);
      }

      // Finally, delete customer auth user (this will cascade delete the profile)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(selectedCustomer.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Success',
        description: `Customer and ${requests?.length || 0} related service request(s) deleted successfully`
      });

      setIsDeleteCustomerOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
      fetchRequests(); // Refresh requests list too
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer and related data',
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
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Professionals</CardTitle>
              <Car className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pros.length}</div>
              <p className="text-xs text-muted-foreground">
                {pros.filter(p => p.pro_profiles && p.pro_profiles.length > 0 && p.pro_profiles[0].is_verified).length} verified
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">
                {requests.filter(r => r.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {fees.filter(f => f.status === 'paid').length} paid fees
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
                  {/* <Label htmlFor="status-filter" className="flex items-center gap-2 mb-2">
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
                  </Select> */}
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
            <TabsTrigger value="referral-fees">Referral Fees</TabsTrigger>
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
                <>
                  {filterData(customers, 'customers')
                    .slice((customersPage - 1) * customersPerPage, customersPage * customersPerPage)
                    .map((customer) => (
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
                          <div className="flex flex-col gap-2 items-end">
                            <Badge>{customer.role}</Badge>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedCustomerId(customer.id);
                                  setIsCustomerDetailOpen(true);
                                }}
                              >
                                <Info className="h-4 w-4 mr-2" />
                                Detail
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditCustomer(customer)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteCustomer(customer)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {filterData(customers, 'customers').length > customersPerPage && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomersPage(p => Math.max(1, p - 1))}
                        disabled={customersPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        {Array.from({ 
                          length: Math.ceil(filterData(customers, 'customers').length / customersPerPage) 
                        }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === customersPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCustomersPage(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomersPage(p => Math.min(
                          Math.ceil(filterData(customers, 'customers').length / customersPerPage),
                          p + 1
                        ))}
                        disabled={customersPage >= Math.ceil(filterData(customers, 'customers').length / customersPerPage)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
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
              <div className="flex gap-2">
                <Dialog open={isAddProDialogOpen} onOpenChange={setIsAddProDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Add Pro +
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Professional</DialogTitle>
                      <DialogDescription>
                        Create a new professional account with complete profile information.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...addProForm}>
                      <form onSubmit={addProForm.handleSubmit(handleAddPro)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={addProForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="professional@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addProForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password *</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Minimum 6 characters" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addProForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addProForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input type="tel" placeholder="(555) 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addProForm.control}
                            name="businessName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Auto Repair Shop" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={addProForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address *</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main Street" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={addProForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City *</FormLabel>
                                <FormControl>
                                  <Input placeholder="New York" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addProForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State *</FormLabel>
                                <FormControl>
                                  <Input placeholder="NY" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addProForm.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Zip Code *</FormLabel>
                                <FormControl>
                                  <Input placeholder="10001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={addProForm.control}
                          name="serviceRadius"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Radius (km) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="25" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 25)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsAddProDialogOpen(false);
                              addProForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Add Professional</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button onClick={() => exportToCSV(filterData(pros, 'pros'), 'professionals')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
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
                <>
                  {filterData(pros, 'pros')
                    .slice((prosPage - 1) * prosPerPage, prosPage * prosPerPage)
                    .map((pro) => (
                    <Card key={pro.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{pro?.name || 'Unknown Professional'}</h3>
                            {pro.pro_profiles && pro.pro_profiles.length > 0 && (
                              <p className="text-sm font-medium">{pro.pro_profiles[0].business_name}</p>
                            )}
                            <p className="text-sm text-muted-foreground">ID: {pro.id}</p>
                            <p className="text-sm text-muted-foreground">
                              Joined: {format(new Date(pro.created_at), 'PPP')}
                            </p>
                            
                            <div className="mt-3 space-y-1">
                              {pro.auth_users?.email && (
                                <p className="text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3 inline mr-1" />
                                  {pro.auth_users.email}
                                </p>
                              )}
                              {(pro.phone || (pro.pro_profiles && pro.pro_profiles.length > 0 && pro.pro_profiles[0].phone)) && (
                                <p className="text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3 inline mr-1" />
                                  {pro.pro_profiles?.[0]?.phone || pro.phone}
                                </p>
                              )}
                              {pro.pro_profiles && pro.pro_profiles.length > 0 && pro.pro_profiles[0].address && (
                                <p className="text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {pro.pro_profiles[0].address}
                                  {pro.pro_profiles[0].city && `, ${pro.pro_profiles[0].city}`}
                                  {pro.pro_profiles[0].state && `, ${pro.pro_profiles[0].state}`}
                                  {pro.pro_profiles[0].zip_code && ` ${pro.pro_profiles[0].zip_code}`}
                                </p>
                              )}
                              {pro.pro_profiles && pro.pro_profiles.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Service radius: {pro.pro_profiles[0].radius_km}km
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge>{pro.role}</Badge>
                            {pro.pro_profiles && pro.pro_profiles.length > 0 && (
                              <>
                                <Badge className={pro.pro_profiles[0].is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {pro.pro_profiles[0].is_verified ? 'Verified' : 'Unverified'}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant={pro.pro_profiles[0].is_verified ? 'outline' : 'default'}
                                  onClick={() => handleToggleProVerification(pro.id, pro.pro_profiles[0].is_verified)}
                                >
                                  {pro.pro_profiles[0].is_verified ? (
                                    <>
                                      <ShieldOff className="h-4 w-4 mr-2" />
                                      Unverify
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="h-4 w-4 mr-2" />
                                      Verify
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {filterData(pros, 'pros').length > prosPerPage && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProsPage(p => Math.max(1, p - 1))}
                        disabled={prosPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        {Array.from({ 
                          length: Math.ceil(filterData(pros, 'pros').length / prosPerPage) 
                        }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === prosPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setProsPage(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProsPage(p => Math.min(
                          Math.ceil(filterData(pros, 'pros').length / prosPerPage),
                          p + 1
                        ))}
                        disabled={prosPage >= Math.ceil(filterData(pros, 'pros').length / prosPerPage)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
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
                <>
                  {filterData(requests, 'requests')
                    .slice((requestsPage - 1) * requestsPerPage, requestsPage * requestsPerPage)
                    .map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4 items-start">
                          {request.image_url && (
                            <div className="flex-shrink-0">
                              <img 
                                src={request.image_url} 
                                alt="Service request" 
                                className="w-24 h-24 object-cover rounded-md"
                              />
                            </div>
                          )}
                          <div className="flex-1">
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
                          <div className="flex flex-col gap-2 items-end">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedRequestId(request.id);
                                setIsProDetailOpen(true);
                              }}
                            >
                              <Info className="h-4 w-4 mr-2" />
                              Pro Detail
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {filterData(requests, 'requests').length > requestsPerPage && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                        disabled={requestsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        {Array.from({ 
                          length: Math.ceil(filterData(requests, 'requests').length / requestsPerPage) 
                        }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === requestsPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setRequestsPage(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRequestsPage(p => Math.min(
                          Math.ceil(filterData(requests, 'requests').length / requestsPerPage),
                          p + 1
                        ))}
                        disabled={requestsPage >= Math.ceil(filterData(requests, 'requests').length / requestsPerPage)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>


          {/* Referral Fees Tab */}
          <TabsContent value="referral-fees" className="space-y-4">
            <ReferralFeesTab />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {selectedRequestId && (
          <ProDetailModal
            requestId={selectedRequestId}
            open={isProDetailOpen}
            onOpenChange={setIsProDetailOpen}
          />
        )}
        
        {selectedCustomerId && (
          <CustomerDetailModal
            customerId={selectedCustomerId}
            open={isCustomerDetailOpen}
            onOpenChange={setIsCustomerDetailOpen}
          />
        )}

        {/* Edit Customer Dialog */}
        <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update customer information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditCustomerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCustomer}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Customer Dialog */}
        <AlertDialog open={isDeleteCustomerOpen} onOpenChange={setIsDeleteCustomerOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>?
                This action cannot be undone and will permanently delete the customer account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteCustomer}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminDashboard;