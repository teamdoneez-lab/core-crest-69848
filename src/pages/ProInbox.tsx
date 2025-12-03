import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Inbox } from 'lucide-react';

export default function ProInbox() {
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
        <h1 className="text-3xl font-bold mb-2">Inbox</h1>
        <p className="text-muted-foreground mb-8">View incoming service requests</p>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5" />Service Requests</CardTitle></CardHeader>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Inbox requires additional database setup.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
