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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const serviceRequestSchema = z.object({
  category_id: z.string().min(1, 'Please select a service category'),
  vehicle_make: z.string().trim().min(1, 'Vehicle make is required').max(50, 'Vehicle make too long'),
  model: z.string().trim().min(1, 'Model is required').max(50, 'Model too long'),
  year: z.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 1, 'Invalid year'),
  trim: z.string().trim().max(50, 'Trim too long').optional(),
  mileage: z.number().min(0, 'Invalid mileage').max(1000000, 'Invalid mileage').optional(),
  appointment_pref: z.enum(['asap', 'scheduled', 'flexible'], {
    errorMap: () => ({ message: 'Please select an appointment preference' })
  }),
  address: z.string().trim().min(1, 'Address is required').max(200, 'Address too long'),
  zip: z.string().trim().min(5, 'ZIP code must be at least 5 characters').max(10, 'ZIP code too long'),
  contact_email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  contact_phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  notes: z.string().trim().max(1000, 'Notes too long').optional()
});

interface ServiceCategory {
  id: string;
  name: string;
}

export default function RequestService() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    vehicle_make: '',
    model: '',
    year: new Date().getFullYear(),
    trim: '',
    mileage: '',
    appointment_pref: '',
    address: '',
    zip: '',
    contact_email: user?.email || '',
    contact_phone: '',
    notes: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      const validatedData = serviceRequestSchema.parse({
        ...formData,
        year: Number(formData.year),
        mileage: formData.mileage ? Number(formData.mileage) : undefined
      });

      // Insert service request
      const { data: newRequest, error } = await supabase
        .from('service_requests')
        .insert({
          customer_id: user?.id!,
          category_id: validatedData.category_id,
          vehicle_make: validatedData.vehicle_make,
          model: validatedData.model,
          year: validatedData.year,
          trim: validatedData.trim,
          mileage: validatedData.mileage,
          appointment_pref: validatedData.appointment_pref,
          address: validatedData.address,
          zip: validatedData.zip,
          contact_email: validatedData.contact_email,
          contact_phone: validatedData.contact_phone,
          notes: validatedData.notes
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      // Send confirmation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-request-confirmation', {
          body: { requestId: newRequest.id }
        });

        if (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      toast({
        title: 'Success!',
        description: 'Your service request has been submitted.'
      });

      navigate('/request-confirmation');
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
          description: 'Failed to submit request. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['customer']}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>Request a Service</CardTitle>
              <CardDescription>
                Tell us about your vehicle and what service you need
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Service Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Vehicle Make</Label>
                    <Input
                      id="make"
                      value={formData.vehicle_make}
                      onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                      placeholder="Toyota, Ford, etc."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Camry, F-150, etc."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trim">Trim (Optional)</Label>
                    <Input
                      id="trim"
                      value={formData.trim}
                      onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                      placeholder="LE, XLT, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage (Optional)</Label>
                    <Input
                      id="mileage"
                      type="number"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      placeholder="50000"
                      min="0"
                    />
                  </div>
                </div>

                {/* Appointment Preference */}
                <div className="space-y-2">
                  <Label>Appointment Preference</Label>
                  <Select
                    value={formData.appointment_pref}
                    onValueChange={(value) => setFormData({ ...formData, appointment_pref: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asap">As soon as possible</SelectItem>
                      <SelectItem value="scheduled">Schedule specific time</SelectItem>
                      <SelectItem value="flexible">I'm flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City, State"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="12345"
                    required
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any specific details about the service needed..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Service Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}