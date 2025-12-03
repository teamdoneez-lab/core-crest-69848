import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface ProDetailModalProps {
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProDetailModal({ requestId, open, onOpenChange }: ProDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Professional Details</DialogTitle>
          <DialogDescription>
            Information about matched professionals
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            Professional detail view requires additional database setup.
          </p>
          <p className="text-xs text-muted-foreground">
            Request ID: {requestId}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
