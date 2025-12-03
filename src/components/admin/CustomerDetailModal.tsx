import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface CustomerDetailModalProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailModal({ customerId, open, onOpenChange }: CustomerDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            Customer information and service history
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Customer detail view requires additional database setup.
            </p>
            <p className="text-xs text-muted-foreground">
              Customer ID: {customerId}
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
