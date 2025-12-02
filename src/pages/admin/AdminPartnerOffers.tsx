import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartnerOffer {
  id: string;
  partner_name: string;
  offer_title: string;
  description: string;
  offer_type: 'pro_perk' | 'exclusive' | 'limited_time';
  cta_label: string;
  cta_url: string;
  tags: string[];
  promo_code?: string;
  image_url?: string;
  is_featured: boolean;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminPartnerOffers() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PartnerOffer | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    partner_name: '',
    offer_title: '',
    description: '',
    offer_type: 'exclusive' as 'pro_perk' | 'exclusive' | 'limited_time',
    cta_label: '',
    cta_url: '',
    tags: '',
    promo_code: '',
    is_featured: false,
    is_active: true,
    start_date: new Date(),
    end_date: undefined as Date | undefined,
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    fetchOffers();
  }, [user, isAdmin, navigate]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch partner offers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return selectedOffer?.image_url || null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('partner-logos')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('partner-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload image if provided
    const imageUrl = await uploadImage();

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const offerData = {
      partner_name: formData.partner_name.trim(),
      offer_title: formData.offer_title.trim(),
      description: formData.description.trim(),
      offer_type: formData.offer_type,
      cta_label: formData.cta_label.trim(),
      cta_url: formData.cta_url.trim(),
      tags,
      promo_code: formData.promo_code.trim() || null,
      image_url: imageUrl,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      start_date: formData.start_date.toISOString(),
      end_date: formData.end_date?.toISOString() || null,
    };

    try {
      if (selectedOffer) {
        // Update existing offer
        const { error } = await supabase
          .from('partner_offers')
          .update(offerData)
          .eq('id', selectedOffer.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Partner offer updated successfully',
        });
      } else {
        // Create new offer
        const { error } = await supabase
          .from('partner_offers')
          .insert(offerData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Partner offer created successfully',
        });
      }

      resetForm();
      setIsFormOpen(false);
      fetchOffers();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to save partner offer',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (offer: PartnerOffer) => {
    setSelectedOffer(offer);
    setFormData({
      partner_name: offer.partner_name,
      offer_title: offer.offer_title,
      description: offer.description,
      offer_type: offer.offer_type,
      cta_label: offer.cta_label,
      cta_url: offer.cta_url,
      tags: offer.tags.join(', '),
      promo_code: offer.promo_code || '',
      is_featured: offer.is_featured,
      is_active: offer.is_active,
      start_date: new Date(offer.start_date),
      end_date: offer.end_date ? new Date(offer.end_date) : undefined,
    });
    setImagePreview(offer.image_url || '');
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedOffer) return;

    try {
      const { error } = await supabase
        .from('partner_offers')
        .delete()
        .eq('id', selectedOffer.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Partner offer deleted successfully',
      });

      setIsDeleteOpen(false);
      setSelectedOffer(null);
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete partner offer',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      partner_name: '',
      offer_title: '',
      description: '',
      offer_type: 'exclusive',
      cta_label: '',
      cta_url: '',
      tags: '',
      promo_code: '',
      is_featured: false,
      is_active: true,
      start_date: new Date(),
      end_date: undefined,
    });
    setSelectedOffer(null);
    setImageFile(null);
    setImagePreview('');
  };

  const getOfferTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pro_perk: { label: 'Pro Perk', className: 'bg-purple-500/20 text-purple-700 dark:text-purple-300' },
      exclusive: { label: 'Exclusive', className: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
      limited_time: { label: 'Limited Time', className: 'bg-orange-500/20 text-orange-700 dark:text-orange-300' },
    };
    return variants[type] || variants.exclusive;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Partner Offers Management</h1>
              <p className="text-muted-foreground mt-2">Create and manage exclusive offers for Pro members</p>
            </div>
            <Button onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Offer
            </Button>
          </div>

          <div className="grid gap-6">
            {offers.map((offer) => {
              const typeBadge = getOfferTypeBadge(offer.offer_type);
              return (
                <Card key={offer.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {offer.image_url && (
                          <img
                            src={offer.image_url}
                            alt={offer.partner_name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CardTitle>{offer.offer_title}</CardTitle>
                            <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                            {offer.is_featured && <Badge variant="secondary">Featured</Badge>}
                            {!offer.is_active && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <CardDescription className="font-semibold">{offer.partner_name}</CardDescription>
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                          {offer.tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {offer.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {offer.promo_code && (
                            <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                              Code: {offer.promo_code}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Start: {format(new Date(offer.start_date), 'MMM d, yyyy')}</span>
                            {offer.end_date && (
                              <span>End: {format(new Date(offer.end_date), 'MMM d, yyyy')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(offer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOffer(offer);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Button size="sm" asChild>
                        <a href={offer.cta_url} target="_blank" rel="noopener noreferrer">
                          {offer.cta_label}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOffer ? 'Edit' : 'Add New'} Partner Offer</DialogTitle>
            <DialogDescription>
              Fill in the details for the partner offer
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner_name">Partner Name *</Label>
              <Input
                id="partner_name"
                value={formData.partner_name}
                onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer_title">Offer Title *</Label>
              <Input
                id="offer_title"
                value={formData.offer_title}
                onChange={(e) => setFormData({ ...formData, offer_title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer_type">Offer Type *</Label>
                <Select
                  value={formData.offer_type}
                  onValueChange={(value: any) => setFormData({ ...formData, offer_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">Exclusive</SelectItem>
                    <SelectItem value="pro_perk">Pro Perk</SelectItem>
                    <SelectItem value="limited_time">Limited Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo_code">Promo Code</Label>
                <Input
                  id="promo_code"
                  value={formData.promo_code}
                  onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_label">Button Text *</Label>
              <Input
                id="cta_label"
                value={formData.cta_label}
                onChange={(e) => setFormData({ ...formData, cta_label: e.target.value })}
                placeholder="e.g., Get Offer, Visit Partner"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_url">Button URL *</Label>
              <Input
                id="cta_url"
                type="url"
                value={formData.cta_url}
                onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., Software, Discount, Training"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Partner Logo</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.start_date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => date && setFormData({ ...formData, start_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.end_date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, 'PPP') : 'No end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData({ ...formData, end_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured Offer</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : selectedOffer ? 'Update' : 'Create'} Offer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedOffer?.offer_title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
