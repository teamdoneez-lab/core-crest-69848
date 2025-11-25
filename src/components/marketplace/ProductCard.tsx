import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/contexts/CartContext';
import { ShoppingCart, Store } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const productHandle = product.id;

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/pro-marketplace/product/${productHandle}`} className="block">
        <div className="aspect-square relative overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform hover:scale-105 ${
              !product.inStock ? 'grayscale opacity-60' : ''
            }`}
          />
          {!product.inStock && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 right-2"
            >
              Out of Stock
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className={`flex-1 p-4 ${!product.inStock ? 'opacity-70' : ''}`}>
        <div className="mb-2">
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
        </div>
        <Link to={`/pro-marketplace/product/${productHandle}`}>
          <h3 
            className="font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>
        
        {product.sellerName && (
          <div className="flex items-center gap-1.5 mb-2 text-xs">
            <Store className="h-3.5 w-3.5" />
            <span className={product.isPlatformSeller ? 'font-medium text-primary' : 'text-muted-foreground'}>
              {product.isPlatformSeller ? '✓ ' : ''}Sold by <span className="font-medium">{product.sellerName}</span>
            </span>
          </div>
        )}
        
        <p className="text-2xl font-bold text-primary">
          ${product.price.toFixed(2)}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock}
          className="w-full"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.inStock ? 'Add to Cart' : 'Sold Out'}
        </Button>
      </CardFooter>
    </Card>
  );
}
