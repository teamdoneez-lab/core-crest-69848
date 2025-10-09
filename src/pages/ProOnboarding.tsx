import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { accordionsData } from '@/data/serviceslist-detailed';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const businessDetailsSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required').max(100, 'Business name too long'),
  businessPhone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone too long'),
  businessAddress: z.string().trim().min(1, 'Business address is required').max(200, 'Address too long'),
  businessWebsite: z.string().trim().url('Invalid website URL').max(200, 'URL too long').optional().or(z.literal('')),
  businessDescription: z.string().trim().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
  serviceType: z.enum(['mobile', 'in_shop', 'both'], { required_error: 'Service type is required' }),
});

const servicesSchema = z.object({
  selectedServices: z.array(z.string()).min(1, 'Select at least one service'),
});

const locationSchema = z.object({
  zipCode: z.string().trim().min(5, 'ZIP code must be at least 5 digits').max(10, 'ZIP code too long'),
  city: z.string().trim().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().trim().min(2, 'State is required').max(2, 'Use 2-letter state code'),
  serviceRadius: z.number().min(5, 'Minimum radius is 5 miles').max(100, 'Maximum radius is 100 miles'),
});

interface ServiceCategory {
  id: string;
  name: string;
}

export default function ProOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  // Check email verification status
  useEffect(() => {
    if (user) {
      setEmailVerified(user.email_confirmed_at !== null);
    }
  }, [user]);

  // Form data for all steps
  const [businessDetails, setBusinessDetails] = useState({
    businessName: '',
    businessPhone: '',
    businessAddress: '',
    businessWebsite: '',
    businessDescription: '',
    serviceType: 'both' as 'mobile' | 'in_shop' | 'both',
  });

  const [services, setServices] = useState({
    selectedServices: [] as string[],
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [location, setLocation] = useState({
    zipCode: '',
    city: '',
    state: '',
    serviceRadius: 25,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const validateCurrentStep = () => {
    try {
      switch (currentStep) {
        case 1:
          businessDetailsSchema.parse(businessDetails);
          return true;
        case 2:
          servicesSchema.parse(services);
          return true;
        case 3:
          locationSchema.parse(location);
          return true;
        default:
          return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      }
      return false;
    }
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setServices(prev => ({
      ...prev,
      selectedServices: checked 
        ? [...prev.selectedServices, serviceId]
        : prev.selectedServices.filter(id => id !== serviceId)
    }));
  };

  const handleSelectAllInSubItem = (subItem: any, checked: boolean) => {
    const serviceIds = subItem.services.map((s: any) => s.id);
    setServices(prev => ({
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
    setServices(prev => ({
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

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    try {
      // Create or update professional profile with all data
      const servicesData = {
        selectedServices: services.selectedServices,
        serviceType: businessDetails.serviceType
      };

      const { error: proProfileError } = await supabase
        .from('pro_profiles')
        .upsert({
          pro_id: user?.id,
          business_name: businessDetails.businessName,
          phone: businessDetails.businessPhone,
          address: businessDetails.businessAddress,
          website: businessDetails.businessWebsite || null,
          description: businessDetails.businessDescription,
          zip_code: location.zipCode,
          city: location.city,
          state: location.state,
          service_radius: location.serviceRadius,
          profile_complete: true,
          is_verified: false, // Will be verified by admin
          notes: JSON.stringify(servicesData)
        });

      if (proProfileError) throw proProfileError;

      // Add primary service area (ZIP code)
      await supabase
        .from('pro_service_areas')
        .delete()
        .eq('pro_id', user?.id);

      const { error: areaError } = await supabase
        .from('pro_service_areas')
        .insert({
          pro_id: user?.id,
          zip: location.zipCode
        });

      if (areaError) throw areaError;

      // Add ALL service categories to pro_service_categories
      // Since the onboarding collects individual services, we'll add all categories
      await supabase
        .from('pro_service_categories')
        .delete()
        .eq('pro_id', user?.id);

      const { data: allCategories, error: fetchCategoriesError } = await supabase
        .from('service_categories')
        .select('id')
        .eq('active', true);

      if (fetchCategoriesError) {
        console.error('Error fetching categories:', fetchCategoriesError);
        throw fetchCategoriesError;
      }

      if (allCategories && allCategories.length > 0) {
        const categoryInserts = allCategories.map(cat => ({
          pro_id: user?.id,
          category_id: cat.id
        }));

        console.log('Inserting categories:', categoryInserts);

        const { error: categoryError } = await supabase
          .from('pro_service_categories')
          .insert(categoryInserts);

        if (categoryError) {
          console.error('Error inserting categories:', categoryError);
          throw categoryError;
        }

        console.log('Successfully inserted', allCategories.length, 'service categories');
      } else {
        console.warn('No active service categories found to insert');
      }

      toast({
        title: 'Registration Complete!',
        description: 'Your professional profile has been created. Pending admin verification.'
      });

      navigate('/pro-dashboard');
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit registration. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Details</h3>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={businessDetails.businessName}
                onChange={(e) => setBusinessDetails({...businessDetails, businessName: e.target.value})}
                placeholder="Your Auto Shop LLC"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone *</Label>
                <Input
                  id="businessPhone"
                  value={businessDetails.businessPhone}
                  onChange={(e) => setBusinessDetails({...businessDetails, businessPhone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessWebsite">Business Website (Optional)</Label>
                <Input
                  id="businessWebsite"
                  value={businessDetails.businessWebsite}
                  onChange={(e) => setBusinessDetails({...businessDetails, businessWebsite: e.target.value})}
                  placeholder="https://www.yourshop.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Input
                id="businessAddress"
                value={businessDetails.businessAddress}
                onChange={(e) => setBusinessDetails({...businessDetails, businessAddress: e.target.value})}
                placeholder="123 Main St, City, State"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description *</Label>
              <Textarea
                id="businessDescription"
                value={businessDetails.businessDescription}
                onChange={(e) => setBusinessDetails({...businessDetails, businessDescription: e.target.value})}
                placeholder="Describe your business, specialties, and what sets you apart..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Service Type *</Label>
              <RadioGroup 
                value={businessDetails.serviceType}
                onValueChange={(value) => setBusinessDetails({...businessDetails, serviceType: value as 'mobile' | 'in_shop' | 'both'})}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mobile" id="mobile" />
                  <Label htmlFor="mobile" className="font-normal cursor-pointer">
                    Mobile (I come to the customer)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in_shop" id="in_shop" />
                  <Label htmlFor="in_shop" className="font-normal cursor-pointer">
                    In-Shop (Customers come to my location)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="font-normal cursor-pointer">
                    Both (Mobile and In-Shop)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services Offered</h3>
            <p className="text-sm text-muted-foreground">Select all services you provide</p>
            
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
                    allAccordionServiceIds.every(id => services.selectedServices.includes(id));
                  const someAccordionSelected = allAccordionServiceIds.some(id => 
                    services.selectedServices.includes(id)
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
                                    subItemServiceIds.every(id => services.selectedServices.includes(id));
                                  const someSubItemSelected = subItemServiceIds.some(id => 
                                    services.selectedServices.includes(id)
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
                                              checked={services.selectedServices.includes(service.id)}
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
              Selected: {services.selectedServices.length} service(s)
            </p>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location & Service Area</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={location.zipCode}
                  onChange={(e) => setLocation({...location, zipCode: e.target.value})}
                  placeholder="12345"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={location.city}
                  onChange={(e) => setLocation({...location, city: e.target.value})}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={location.state}
                  onChange={(e) => setLocation({...location, state: e.target.value.toUpperCase()})}
                  placeholder="NY"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceRadius">Service Radius (miles) *</Label>
              <Input
                id="serviceRadius"
                type="number"
                min="5"
                max="100"
                value={location.serviceRadius}
                onChange={(e) => setLocation({...location, serviceRadius: Number(e.target.value)})}
              />
              <p className="text-xs text-muted-foreground">
                How far are you willing to travel for service calls?
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Your Registration</h3>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Business Details</h4>
                <p className="text-sm text-muted-foreground">Business: {businessDetails.businessName}</p>
                <p className="text-sm text-muted-foreground">Phone: {businessDetails.businessPhone}</p>
                <p className="text-sm text-muted-foreground">Address: {businessDetails.businessAddress}</p>
                {businessDetails.businessWebsite && <p className="text-sm text-muted-foreground">Website: {businessDetails.businessWebsite}</p>}
                <p className="text-sm text-muted-foreground">Description: {businessDetails.businessDescription}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Services Offered</h4>
                <p className="text-sm text-muted-foreground">
                  {services.selectedServices.length} service{services.selectedServices.length === 1 ? '' : 's'} selected
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Location & Service Area</h4>
                <p className="text-sm text-muted-foreground">Location: {location.city}, {location.state} {location.zipCode}</p>
                <p className="text-sm text-muted-foreground">Service Radius: {location.serviceRadius} miles</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show email verification notice if email not verified
  if (emailVerified === false) {
    return (
      <RoleGuard allowedRoles={['pro']}>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="mx-auto max-w-2xl p-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Verification Required</CardTitle>
                <CardDescription>
                  Please verify your email address to continue with registration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-center py-8">
                  <p className="text-muted-foreground">
                    We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    After verifying your email, refresh this page to continue.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['pro']}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl p-6">
          <Card>
            <CardHeader>
              <div className="mb-4">
                <ProgressIndicator currentStep={currentStep} totalSteps={4} />
              </div>
              <CardTitle>Professional Registration</CardTitle>
              <CardDescription>
                Register your business to start receiving job requests from customers in your area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {renderStepContent()}
                
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button onClick={handleNext} className="flex items-center gap-2">
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}