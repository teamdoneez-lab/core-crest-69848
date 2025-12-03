import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface ProDetailWithReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proId: string;
}

export function ProDetailWithReviewsModal({
  open,
  onOpenChange,
  proId,
}: ProDetailWithReviewsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Professional Details</DialogTitle>
        </DialogHeader>

        <div className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            Professional details require additional database setup.
          </p>
          <p className="text-xs text-muted-foreground">
            Pro ID: {proId}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
