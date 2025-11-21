import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, MapPin, Home, Building2, ChevronLeft, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { accordionsData } from "@/data/serviceslist";
import { GuidedServiceSelection, serviceFlow } from "@/components/GuidedServiceSelection";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ServiceRequestData {
  service_category: string[];
  year: number | null;
  vehicle_make: string;
  vehicle_model: string;
  trim: string;
  mileage: number | null;
  description: string;
  urgency: string;
  appointment_type: string;
  zip: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  formatted_address: string;
  preferred_time: Date | null;
  contact_phone: string;
  contact_email: string;
  file_url: string;
}

export default function ServiceRequestFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ServiceRequestData>({
    service_category: [],
    year: null,
    vehicle_make: "",
    vehicle_model: "",
    trim: "",
    mileage: null,
    description: "",
    urgency: "week",
    appointment_type: "mobile",
    zip: "",
    address: "",
    latitude: null,
    longitude: null,
    formatted_address: "",
    preferred_time: null,
    contact_phone: "",
    contact_email: user?.email || "",
    file_url: "",
  });

  // Fetch makes when year changes
  useEffect(() => {
    if (formData.year) {
      fetchMakes(formData.year);
    }
  }, [formData.year]);

  // Fetch models when make changes
  useEffect(() => {
    if (formData.year && formData.vehicle_make) {
      fetchModels(formData.year, formData.vehicle_make);
    }
  }, [formData.year, formData.vehicle_make]);

  const fetchMakes = async (year: number) => {
    try {
      const response = await fetch(
        `https://api.nhtsa.gov/products/vehicle/makes?modelYear=${year}&issueType=r`
      );
      const data = await response.json();
      const makeList = data.results.map((item: any) => item.make).sort();
      setMakes(makeList);
    } catch (error) {
      // Silently fail - user can still type manually
      setMakes([]);
    }
  };

  const fetchModels = async (year: number, make: string) => {
    try {
      const response = await fetch(
        `https://api.nhtsa.gov/products/vehicle/models?modelYear=${year}&make=${make}&issueType=r`
      );
      const data = await response.json();
      const modelList = data.results.map((item: any) => item.model).sort();
      setModels(modelList);
    } catch (error) {
      // Silently fail - this is expected when typing or invalid combinations
      setModels([]);
    }
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      service_category: prev.service_category.includes(serviceId)
        ? prev.service_category.filter((id) => id !== serviceId)
        : [...prev.service_category, serviceId],
    }));
  };

  const clearServices = () => {
    setFormData((prev) => ({ ...prev, service_category: [] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const geocodeFullAddress = async (fullAddress: string) => {
    console.log('Geocoding address:', fullAddress);
    
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: fullAddress }
      });

      console.log('Geocode response:', { data, error });

      if (error) {
        console.error('Geocode error from function:', error);
        throw error;
      }

      if (!data || !data.latitude || !data.longitude) {
        console.error('Invalid geocode response:', data);
        throw new Error('Invalid response from geocoding service');
      }
      
      console.log('Geocoded successfully:', data);
      
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        formatted_address: data.formatted_address
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      throw new Error("Failed to geocode address. Please check your address and try again.");
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return formData.service_category.length > 0;
      case 2:
        return formData.year && formData.vehicle_make && formData.vehicle_model;
      case 3:
        return true; // Optional step
      case 4:
        return formData.appointment_type !== "";
      case 5:
        return formData.zip !== "";
      case 6:
        if (!formData.preferred_time) {
          return false;
        }
        // Validate that preferred time is in the future
        const now = new Date();
        return formData.preferred_time > now;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canContinue()) {
      if (currentStep === 6 && formData.preferred_time && formData.preferred_time <= new Date()) {
        toast.error("Please select a future date and time");
      } else {
        toast.error("Please complete all required fields");
      }
      return;
    }

    if (currentStep < 7) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.service_category || formData.service_category.length === 0) {
        toast.error("Please select at least one service");
        setIsSubmitting(false);
        return;
      }

      if (!formData.year || !formData.vehicle_make || !formData.vehicle_model) {
        toast.error("Please complete vehicle information");
        setIsSubmitting(false);
        return;
      }

      if (!formData.zip) {
        toast.error("Please provide your zip code");
        setIsSubmitting(false);
        return;
      }

      if (!formData.contact_phone) {
        toast.error("Please provide your phone number");
        setIsSubmitting(false);
        return;
      }

      // Use user's email if not explicitly provided
      const contactEmail = formData.contact_email || user.email || "";

      // Upload file if exists
      let imageUrl = "";
      if (uploadedFile) {
        try {
          const fileExt = uploadedFile.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          
          const { data: fileData, error: fileError } = await supabase.storage
            .from('service-images')
            .upload(fileName, uploadedFile);
          
          if (fileError) {
            console.error("File upload error:", fileError);
            toast.error("Failed to upload image. Continuing without image.");
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('service-images')
              .getPublicUrl(fileName);
            
            imageUrl = publicUrl;
          }
        } catch (fileUploadError) {
          console.error("File upload exception:", fileUploadError);
          // Continue without image
        }
      }

      // Fetch service categories to map the selected services
      const { data: categories, error: categoriesError } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("active", true);

      if (categoriesError) {
        console.error("Categories fetch error:", categoriesError);
        throw new Error("Failed to load service categories. Please try again.");
      }

      if (!categories || categories.length === 0) {
        throw new Error("No service categories available. Please contact support.");
      }

      // Map service ID prefixes to category names
      // "1-x-x" services are under "Auto Repair", etc.
      const getCategoryId = (serviceIds: string[]): string | null => {
        if (serviceIds.length === 0) return null;
        
        // Check the first service to determine the main category
        const firstService = serviceIds[0];
        const categoryPrefix = firstService.split("-")[0];
        
        // Map prefixes to category names
        const categoryMap: Record<string, string> = {
          "1": "Auto Repair",
          "2": "Oil Change",
          "3": "Tire Service",
          "4": "Car Wash",
          "5": "Diagnostics",
        };
        
        const categoryName = categoryMap[categoryPrefix];
        const category = categories?.find(c => c.name === categoryName);
        return category?.id || null;
      };

      const categoryId = getCategoryId(formData.service_category);

      if (!categoryId) {
        console.warn("Category ID not found for services:", formData.service_category);
      }

      // Build full address for geocoding (address field already contains street, city, state)
      const fullAddress = formData.address 
        ? `${formData.address} ${formData.zip}`.trim()
        : formData.zip;
      
      console.log("Geocoding address:", fullAddress);
      let geo = { 
        latitude: null as number | null, 
        longitude: null as number | null, 
        formatted_address: fullAddress 
      };
      
      try {
        geo = await geocodeFullAddress(fullAddress);
        console.log("Geocoded location:", geo);
      } catch (geoError) {
        console.warn("Geocoding failed, continuing without coordinates:", geoError);
        // Silent fallback - request will proceed with null coordinates
      }

      const { error, data: request } = await supabase
        .from("service_requests")
        .insert({
          customer_id: user.id,
          service_category: formData.service_category,
          category_id: categoryId,
          year: formData.year,
          vehicle_make: formData.vehicle_make,
          model: formData.vehicle_model,
          trim: formData.trim || null,
          mileage: formData.mileage || null,
          description: formData.description || null,
          urgency: formData.urgency,
          appointment_type: formData.appointment_type,
          zip: formData.zip,
          address: geo.formatted_address,
          latitude: geo.latitude,
          longitude: geo.longitude,
          formatted_address: geo.formatted_address,
          preferred_time: formData.preferred_time?.toISOString() || null,
          contact_phone: formData.contact_phone,
          contact_email: contactEmail,
          appointment_pref: "scheduled",
          status: "pending",
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        throw new Error(error.message || "Failed to submit service request. Please try again.");
      }

      // Generate leads for professionals
      console.log("Generating leads for request:", request.id);
      const { error: rpcError } = await supabase.rpc('generate_leads_for_request', {
        p_request_id: request.id
      });

      if (rpcError) {
        console.error("Lead generation error:", rpcError);
        // Don't fail the request if lead generation fails
      } else {
        console.log("Leads generated successfully");
      }

      // Send confirmation email
      try {
        const serviceNames = getSelectedServiceNames();
        const vehicleInfo = `${formData.year} ${formData.vehicle_make} ${formData.vehicle_model}${formData.trim ? ' ' + formData.trim : ''}`;
        
        await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            email: contactEmail,
            name: user.email?.split('@')[0] || 'Customer',
            services: serviceNames,
            vehicle: vehicleInfo,
            preferredTime: formData.preferred_time?.toLocaleString() || 'Not specified',
            appointmentType: formData.appointment_type,
            zip: formData.zip,
          }
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the whole request if email fails
      }

      toast.success("Service request submitted successfully!");
      navigate("/request-confirmation");
    } catch (error: any) {
      console.error("Submission error:", error);
      const errorMessage = error?.message || error?.error_description || error?.error || "Failed to submit request. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const editStep = (step: Step) => {
    setCurrentStep(step);
  };

  const filteredAccordions = accordionsData.map((category) => ({
    ...category,
    subItems: category.subItems.map((subItem) => ({
      ...subItem,
      services: subItem.services.filter((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    })).filter((subItem) => subItem.services.length > 0),
  })).filter((category) => category.subItems.length > 0);

  const getSelectedServiceNames = () => {
    const names: string[] = [];
    
    // Check in the new guided selection flow
    Object.values(serviceFlow).forEach((level) => {
      level.options.forEach((option) => {
        if (formData.service_category.includes(option.id)) {
          names.push(option.name);
        }
      });
    });
    
    // Also check in old accordions data for backward compatibility
    accordionsData.forEach((category) => {
      category.subItems.forEach((subItem) => {
        subItem.services.forEach((service) => {
          if (formData.service_category.includes(service.id)) {
            names.push(service.name);
          }
        });
      });
    });
    
    return names;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Services</CardTitle>
              <CardDescription>Let us guide you to the right service for your vehicle</CardDescription>
            </CardHeader>
            <CardContent>
              <GuidedServiceSelection
                selectedServices={formData.service_category}
                onServicesChange={(services) => setFormData((prev) => ({ ...prev, service_category: services }))}
                onComplete={handleNext}
              />
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>Tell us about your vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, year: parseInt(e.target.value) || null }))}
                    placeholder="e.g., 2020"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={formData.vehicle_make}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicle_make: e.target.value }))}
                    placeholder="e.g., Toyota, Honda, Ford"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicle_model: e.target.value }))}
                    placeholder="e.g., Camry, Accord, F-150"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trim">Trim (Optional)</Label>
                  <Input
                    id="trim"
                    value={formData.trim}
                    onChange={(e) => setFormData((prev) => ({ ...prev, trim: e.target.value }))}
                    placeholder="e.g., EX, Limited, Sport"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mileage: parseInt(e.target.value) || null }))}
                    placeholder="Current mileage"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Provide extra details about your service needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Note for Mechanic (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe any symptoms, sounds, or concerns..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload Files (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  {uploadedFile && (
                    <span className="text-sm text-muted-foreground">{uploadedFile.name}</span>
                  )}
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label>Urgency</Label>
                <RadioGroup value={formData.urgency} onValueChange={(value) => setFormData((prev) => ({ ...prev, urgency: value }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate" className="font-normal cursor-pointer">
                      Immediate - ASAP (same day if available)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="couple_days" id="couple_days" />
                    <Label htmlFor="couple_days" className="font-normal cursor-pointer">
                      Within 1-2 days
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="week" id="week" />
                    <Label htmlFor="week" className="font-normal cursor-pointer">
                      Within a week
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month" id="month" />
                    <Label htmlFor="month" className="font-normal cursor-pointer">
                      Flexible - within a month
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quotes" id="quotes" />
                    <Label htmlFor="quotes" className="font-normal cursor-pointer">
                      Just getting quotes (no rush)
                    </Label>
                  </div>
                </RadioGroup>
                {formData.urgency === 'immediate' && (
                  <p className="text-sm text-muted-foreground mt-2 p-3 bg-accent/50 rounded-md">
                    ℹ️ For immediate service, professionals will contact you directly with their earliest availability, which may include same-day or emergency hours.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Choose Service Type</CardTitle>
              <CardDescription>Where would you like the service performed?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    formData.appointment_type === "mobile" && "ring-2 ring-primary"
                  )}
                  onClick={() => setFormData((prev) => ({ ...prev, appointment_type: "mobile" }))}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <Home className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">Mobile Mechanic</h3>
                    <p className="text-sm text-muted-foreground">
                      We come to your location
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    formData.appointment_type === "shop" && "ring-2 ring-primary"
                  )}
                  onClick={() => setFormData((prev) => ({ ...prev, appointment_type: "shop" }))}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <Building2 className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">In-Shop Service</h3>
                    <p className="text-sm text-muted-foreground">
                      Visit a professional shop
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    formData.appointment_type === "either" && "ring-2 ring-primary"
                  )}
                  onClick={() => setFormData((prev) => ({ ...prev, appointment_type: "either" }))}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <MapPin className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">Either</h3>
                    <p className="text-sm text-muted-foreground">
                      No preference - fastest response
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where should the service be performed?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => setFormData((prev) => ({ ...prev, zip: e.target.value }))}
                      placeholder="Enter ZIP code"
                      className="pl-9"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address {formData.appointment_type === "mobile" ? "*" : "(Optional)"}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address, city, state"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="(555) 555-5555"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        const getMinimumDate = () => {
          const now = new Date();
          
          // For immediate urgency, allow same-day booking
          if (formData.urgency === 'immediate') {
            return now;
          }
          
          // For couple_days, allow starting from tomorrow
          if (formData.urgency === 'couple_days') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow;
          }
          
          // For all others, allow next day
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          return tomorrow;
        };

        const getAvailableTimeSlots = () => {
          const now = new Date();
          const selectedDate = formData.preferred_time || new Date();
          const isToday = selectedDate.toDateString() === now.toDateString();
          
          // For immediate urgency on same day, start from current hour + 2 hours
          if (formData.urgency === 'immediate' && isToday) {
            const minHour = Math.max(9, Math.min(17, now.getHours() + 2));
            // Extended hours for urgent requests: 7 AM to 9 PM
            const slots = [];
            for (let hour = minHour; hour <= 21; hour++) {
              slots.push(hour);
            }
            return slots.length > 0 ? slots : [9]; // Fallback to 9 AM if no slots today
          }
          
          // For immediate urgency on future days, offer extended hours
          if (formData.urgency === 'immediate') {
            // 7 AM to 9 PM for urgent requests
            return Array.from({ length: 15 }, (_, i) => i + 7);
          }
          
          // Standard business hours: 9 AM to 5 PM
          return Array.from({ length: 9 }, (_, i) => i + 9);
        };

        const availableSlots = getAvailableTimeSlots();
        const minDate = getMinimumDate();

        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Appointment Details</CardTitle>
              <CardDescription className="text-sm">
                {formData.urgency === 'immediate' 
                  ? "Select your preferred time - professionals will respond with their earliest availability"
                  : "When would you like the service?"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.urgency === 'immediate' && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
                  <p className="font-semibold text-primary mb-1">Urgent Request</p>
                  <p className="text-muted-foreground">
                    Extended hours (7 AM - 9 PM) are available. Professionals will contact you directly with their earliest availability.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Preferred Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs sm:text-sm",
                        !formData.preferred_time && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.preferred_time ? format(formData.preferred_time, "PPP") : "Pick a date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.preferred_time || undefined}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(date);
                          if (formData.preferred_time) {
                            newDate.setHours(formData.preferred_time.getHours(), formData.preferred_time.getMinutes());
                          }
                          setFormData((prev) => ({ ...prev, preferred_time: newDate }));
                        }
                      }}
                      disabled={(date) => {
                        const compareDate = new Date(date);
                        compareDate.setHours(0, 0, 0, 0);
                        const minDateCompare = new Date(minDate);
                        minDateCompare.setHours(0, 0, 0, 0);
                        return compareDate < minDateCompare;
                      }}
                      initialFocus
                      className="pointer-events-auto p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Preferred Time *</Label>
                <Select
                  value={formData.preferred_time ? format(formData.preferred_time, "HH:mm") : ""}
                  onValueChange={(time) => {
                    const [hours, minutes] = time.split(":");
                    const newDate = formData.preferred_time ? new Date(formData.preferred_time) : new Date();
                    newDate.setHours(parseInt(hours), parseInt(minutes));
                    setFormData((prev) => ({ ...prev, preferred_time: newDate }));
                  }}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[300px]">
                    {availableSlots.map((hour) => (
                      <SelectItem key={hour} value={`${hour}:00`} className="text-sm">
                        {hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.urgency !== 'immediate' && (
                <p className="text-xs text-muted-foreground">
                  Standard business hours: 9:00 AM - 5:00 PM
                </p>
              )}
            </CardContent>
          </Card>
        );

      case 7:
        const selectedServiceNames = getSelectedServiceNames();
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>Please review your service request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="space-y-1">
                    <h4 className="font-semibold">Selected Services</h4>
                    <ul className="text-sm text-muted-foreground list-disc pl-5">
                      {selectedServiceNames.map((name, idx) => (
                        <li key={idx}>{name}</li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => editStep(1)}>
                    Edit
                  </Button>
                </div>

                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="space-y-1">
                    <h4 className="font-semibold">Vehicle Information</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.year} {formData.vehicle_make} {formData.vehicle_model}
                      {formData.trim && ` ${formData.trim}`}
                      {formData.mileage && ` • ${formData.mileage.toLocaleString()} miles`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => editStep(2)}>
                    Edit
                  </Button>
                </div>

                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="space-y-1">
                    <h4 className="font-semibold">Service Type</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.appointment_type === "mobile" ? "Mobile Mechanic" : "In-Shop Service"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => editStep(4)}>
                    Edit
                  </Button>
                </div>

                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="space-y-1">
                    <h4 className="font-semibold">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.address || `ZIP: ${formData.zip}`}
                    </p>
                    <p className="text-sm text-muted-foreground">{formData.contact_phone}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => editStep(5)}>
                    Edit
                  </Button>
                </div>

                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="space-y-1">
                    <h4 className="font-semibold">Appointment Time</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.preferred_time && format(formData.preferred_time, "PPP p")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => editStep(6)}>
                    Edit
                  </Button>
                </div>

                {formData.description && (
                  <div className="flex items-start justify-between pb-4 border-b">
                    <div className="space-y-1">
                      <h4 className="font-semibold">Additional Notes</h4>
                      <p className="text-sm text-muted-foreground">{formData.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => editStep(3)}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5, 6, 7].map((step) => (
            <div
              key={step}
              className={cn(
                "flex-1 h-2 rounded-full mx-1",
                step <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of 7
          </p>
        </div>

        {renderStep()}

        {/* Navigation buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {currentStep < 7 ? (
            <Button onClick={handleNext} disabled={!canContinue()} className="flex-1">
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Confirm & Book Appointment"}
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}