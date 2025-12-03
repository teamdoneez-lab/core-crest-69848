import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface ProductEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    sku: string;
    part_name: string;
    description?: string;
    images?: string[];
  };
  onSuccess: () => void;
}

export function ProductEditModal({ open, onOpenChange, product }: ProductEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product: {product.part_name}</DialogTitle>
        </DialogHeader>

        <div className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            Product editing requires additional database setup.
          </p>
          <p className="text-xs text-muted-foreground">
            SKU: {product.sku}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
