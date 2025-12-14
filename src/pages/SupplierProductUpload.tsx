import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, ArrowLeft } from 'lucide-react';

export default function SupplierProductUpload() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div>Loading...</div></div>;
  if (!user) return <Navigate to="/supplier-login" replace />;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/supplier-dashboard"><Button variant="ghost" size="sm" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload Products</CardTitle>
            <CardDescription>Add new products to your catalog</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Product upload functionality coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}