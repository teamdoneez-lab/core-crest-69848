import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Briefcase, MapPin, Shield, MessageSquare, Heart, Lock, Award, CheckCircle2 } from 'lucide-react';
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden transition-all duration-300 animate-scale-in">
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
              <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-primary/60 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
              </div>

              {/* Header Section */}
              <div className="px-6 pb-6">
                {/* Logo & Basic Info */}
                <div className="flex flex-col items-center mb-6 -mt-16">
                  <div className="w-32 h-32 rounded-full bg-card border-4 border-background shadow-xl flex items-center justify-center text-4xl font-bold text-primary hover:scale-105 transition-transform duration-300 mb-4">
                    {(proDetail.business_name || proDetail.name).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 w-full text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          <h2 className="text-3xl font-bold">{proDetail.business_name || proDetail.name}</h2>
                          {proDetail.is_verified && (
                            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20 transition-colors">
                              <Shield className="h-3.5 w-3.5 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        {/* Verified Date Badge */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Verified Professional</span>
                        </div>
                        
                        {/* Rating Summary */}
                        {reviews.length > 0 && (
                          <div className="flex items-center gap-2">
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <div className="space-y-8">
                  {/* Business Description */}
                  {proDetail.description && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        About
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed pl-7">
                        {truncateDescription(proDetail.description, 250)}
                      </p>
                    </div>
                  )}

                  {/* Services Offered */}
                  {proDetail.service_categories && proDetail.service_categories.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Services Offered
                      </h3>
                      <div className="flex flex-wrap gap-2 pl-7">
                        {proDetail.service_categories.map((category, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs hover:bg-secondary/80 transition-colors cursor-default"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications & Amenities */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Certifications & Amenities
                    </h3>
                    <Card className="bg-muted/30 border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="hover:bg-accent transition-colors">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Licensed & Insured
                          </Badge>
                          <Badge variant="outline" className="hover:bg-accent transition-colors">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Background Checked
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

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
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Customer Reviews
                    </h3>

                    {reviews.length === 0 ? (
                      <Card className="bg-muted/30">
                        <CardContent className="py-12 text-center">
                          <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                          <p className="text-muted-foreground font-medium mb-2">No reviews yet</p>
                          <p className="text-sm text-muted-foreground">
                            Be the first to share your experience with this professional
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {/* Top Review Highlight - if 5+ reviews */}
                        {reviews.length >= 5 && reviews[0] && (
                          <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="default" className="text-xs">
                                  Top Review
                                </Badge>
                              </div>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold">{reviews[0].customer_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {renderStars(reviews[0].rating)}
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(reviews[0].created_at), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {reviews[0].comment && (
                                <p className="text-sm text-muted-foreground mt-3 italic">"{reviews[0].comment}"</p>
                              )}
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Recent Reviews */}
                        {reviews.slice(reviews.length >= 5 ? 1 : 0, 5).map((review) => (
                          <Card key={review.id} className="hover:shadow-md transition-shadow duration-200">
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
                          <Button 
                            variant="outline" 
                            className="w-full hover:bg-accent transition-colors"
                          >
                            View All {reviews.length} Reviews
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 mt-8 pt-6 pb-4 bg-background/95 backdrop-blur-sm border-t">
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 h-12 hover:scale-[1.02] transition-transform" 
                      size="lg"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 hover:scale-[1.02] transition-transform" 
                      size="lg"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Provider
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="h-12 hover:bg-accent transition-colors"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
