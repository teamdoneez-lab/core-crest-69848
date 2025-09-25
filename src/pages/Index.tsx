import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ServiceCategory {
  id: string;
  name: string;
  active: boolean;
}

interface Profile {
  id: string;
  name: string;
  role: 'customer' | 'pro' | 'admin';
  phone?: string;
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect to auth if not authenticated
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch service categories
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

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Auto Services Marketplace</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.name || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {profile?.role || 'customer'}
            </Badge>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default Index;
