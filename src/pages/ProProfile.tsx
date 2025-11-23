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
import { Building2, MapPin, CheckCircle, XCircle, Save, Edit, Search } from 'lucide-react';
import { accordionsData } from '@/data/serviceslist-detailed';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const triggerGeocode = async (zip_code: string, address: string, user_id?: string) => {
  try {
    await fetch('/functions/v1/geocode_pro_profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zip_code,
        address,
        pro_id: user_id
      }),
    });
  } catch (e) {
    console.error("Geocode failed:", e);
  }
};

const proProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  business_name: z.string().trim().min(1, 'Business name is required').max(100, 'Business name too long'),
  phone: z.string().trim().min(10, 'Phone must be at least 10 digits').max(15, 'Phone too long').optional().or(z.literal('')),
  address: z.string().trim().max(200, 'Address too long').optional().or(z.literal('')),
  website: z.string().trim().url('Invalid website URL').max(200, 'URL too long').optional().or(z.literal('')),
  description: z.string().trim().max(500, 'Description too long').optional().or(z.literal('')),
  zip_code: z.string().trim().min(5, 'ZIP code must be at least 5 digits').max(10, 'ZIP code too long').optional().or(z.literal('')),
  city: z.string().trim().max(100, 'City name too long').optional().or(z.literal('')),
  state: z.string().trim().max(2, 'Use 2-letter state code').optional().or(z.literal('')),
  service_radius: z.number().min(5, 'Minimum radius is 5 miles').max(100, 'Maximum radius is 100 miles'),
  selectedServices: z.array(z.string()).min(1, 'Select at least one service'),
  service_areas: z.string().trim().min(1, 'Enter at least one ZIP code')
});

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
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    zip_code: '',
    city: '',
    state: '',
    service_radius: 25,
    selectedServices: [] as string[],
    service_areas: ''
  });

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchProProfile(),
        fetchProServiceAreas()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchProProfile = async () => {
    const { data: proData } = await supabase
      .from('pro_profiles')
      .select('*')
      .eq('pro_id', user?.id)
      .single();
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user?.id)
      .single();
    
    if (proData) {
      setProfile(proData);
      
      // Parse selectedServices from notes field
      let selectedServices: string[] = [];
      if (proData.notes) {
        try {
          const parsedNotes = JSON.parse(proData.notes);
          selectedServices = parsedNotes.selectedServices || [];
        } catch (e) {
          console.error('Error parsing notes:', e);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        name: profileData?.name || '',
        business_name: proData.business_name,
        phone: proData.phone || '',
        address: proData.address || '',
        website: proData.website || '',
        description: proData.description || '',
        zip_code: proData.zip_code || '',
        city: proData.city || '',
        state: proData.state || '',
        service_radius: proData.service_radius || 25,
        selectedServices
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

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: checked 
        ? [...prev.selectedServices, serviceId]
        : prev.selectedServices.filter(id => id !== serviceId)
    }));
  };

  const handleSelectAllInSubItem = (subItem: any, checked: boolean) => {
    const serviceIds = subItem.services.map((s: any) => s.id);
    setFormData(prev => ({
      ...prev,
      selectedServices: checked
        ? [...new Set([...prev.selectedServices, ...serviceIds])]
        : prev.selectedServices.filter(id => !serviceIds.includes(id))
    }));
  };

  const handleSelectAllInAccordion = (accordion: any, checked: boolean) => {
    const allServiceIds = accordion.subItems.flatMap((subItem: any) => 
      subItem.services.map((s: any) => s.id)
    );
    setFormData(prev => ({
      ...prev,
      selectedServices: checked
        ? [...new Set([...prev.selectedServices, ...allServiceIds])]
        : prev.selectedServices.filter(id => !allServiceIds.includes(id))
    }));
  };

  // Filter services based on search
  const filteredAccordions = accordionsData.map(accordion => ({
    ...accordion,
    subItems: accordion.subItems.map(subItem => ({
      ...subItem,
      services: subItem.services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(subItem => subItem.services.length > 0)
  })).filter(accordion => accordion.subItems.length > 0);

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

      // Update user profile name
      const { error: nameError } = await supabase
        .from('profiles')
        .update({ name: validatedData.name })
        .eq('id', user?.id);

      if (nameError) throw nameError;

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

      const zipChanged = validatedData.zip_code !== profile?.zip_code;
      const addressChanged = validatedData.address !== profile?.address;

      if (zipChanged || addressChanged) {
        await triggerGeocode(validatedData.zip_code || '', validatedData.address || '', user?.id);
      }

      // Store selected services in notes field as JSON
      const servicesData = {
        selectedServices: validatedData.selectedServices
      };
      
      await supabase
        .from('pro_profiles')
        .update({ 
          notes: JSON.stringify(servicesData)
        })
        .eq('pro_id', user?.id);

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
                  <Label htmlFor="name">Your Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{formData.name || 'Not provided'}</p>
                  )}
                </div>
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Search Services</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <Accordion type="multiple" className="w-full">
                      {filteredAccordions.map((accordion) => {
                        const allAccordionServiceIds = accordion.subItems.flatMap(subItem => 
                          subItem.services.map(s => s.id)
                        );
                        const allAccordionSelected = allAccordionServiceIds.length > 0 && 
                          allAccordionServiceIds.every(id => formData.selectedServices.includes(id));
                        const someAccordionSelected = allAccordionServiceIds.some(id => 
                          formData.selectedServices.includes(id)
                        );

                        return (
                          <AccordionItem key={accordion.title} value={accordion.title}>
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center gap-2 flex-1">
                                <Checkbox
                                  checked={allAccordionSelected}
                                  ref={(el) => {
                                    if (el) {
                                      const input = el.querySelector('input');
                                      if (input) input.indeterminate = someAccordionSelected && !allAccordionSelected;
                                    }
                                  }}
                                  onCheckedChange={(checked) => {
                                    handleSelectAllInAccordion(accordion, checked as boolean);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="font-medium">{accordion.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 px-4 pb-2">
                                {accordion.subItems.map((subItem) => {
                                  const subItemServiceIds = subItem.services.map(s => s.id);
                                  const allSubItemSelected = subItemServiceIds.length > 0 && 
                                    subItemServiceIds.every(id => formData.selectedServices.includes(id));
                                  const someSubItemSelected = subItemServiceIds.some(id => 
                                    formData.selectedServices.includes(id)
                                  );

                                  return (
                                    <div key={subItem.title} className="space-y-2">
                                      <div className="flex items-center gap-2 mt-2">
                                        <Checkbox
                                          checked={allSubItemSelected}
                                          ref={(el) => {
                                            if (el) {
                                              const input = el.querySelector('input');
                                              if (input) input.indeterminate = someSubItemSelected && !allSubItemSelected;
                                            }
                                          }}
                                          onCheckedChange={(checked) => 
                                            handleSelectAllInSubItem(subItem, checked as boolean)
                                          }
                                        />
                                        <h4 className="text-sm font-medium text-muted-foreground">
                                          {subItem.title}
                                        </h4>
                                      </div>
                                      <div className="grid grid-cols-1 gap-2 pl-8">
                                        {subItem.services.map((service) => (
                                          <div key={service.id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`service-${service.id}`}
                                              checked={formData.selectedServices.includes(service.id)}
                                              onCheckedChange={(checked) => 
                                                handleServiceToggle(service.id, checked as boolean)
                                              }
                                            />
                                            <Label 
                                              htmlFor={`service-${service.id}`} 
                                              className="text-sm font-normal cursor-pointer"
                                            >
                                              {service.name}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Selected: {formData.selectedServices.length} service(s)
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {formData.selectedServices.length > 0 
                      ? `${formData.selectedServices.length} service${formData.selectedServices.length === 1 ? '' : 's'} selected`
                      : 'No services selected'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}