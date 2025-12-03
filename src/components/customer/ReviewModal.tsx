import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string | null;
  proId: string;
  proName: string;
  onReviewSubmitted?: () => void;
}

export function ReviewModal({
  open,
  onOpenChange,
  proName
}: ReviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {proName}</DialogTitle>
        </DialogHeader>

        <div className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            Review functionality requires additional database setup.
          </p>
          <p className="text-xs text-muted-foreground">
            The pro_reviews table needs to be created.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
