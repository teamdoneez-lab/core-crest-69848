import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export default function SupplierDashboard() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div>Loading...</div></div>;
  if (!user) return <Navigate to="/supplier-login" replace />;

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold mb-6">Supplier Dashboard</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Products</CardTitle></CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">Manage your products</p>
          <Link to="/supplier-product-upload"><Button>Upload Products</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}