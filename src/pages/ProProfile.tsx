import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/RoleGuard';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

const proProfileSchema = z.object({
  business_name: z.string().trim().min(1, 'Business name is required').max(100, 'Business name too long'),
  notes: z.string().trim().max(1000, 'Notes too long').optional(),
  radius_km: z.number().min(5, 'Minimum radius is 5km').max(100, 'Maximum radius is 100km'),
  service_categories: z.array(z.string()).min(1, 'Select at least one service category'),
  service_areas: z.string().trim().min(1, 'Enter at least one ZIP code')
});

interface ServiceCategory {
  id: string;
  name: string;
}

interface ProProfile {
  business_name: string;
  notes?: string;
  radius_km: number;
  is_verified: boolean;
}

export default function ProProfile() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    business_name: '',
    notes: '',
    radius_km: 25,
    service_categories: [] as string[],
    service_areas: ''
  });

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchCategories(),
        fetchProProfile(),
        fetchProServiceCategories(),
        fetchProServiceAreas()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('service_categories')
      .select('id, name')
      .eq('active', true)
      .order('name');
    
    if (data) {
      setCategories(data);
    }
  };

  const fetchProProfile = async () => {
    const { data } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('pro_id', user?.id)
      .single();
    
    if (data) {
      setProfile(data);
      setFormData(prev => ({
        ...prev,
        business_name: data.business_name,
        notes: data.notes || '',
        radius_km: data.radius_km
      }));
    }
  };

  const fetchProServiceCategories = async () => {
    const { data } = await supabase
      .from('pro_service_categories')
      .select('category_id')
      .eq('pro_id', user?.id);
    
    if (data) {
      setFormData(prev => ({
        ...prev,
        service_categories: data.map(item => item.category_id)
      }));
    }
  };

  const fetchProServiceAreas = async () => {
    const { data } = await supabase
      .from('pro_service_areas')
      .select('zip')
      .eq('pro_id', user?.id);
    
    if (data) {
      setFormData(prev => ({
        ...prev,
        service_areas: data.map(item => item.zip).join(', ')
      }));
    }
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      service_categories: checked 
        ? [...prev.service_categories, categoryId]
        : prev.service_categories.filter(id => id !== categoryId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      const validatedData = proProfileSchema.parse({
        ...formData,
        service_areas: formData.service_areas.trim()
      });

      // Parse ZIP codes
      const zipCodes = validatedData.service_areas
        .split(',')
        .map(zip => zip.trim())
        .filter(zip => zip.length > 0);

      // Upsert pro profile
      const { error: profileError } = await supabase
        .from('pro_profiles')
        .upsert({
          pro_id: user?.id,
          business_name: validatedData.business_name,
          notes: validatedData.notes,
          radius_km: validatedData.radius_km
        });

      if (profileError) throw profileError;

      // Delete existing service categories
      await supabase
        .from('pro_service_categories')
        .delete()
        .eq('pro_id', user?.id);

      // Insert new service categories
      if (validatedData.service_categories.length > 0) {
        const categoryInserts = validatedData.service_categories.map(categoryId => ({
          pro_id: user?.id,
          category_id: categoryId
        }));

        const { error: categoriesError } = await supabase
          .from('pro_service_categories')
          .insert(categoryInserts);

        if (categoriesError) throw categoriesError;
      }

      // Delete existing service areas
      await supabase
        .from('pro_service_areas')
        .delete()
        .eq('pro_id', user?.id);

      // Insert new service areas
      if (zipCodes.length > 0) {
        const areaInserts = zipCodes.map(zip => ({
          pro_id: user?.id,
          zip: zip
        }));

        const { error: areasError } = await supabase
          .from('pro_service_areas')
          .insert(areaInserts);

        if (areasError) throw areasError;
      }

      toast({
        title: 'Success!',
        description: 'Your professional profile has been saved.'
      });

      // Refresh data
      await fetchProProfile();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save profile. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['pro']}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Profile</CardTitle>
              <CardDescription>
                Set up your business profile to start receiving service requests
                {profile?.is_verified && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    ✓ Verified
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Business Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="Your Auto Service Business"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Service Notes & Pricing (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Describe your services, pricing, specialties..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="radius">Service Radius (km)</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={formData.radius_km}
                      onChange={(e) => setFormData({ ...formData, radius_km: Number(e.target.value) })}
                      min="5"
                      max="100"
                      required
                    />
                  </div>
                </div>

                <Separator />

                {/* Service Categories */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Service Categories</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={formData.service_categories.includes(category.id)}
                          onCheckedChange={(checked) => 
                            handleCategoryChange(category.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={category.id} className="text-sm font-normal">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Service Areas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Service Areas</h3>
                  <div className="space-y-2">
                    <Label htmlFor="service_areas">ZIP Codes (comma-separated)</Label>
                    <Input
                      id="service_areas"
                      value={formData.service_areas}
                      onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
                      placeholder="12345, 12346, 12347"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the ZIP codes where you provide services, separated by commas
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}