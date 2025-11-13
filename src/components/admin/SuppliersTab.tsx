import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Eye, Building2, Package, AlertCircle, Filter } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Supplier {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: string;
  product_categories: string[];
  total_orders: number;
  acceptance_rate: number;
  stripe_onboarding_complete: boolean;
  created_at: string;
}

interface SupplierProduct {
  id: string;
  supplier_id: string;
  sku: string;
  part_name: string;
  category: string;
  condition: string;
  price: number;
  quantity: number;
  admin_approved: boolean;
  is_active: boolean;
  created_at: string;
  suppliers: {
    business_name: string;
    stripe_onboarding_complete: boolean;
    is_platform_seller: boolean;
  };
}

type ProductFilter = 'all' | 'platform' | 'vendors';

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [allProducts, setAllProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [allProductsLoading, setAllProductsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [productActionType, setProductActionType] = useState<'approve' | 'reject' | null>(null);
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');

  useEffect(() => {
    fetchSuppliers();
    fetchPendingProducts();
    fetchAllProducts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_platform_seller', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({ title: 'Error', description: 'Failed to load suppliers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          *,
          suppliers (
            business_name,
            stripe_onboarding_complete,
            is_platform_seller
          )
        `)
        .eq('admin_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          *,
          suppliers (
            business_name,
            stripe_onboarding_complete,
            is_platform_seller
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllProducts(data || []);
    } catch (error) {
      console.error('Error fetching all products:', error);
      toast({ title: 'Error', description: 'Failed to load all products', variant: 'destructive' });
    } finally {
      setAllProductsLoading(false);
    }
  };

  const getFilteredProducts = () => {
    switch (productFilter) {
      case 'platform':
        return allProducts.filter(p => p.suppliers.is_platform_seller);
      case 'vendors':
        return allProducts.filter(p => !p.suppliers.is_platform_seller);
      default:
        return allProducts;
    }
  };

  const filteredProducts = getFilteredProducts();

  const openDialog = (supplier: Supplier, action: 'approve' | 'reject') => {
    setSelectedSupplier(supplier);
    setActionType(action);
    setVerificationNotes('');
    setShowDialog(true);
  };

  const handleVerification = async () => {
    if (!selectedSupplier || !actionType) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('suppliers')
        .update({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          verification_notes: verificationNotes,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', selectedSupplier.id);

      if (error) throw error;

      // Send email notification to supplier
      try {
        await supabase.functions.invoke('send-supplier-notification', {
          body: {
            supplierEmail: selectedSupplier.email,
            supplierName: selectedSupplier.contact_name,
            status: actionType === 'approve' ? 'approved' : 'rejected',
            notes: verificationNotes,
          }
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the entire operation if email fails
      }

      toast({ 
        title: 'Success', 
        description: `Supplier ${actionType === 'approve' ? 'approved' : 'rejected'} successfully. Email notification sent.` 
      });
      
      setShowDialog(false);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openProductDialog = (product: SupplierProduct, action: 'approve' | 'reject') => {
    setSelectedProduct(product);
    setProductActionType(action);
    setShowProductDialog(true);
  };

  const handleProductApproval = async () => {
    if (!selectedProduct || !productActionType) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('supplier_products')
        .update({
          admin_approved: productActionType === 'approve',
          is_active: productActionType === 'approve',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({ 
        title: 'Success', 
        description: `Product ${productActionType === 'approve' ? 'approved' : 'rejected'} successfully.` 
      });
      
      setShowProductDialog(false);
      fetchPendingProducts();
    } catch (error: any) {
      console.error('Product approval error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
    return <div>Loading suppliers...</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Supplier Management</CardTitle>
              <CardDescription>
                Review and manage supplier applications and accounts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Acceptance</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.business_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{supplier.contact_name}</div>
                        <div className="text-muted-foreground">{supplier.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.city}, {supplier.state}
                    </TableCell>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell>{supplier.total_orders}</TableCell>
                    <TableCell>{supplier.acceptance_rate.toFixed(1)}%</TableCell>
                    <TableCell>
                      {supplier.stripe_onboarding_complete ? (
                        <Badge variant="default">Connected</Badge>
                      ) : (
                        <Badge variant="outline">Not Connected</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {supplier.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(supplier, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(supplier, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {supplier.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setShowDialog(true);
                              setActionType(null);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Products Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Pending Product Approvals</CardTitle>
              <CardDescription>
                Review and approve products uploaded by suppliers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div>Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending products to review
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
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
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.suppliers.business_name}</div>
                          {!product.suppliers.stripe_onboarding_complete && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <AlertCircle className="h-3 w-3" />
                              Stripe not connected
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>{product.part_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.condition}</Badge>
                      </TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Pending Approval</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openProductDialog(product, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openProductDialog(product, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Supplier'}
              {actionType === 'reject' && 'Reject Supplier'}
              {!actionType && 'Supplier Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier?.business_name}
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <p className="text-sm">{selectedSupplier.contact_name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedSupplier.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">{selectedSupplier.phone}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSupplier.status)}</div>
                </div>
              </div>

              <div>
                <Label>Product Categories</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedSupplier.product_categories.map((cat) => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </div>

              {actionType && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Verification Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this verification decision..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          {actionType && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerification}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {actionType === 'approve' ? 'Approve Supplier' : 'Reject Supplier'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Approval Dialog */}
      {/* All Products Section with Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>All Products Inventory</CardTitle>
                <CardDescription>
                  View and filter all products from DoneEZ and vendors
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Tabs value={productFilter} onValueChange={(v) => setProductFilter(v as ProductFilter)}>
                <TabsList>
                  <TabsTrigger value="all">All Listings</TabsTrigger>
                  <TabsTrigger value="platform">DoneEZ Only</TabsTrigger>
                  <TabsTrigger value="vendors">Vendors Only</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allProductsLoading ? (
            <div>Loading all products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found for the selected filter
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {product.suppliers.business_name}
                            {product.suppliers.is_platform_seller && (
                              <Badge variant="default" className="text-xs">Platform</Badge>
                            )}
                          </div>
                          {!product.suppliers.stripe_onboarding_complete && !product.suppliers.is_platform_seller && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <AlertCircle className="h-3 w-3" />
                              Stripe not connected
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>{product.part_name}</TableCell>
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
                      <TableCell>
                        {product.admin_approved ? (
                          product.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {productActionType === 'approve' ? 'Approve Product' : 'Reject Product'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.part_name} by {selectedProduct?.suppliers.business_name}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SKU</Label>
                  <p className="text-sm font-mono">{selectedProduct.sku}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm">{selectedProduct.category}</p>
                </div>
                <div>
                  <Label>Condition</Label>
                  <p className="text-sm">{selectedProduct.condition}</p>
                </div>
                <div>
                  <Label>Price</Label>
                  <p className="text-sm">${selectedProduct.price.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <p className="text-sm">{selectedProduct.quantity}</p>
                </div>
              </div>

              {!selectedProduct.suppliers.stripe_onboarding_complete && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-900 dark:text-orange-100">Stripe Not Connected</p>
                    <p className="text-orange-700 dark:text-orange-300">
                      This supplier hasn't completed Stripe setup. They won't be able to receive payouts until they connect their account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProductApproval}
              variant={productActionType === 'approve' ? 'default' : 'destructive'}
            >
              {productActionType === 'approve' ? 'Approve Product' : 'Reject Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
