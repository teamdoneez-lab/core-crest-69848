import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getServiceNames } from "@/utils/serviceCodeLookup";
import { JobSummaryPanel } from "./JobSummaryPanel";
import { QuoteFormFields } from "./QuoteFormFields";

const quoteSchema = z.object({
  estimated_price: z.number().min(1, "Price must be at least $1").max(999999, "Price cannot exceed $999,999"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000, "Description cannot exceed 1000 characters"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional()
});

interface QuoteFormProps {
  requestId: string;
  onSuccess: () => void;
}

interface ServiceRequestDetails {
  vehicle_make: string;
  model: string;
  year: number;
  trim?: string;
  mileage?: number;
  zip: string;
  address: string;
  description?: string;
  service_category?: string[];
  image_url?: string;
  notes?: string;
  service_categories: {
    name: string;
  };
  profiles: {
    name: string;
  };
}


export function QuoteForm({ requestId, onSuccess }: QuoteFormProps) {
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestDetails, setRequestDetails] = useState<ServiceRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoRequestDialog, setShowPhotoRequestDialog] = useState(false);

  const handleRequestMorePhotos = async () => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ 
          additional_photos_requested: true,
          photos_requested_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Photo Request Sent",
        description: "The customer will be notified to upload additional photos.",
      });
      
      setShowPhotoRequestDialog(false);
    } catch (error) {
      console.error('Error requesting photos:', error);
      toast({
        title: "Error",
        description: "Failed to send photo request",
        variant: "destructive",
      });
    }
  };

  // Demo placeholder images for testing (replace with actual customer photos)
  const demoPhotos = [
    "/images/demo-bumper-damage-1.jpg",
    "/images/demo-bumper-damage-2.jpg",
    "/images/demo-bumper-damage-3.jpg",
    "/images/demo-bumper-damage-4.jpg"
  ];

  // Use demo photos if no image_url exists, or combine them
  const getPhotoUrls = () => {
    if (requestDetails?.image_url) {
      return [requestDetails.image_url, ...demoPhotos];
    }
    return demoPhotos;
  };

  const photoUrls = requestDetails ? getPhotoUrls() : [];

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      const { data: requestData, error: requestError } = await supabase
        .from("service_requests")
        .select(`
          vehicle_make,
          model,
          year,
          trim,
          mileage,
          zip,
          address,
          description,
          service_category,
          customer_id,
          category_id,
          image_url,
          notes
        `)
        .eq("id", requestId)
        .maybeSingle();

      if (requestError) throw requestError;
      
      if (!requestData) {
        throw new Error("Request not found");
      }

      // Fetch customer name
      const { data: customerData } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", requestData.customer_id)
        .maybeSingle();

      // Fetch service category name
      const { data: categoryData } = await supabase
        .from("service_categories")
        .select("name")
        .eq("id", requestData.category_id)
        .maybeSingle();

      setRequestDetails({
        ...requestData,
        profiles: { name: customerData?.name || "Customer" },
        service_categories: { name: categoryData?.name || "Service" }
      });
    } catch (error) {
      console.error("Error fetching request details:", error);
      toast({
        title: "Error",
        description: "Failed to load request details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate input
      const priceNum = parseFloat(estimatedPrice);
      const validation = quoteSchema.safeParse({
        estimated_price: priceNum,
        description,
        notes: notes || undefined
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert quote directly
      const { data: newQuote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          request_id: requestId,
          pro_id: user.id,
          estimated_price: validation.data.estimated_price,
          description: validation.data.description,
          notes: validation.data.notes,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Send email notification to customer
      try {
        const { error: emailError } = await supabase.functions.invoke('send-quote-email', {
          body: { quoteId: newQuote.id }
        });
        
        if (emailError) {
          console.error('Email notification error:', emailError);
          // Don't fail the quote submission if email fails
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      toast({
        title: "Success",
        description: "Quote submitted successfully!",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting quote:", error);
      toast({
        title: "Error",
        description: "Failed to submit quote",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-3 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!requestDetails) {
    return <div className="text-center py-3 text-sm text-destructive">Failed to load details</div>;
  }

  // Get specific service name (prioritize description, then service_category codes, finally category name)
  const getServiceDisplayName = () => {
    // First, check if customer provided a custom description
    if (requestDetails.description && requestDetails.description.trim()) {
      return requestDetails.description;
    }
    
    // Second, try to map service codes to actual service names
    if (requestDetails.service_category && requestDetails.service_category.length > 0) {
      const mappedNames = getServiceNames(requestDetails.service_category);
      if (mappedNames) {
        return mappedNames;
      }
    }
    
    // Finally, fallback to generic category name
    return requestDetails.service_categories?.name || "Service Request";
  };

  const serviceName = getServiceDisplayName();
  const vehicleInfo = `${requestDetails.year} ${requestDetails.vehicle_make} ${requestDetails.model}`;
  const mileageInfo = requestDetails.mileage ? `${requestDetails.mileage.toLocaleString()} miles` : "";
  const location = requestDetails.address?.split(",").slice(-2).join(",").trim() || `ZIP ${requestDetails.zip}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
      {/* Left Panel: Job Summary */}
      <div className="lg:pr-4 lg:border-r border-border">
        <JobSummaryPanel
          serviceName={serviceName}
          vehicleInfo={vehicleInfo}
          mileageInfo={mileageInfo}
          location={location}
          photoUrls={photoUrls}
          customerNotes={requestDetails.notes}
          serviceDescription={requestDetails.description}
        />
      </div>

      {/* Right Panel: Quote Form */}
      <div className="lg:pl-2">
        <QuoteFormFields
          estimatedPrice={estimatedPrice}
          setEstimatedPrice={setEstimatedPrice}
          description={description}
          setDescription={setDescription}
          notes={notes}
          setNotes={setNotes}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onRequestPhotos={() => setShowPhotoRequestDialog(true)}
        />
      </div>

      {/* Request More Photos Confirmation Dialog */}
      <AlertDialog open={showPhotoRequestDialog} onOpenChange={setShowPhotoRequestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request More Photos</AlertDialogTitle>
            <AlertDialogDescription>
              We'll notify the customer to upload more photos of the damaged area. 
              This will help you provide a more accurate quote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestMorePhotos}>
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
