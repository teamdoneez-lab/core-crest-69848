import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SupplierStripeRefresh() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRestartOnboarding = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-supplier-connect-account');
      
      if (error) {
        toast({
          title: "Setup Failed",
          description: error.message || "Failed to restart Stripe setup. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Handle iframe redirect for Lovable preview
        if (window.top !== window.self) {
          window.top.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error restarting Stripe setup:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">Stripe Setup Incomplete</CardTitle>
          <CardDescription>
            Your Stripe onboarding was not completed. You need to finish setting up your account to receive payouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full" 
            onClick={handleRestartOnboarding}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Restart Stripe Onboarding'}
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/supplier-dashboard')}
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
