import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { User, AlertCircle } from 'lucide-react';

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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Professional Details</h2>
          </div>
          
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-center">
                <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto" />
              </div>
              <div className="text-center mt-4">
                <p className="text-muted-foreground">
                  Professional details require database setup.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  The pro_profiles and related tables need to be created.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}