import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Mail, Globe, Clock, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

interface ProDetailModalProps {
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProDetail {
  pro_id: string;
  name: string;
  phone: string | null;
  business_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone_business: string | null;
  website: string | null;
  description: string | null;
  is_verified: boolean;
  service_radius: number;
  created_at: string;
}

export function ProDetailModal({ requestId, open, onOpenChange }: ProDetailModalProps) {
  const [proDetail, setProDetail] = useState<ProDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);

  useEffect(() => {
    if (open && requestId) {
      fetchProDetail();
    }
  }, [open, requestId]);

  const fetchProDetail = async () => {
    try {
      setLoading(true);
      
      // Get the service request with accepted pro
      const { data: requestData, error: requestError } = await supabase
        .from('service_requests')
        .select('accepted_pro_id')
        .eq('id', requestId)
        .single();

      if (requestError || !requestData?.accepted_pro_id) {
        console.error('No pro assigned to this request');
        setProDetail(null);
        return;
      }

      const proId = requestData.accepted_pro_id;

      // Get pro profile details
      const { data: proData, error: proError } = await supabase
        .from('pro_profiles')
        .select(`
          pro_id,
          business_name,
          address,
          city,
          state,
          zip_code,
          phone,
          website,
          description,
          is_verified,
          service_radius,
          created_at
        `)
        .eq('pro_id', proId)
        .single();

      if (proError) throw proError;

      // Get pro name from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', proId)
        .single();

      // Get service categories
      const { data: categoriesData } = await supabase
        .from('pro_service_categories')
        .select('category_id, service_categories(name)')
        .eq('pro_id', proId);

      const categoryNames = categoriesData?.map(c => (c as any).service_categories?.name).filter(Boolean) || [];
      setServiceCategories(categoryNames);

      // Get service areas
      const { data: areasData } = await supabase
        .from('pro_service_areas')
        .select('zip')
        .eq('pro_id', proId);

      const zipCodes = areasData?.map(a => a.zip) || [];
      setServiceAreas(zipCodes);

      setProDetail({
        pro_id: proId,
        name: profileData?.name || 'Unknown',
        phone: profileData?.phone || null,
        business_name: proData.business_name,
        address: proData.address,
        city: proData.city,
        state: proData.state,
        zip_code: proData.zip_code,
        phone_business: proData.phone,
        website: proData.website,
        description: proData.description,
        is_verified: proData.is_verified,
        service_radius: proData.service_radius,
        created_at: proData.created_at
      });

    } catch (error) {
      console.error('Error fetching pro details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Professional Details</DialogTitle>
          <DialogDescription>
            Detailed information about the assigned professional
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : !proDetail ? (
          <div className="py-8 text-center text-muted-foreground">
            No professional assigned to this request
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{proDetail.business_name}</h3>
                <Badge className={proDetail.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {proDetail.is_verified ? (
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
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Contact Person</p>
                  <p className="font-medium">{proDetail.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Pro ID</p>
                  <p className="font-mono text-xs">{proDetail.pro_id}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                {proDetail.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Personal:</span>
                    <span>{proDetail.phone}</span>
                  </div>
                )}
                {proDetail.phone_business && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Business:</span>
                    <span>{proDetail.phone_business}</span>
                  </div>
                )}
                {proDetail.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <a href={proDetail.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {proDetail.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Business Address */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Business Address
              </h4>
              <div className="text-sm">
                {proDetail.address ? (
                  <>
                    <p>{proDetail.address}</p>
                    <p>
                      {proDetail.city && `${proDetail.city}, `}
                      {proDetail.state && `${proDetail.state} `}
                      {proDetail.zip_code}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No address provided</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Service Information */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Service Information
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-2">Service Radius</p>
                  <Badge variant="outline">{proDetail.service_radius} km</Badge>
                </div>
                
                {serviceCategories.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Service Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {serviceCategories.map((category, idx) => (
                        <Badge key={idx} variant="secondary">{category}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {serviceAreas.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Service Areas (ZIP Codes)</p>
                    <div className="flex flex-wrap gap-2">
                      {serviceAreas.slice(0, 10).map((zip, idx) => (
                        <Badge key={idx} variant="outline">{zip}</Badge>
                      ))}
                      {serviceAreas.length > 10 && (
                        <Badge variant="outline">+{serviceAreas.length - 10} more</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {proDetail.description && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Description</h4>
                  <p className="text-sm text-muted-foreground">{proDetail.description}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Additional Info */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Additional Information
              </h4>
              <div className="text-sm">
                <p className="text-muted-foreground">
                  Joined: {format(new Date(proDetail.created_at), 'PPP')}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
