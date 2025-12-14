import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, Car, MapPin, Calendar, Phone } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function ServiceRequestFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    service_category: [] as string[],
    year: new Date().getFullYear(),
    vehicle_make: "",
    vehicle_model: "",
    trim: "",
    mileage: "",
    description: "",
    urgency: "week",
    appointment_type: "mobile",
    zip: "",
    address: "",
    contact_phone: "",
    contact_email: user?.email || "",
  });

  const handleNext = () => {
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
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Service request submitted successfully!");
      navigate("/request-confirmation");
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Services</CardTitle>
              <CardDescription>What service do you need?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {["Auto Repair", "Oil Change", "Tire Service", "Detailing", "Body Work"].map((service) => (
                  <Button
                    key={service}
                    variant={formData.service_category.includes(service) ? "default" : "outline"}
                    className="h-16"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        service_category: prev.service_category.includes(service)
                          ? prev.service_category.filter(s => s !== service)
                          : [...prev.service_category, service]
                      }));
                    }}
                  >
                    {service}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
              <CardDescription>Tell us about your vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input
                    value={formData.vehicle_make}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_make: e.target.value }))}
                    placeholder="Toyota, Ford, etc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_model: e.target.value }))}
                  placeholder="Camry, F-150, etc."
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Tell us more about the issue (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the issue or service needed..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Service Type</CardTitle>
              <CardDescription>How would you like to receive service?</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.appointment_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, appointment_type: value }))}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="mobile" id="mobile" />
                  <Label htmlFor="mobile" className="cursor-pointer flex-1">
                    <div className="font-medium">Mobile Service</div>
                    <div className="text-sm text-muted-foreground">We come to you</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg mt-3">
                  <RadioGroupItem value="shop" id="shop" />
                  <Label htmlFor="shop" className="cursor-pointer flex-1">
                    <div className="font-medium">Shop Service</div>
                    <div className="text-sm text-muted-foreground">Visit a local shop</div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
              <CardDescription>Where should we provide service?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input
                  value={formData.zip}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label>Address (Optional)</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timing
              </CardTitle>
              <CardDescription>When do you need service?</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.urgency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="cursor-pointer">ASAP (1-2 days)</Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg mt-3">
                  <RadioGroupItem value="week" id="week" />
                  <Label htmlFor="week" className="cursor-pointer">Within a week</Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg mt-3">
                  <RadioGroupItem value="month" id="month" />
                  <Label htmlFor="month" className="cursor-pointer">Within a month</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>How can we reach you?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="you@example.com"
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Request Service</h1>
            <span className="text-sm text-muted-foreground">Step {currentStep} of 7</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>

        {renderStep()}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < 7 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}