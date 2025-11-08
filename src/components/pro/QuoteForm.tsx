import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { DollarSign, Info, Plus } from "lucide-react";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getServiceNames } from "@/utils/serviceCodeLookup";

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
  service_categories: {
    name: string;
  };
  profiles: {
    name: string;
  };
}

// Calculate referral fee based on tiered pricing
const calculateReferralFee = (jobTotal: number): number => {
  if (jobTotal < 1000) {
    return Math.max(5.00, jobTotal * 0.05);
  } else if (jobTotal < 5000) {
    return jobTotal * 0.03;
  } else if (jobTotal < 10000) {
    return jobTotal * 0.02;
  } else {
    return jobTotal * 0.01;
  }
};

const getFeePercentage = (jobTotal: number): number => {
  if (jobTotal < 1000) return 5;
  if (jobTotal < 5000) return 3;
  if (jobTotal < 10000) return 2;
  return 1;
};

export function QuoteForm({ requestId, onSuccess }: QuoteFormProps) {
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestDetails, setRequestDetails] = useState<ServiceRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

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
          category_id
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

  const priceNum = parseFloat(estimatedPrice) || 0;
  const referralFee = calculateReferralFee(priceNum);
  const feePercentage = getFeePercentage(priceNum);
  const youReceive = priceNum - referralFee;

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
  const mileageInfo = requestDetails.mileage ? ` – ${requestDetails.mileage.toLocaleString()} miles` : "";
  const cityState = requestDetails.address?.split(",").slice(-2).join(",").trim() || `ZIP ${requestDetails.zip}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Compact Service Context */}
      <div className="bg-muted/30 rounded-md p-3 space-y-1">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {serviceName}
        </p>
        <p className="text-xs text-muted-foreground">
          {vehicleInfo}{mileageInfo}
        </p>
        <p className="text-xs text-muted-foreground">
          {cityState}
        </p>
      </div>

      {/* Estimated Price */}
      <div className="space-y-1.5">
        <Label htmlFor="estimatedPrice" className="text-sm">Estimated Price ($)</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="estimatedPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={estimatedPrice}
            onChange={(e) => setEstimatedPrice(e.target.value)}
            required
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your total for labor and parts.
        </p>
        
        {/* Inline Referral Fee Preview */}
        {priceNum > 0 && (
          <div className="flex items-center justify-between text-xs bg-accent/50 rounded px-3 py-2 mt-2">
            <span className="text-muted-foreground">
              💰 Fee: ~${referralFee.toFixed(2)} ({feePercentage}%)
            </span>
            <span className="font-semibold text-primary">
              You get ~${youReceive.toFixed(2)}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 ml-2 text-xs text-primary hover:underline">
                  <Info className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" side="top">
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs">Referral Fee Tiers</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Under $1,000</span>
                      <span className="font-medium">5% (min $5)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">$1,000–$4,999</span>
                      <span className="font-medium">3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">$5,000–$9,999</span>
                      <span className="font-medium">2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">$10,000+</span>
                      <span className="font-medium">1%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1 border-t">
                    Fee applies only if appointment confirmed.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Service Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-sm">Service Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the work to be performed..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Collapsible Additional Notes */}
      <Collapsible open={showNotes} onOpenChange={setShowNotes}>
        <CollapsibleTrigger asChild>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
          >
            <Plus className={`h-3 w-3 mr-1 transition-transform ${showNotes ? "rotate-45" : ""}`} />
            {showNotes ? "Hide" : "Add"} Notes
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1.5 pt-2">
          <Label htmlFor="notes" className="text-sm">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional information..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Submit Button */}
      <div className="space-y-1.5 pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit Quote"}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Customer will be notified once sent.
        </p>
      </div>
    </form>
  );
}
