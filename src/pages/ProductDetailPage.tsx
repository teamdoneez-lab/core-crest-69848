import { Navigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const { productHandle } = useParams<{ productHandle: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !isPro) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <Link to="/pro-marketplace">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-6">
              Product not found or marketplace is currently unavailable.
            </p>
            <Link to="/pro-marketplace">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Marketplace
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}