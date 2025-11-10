import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CartPanel() {
  const { cart, totalItems, subtotal, removeFromCart, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to complete checkout");
        setIsProcessing(false);
        return;
      }

      console.log("Starting checkout with cart:", cart);

      // Call edge function to create Stripe checkout session
      const res = await fetch(
        'https://cxraykdmlshcntqjumpc.supabase.co/functions/v1/create-marketplace-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ cartItems: cart }),
        }
      );

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Full Stripe session response:", data);

      if (data.error) {
        console.error("Checkout error:", data.error);
        toast.error(data.error || "Checkout failed. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (!data.url) {
        console.error("No checkout URL returned from backend:", data);
        toast.error("An error occurred: no checkout URL received.");
        setIsProcessing(false);
        return;
      }

      // Validate that the URL is a legitimate Stripe checkout URL
      if (!data.url.startsWith('https://checkout.stripe.com/')) {
        console.error("Invalid Stripe checkout URL:", data.url);
        toast.error("Invalid checkout URL received. Please try again.");
        setIsProcessing(false);
        return;
      }

      console.log("Valid Stripe checkout URL confirmed:", data.url);
      
      // Always open in new tab when in iframe to avoid security restrictions
      const isInIframe = window.top !== window.self;
      console.log("Running in iframe:", isInIframe);
      
      if (isInIframe) {
        console.log("Opening checkout in new tab (iframe detected)...");
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup was blocked
          toast.error("Popup blocked. Please allow popups and try again.");
        } else {
          toast.success("Opening Stripe checkout in new tab...");
        }
        setIsProcessing(false);
      } else {
        console.log("Redirecting to Stripe checkout...");
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Shopping cart with ${totalItems} items`}
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full p-0 px-1.5 text-xs"
            >
              {totalItems > 99 ? '99+' : totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({totalItems})</SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty!</h3>
            <p className="text-sm text-muted-foreground">
              Start shopping for parts and tools.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded object-cover bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {item.name}
                      </h4>
                      <p className="text-sm font-semibold text-primary mb-2">
                        ${item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-sm font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span className="text-primary">${subtotal.toFixed(2)}</span>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Proceed to Checkout"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Taxes and shipping calculated at checkout
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
