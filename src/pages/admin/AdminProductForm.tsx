import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Construction } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

export default function AdminProductForm() {
  const navigate = useNavigate();

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-4xl p-6">
          <Button onClick={() => navigate('/admin')} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Construction className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>Product Form</CardTitle>
              <CardDescription>
                This feature is coming soon. Database tables are being set up.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/admin')} variant="outline">
                Return to Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
