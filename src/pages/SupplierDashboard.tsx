import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, DollarSign, TrendingUp, AlertCircle, Upload, ShoppingCart, CheckCircle, LogOut } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface SupplierData {
  id: string;
  business_name: string;
  status: string;
  total_orders: number;
  fulfilled_orders: number;
  acceptance_rate: number;
  stripe_onboarding_complete: boolean;
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (user) {
      fetchSupplierData();
    }
  }, [user]);

  useEffect(() => {
    // Check for Stripe redirect status
    const stripeSuccess = searchParams.get('stripe_success');
    const stripeRefresh = searchParams.get('stripe_refresh');

    if (stripeSuccess === 'true') {
      verifyStripeStatus();
      toast({
        title: "Stripe Setup Complete",
        description: "Your Stripe account has been connected successfully!",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/supplier-dashboard');
    } else if (stripeRefresh === 'true') {
      toast({
        title: "Setup Incomplete",
        description: "Please complete the Stripe setup to receive payouts.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/supplier-dashboard');
    }
  }, [searchParams]);

  const fetchSupplierData = async () => {
    try {
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (supplierError) throw supplierError;
      setSupplier(supplierData);

      // Fetch product stats
      const { count: totalProducts } = await supabase
        .from('supplier_products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierData.id);

      const { count: activeProducts } = await supabase
        .from('supplier_products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierData.id)
        .eq('is_active', true)
        .eq('admin_approved', true);

      // Fetch order stats
      const { count: pendingOrders } = await supabase
        .from('supplier_orders')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierData.id)
        .eq('status', 'pending');

      const { data: revenueData } = await supabase
        .from('supplier_orders')
        .select('supplier_payout')
        .eq('supplier_id', supplierData.id)
        .eq('status', 'paid');

      const totalRevenue = revenueData?.reduce((sum, order) => 
        sum + parseFloat(String(order.supplier_payout) || '0'), 0) || 0;

      setStats({
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSetup = async () => {
    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-supplier-connect-account');
      
      if (error) throw error;
      if (!data?.url) throw new Error('No redirect URL received');

      // Redirect to Stripe onboarding
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error setting up Stripe:', error);
      toast({
        title: "Stripe Setup Failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setStripeLoading(false);
    }
  };

  const verifyStripeStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-supplier-stripe-status');
      
      if (error) throw error;
      
      if (data?.onboarding_complete) {
        // Refresh supplier data to show updated status
        await fetchSupplierData();
      }
    } catch (error) {
      console.error('Error verifying Stripe status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      suspended: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <p>Loading...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Application</CardTitle>
            <CardDescription>
              You haven't submitted a supplier application yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/supplier-onboarding">
              <Button>Apply to Become a Supplier</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{supplier.business_name}</h1>
            <p className="text-muted-foreground">Supplier Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(supplier.status)}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {supplier.status === 'pending' && (
        <Card className="mb-6 border-yellow-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Application Pending</CardTitle>
            </div>
            <CardDescription>
              Your supplier application is under review. You'll be notified once approved.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {supplier.status === 'approved' && !supplier.stripe_onboarding_complete && (
        <Card className="mb-6 border-blue-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <CardTitle>Complete Stripe Connect Setup</CardTitle>
            </div>
            <CardDescription>
              Connect your bank account to receive payouts for your sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStripeSetup} disabled={stripeLoading}>
              {stripeLoading ? 'Connecting...' : 'Complete Stripe Setup'}
            </Button>
          </CardContent>
        </Card>
      )}

      {supplier.status === 'approved' && supplier.stripe_onboarding_complete && (
        <Card className="mb-6 border-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Stripe Account Connected</CardTitle>
            </div>
            <CardDescription>
              Your bank account is connected and ready to receive payouts.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProducts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Requires action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              After commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplier.acceptance_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {supplier.fulfilled_orders} of {supplier.total_orders} orders
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Inventory</CardTitle>
                <Link to="/supplier/upload-products">
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Products
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your product listings will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your orders will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your payout history will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
