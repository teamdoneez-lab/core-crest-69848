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
import { ArrowLeft, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RoleGuard } from '@/components/RoleGuard';
import { getSuppliesCategoryList } from '@/data/mockCategories';

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

interface UploadedImage {
  file: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
}

// Get only Supplies categories matching Pro Marketplace
const CATEGORIES = getSuppliesCategoryList();

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [platformSupplierId, setPlatformSupplierId] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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
      // Query for platform supplier - handle multiple by taking the first one
      const { data, error } = await supabase
        .from('suppliers')
        .select('id')
        .eq('is_platform_seller', true)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPlatformSupplierId(data[0].id);
      } else {
        // If platform supplier doesn't exist, try to create it
        const { data: newSupplier, error: createError } = await supabase
          .from('suppliers')
          .insert({
            business_name: 'DoneEZ',
            contact_name: 'DoneEZ Platform',
            business_address: 'Platform Headquarters',
            city: 'Online',
            state: 'CA',
            zip: '00000',
            email: 'platform@doneez.com',
            phone: '0000000000',
            is_platform_seller: true,
            stripe_connect_account_id: null,
            status: 'approved',
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating platform supplier:', createError);
          toast({
            title: 'Error',
            description: 'Failed to create platform supplier',
            variant: 'destructive',
          });
        } else {
          setPlatformSupplierId(newSupplier.id);
          toast({
            title: 'Success',
            description: 'Platform supplier created successfully',
          });
        }
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
        
        // Load existing image if present
        if (data.image_url) {
          setImages([{
            file: new File([], 'existing'),
            preview: data.image_url,
            uploaded: true,
            url: data.image_url,
          }]);
        }
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    // If no images selected, return empty array
    if (images.length === 0) {
      return uploadedUrls;
    }
    
    for (const img of images) {
      if (img.uploaded && img.url) {
        uploadedUrls.push(img.url);
        continue;
      }

      try {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(filePath, img.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          // If bucket doesn't exist, throw specific error
          if (uploadError.message?.includes('Bucket not found')) {
            throw new Error('BUCKET_NOT_FOUND');
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      } catch (error: any) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }

    return uploadedUrls;
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
      setUploadingImages(true);

      let primaryImageUrl = formData.image_url;

      // Try to upload images, but continue if bucket doesn't exist
      try {
        const imageUrls = await uploadImages();
        if (imageUrls.length > 0) {
          primaryImageUrl = imageUrls[0];
        }
      } catch (uploadError: any) {
        setUploadingImages(false);
        
        if (uploadError.message === 'BUCKET_NOT_FOUND') {
          toast({
            title: 'Storage Not Configured',
            description: 'Image upload bucket not found. Product will be saved with URL only. Please run create-product-images-bucket.sql to enable uploads.',
            variant: 'destructive',
          });
          // Continue with product creation using URL if provided
          if (!formData.image_url && images.length > 0) {
            throw new Error('Cannot upload images - storage bucket not configured. Please provide an image URL or configure storage.');
          }
        } else {
          throw uploadError;
        }
      }

      const productData = {
        ...formData,
        image_url: primaryImageUrl || null,
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
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      let errorMessage = 'Failed to save product';
      if (error?.message?.includes('storage')) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadingImages(false);
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
                  <Label htmlFor="images">Product Images</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload product images (JPG, PNG, WebP). First image will be the primary image.
                  </p>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img.preview}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {index === 0 && (
                            <Badge className="absolute bottom-1 left-1 text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Or Image URL (optional)</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-sm text-muted-foreground">
                    You can provide an image URL instead of uploading
                  </p>
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
                  <Button type="submit" disabled={loading || uploadingImages}>
                    <Save className="mr-2 h-4 w-4" />
                    {uploadingImages ? 'Uploading Images...' : loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
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
