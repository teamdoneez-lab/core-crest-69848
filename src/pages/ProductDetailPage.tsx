import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart, Product } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, ArrowLeft, Minus, Plus, Check, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ProductDetailPage() {
  const { productHandle } = useParams<{ productHandle: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);

  // Fetch product from database
  useEffect(() => {
    if (productHandle) {
      fetchProduct();
    }
  }, [productHandle]);

  const fetchProduct = async () => {
    try {
      setProductLoading(true);
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('id', productHandle)
        .eq('admin_approved', true)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (data) {
        const mappedProduct: Product = {
          id: data.id,
          name: data.part_name,
          price: Number(data.price),
          category: data.category,
          image: data.image_url || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop',
          description: data.description || '',
          inStock: (data.quantity || 0) > 0,
          sku: data.sku,
          condition: data.condition,
          quantity: data.quantity || 0,
          supplierId: data.supplier_id,
        };
        setProduct(mappedProduct);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setProductLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if not a pro user
  if (!roleLoading && !isPro) {
    return <Navigate to="/" replace />;
  }

  if (!product && !authLoading && !roleLoading && !productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate('/pro-marketplace')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </main>
      </div>
    );
  }

  if (authLoading || roleLoading || productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <Skeleton className="w-full aspect-square rounded-lg" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-md" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast({
      title: 'Added to cart',
      description: `${quantity}x ${product.name} added to your cart.`,
    });
  };

  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, 99));
  const decrementQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/pro-marketplace')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>

        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-2">
              <img
                src={product.image}
                alt={product.name}
                className="w-full aspect-square object-cover bg-muted"
              />
            </Card>
            {/* Thumbnail gallery - ready for multiple images */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="overflow-hidden border-2 border-primary cursor-pointer">
                <img
                  src={product.image}
                  alt={`${product.name} thumbnail`}
                  className="w-full aspect-square object-cover"
                />
              </Card>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              
              <div className="flex flex-wrap gap-4 text-sm">
                {product.sku && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono font-semibold">{product.sku}</span>
                  </div>
                )}
                {product.condition && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Condition:</span>
                    <span className="font-semibold">{product.condition}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </p>
              </div>
              
              {product.inStock ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-md w-fit">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-700 dark:text-green-300 text-sm">
                    In Stock ({product.quantity} available)
                  </span>
                </div>
              ) : (
                <Badge variant="destructive" className="text-sm py-2 px-3">
                  <Package className="h-4 w-4 mr-1" />
                  Out of Stock
                </Badge>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-3 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="h-12 w-12"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-bold">
                      {quantity}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={quantity >= 99}
                    className="h-12 w-12"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="w-full text-lg h-14 font-semibold"
              >
                <ShoppingCart className="mr-2 h-6 w-6" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>

              {product.description && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description.substring(0, 150)}
                      {product.description.length > 150 ? '...' : ''}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="fitment">Fitment</TabsTrigger>
                <TabsTrigger value="cross-reference">Cross-Reference</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Product Description</h3>
                  {product.description ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No description available.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Technical Specifications</h3>
                  <Table>
                    <TableBody>
                      {product.sku && (
                        <TableRow>
                          <TableCell className="font-medium w-1/3">SKU</TableCell>
                          <TableCell className="font-mono">{product.sku}</TableCell>
                        </TableRow>
                      )}
                      {product.condition && (
                        <TableRow>
                          <TableCell className="font-medium w-1/3">Condition</TableCell>
                          <TableCell>{product.condition}</TableCell>
                        </TableRow>
                      )}
                      {product.category && (
                        <TableRow>
                          <TableCell className="font-medium w-1/3">Category</TableCell>
                          <TableCell>{product.category}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="font-medium w-1/3">Stock Status</TableCell>
                        <TableCell>
                          {product.inStock ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              In Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Out of Stock
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      {product.quantity !== undefined && (
                        <TableRow>
                          <TableCell className="font-medium w-1/3">Available Quantity</TableCell>
                          <TableCell>{product.quantity} units</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <p className="text-sm text-muted-foreground mt-4 italic">
                    Additional specifications will be available once supplier provides detailed technical data.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="fitment" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Vehicle Fitment</h3>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Make</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Years</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Fitment data is not yet available for this product.
                            <br />
                            <span className="text-sm">Please contact the supplier for compatibility information.</span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cross-reference" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Cross-Reference Part Numbers</h3>
                  <div className="rounded-lg border p-6">
                    <p className="text-muted-foreground text-center">
                      No cross-reference part numbers available.
                      <br />
                      <span className="text-sm">Alternative part numbers will be displayed here when provided by the supplier.</span>
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
