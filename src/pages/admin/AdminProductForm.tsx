import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface ProductForm {
  part_name: string;
  description: string;
  category: string;
  price: number;
  sku: string;
  quantity: number;
  image_url: string;
  is_active: boolean;
  condition: string;
  warranty_months: number;
}

const CATEGORIES = [
  'Alternators',
  'Batteries',
  'Brakes',
  'Engine Parts',
  'Filters',
  'Lights',
  'Suspension',
  'Transmission',
  'Other',
];

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [platformSupplierId, setPlatformSupplierId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductForm>({
    part_name: '',
    description: '',
    category: '',
    price: 0,
    sku: '',
    quantity: 0,
    image_url: '',
    is_active: true,
    condition: 'new',
    warranty_months: 12,
  });

  useEffect(() => {
    fetchPlatformSupplier();
  }, []);

  useEffect(() => {
    if (productId && platformSupplierId) {
      fetchProduct();
    }
  }, [productId, platformSupplierId]);

  const fetchPlatformSupplier = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id')
        .eq('is_platform_seller', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPlatformSupplierId(data.id);
      }
    } catch (error) {
      console.error('Error fetching platform supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to load platform supplier',
        variant: 'destructive',
      });
    }
  };

  const fetchProduct = async () => {
    if (!productId || !platformSupplierId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('id', productId)
        .eq('supplier_id', platformSupplierId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          part_name: data.part_name,
          description: data.description || '',
          category: data.category,
          price: Number(data.price),
          sku: data.sku,
          quantity: data.quantity,
          image_url: data.image_url || '',
          is_active: data.is_active,
          condition: data.condition,
          warranty_months: data.warranty_months,
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platformSupplierId) {
      toast({
        title: 'Error',
        description: 'Platform supplier not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const productData = {
        ...formData,
        supplier_id: platformSupplierId,
        admin_approved: true,
      };

      if (productId) {
        // Update existing product
        const { error } = await supabase
          .from('supplier_products')
          .update(productData)
          .eq('id', productId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        // Create new product
        const { error } = await supabase
          .from('supplier_products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      }

      navigate('/admin/doneez/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']} redirectTo="/">
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto py-8 px-4 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/doneez/products')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{productId ? 'Edit Product' : 'Add New Product'}</CardTitle>
              <CardDescription>
                {productId ? 'Update product details' : 'Add a new DoneEZ platform product'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="part_name">Product Name *</Label>
                  <Input
                    id="part_name"
                    value={formData.part_name}
                    onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="refurbished">Refurbished</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Stock *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty_months">Warranty (months)</Label>
                  <Input
                    id="warranty_months"
                    type="number"
                    min="0"
                    value={formData.warranty_months}
                    onChange={(e) => setFormData({ ...formData, warranty_months: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active (visible to customers)</Label>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/doneez/products')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
