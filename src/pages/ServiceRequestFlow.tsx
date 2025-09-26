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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Car, MapPin, Clock, Upload } from 'lucide-react';

const serviceRequestSchema = z.object({
  category_id: z.string().min(1, 'Please select a service category'),
  vehicle_make: z.string().trim().min(1, 'Vehicle make is required'),
  model: z.string().trim().min(1, 'Model is required'),
  year: z.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 1, 'Invalid year'),
  mileage: z.number().min(0, 'Invalid mileage').optional(),
  address: z.string().trim().min(1, 'Address is required'),
  zip: z.string().trim().min(5, 'ZIP code must be at least 5 characters'),
  appointment_pref: z.enum(['asap', 'scheduled', 'flexible']),
  contact_email: z.string().trim().email('Invalid email address'),
  contact_phone: z.string().trim().min(10, 'Phone number must be at least 10 digits'),
  notes: z.string().trim().optional(),
});

interface ServiceCategory {
  id: string;
  name: string;
}

export default function ServiceRequestFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form data for all steps
  const [serviceInfo, setServiceInfo] = useState({
    category_id: ''
  });

  const [vehicleInfo, setVehicleInfo] = useState({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    mileage: ''
  });

  const [appointmentInfo, setAppointmentInfo] = useState({
    serviceLocation: 'mobile',
    address: '',
    zip: '',
    preferredDate: '',
    preferredTime: '',
    urgency: '1-2-days'
  });

  const [additionalInfo, setAdditionalInfo] = useState({
    description: '',
    photos: [] as File[]
  });

  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    email: user?.email || '',
    phone: ''
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
          if (!serviceInfo.category_id) {
            toast({
              title: 'Validation Error',
              description: 'Please select a service category',
              variant: 'destructive'
            });
            return false;
          }
          return true;
        case 2:
          if (!vehicleInfo.make || !vehicleInfo.model) {
            toast({
              title: 'Validation Error',
              description: 'Please fill in all vehicle information',
              variant: 'destructive'
            });
            return false;
          }
          return true;
        case 3:
          if (!appointmentInfo.address || !appointmentInfo.zip) {
            toast({
              title: 'Validation Error',
              description: 'Please fill in address and ZIP code',
              variant: 'destructive'
            });
            return false;
          }
          return true;
        case 4:
          // Additional info is optional
          return true;
        case 5:
          if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
            toast({
              title: 'Validation Error',
              description: 'Please fill in all contact information',
              variant: 'destructive'
            });
            return false;
          }
          return true;
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    try {
      const requestData = {
        customer_id: user?.id!,
        category_id: serviceInfo.category_id,
        vehicle_make: vehicleInfo.make,
        model: vehicleInfo.model,
        year: vehicleInfo.year,
        mileage: vehicleInfo.mileage ? Number(vehicleInfo.mileage) : undefined,
        appointment_pref: appointmentInfo.urgency === 'immediate' ? 'asap' : 'flexible',
        address: appointmentInfo.address,
        zip: appointmentInfo.zip,
        contact_email: contactInfo.email,
        contact_phone: contactInfo.phone,
        notes: additionalInfo.description || undefined
      };

      const { error } = await supabase
        .from('service_requests')
        .insert(requestData);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success!',
        description: 'Your service request has been submitted.'
      });

      navigate('/request-confirmation');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
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
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Car className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Service Category</h3>
              <p className="text-muted-foreground">What type of service do you need?</p>
            </div>
            
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    serviceInfo.category_id === category.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setServiceInfo({ category_id: category.id })}
                >
                  <div className="font-medium">{category.name}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Car className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Vehicle Information</h3>
              <p className="text-muted-foreground">Tell us about your vehicle</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select
                  value={vehicleInfo.year.toString()}
                  onValueChange={(value) => setVehicleInfo({...vehicleInfo, year: Number(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 30}, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={vehicleInfo.make}
                  onChange={(e) => setVehicleInfo({...vehicleInfo, make: e.target.value})}
                  placeholder="Toyota, Ford, etc."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={vehicleInfo.model}
                  onChange={(e) => setVehicleInfo({...vehicleInfo, model: e.target.value})}
                  placeholder="Camry, F-150, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={vehicleInfo.mileage}
                  onChange={(e) => setVehicleInfo({...vehicleInfo, mileage: e.target.value})}
                  placeholder="Enter mileage"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Appointment Details</h3>
              <p className="text-muted-foreground">Where and when would you like the service?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Service Location</Label>
                <RadioGroup 
                  value={appointmentInfo.serviceLocation} 
                  onValueChange={(value) => setAppointmentInfo({...appointmentInfo, serviceLocation: value})}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mobile" id="mobile" />
                    <Label htmlFor="mobile">Mobile (Come to me)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shop" id="shop" />
                    <Label htmlFor="shop">Shop (I'll come to you)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Service Address</Label>
                  <Input
                    id="address"
                    value={appointmentInfo.address}
                    onChange={(e) => setAppointmentInfo({...appointmentInfo, address: e.target.value})}
                    placeholder="1234 center street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={appointmentInfo.zip}
                    onChange={(e) => setAppointmentInfo({...appointmentInfo, zip: e.target.value})}
                    placeholder="90210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Preferred Date</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={appointmentInfo.preferredDate}
                    onChange={(e) => setAppointmentInfo({...appointmentInfo, preferredDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred Time</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={appointmentInfo.preferredTime}
                    onChange={(e) => setAppointmentInfo({...appointmentInfo, preferredTime: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">How urgent is this?</Label>
                <RadioGroup 
                  value={appointmentInfo.urgency} 
                  onValueChange={(value) => setAppointmentInfo({...appointmentInfo, urgency: value})}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate">Immediate (ASAP)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1-2-days" id="1-2-days" />
                    <Label htmlFor="1-2-days">1-2 Days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1-week" id="1-week" />
                    <Label htmlFor="1-week">1 Week</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1-month" id="1-month" />
                    <Label htmlFor="1-month">1 Month</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Upload className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Additional Information (Optional)</h3>
              <p className="text-muted-foreground">Help us understand your needs better</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Describe the issue or service needed</Label>
                <Textarea
                  id="description"
                  value={additionalInfo.description}
                  onChange={(e) => setAdditionalInfo({...additionalInfo, description: e.target.value})}
                  placeholder="Provide any additional details that might help mechanics give you a more accurate quote..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Photos (Optional)</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Upload photos of the issue or your vehicle</p>
                  <Button variant="outline">Choose Files</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <p className="text-muted-foreground">How can professionals reach you?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={contactInfo.fullName}
                  onChange={(e) => setContactInfo({...contactInfo, fullName: e.target.value})}
                  placeholder="Andy Lee"
                  className="border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailContact">Email Address</Label>
                <Input
                  id="emailContact"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                  placeholder="andyredlands@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneContact">Phone Number</Label>
                <Input
                  id="phoneContact"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                  placeholder="9097922243"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">What happens next?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    We'll send your request to verified mechanics in your area. You'll receive quotes within the timeframe you specified. You can then compare and choose the best option.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <RoleGuard allowedRoles={['customer']}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl p-6">
          <Card>
            <CardHeader>
              <div className="mb-4">
                <ProgressIndicator currentStep={currentStep} totalSteps={5} />
              </div>
              <CardTitle>Request Auto Service</CardTitle>
              <CardDescription>
                Tell us about your vehicle and the service you need. We'll connect you with verified mechanics.
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
                  
                  {currentStep < 5 ? (
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
                      {isLoading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom feature bar - only show on steps 2-4 */}
        {currentStep >= 2 && currentStep <= 4 && (
          <div className="fixed bottom-0 left-0 right-0 bg-muted/90 backdrop-blur-sm border-t p-4">
            <div className="mx-auto max-w-4xl grid grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Verified Pros</p>
                  <p className="text-xs text-muted-foreground">Licensed & Insured</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Quality Reviews</p>
                  <p className="text-xs text-muted-foreground">Real Customer Ratings</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Fast Response</p>
                  <p className="text-xs text-muted-foreground">Quick Quote Turnaround</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Fair Pricing</p>
                  <p className="text-xs text-muted-foreground">Transparent Quotes</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}