import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail } from 'lucide-react';

export default function ProProfile() {
  const { user, loading: authLoading } = useAuth();
  const { profile, isPro, loading: roleLoading } = useRole();

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Professional Profile</h1>
          <p className="text-muted-foreground">Manage your business information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Your professional information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="text-muted-foreground flex items-center gap-2 mb-1">
                  <User className="h-4 w-4" />
                  Name
                </label>
                <p className="text-lg font-medium">{profile?.name || 'Not set'}</p>
              </div>

              <div>
                <label className="text-muted-foreground flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <p className="text-lg font-medium">{profile?.phone || 'Not set'}</p>
              </div>

              <div>
                <label className="text-muted-foreground flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-lg font-medium">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}