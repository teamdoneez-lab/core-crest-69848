import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SupplierOnboarding() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Supplier Onboarding</CardTitle>
          <CardDescription>Complete your supplier profile</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">Welcome! Complete your setup to start selling.</p>
          <Button onClick={() => navigate('/supplier-dashboard')}>Complete Setup</Button>
        </CardContent>
      </Card>
    </div>
  );
}