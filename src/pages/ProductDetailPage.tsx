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
import { ShoppingCart, ArrowLeft, Minus, Plus, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

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
            <Card className="overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
            </Card>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.condition && (
                <p className="text-muted-foreground mb-4">
                  Condition: <span className="font-semibold text-foreground">{product.condition}</span>
                </p>
              )}
              {product.sku && (
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">SKU:</span>
                  <span className="text-sm font-mono">{product.sku}</span>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-4xl font-bold text-primary mb-4">
                ${product.price.toFixed(2)}
              </p>
              {product.inStock ? (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">In Stock</span>
                </div>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-16 text-center font-semibold text-lg">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={quantity >= 99}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="w-full text-lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        {product.description && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
