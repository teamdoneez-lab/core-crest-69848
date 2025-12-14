import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, CheckCircle, DollarSign, Settings } from 'lucide-react';

export default function ProDashboard() {
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
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Professional Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Manage your auto service business
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access your most used features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link to="/service-requests">
                  <Button className="w-full h-20 text-lg">
                    <Wrench className="mr-2 h-6 w-6" />
                    New Requests
                  </Button>
                </Link>
                <Link to="/my-jobs">
                  <Button variant="outline" className="w-full h-20 text-lg">
                    <CheckCircle className="mr-2 h-6 w-6" />
                    My Jobs
                  </Button>
                </Link>
                <Link to="/earnings">
                  <Button variant="outline" className="w-full h-20 text-lg">
                    <DollarSign className="mr-2 h-6 w-6" />
                    Earnings
                  </Button>
                </Link>
                <Link to="/pro-profile">
                  <Button variant="outline" className="w-full h-20 text-lg">
                    <Settings className="mr-2 h-6 w-6" />
                    Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No recent activity to display.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}