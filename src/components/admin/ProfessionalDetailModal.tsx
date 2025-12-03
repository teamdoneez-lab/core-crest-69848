import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface ProfessionalDetailModalProps {
  proId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfessionalDetailModal = ({ proId, open, onOpenChange }: ProfessionalDetailModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Professional Details</DialogTitle>
          <DialogDescription>
            Detailed information about the professional
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            Professional detail view requires additional database setup.
          </p>
          <p className="text-xs text-muted-foreground">
            Pro ID: {proId || 'N/A'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
