import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, DollarSign, TrendingUp, AlertCircle, Upload, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      suspended: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
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
          {getStatusBadge(supplier.status)}
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
            <Button>Complete Stripe Setup</Button>
          </CardContent>
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
