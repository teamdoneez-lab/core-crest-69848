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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Building2, MapPin, CheckCircle, XCircle, Save, Edit } from 'lucide-react';

const proProfileSchema = z.object({
  business_name: z.string().trim().min(1, 'Business name is required').max(100, 'Business name too long'),
  phone: z.string().trim().min(10, 'Phone must be at least 10 digits').max(15, 'Phone too long').optional().or(z.literal('')),
  address: z.string().trim().max(200, 'Address too long').optional().or(z.literal('')),
  website: z.string().trim().url('Invalid website URL').max(200, 'URL too long').optional().or(z.literal('')),
  description: z.string().trim().max(500, 'Description too long').optional().or(z.literal('')),
  zip_code: z.string().trim().min(5, 'ZIP code must be at least 5 digits').max(10, 'ZIP code too long').optional().or(z.literal('')),
  city: z.string().trim().max(100, 'City name too long').optional().or(z.literal('')),
  state: z.string().trim().max(2, 'Use 2-letter state code').optional().or(z.literal('')),
  service_radius: z.number().min(5, 'Minimum radius is 5 miles').max(100, 'Maximum radius is 100 miles'),
  service_categories: z.array(z.string()).min(1, 'Select at least one service category'),
  service_areas: z.string().trim().min(1, 'Enter at least one ZIP code')
});

interface ServiceCategory {
  id: string;
  name: string;
}

interface ProProfile {
  business_name: string;
  phone?: string;
  address?: string;
  website?: string;
  description?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  service_radius: number;
  is_verified: boolean;
  profile_complete: boolean;
}

export default function ProProfile() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    zip_code: '',
    city: '',
    state: '',
    service_radius: 25,
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
        phone: data.phone || '',
        address: data.address || '',
        website: data.website || '',
        description: data.description || '',
        zip_code: data.zip_code || '',
        city: data.city || '',
        state: data.state || '',
        service_radius: data.service_radius || 25
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
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          website: validatedData.website || null,
          description: validatedData.description || null,
          zip_code: validatedData.zip_code || null,
          city: validatedData.city || null,
          state: validatedData.state || null,
          service_radius: validatedData.service_radius
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

      setIsEditing(false);
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
        <div className="mx-auto max-w-4xl p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">Professional Profile</h1>
              <p className="text-muted-foreground">Manage your business information and settings</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={profile?.is_verified ? "default" : "secondary"}>
                {profile?.is_verified ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Pending Verification
                  </>
                )}
              </Badge>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Business Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  {isEditing ? (
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{formData.business_name || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{formData.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{formData.address || 'Not provided'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                {isEditing ? (
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.example.com"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {formData.website ? (
                      <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {formData.website}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{formData.description || 'Not provided'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location & Service Area */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Service Area
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  {isEditing ? (
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      maxLength={10}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{formData.zip_code || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{formData.city || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  {isEditing ? (
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      maxLength={2}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{formData.state || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_radius">Service Radius (miles)</Label>
                {isEditing ? (
                  <Input
                    id="service_radius"
                    type="number"
                    min="5"
                    max="100"
                    value={formData.service_radius}
                    onChange={(e) => setFormData({ ...formData, service_radius: Number(e.target.value) })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{formData.service_radius} miles</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_areas">Additional Service Areas (ZIP Codes)</Label>
                {isEditing ? (
                  <Input
                    id="service_areas"
                    value={formData.service_areas}
                    onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
                    placeholder="12345, 12346, 12347"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{formData.service_areas || 'Not provided'}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter additional ZIP codes separated by commas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Services Offered */}
          <Card>
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>Select the services you provide</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.id}
                        checked={formData.service_categories.includes(category.id)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={category.id} className="text-sm font-normal cursor-pointer">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter(cat => formData.service_categories.includes(cat.id))
                    .map(cat => (
                      <Badge key={cat.id} variant="secondary">
                        {cat.name}
                      </Badge>
                    ))
                  }
                  {formData.service_categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">No services selected</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}