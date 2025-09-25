import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function RequestConfirmation() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <CardTitle>Request Submitted Successfully!</CardTitle>
            <CardDescription>
              Your service request has been received and will be reviewed by professionals in your area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Qualified professionals in your area will review your request</li>
                <li>You'll receive quotes and availability from interested providers</li>
                <li>Compare options and choose the best fit for your needs</li>
                <li>Schedule your service appointment</li>
              </ul>
            </div>
            
            <div className="flex gap-4">
              <Button asChild className="flex-1">
                <Link to="/">Return to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/request-service">Submit Another Request</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}