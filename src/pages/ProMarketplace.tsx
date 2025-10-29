import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Navigation } from '@/components/Navigation';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { useCart } from '@/contexts/CartContext';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { useToast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';

export default function ProMarketplace() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if not a pro user
  if (!roleLoading && !isPro) {
    return <Navigate to="/" replace />;
  }

  const handleAddToCart = (product: typeof MOCK_PRODUCTS[0]) => {
    addToCart(product);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Banner */}
        <section 
          className="bg-gradient-primary rounded-lg p-8 md:p-12 mb-8 text-primary-foreground"
          role="banner"
        >
          <div className="flex items-start gap-4">
            <Package className="h-12 w-12 flex-shrink-0" aria-hidden="true" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Pro Marketplace
              </h1>
              <p className="text-lg md:text-xl opacity-95 max-w-3xl">
                Shop trusted parts, tools, and supplies for your next job. 
                Professional-grade equipment at competitive prices.
              </p>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <ProductGrid
          products={MOCK_PRODUCTS}
          onAddToCart={handleAddToCart}
          isLoading={false}
        />
      </main>
    </div>
  );
}
