import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Building2 } from 'lucide-react';

export default function SupplierOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: user?.email || '',
    phone: '',
    businessAddress: '',
    city: '',
    state: '',
    zip: '',
    deliveryRadius: 50,
    pickupAvailable: false,
    productCategories: [] as string[],
  });

  const categories = [
    {
      name: 'Auto Parts',
      description: 'Brakes, suspension, engine, transmission, electrical, and other replacement parts.'
    },
    {
      name: 'Shop Supplies',
      description: 'Oils, fluids, cleaners, fasteners, and maintenance consumables.'
    },
    {
      name: 'Equipment & Lifts',
      description: 'Vehicle lifts, tire changers, compressors, and diagnostic machines.'
    },
    {
      name: 'Tools',
      description: 'Hand tools, power tools, and specialty automotive tools.'
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const db = supabase as any;
    try {
      // Create supplier profile
      const { data: supplier, error: supplierError } = await db
        .from('suppliers')
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          business_address: formData.businessAddress,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          delivery_radius_km: formData.deliveryRadius,
          pickup_available: formData.pickupAvailable,
          product_categories: formData.productCategories,
          status: 'pending',
        })
        .select()
        .single();

      if (supplierError) throw supplierError;

      // Upload documents if provided
      if (documents.length > 0 && supplier) {
        for (const file of documents) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${supplier.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('service-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('service-images')
            .getPublicUrl(fileName);

          await db.from('supplier_documents').insert({
            supplier_id: supplier.id,
            document_type: 'resale_license',
            file_url: publicUrl,
            file_name: file.name,
          });
        }
      }

      toast({ 
        title: 'Application Submitted!', 
        description: 'Your supplier application is pending admin approval.' 
      });
      navigate('/supplier-dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
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
    <div className="container max-w-3xl py-10">
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Business Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Provide your business details and contact information
                </p>
              </div>
              <Separator />
              
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
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
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

            {/* Service Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Service Details</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Specify your delivery options and service area
                </p>
              </div>
              <Separator />
              
                <div className="space-y-2">
                  <Label htmlFor="deliveryRadius">Delivery Radius (miles)</Label>
                <Input
                  id="deliveryRadius"
                  type="number"
                  min="0"
                  value={formData.deliveryRadius}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryRadius: parseInt(e.target.value) }))}
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

            </div>

            {/* Product Categories */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Product Categories</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Select at least one category that matches your inventory
                </p>
              </div>
              <Separator />
              
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.name} className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={category.name}
                      checked={formData.productCategories.includes(category.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            productCategories: [...prev.productCategories, category.name]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            productCategories: prev.productCategories.filter(c => c !== category.name)
                          }));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={category.name} className="font-medium cursor-pointer">
                        {category.name}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {category.description}
                      </p>
                    </div>
                  </div>
                ))}
                {formData.productCategories.length === 0 && (
                  <p className="text-sm text-destructive">Please select at least one category</p>
                )}
              </div>
            </div>

            {/* Banking Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Banking Information</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Payment setup will be completed via Stripe after your application is approved
                </p>
              </div>
              <Separator />
              
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  Once your supplier application is approved, you'll receive an email with instructions to complete your Stripe Connect onboarding. This secure process will enable you to receive payments for orders.
                </p>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Documents</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload verification documents (optional but recommended)
                </p>
              </div>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="documents">
                  Upload Business License / Resale Certificate
                </Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Accepted formats: PDF, JPG, PNG. Multiple files allowed.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || formData.productCategories.length === 0}
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                By submitting, you agree to our terms of service and supplier agreement
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
