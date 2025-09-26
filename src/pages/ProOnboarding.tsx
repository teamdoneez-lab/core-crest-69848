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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const basicInfoSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  businessName: z.string().trim().max(100, 'Business name too long').optional(),
});

const businessInfoSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required').max(100, 'Business name too long'),
  experience: z.number().min(0, 'Experience cannot be negative').max(50, 'Experience too high'),
  serviceCategories: z.array(z.string()).min(1, 'Select at least one service category'),
  serviceAreas: z.string().trim().min(1, 'Enter at least one ZIP code'),
});

const verificationSchema = z.object({
  licenseNumber: z.string().trim().min(1, 'License number is required').max(50, 'License number too long'),
  insuranceProvider: z.string().trim().min(1, 'Insurance provider is required').max(100, 'Insurance provider too long'),
  yearsExperience: z.number().min(0, 'Years of experience cannot be negative').max(50, 'Years too high'),
  certifications: z.string().trim().max(500, 'Certifications description too long').optional(),
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

  // Form data for all steps
  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    businessName: ''
  });

  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    experience: 0,
    serviceCategories: [] as string[],
    serviceAreas: ''
  });

  const [verificationInfo, setVerificationInfo] = useState({
    licenseNumber: '',
    insuranceProvider: '',
    yearsExperience: 0,
    certifications: ''
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
          basicInfoSchema.parse(basicInfo);
          return true;
        case 2:
          businessInfoSchema.parse(businessInfo);
          return true;
        case 3:
          verificationSchema.parse(verificationInfo);
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

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setBusinessInfo(prev => ({
      ...prev,
      serviceCategories: checked 
        ? [...prev.serviceCategories, categoryId]
        : prev.serviceCategories.filter(id => id !== categoryId)
    }));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    try {
      // Parse ZIP codes
      const zipCodes = businessInfo.serviceAreas
        .split(',')
        .map(zip => zip.trim())
        .filter(zip => zip.length > 0);

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: basicInfo.fullName,
          phone: basicInfo.phone
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Create professional profile
      const { error: proProfileError } = await supabase
        .from('pro_profiles')
        .upsert({
          pro_id: user?.id,
          business_name: businessInfo.businessName || basicInfo.businessName,
          radius_km: 25, // Default radius
          is_verified: false // Will be verified by admin
        });

      if (proProfileError) throw proProfileError;

      // Add service categories
      if (businessInfo.serviceCategories.length > 0) {
        // Delete existing categories first
        await supabase
          .from('pro_service_categories')
          .delete()
          .eq('pro_id', user?.id);

        const categoryInserts = businessInfo.serviceCategories.map(categoryId => ({
          pro_id: user?.id,
          category_id: categoryId
        }));

        const { error: categoriesError } = await supabase
          .from('pro_service_categories')
          .insert(categoryInserts);

        if (categoriesError) throw categoriesError;
      }

      // Add service areas
      if (zipCodes.length > 0) {
        // Delete existing areas first
        await supabase
          .from('pro_service_areas')
          .delete()
          .eq('pro_id', user?.id);

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
        title: 'Application Submitted!',
        description: 'Your professional application has been submitted for review.'
      });

      navigate('/pro-dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
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
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={basicInfo.fullName}
                  onChange={(e) => setBasicInfo({...basicInfo, fullName: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={basicInfo.email}
                  onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})}
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({...basicInfo, phone: e.target.value})}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessNameBasic">Business Name (Optional)</Label>
                <Input
                  id="businessNameBasic"
                  value={basicInfo.businessName}
                  onChange={(e) => setBasicInfo({...basicInfo, businessName: e.target.value})}
                  placeholder="Enter business name if applicable"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessInfo.businessName}
                  onChange={(e) => setBusinessInfo({...businessInfo, businessName: e.target.value})}
                  placeholder="Your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience *</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={businessInfo.experience}
                  onChange={(e) => setBusinessInfo({...businessInfo, experience: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Service Categories *</Label>
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category.id}`}
                      checked={businessInfo.serviceCategories.includes(category.id)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`cat-${category.id}`} className="text-sm font-normal">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceAreas">Service Areas (ZIP Codes) *</Label>
              <Input
                id="serviceAreas"
                value={businessInfo.serviceAreas}
                onChange={(e) => setBusinessInfo({...businessInfo, serviceAreas: e.target.value})}
                placeholder="12345, 12346, 12347"
              />
              <p className="text-xs text-muted-foreground">
                Enter ZIP codes separated by commas
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Verification Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={verificationInfo.licenseNumber}
                  onChange={(e) => setVerificationInfo({...verificationInfo, licenseNumber: e.target.value})}
                  placeholder="Enter your mechanic license number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Insurance Provider *</Label>
                <Input
                  id="insuranceProvider"
                  value={verificationInfo.insuranceProvider}
                  onChange={(e) => setVerificationInfo({...verificationInfo, insuranceProvider: e.target.value})}
                  placeholder="Enter your liability insurance provider"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Experience *</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  max="50"
                  value={verificationInfo.yearsExperience}
                  onChange={(e) => setVerificationInfo({...verificationInfo, yearsExperience: Number(e.target.value)})}
                  placeholder="Enter years of experience"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications (Optional)</Label>
                <Input
                  id="certifications"
                  value={verificationInfo.certifications}
                  onChange={(e) => setVerificationInfo({...verificationInfo, certifications: e.target.value})}
                  placeholder="ASE, manufacturer certifications, etc."
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Your Application</h3>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Basic Information</h4>
                <p className="text-sm text-muted-foreground">Name: {basicInfo.fullName}</p>
                <p className="text-sm text-muted-foreground">Email: {basicInfo.email}</p>
                <p className="text-sm text-muted-foreground">Phone: {basicInfo.phone}</p>
                {basicInfo.businessName && <p className="text-sm text-muted-foreground">Business: {basicInfo.businessName}</p>}
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Business Information</h4>
                <p className="text-sm text-muted-foreground">Business Name: {businessInfo.businessName}</p>
                <p className="text-sm text-muted-foreground">Experience: {businessInfo.experience} years</p>
                <p className="text-sm text-muted-foreground">Service Areas: {businessInfo.serviceAreas}</p>
                <p className="text-sm text-muted-foreground">
                  Categories: {businessInfo.serviceCategories.length} selected
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Verification</h4>
                <p className="text-sm text-muted-foreground">License: {verificationInfo.licenseNumber}</p>
                <p className="text-sm text-muted-foreground">Insurance: {verificationInfo.insuranceProvider}</p>
                <p className="text-sm text-muted-foreground">Experience: {verificationInfo.yearsExperience} years</p>
                {verificationInfo.certifications && <p className="text-sm text-muted-foreground">Certifications: {verificationInfo.certifications}</p>}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
              <CardTitle>Join DoneEZ Pro</CardTitle>
              <CardDescription>
                Complete your application to start receiving qualified job requests from customers.
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