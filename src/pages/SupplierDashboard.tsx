import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, DollarSign, TrendingUp, AlertCircle, Upload, ShoppingCart, CheckCircle, LogOut, RefreshCw, Edit } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ProductEditModal } from '@/components/supplier/ProductEditModal';

interface SupplierData {
  id: string;
  business_name: string;
  status: string;
  total_orders: number;
  fulfilled_orders: number;
  acceptance_rate: number;
  stripe_onboarding_complete: boolean;
  is_platform_seller?: boolean;
}

interface SupplierProduct {
  id: string;
  sku: string;
  part_name: string;
  category: string;
  condition: string;
  price: number;
  quantity: number;
  admin_approved: boolean;
  is_active: boolean;
  created_at: string;
  description?: string;
  images?: string[];
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
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
    if (supplier) {
      fetchProducts();
    }
  }, [supplier]);

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
        .maybeSingle();

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
      
      if (error) {
        console.error('Stripe setup error:', error);
        
        // Extract error message from the response
        const errorMessage = error.message || error.context?.body?.error || "Failed to initiate Stripe setup. Please try again.";
        
        toast({
          title: "Stripe Setup Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 10000, // Show longer for important account rejection messages
        });
        setStripeLoading(false);
        return;
      }

      if (!data) {
        toast({
          title: "Setup Failed",
          description: "No response from Stripe setup. Please try again.",
          variant: "destructive",
        });
        setStripeLoading(false);
        return;
      }

      // Check if there's an error in the data
      if (data.error) {
        toast({
          title: "Stripe Setup Failed",
          description: data.error,
          variant: "destructive",
          duration: 10000,
        });
        setStripeLoading(false);
        return;
      }

      if (data?.url) {
        // Open Stripe onboarding in a new tab (works in iframe and standalone)
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup was blocked
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Opening Stripe Setup",
            description: "Complete the setup in the new tab and return here when done.",
          });
        }
      }
    } catch (error) {
      console.error('Error setting up Stripe:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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

  const handleClearStripeAccount = async () => {
    if (!supplier?.id) return;
    
    setStripeLoading(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ 
          stripe_connect_account_id: null,
          stripe_onboarding_complete: false 
        })
        .eq('id', supplier.id);

      if (error) throw error;

      toast({
        title: "Stripe Account Cleared",
        description: "You can now restart the Stripe setup process.",
      });

      // Refresh supplier data
      await fetchSupplierData();
    } catch (error) {
      console.error('Error clearing Stripe account:', error);
      toast({
        title: "Error",
        description: "Failed to clear Stripe account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStripeLoading(false);
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
      
      // If session is missing, user is already logged out - treat as success
      if (error && error.message !== 'Auth session missing!') {
        throw error;
      }
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if logout fails, redirect to auth page to prevent stuck state
      navigate('/auth');
      toast({
        title: "Logged out",
        description: "You have been logged out.",
      });
    }
  };

  const fetchProducts = async () => {
    if (!supplier?.id) return;
    
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  const getProductStatusBadge = (product: SupplierProduct) => {
    if (!product.admin_approved) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (product.admin_approved && product.is_active) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
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

      {supplier.status === 'approved' && !supplier.stripe_onboarding_complete && !supplier.is_platform_seller && (
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
            <div className="flex gap-3">
              <Button onClick={handleStripeSetup} disabled={stripeLoading}>
                {stripeLoading ? 'Connecting...' : 'Complete Stripe Setup'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearStripeAccount} 
                disabled={stripeLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Account
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              If you're experiencing issues with a rejected Stripe account, click "Reset Account" to clear it and start fresh.
            </p>
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchProducts} disabled={productsLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Link to="/supplier/upload-products">
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Products
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No products uploaded yet.</p>
                  <Link to="/supplier/upload-products">
                    <Button className="mt-4" variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Your First Product
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.part_name}</div>
                              {product.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-xs">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{product.condition}</Badge>
                          </TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={product.quantity === 0 ? 'text-destructive' : ''}>
                              {product.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{getProductStatusBadge(product)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProduct(product)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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

      {editingProduct && (
        <ProductEditModal
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          product={editingProduct}
          onSuccess={() => {
            fetchProducts();
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
