import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";

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

export function ProductEditModal({ open, onOpenChange, product, onSuccess }: ProductEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Edit Product: {product.part_name}
          </DialogTitle>
          <DialogDescription>
            SKU: {product.sku}
          </DialogDescription>
        </DialogHeader>
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p>Product editing requires database setup.</p>
          <p className="text-sm mt-2">The supplier_products table needs to be created.</p>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}