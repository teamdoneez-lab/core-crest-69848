import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Car, MapPin, Wrench } from "lucide-react";
import { QuoteFormFields } from "./QuoteFormFields";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuoteFormProps {
  requestId: string;
  onSuccess: () => void;
}

interface ServiceRequestDetails {
  id: string;
  vehicle_make: string;
  model: string;
  year: number;
  trim?: string;
  mileage?: number;
  address: string;
  zip: string;
  notes?: string;
  image_url?: string;
  status: string;
  service_categories?: {
    name: string;
  };
}

export function QuoteForm({ requestId, onSuccess }: QuoteFormProps) {
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestDetails, setRequestDetails] = useState<ServiceRequestDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests" as any)
        .select(`
          id,
          vehicle_make,
          model,
          year,
          trim,
          mileage,
          address,
          zip,
          notes,
          image_url,
          status,
          service_categories (
            name
          )
        `)
        .eq("id", requestId)
        .single();

      if (error) {
        console.error("Error fetching request details:", error);
      } else if (data) {
        setRequestDetails(data as unknown as ServiceRequestDetails);
      }
    } catch (err) {
      console.error("Failed to fetch request details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a quote",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("quotes" as any)
        .insert({
          service_request_id: requestId,
          pro_id: user.id,
          estimated_price: parseFloat(estimatedPrice),
          description,
          notes: notes || null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Quote Submitted",
        description: "Your quote has been sent to the customer",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Quote submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit quote",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPhotos = async () => {
    toast({
      title: "Photo Request Sent",
      description: "Customer will be notified to upload more photos",
    });
  };

  // Parse multiple images from image_url (comma-separated or JSON array)
  const getImageUrls = (imageUrl?: string): string[] => {
    if (!imageUrl) return [];
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(imageUrl);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // If not JSON, check if comma-separated
      if (imageUrl.includes(',')) {
        return imageUrl.split(',').map(url => url.trim()).filter(Boolean);
      }
      // Single image URL
      return [imageUrl];
    }
    return [imageUrl];
  };

  const imageUrls = getImageUrls(requestDetails?.image_url);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Job Details */}
      <div className="space-y-4">
        {loadingDetails ? (
          <Card>
            <CardContent className="py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ) : requestDetails ? (
          <>
            {/* Service Type Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {requestDetails.service_categories?.name || "Service Request"}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {requestDetails.status === 'quote_requested' ? 'Quote Request' : requestDetails.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {requestDetails.year} {requestDetails.vehicle_make} {requestDetails.model}
                      {requestDetails.trim && ` ${requestDetails.trim}`}
                    </span>
                  </div>
                  {requestDetails.mileage && (
                    <div className="text-sm text-muted-foreground ml-6">
                      {requestDetails.mileage.toLocaleString()} miles
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{requestDetails.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Notes */}
            {requestDetails.notes && (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-4">
                  <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">
                    Customer Notes
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {requestDetails.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Photos */}
            {imageUrls.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                  Photos ({imageUrls.length})
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {imageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Vehicle photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Unable to load request details
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Quote Form */}
      <div>
        <QuoteFormFields
          estimatedPrice={estimatedPrice}
          setEstimatedPrice={setEstimatedPrice}
          description={description}
          setDescription={setDescription}
          notes={notes}
          setNotes={setNotes}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onRequestPhotos={handleRequestPhotos}
        />
      </div>
    </div>
  );
}
