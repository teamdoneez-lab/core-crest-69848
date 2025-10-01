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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Car, MapPin, Clock, FileText, Truck, Wrench, CheckCircle } from 'lucide-react';

const serviceRequestSchema = z.object({
  service_category: z.array(z.string()).min(1, 'Please select at least one service'),
  vehicle_make: z.string().trim().min(1, 'Vehicle make is required'),
  model: z.string().trim().min(1, 'Model is required'),
  year: z.number().min(2000, 'Year must be 2000 or later').max(2025),
  trim: z.string().trim().optional(),
  mileage: z.number().min(0, 'Invalid mileage').optional(),
  description: z.string().trim().optional(),
  urgency: z.enum(['immediate', 'week', 'month', 'other']),
  appointment_type: z.enum(['mobile', 'shop']),
  zip: z.string().trim().min(5, 'ZIP code must be at least 5 characters'),
  address: z.string().trim().optional(),
  preferred_time: z.string().min(1, 'Please select a date and time'),
  contact_email: z.string().trim().email('Invalid email address'),
  contact_phone: z.string().trim().min(10, 'Phone number must be at least 10 digits'),
});

interface ServiceCategory {
  id: string;
  name: string;
}

interface VehicleMake {
  MakeName: string;
}

interface VehicleModel {
  ModelName: string;
}

