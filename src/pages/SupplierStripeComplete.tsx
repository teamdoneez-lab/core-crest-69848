import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SupplierStripeComplete() {
  const navigate = useNavigate();

  useEffect(() => {
    toast({
      title: "Stripe Connected!",
      description: "Your Stripe account has been connected successfully. You can now receive payouts.",
    });
  }, []);

  const handleContinue = () => {
    navigate('/supplier-dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Stripe Account Connected!</CardTitle>
          <CardDescription>
            Your Stripe account has been successfully connected. You can now start selling products and receiving payouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={handleContinue}
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
