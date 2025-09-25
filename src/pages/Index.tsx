import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceCategory {
  id: string;
  name: string;
  active: boolean;
}

const Index = () => {
  const { user, loading } = useAuth();
  const { profile, isCustomer, isPro, isAdmin, loading: roleLoading } = useRole();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect to auth if not authenticated
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchServiceCategories();
    }
  }, [user]);

  const fetchServiceCategories = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('service_categories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || roleLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isAdmin && 'Admin Dashboard'}
            {isPro && 'Professional Dashboard'}
            {isCustomer && 'Customer Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.name || user?.email}
          </p>
        </div>

        {isCustomer && (
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
              <CardDescription>
                Browse available auto services in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Find {category.name.toLowerCase()} services near you
                    </p>
                  </div>
                ))}
              </div>
              {categories.length === 0 && (
                <p className="text-center text-muted-foreground">
                  No service categories available yet.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {isPro && (
          <Card>
            <CardHeader>
              <CardTitle>Professional Dashboard</CardTitle>
              <CardDescription>
                Manage your service offerings and requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Complete your professional profile to start receiving service requests.
              </p>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>
                System administration and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage users, service categories, and system settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