export default function ServiceRequestFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleMakes, setVehicleMakes] = useState<string[]>([]);
  const [vehicleModels, setVehicleModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Step 1: Selected Services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Step 2: Vehicle Information
  const [vehicleInfo, setVehicleInfo] = useState({
    year: 2024,
    make: '',
    model: '',
    trim: '',
    mileage: ''
  });

  // Step 3: Note & Urgency
  const [noteInfo, setNoteInfo] = useState({
    description: '',
    urgency: 'week' as 'immediate' | 'week' | 'month' | 'other',
    urgencyExplanation: ''
  });

  // Step 4: Service Type
  const [serviceType, setServiceType] = useState<'mobile' | 'shop'>('mobile');

  // Step 5: Location
  const [locationInfo, setLocationInfo] = useState({
    zip: '',
    address: ''
  });

  // Step 6: Appointment Time
  const [appointmentTime, setAppointmentTime] = useState({
    date: '',
    time: ''
  });

  // Contact info from user
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: ''
  });

  const totalSteps = 7;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (vehicleInfo.year) {
      fetchVehicleMakes();
    }
  }, [vehicleInfo.year]);

  useEffect(() => {
    if (vehicleInfo.year && vehicleInfo.make) {
      fetchVehicleModels();
    }
  }, [vehicleInfo.year, vehicleInfo.make]);

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

  const fetchVehicleMakes = async () => {
    setLoadingMakes(true);
    try {
      const response = await fetch(
        `https://api.nhtsa.gov/products/vehicle/makes?modelYear=${vehicleInfo.year}&issueType=r`
      );
      const data = await response.json();
      if (data.Results) {
        const makes = data.Results.map((item: VehicleMake) => item.MakeName).sort();
        setVehicleMakes(makes);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load vehicle makes',
        variant: 'destructive'
      });
    } finally {
      setLoadingMakes(false);
    }
  };

  const fetchVehicleModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch(
        `https://api.nhtsa.gov/products/vehicle/models?modelYear=${vehicleInfo.year}&make=${encodeURIComponent(vehicleInfo.make)}&issueType=r`
      );
      const data = await response.json();
      if (data.Results) {
        const models = data.Results.map((item: VehicleModel) => item.ModelName).sort();
        setVehicleModels(models);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load vehicle models',
        variant: 'destructive'
      });
    } finally {
      setLoadingModels(false);
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
          if (selectedServices.length === 0) {
            toast({
              title: 'Validation Error',
              description: 'Please select at least one service',
              variant: 'destructive'
            });
            return false;
          }
          return true;
        case 2:
          if (!vehicleInfo.make || !vehicleInfo.model) {
            toast({
              title: 'Validation Error',
              description: 'Please select vehicle make and model',
              variant: 'destructive'
            });
            return false;
          }
          return true;
        case 3:
          // Note and urgency - urgency is required
          return true;
        case 4:
          // Service type is required
          return true;
        case 5:
          if (!locationInfo.zip) {
            toast({
              title: 'Validation Error',
              description: 'Please enter a ZIP code',
              variant: 'destructive'
            });
            return false;
          }
          return true;
        case 6:
          if (!appointmentTime.date || !appointmentTime.time) {
            toast({
              title: 'Validation Error',
              description: 'Please select a date and time',
              variant: 'destructive'
            });
            return false;
          }
          return true;
        case 7:
          if (!contactInfo.email || !contactInfo.phone) {
            toast({
              title: 'Validation Error',
              description: 'Please fill in your contact information',
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

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    try {
      const preferredDateTime = new Date(`${appointmentTime.date}T${appointmentTime.time}`).toISOString();
      
      const requestData: any = {
        customer_id: user?.id!,
        service_category: selectedServices,
        vehicle_make: vehicleInfo.make,
        model: vehicleInfo.model,
        year: vehicleInfo.year,
        trim: vehicleInfo.trim || undefined,
        mileage: vehicleInfo.mileage ? Number(vehicleInfo.mileage) : undefined,
        description: noteInfo.description || undefined,
        urgency: noteInfo.urgency,
        appointment_type: serviceType,
        zip: locationInfo.zip,
        address: locationInfo.address || locationInfo.zip,
        preferred_time: preferredDateTime,
        contact_email: contactInfo.email,
        contact_phone: contactInfo.phone,
        appointment_pref: 'scheduled',
        status: 'pending'
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
      // Step 1: Select Services
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Wrench className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Select Services</h3>
              <p className="text-muted-foreground">Choose the services you need</p>
            </div>

            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">
                {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
              </p>
              {selectedServices.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedServices([])}
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedServices.includes(category.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => toggleService(category.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      checked={selectedServices.includes(category.id)}
                      onCheckedChange={() => toggleService(category.id)}
                    />
                    <div className="font-medium">{category.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // Step 2: Vehicle Information
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Car className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Vehicle Information</h3>
              <p className="text-muted-foreground">Tell us about your vehicle</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Select
                  value={vehicleInfo.year.toString()}
                  onValueChange={(value) => {
                    setVehicleInfo({...vehicleInfo, year: Number(value), make: '', model: ''});
                    setVehicleModels([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 26}, (_, i) => 2025 - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Select
                  value={vehicleInfo.make}
                  onValueChange={(value) => {
                    setVehicleInfo({...vehicleInfo, make: value, model: ''});
                  }}
                  disabled={loadingMakes || vehicleMakes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMakes ? "Loading makes..." : "Select make"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleMakes.map(make => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Select
                  value={vehicleInfo.model}
                  onValueChange={(value) => setVehicleInfo({...vehicleInfo, model: value})}
                  disabled={!vehicleInfo.make || loadingModels || vehicleModels.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingModels ? "Loading models..." : "Select model"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleModels.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trim">Trim (Optional)</Label>
                  <Input
                    id="trim"
                    value={vehicleInfo.trim}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, trim: e.target.value})}
                    placeholder="LE, XLT, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage (Optional)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={vehicleInfo.mileage}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, mileage: e.target.value})}
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      // Step 3: Note & Urgency
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Add Note & Urgency</h3>
              <p className="text-muted-foreground">Help us understand your needs</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Note for Mechanic (Optional)</Label>
                <Textarea
                  id="description"
                  value={noteInfo.description}
                  onChange={(e) => setNoteInfo({...noteInfo, description: e.target.value})}
                  placeholder="Describe the issue or service needed..."
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Urgency *</Label>
                <RadioGroup 
                  value={noteInfo.urgency} 
                  onValueChange={(value: any) => setNoteInfo({...noteInfo, urgency: value})}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate" className="cursor-pointer flex-1">
                      <div className="font-medium">Immediate</div>
                      <div className="text-sm text-muted-foreground">1-2 days</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="week" id="week" />
                    <Label htmlFor="week" className="cursor-pointer flex-1">
                      <div className="font-medium">Within 1 week</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="month" id="month" />
                    <Label htmlFor="month" className="cursor-pointer flex-1">
                      <div className="font-medium">Within 1 month</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="cursor-pointer flex-1">
                      <div className="font-medium">Other</div>
                    </Label>
                  </div>
                </RadioGroup>

                {noteInfo.urgency === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="urgencyExplanation">Please explain</Label>
                    <Input
                      id="urgencyExplanation"
                      value={noteInfo.urgencyExplanation}
                      onChange={(e) => setNoteInfo({...noteInfo, urgencyExplanation: e.target.value})}
                      placeholder="When do you need this service?"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // Step 4: Service Type
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Truck className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Choose Service Type</h3>
              <p className="text-muted-foreground">Where should the service take place?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  serviceType === 'mobile'
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setServiceType('mobile')}
              >
                <div className="text-center space-y-3">
                  <Truck className="h-10 w-10 text-primary mx-auto" />
                  <div>
                    <div className="font-semibold text-lg">Mobile Mechanic</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      We come to you
                    </div>
                  </div>
                  <RadioGroup value={serviceType} onValueChange={(value: any) => setServiceType(value)}>
                    <div className="flex justify-center">
                      <RadioGroupItem value="mobile" id="mobile-radio" />
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  serviceType === 'shop'
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setServiceType('shop')}
              >
                <div className="text-center space-y-3">
                  <Wrench className="h-10 w-10 text-primary mx-auto" />
                  <div>
                    <div className="font-semibold text-lg">In-Shop Service</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      You come to us
                    </div>
                  </div>
                  <RadioGroup value={serviceType} onValueChange={(value: any) => setServiceType(value)}>
                    <div className="flex justify-center">
                      <RadioGroupItem value="shop" id="shop-radio" />
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        );

      // Step 5: Location
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Location</h3>
              <p className="text-muted-foreground">Where should we provide the service?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code *</Label>
                <Input
                  id="zip"
                  value={locationInfo.zip}
                  onChange={(e) => setLocationInfo({...locationInfo, zip: e.target.value})}
                  placeholder="90210"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Full Address {serviceType === 'mobile' ? '*' : '(Optional)'}
                </Label>
                <Input
                  id="address"
                  value={locationInfo.address}
                  onChange={(e) => setLocationInfo({...locationInfo, address: e.target.value})}
                  placeholder="123 Main St, City, State"
                />
                {serviceType === 'mobile' && (
                  <p className="text-xs text-muted-foreground">
                    Required for mobile service
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      // Step 6: Appointment Time
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Clock className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Appointment Time</h3>
              <p className="text-muted-foreground">When would you like the service?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={appointmentTime.date}
                  onChange={(e) => setAppointmentTime({...appointmentTime, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Select
                  value={appointmentTime.time}
                  onValueChange={(value) => setAppointmentTime({...appointmentTime, time: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                      <SelectItem key={time} value={time}>
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      // Step 7: Review & Confirm
      case 7:
        const selectedServiceNames = categories
          .filter(cat => selectedServices.includes(cat.id))
          .map(cat => cat.name);

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Review & Confirm</h3>
              <p className="text-muted-foreground">Please review your booking details</p>
            </div>

            <div className="space-y-4">
              {/* Services */}
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">Selected Services</h4>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      {selectedServiceNames.map(name => (
                        <li key={name}>• {name}</li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Vehicle */}
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">Vehicle Info</h4>
                    <p className="text-sm text-muted-foreground">
                      {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                      {vehicleInfo.trim && ` ${vehicleInfo.trim}`}
                      {vehicleInfo.mileage && ` • ${vehicleInfo.mileage} mi`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Service Type */}
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">Service Type</h4>
                    <p className="text-sm text-muted-foreground">
                      {serviceType === 'mobile' ? 'Mobile Mechanic' : 'In-Shop Service'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Location */}
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {locationInfo.address || locationInfo.zip}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(5)}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Appointment */}
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">Appointment Time</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(`${appointmentTime.date}T${appointmentTime.time}`).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(6)}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Urgency & Notes */}
              {(noteInfo.urgency || noteInfo.description) && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Additional Info</h4>
                      <p className="text-sm text-muted-foreground">
                        Urgency: {noteInfo.urgency === 'immediate' ? '1-2 days' : noteInfo.urgency === 'week' ? 'Within 1 week' : noteInfo.urgency === 'month' ? 'Within 1 month' : 'Other'}
                      </p>
                      {noteInfo.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {noteInfo.description}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                      Edit
                    </Button>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-4 pt-2">
                <h4 className="font-semibold">Contact Information</h4>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
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
        
        <div className="mx-auto max-w-3xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Auto Service</CardTitle>
              <CardDescription>
                Complete this form to get matched with qualified professionals
              </CardDescription>
              <div className="mt-4">
                <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={handleBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < totalSteps ? (
                  <Button onClick={handleNext}>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Confirm & Book Appointment'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-muted/50 backdrop-blur-sm border-t py-3">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold">✓ Verified Pros</div>
                <div className="text-muted-foreground text-xs">Licensed & insured</div>
              </div>
              <div>
                <div className="font-semibold">✓ Transparent Pricing</div>
                <div className="text-muted-foreground text-xs">No hidden fees</div>
              </div>
              <div>
                <div className="font-semibold">✓ Quality Service</div>
                <div className="text-muted-foreground text-xs">Satisfaction guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}