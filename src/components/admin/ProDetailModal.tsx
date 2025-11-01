import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Mail, Globe, Clock, CheckCircle, XCircle, Briefcase, Users } from 'lucide-react';
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
  lead_status?: string;
}

export function ProDetailModal({ requestId, open, onOpenChange }: ProDetailModalProps) {
  const [proDetails, setProDetails] = useState<ProDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAcceptedProView, setIsAcceptedProView] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<Record<string, string[]>>({});
  const [serviceAreas, setServiceAreas] = useState<Record<string, string[]>>({});

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
        .select('accepted_pro_id, status')
        .eq('id', requestId)
        .single();

      if (requestError) {
        console.error('Error fetching request:', requestError);
        setProDetails([]);
        return;
      }

      let proIds: string[] = [];
      
      if (requestData?.accepted_pro_id) {
        // Show only the accepted pro
        proIds = [requestData.accepted_pro_id];
        setIsAcceptedProView(true);
      } else {
        // Show all leads for this request
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('pro_id, status')
          .eq('request_id', requestId);

        if (leadsError) {
          console.error('Error fetching leads:', leadsError);
          setProDetails([]);
          return;
        }

        if (!leadsData || leadsData.length === 0) {
          setProDetails([]);
          return;
        }

        proIds = leadsData.map(lead => lead.pro_id);
        setIsAcceptedProView(false);
      }

      // Fetch details for all pros
      const prosData: ProDetail[] = [];
      const categoriesMap: Record<string, string[]> = {};
      const areasMap: Record<string, string[]> = {};

      for (const proId of proIds) {
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
          .maybeSingle();

        if (proError || !proData) continue;

        // Get pro name from profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', proId)
          .maybeSingle();

        // Get lead status if not accepted pro view
        let leadStatus = undefined;
        if (!isAcceptedProView) {
          const { data: leadData } = await supabase
            .from('leads')
            .select('status')
            .eq('request_id', requestId)
            .eq('pro_id', proId)
            .maybeSingle();
          leadStatus = leadData?.status;
        }

        // Get service categories
        const { data: categoriesData } = await supabase
          .from('pro_service_categories')
          .select('category_id, service_categories(name)')
          .eq('pro_id', proId);

        const categoryNames = categoriesData?.map(c => (c as any).service_categories?.name).filter(Boolean) || [];
        categoriesMap[proId] = categoryNames;

        // Get service areas
        const { data: areasData } = await supabase
          .from('pro_service_areas')
          .select('zip')
          .eq('pro_id', proId);

        const zipCodes = areasData?.map(a => a.zip) || [];
        areasMap[proId] = zipCodes;

        prosData.push({
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
          created_at: proData.created_at,
          lead_status: leadStatus
        });
      }

      setProDetails(prosData);
      setServiceCategories(categoriesMap);
      setServiceAreas(areasMap);

    } catch (error) {
      console.error('Error fetching pro details:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProCard = (proDetail: ProDetail) => {
    const categories = serviceCategories[proDetail.pro_id] || [];
    const areas = serviceAreas[proDetail.pro_id] || [];

    return (
      <div key={proDetail.pro_id} className="space-y-6 p-4 border rounded-lg">
        {/* Basic Info */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{proDetail.business_name}</h3>
            <div className="flex gap-2">
              {proDetail.lead_status && (
                <Badge variant="outline" className="capitalize">
                  {proDetail.lead_status}
                </Badge>
              )}
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
              <Badge variant="outline">{proDetail.service_radius} miles</Badge>
            </div>
            
            {categories.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2">Service Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category, idx) => (
                    <Badge key={idx} variant="secondary">{category}</Badge>
                  ))}
                </div>
              </div>
            )}

            {areas.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2">Service Areas (ZIP Codes)</p>
                <div className="flex flex-wrap gap-2">
                  {areas.slice(0, 10).map((zip, idx) => (
                    <Badge key={idx} variant="outline">{zip}</Badge>
                  ))}
                  {areas.length > 10 && (
                    <Badge variant="outline">+{areas.length - 10} more</Badge>
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
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAcceptedProView ? 'Assigned Professional Details' : 'Matched Professionals'}
          </DialogTitle>
          <DialogDescription>
            {isAcceptedProView 
              ? 'Detailed information about the assigned professional'
              : `${proDetails.length} professional${proDetails.length !== 1 ? 's' : ''} matched to this request`
            }
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : proDetails.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No professionals matched to this request yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proDetails.map(pro => renderProCard(pro))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
