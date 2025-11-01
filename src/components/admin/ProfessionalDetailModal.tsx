import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Phone, Mail, Globe, Calendar, CheckCircle, XCircle, Car, DollarSign } from 'lucide-react';

interface ProfessionalDetailModalProps {
  proId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProDetail {
  id: string;
  name: string;
  phone?: string;
  role: string;
  created_at: string;
  violation_flags: number;
  last_violation_at?: string;
  pro_profiles?: {
    business_name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    website?: string;
    description?: string;
    is_verified: boolean;
    service_radius: number;
    profile_complete: boolean;
    operating_hours?: any;
  }[];
  service_categories?: Array<{
    name: string;
  }>;
  service_areas?: Array<{
    zip: string;
  }>;
  service_requests_count?: number;
  quotes_count?: number;
  appointments_count?: number;
  completed_jobs?: number;
}

export const ProfessionalDetailModal = ({ proId, open, onOpenChange }: ProfessionalDetailModalProps) => {
  const [proDetail, setProDetail] = useState<ProDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && proId) {
      fetchProDetail();
    }
  }, [open, proId]);

  const fetchProDetail = async () => {
    if (!proId) return;
    
    setLoading(true);
    try {
      // Fetch professional profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', proId)
        .single();

      if (profileError) throw profileError;

      // Fetch pro profile separately
      const { data: proProfileData } = await supabase
        .from('pro_profiles')
        .select('*')
        .eq('pro_id', proId);

      // Fetch service categories
      const { data: categoriesData } = await supabase
        .from('pro_service_categories')
        .select('category_id, service_categories(name)')
        .eq('pro_id', proId);

      // Fetch service areas
      const { data: areasData } = await supabase
        .from('pro_service_areas')
        .select('zip')
        .eq('pro_id', proId);

      // Fetch service requests count
      const { count: requestsCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('accepted_pro_id', proId);

      // Fetch quotes count
      const { count: quotesCount } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('pro_id', proId);

      // Fetch appointments count
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('pro_id', proId);

      // Fetch completed jobs count
      const { count: completedCount } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('accepted_pro_id', proId)
        .eq('status', 'completed');

      setProDetail({
        ...profileData,
        pro_profiles: proProfileData || [],
        service_categories: categoriesData?.map(cat => ({ 
          name: (cat.service_categories as any)?.name || 'Unknown' 
        })) || [],
        service_areas: areasData || [],
        service_requests_count: requestsCount || 0,
        quotes_count: quotesCount || 0,
        appointments_count: appointmentsCount || 0,
        completed_jobs: completedCount || 0,
      });
    } catch (error) {
      console.error('Error fetching professional details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Professional Details</DialogTitle>
          <DialogDescription>
            Complete information about the professional
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !proDetail ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No professional information found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Basic Information</span>
                  <Badge>{proDetail.role}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{proDetail.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-sm text-muted-foreground font-mono text-xs">{proDetail.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 inline mr-1" />
                      {proDetail.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Joined</p>
                    <p className="text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(new Date(proDetail.created_at), 'PPP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Violation Flags</p>
                    <p className="text-sm text-muted-foreground">{proDetail.violation_flags || 0}</p>
                  </div>
                  {proDetail.last_violation_at && (
                    <div>
                      <p className="text-sm font-medium">Last Violation</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(proDetail.last_violation_at), 'PPP')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Business Profile */}
            {proDetail.pro_profiles && proDetail.pro_profiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Business Profile</span>
                    <div className="flex gap-2">
                      <Badge variant={proDetail.pro_profiles[0].is_verified ? 'default' : 'secondary'}>
                        {proDetail.pro_profiles[0].is_verified ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Unverified
                          </>
                        )}
                      </Badge>
                      <Badge variant={proDetail.pro_profiles[0].profile_complete ? 'default' : 'outline'}>
                        {proDetail.pro_profiles[0].profile_complete ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Business Name</p>
                      <p className="text-sm text-muted-foreground">{proDetail.pro_profiles[0].business_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Service Radius</p>
                      <p className="text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {proDetail.pro_profiles[0].service_radius} miles
                      </p>
                    </div>
                    {proDetail.pro_profiles[0].phone && (
                      <div>
                        <p className="text-sm font-medium">Business Phone</p>
                        <p className="text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 inline mr-1" />
                          {proDetail.pro_profiles[0].phone}
                        </p>
                      </div>
                    )}
                    {proDetail.pro_profiles[0].website && (
                      <div>
                        <p className="text-sm font-medium">Website</p>
                        <p className="text-sm text-muted-foreground">
                          <Globe className="h-3 w-3 inline mr-1" />
                          <a href={proDetail.pro_profiles[0].website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {proDetail.pro_profiles[0].website}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {proDetail.pro_profiles[0].address && (
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {proDetail.pro_profiles[0].address}
                        {proDetail.pro_profiles[0].city && `, ${proDetail.pro_profiles[0].city}`}
                        {proDetail.pro_profiles[0].state && `, ${proDetail.pro_profiles[0].state}`}
                        {proDetail.pro_profiles[0].zip_code && ` ${proDetail.pro_profiles[0].zip_code}`}
                      </p>
                    </div>
                  )}

                  {proDetail.pro_profiles[0].description && (
                    <div>
                      <p className="text-sm font-medium">Description</p>
                      <p className="text-sm text-muted-foreground">{proDetail.pro_profiles[0].description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Service Categories & Areas */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {proDetail.service_categories && proDetail.service_categories.length > 0 ? (
                      proDetail.service_categories.map((cat, index) => (
                        <Badge key={index} variant="outline">
                          <Car className="h-3 w-3 mr-1" />
                          {cat.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No categories assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {proDetail.service_areas && proDetail.service_areas.length > 0 ? (
                      proDetail.service_areas.map((area, index) => (
                        <Badge key={index} variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {area.zip}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No service areas assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{proDetail.service_requests_count}</p>
                    <p className="text-sm text-muted-foreground">Accepted Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{proDetail.quotes_count}</p>
                    <p className="text-sm text-muted-foreground">Quotes Submitted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{proDetail.appointments_count}</p>
                    <p className="text-sm text-muted-foreground">Appointments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{proDetail.completed_jobs}</p>
                    <p className="text-sm text-muted-foreground">Completed Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
