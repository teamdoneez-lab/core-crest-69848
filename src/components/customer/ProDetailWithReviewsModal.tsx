import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Globe, Calendar, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ProDetailWithReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proId: string;
}

interface ProDetail {
  name: string;
  email: string;
  phone?: string;
  business_name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  website?: string;
  is_verified: boolean;
  service_categories?: string[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name: string;
}

export function ProDetailWithReviewsModal({
  open,
  onOpenChange,
  proId,
}: ProDetailWithReviewsModalProps) {
  const [loading, setLoading] = useState(true);
  const [proDetail, setProDetail] = useState<ProDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (open && proId) {
      fetchProDetail();
      fetchReviews();
    }
  }, [open, proId]);

  const fetchProDetail = async () => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email, phone')
        .eq('id', proId)
        .single();

      if (profileError) throw profileError;

      // Fetch pro profile
      const { data: proProfile, error: proProfileError } = await supabase
        .from('pro_profiles')
        .select('*')
        .eq('pro_id', proId)
        .single();

      if (proProfileError) throw proProfileError;

      // Fetch service categories
      const { data: categories } = await supabase
        .from('pro_service_categories')
        .select(`
          service_categories (
            name
          )
        `)
        .eq('pro_id', proId);

      const serviceCategories = categories?.map((c: any) => c.service_categories.name) || [];

      setProDetail({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || proProfile.phone,
        business_name: proProfile.business_name,
        description: proProfile.description,
        address: proProfile.address,
        city: proProfile.city,
        state: proProfile.state,
        zip_code: proProfile.zip_code,
        website: proProfile.website,
        is_verified: proProfile.is_verified,
        service_categories: serviceCategories,
      });
    } catch (error) {
      console.error('Error fetching pro details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('pro_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          customer:profiles!customer_id (
            name
          )
        `)
        .eq('pro_id', proId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReviews = data?.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        customer_name: review.customer?.name || 'Anonymous',
      })) || [];

      setReviews(formattedReviews);

      // Calculate average rating
      if (formattedReviews.length > 0) {
        const avg = formattedReviews.reduce((sum, r) => sum + r.rating, 0) / formattedReviews.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Professional Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : !proDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">No information found</div>
            </div>
          ) : (
            <div className="space-y-6 pr-4">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{proDetail.business_name || proDetail.name}</h2>
                  {proDetail.is_verified && (
                    <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                  )}
                </div>
                {proDetail.description && (
                  <p className="text-muted-foreground">{proDetail.description}</p>
                )}
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="grid gap-4 md:grid-cols-2">
                {proDetail.name && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Contact Name</p>
                      <p className="text-sm text-muted-foreground">{proDetail.name}</p>
                    </div>
                  </div>
                )}
                {proDetail.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Website</p>
                      <a
                        href={proDetail.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {proDetail.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Categories */}
              {proDetail.service_categories && proDetail.service_categories.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Services Offered</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {proDetail.service_categories.map((category, idx) => (
                        <Badge key={idx} variant="outline">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Reviews Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Customer Reviews</h3>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      {renderStars(Math.round(averageRating))}
                      <span className="text-sm font-semibold">
                        {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No reviews yet
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{review.customer_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {renderStars(review.rating)}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground mt-3">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
