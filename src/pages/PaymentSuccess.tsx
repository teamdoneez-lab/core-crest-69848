import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const requestId = searchParams.get('request_id');

    if (!sessionId || !requestId) {
      setError('Missing payment information');
      setVerifying(false);
      return;
    }

    verifyPayment(sessionId, requestId);
  }, [searchParams]);

  const verifyPayment = async (sessionId: string, requestId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-referral-payment', {
        body: {
          session_id: sessionId,
          request_id: requestId
        }
      });

      if (error) throw error;

      if (data?.success) {
        setSuccess(true);
      } else {
        setError('Payment verification failed');
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setError(err.message || 'Payment verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {verifying ? (
              <>
                <div className="mx-auto mb-4">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
                <CardTitle>Verifying Payment...</CardTitle>
                <CardDescription>Please wait while we confirm your payment</CardDescription>
              </>
            ) : success ? (
              <>
                <div className="mx-auto mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle>Payment Successful!</CardTitle>
                <CardDescription>Your appointment has been confirmed</CardDescription>
              </>
            ) : (
              <>
                <CardTitle>Payment Verification Failed</CardTitle>
                <CardDescription>{error}</CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            {success && (
              <>
                <p className="text-muted-foreground">
                  The customer has been notified and will schedule the appointment with you shortly.
                </p>
                <Button onClick={() => navigate('/pro-dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
              </>
            )}
            
            {error && (
              <Button onClick={() => navigate('/pro-dashboard')} variant="outline" className="w-full">
                Return to Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
