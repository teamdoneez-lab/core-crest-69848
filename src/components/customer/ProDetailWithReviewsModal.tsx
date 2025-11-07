import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Briefcase, MapPin, Shield, MessageSquare, Heart, Lock } from 'lucide-react';
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
  latitude?: number;
  longitude?: number;
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
        latitude: proProfile.latitude,
        longitude: proProfile.longitude,
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

  const truncateDescription = (text: string | undefined, maxLength: number = 250) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : !proDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">No information found</div>
            </div>
          ) : (
            <div>
              {/* Cover Photo / Banner */}
              <div className="relative h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              </div>

              {/* Header Section */}
              <div className="px-6 pb-6 -mt-12">
                {/* Logo & Basic Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-lg flex items-center justify-center text-3xl font-bold text-primary">
                    {(proDetail.business_name || proDetail.name).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 pt-12">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-2xl font-bold">{proDetail.business_name || proDetail.name}</h2>
                          {proDetail.is_verified && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        {/* Rating Summary */}
                        {reviews.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {renderStars(Math.round(averageRating))}
                            <span className="text-sm font-semibold">
                              {averageRating.toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                            </span>
                          </div>
                        )}

                        {/* Location */}
                        {(proDetail.city || proDetail.zip_code) && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {proDetail.city && `${proDetail.city}, `}
                              {proDetail.state} {proDetail.zip_code}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Body Content */}
                <div className="space-y-6">
                  {/* Business Description */}
                  {proDetail.description && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        About
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {truncateDescription(proDetail.description, 250)}
                      </p>
                    </div>
                  )}

                  {/* Services Offered */}
                  {proDetail.service_categories && proDetail.service_categories.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        Services Offered
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {proDetail.service_categories.map((category, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Privacy-Protected Information */}
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-2">Contact Details Available After Booking</h4>
                          <p className="text-xs text-muted-foreground">
                            Full address, phone number, and contact information will be provided once you book an appointment.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Reviews Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>

                    {reviews.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          No reviews yet
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {reviews.slice(0, 5).map((review) => (
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
                        {reviews.length > 5 && (
                          <p className="text-sm text-center text-muted-foreground">
                            Showing 5 of {reviews.length} reviews
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 mt-6 pt-4 pb-2 bg-background border-t flex gap-3">
                  <Button className="flex-1" size="lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Provider
                  </Button>
                  <Button variant="outline" size="lg">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
