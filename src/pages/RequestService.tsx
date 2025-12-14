import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/RoleGuard';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, ArrowRight } from 'lucide-react';

export default function RequestService() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartRequest = () => {
    navigate('/service-request-flow');
  };

  return (
    <RoleGuard allowedRoles={['customer']}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl p-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Request a Service</CardTitle>
              <CardDescription>
                Tell us about your vehicle and what service you need
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Get quotes from verified local professionals for your auto service needs.
              </p>
              <Button onClick={handleStartRequest} size="lg">
                Start Service Request
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}