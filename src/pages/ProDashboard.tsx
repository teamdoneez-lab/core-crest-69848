import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Briefcase } from 'lucide-react';

export default function ProDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: roleLoading } = useRole();

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isPro) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Pro Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage your professional services</p>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Dashboard</CardTitle></CardHeader>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Pro dashboard requires additional database setup.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
