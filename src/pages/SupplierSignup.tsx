import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Upload, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { PublicNavigation } from '@/components/PublicNavigation';

const supplierSignupSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required").max(100),
  contactName: z.string().trim().min(2, "Contact name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  phone: z.string().trim().min(10, "Valid phone number required").max(20),
  businessAddress: z.string().trim().min(5, "Business address is required").max(255),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().length(2, "State must be 2 characters").toUpperCase(),
  zip: z.string().trim().min(5, "ZIP code required").max(10),
  deliveryRadius: z.number().min(0).max(500),
  productCategories: z.array(z.string()).min(1, "Select at least one category"),
});

export default function SupplierSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    password: '',
    phone: '',
    businessAddress: '',
    city: '',
    state: '',
    zip: '',
    deliveryRadius: 50,
    pickupAvailable: false,
    productCategories: [] as string[],
    bankAccountNumber: '',
    bankRoutingNumber: '',
  });

  const categories = [
    'Alternators', 'Starters', 'Compressors', 'Brake Parts', 
    'Suspension', 'Engine Parts', 'Transmission', 'Electrical'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      const validation = supplierSignupSchema.safeParse(formData);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast({ title: 'Validation Error', description: firstError.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Create auth user with supplier data in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.contactName,
            role: 'supplier',
            // Store supplier data in metadata for the trigger
            supplier_data: {
              business_name: formData.businessName,
              contact_name: formData.contactName,
              phone: formData.phone,
              business_address: formData.businessAddress,
              city: formData.city,
              state: formData.state,
              zip: formData.zip,
              delivery_radius_km: formData.deliveryRadius,
              pickup_available: formData.pickupAvailable,
              product_categories: formData.productCategories,
            }
          },
          emailRedirectTo: `${window.location.origin}/supplier-login`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      toast({ 
        title: 'Check Your Email!', 
        description: "Please confirm your email address to complete your supplier registration. Check your inbox for the confirmation link.",
      });
      
      setTimeout(() => navigate('/supplier-login'), 2000);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavigation />
      <div className="container max-w-3xl py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Become a DoneEZ Supplier</CardTitle>
                <CardDescription>
                  Join our network of trusted auto parts suppliers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Information</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input
                      id="contactName"
                      required
                      value={formData.contactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (for login) *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Input
                    id="businessAddress"
                    required
                    value={formData.businessAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      required
                      maxLength={2}
                      placeholder="CA"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      required
                      value={formData.zip}
                      onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="deliveryRadius">Delivery Radius (miles)</Label>
                  <Input
                    id="deliveryRadius"
                    type="number"
                    min="0"
                    max="500"
                    value={formData.deliveryRadius}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryRadius: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pickupAvailable"
                    checked={formData.pickupAvailable}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, pickupAvailable: checked === true }))
                    }
                  />
                  <Label htmlFor="pickupAvailable">Pickup available at your location</Label>
                </div>

                <div className="space-y-2">
                  <Label>Product Categories * (Select at least one)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={formData.productCategories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                productCategories: [...prev.productCategories, category]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                productCategories: prev.productCategories.filter(c => c !== category)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={category} className="font-normal">{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Banking Information (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  You can connect your Stripe account later for payouts
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankRoutingNumber">Bank Routing Number</Label>
                    <Input
                      id="bankRoutingNumber"
                      type="text"
                      value={formData.bankRoutingNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankRoutingNumber: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Documents</h3>
                <div className="space-y-2">
                  <Label htmlFor="documents">
                    <Upload className="h-4 w-4 inline mr-2" />
                    Upload Business License / Resale Certificate
                  </Label>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Accepted formats: PDF, JPG, PNG. Optional but recommended for faster approval.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Submitting Application...' : 'Submit Supplier Application'}
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Already have an account?{' '}
                  <Link to="/supplier-login" className="text-primary hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
