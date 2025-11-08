import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { DollarSign, Info } from "lucide-react";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

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
  zip: string;
  address: string;
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
          zip,
          address,
          customer_id,
          category_id
        `)
        .eq("id", requestId)
        .single();

      if (requestError) throw requestError;

      // Fetch customer name
      const { data: customerData } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", requestData.customer_id)
        .single();

      // Fetch service category name
      const { data: categoryData } = await supabase
        .from("service_categories")
        .select("name")
        .eq("id", requestData.category_id)
        .single();

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
    return <div className="text-center py-4 text-muted-foreground">Loading request details...</div>;
  }

  if (!requestDetails) {
    return <div className="text-center py-4 text-destructive">Failed to load request details</div>;
  }

  const customerFirstName = requestDetails.profiles?.name?.split(" ")[0] || "Customer";
  const serviceName = requestDetails.service_categories?.name || "Service Request";
  const vehicleInfo = `${requestDetails.year} ${requestDetails.vehicle_make} ${requestDetails.model}${requestDetails.trim ? ` ${requestDetails.trim}` : ""}`;
  const location = requestDetails.address || `ZIP: ${requestDetails.zip}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Context Section */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
          <span className="font-semibold text-foreground">Customer:</span>
          <span className="text-muted-foreground">{customerFirstName}</span>
          
          <span className="font-semibold text-foreground">Service Request:</span>
          <span className="text-muted-foreground">{serviceName}</span>
          
          <span className="font-semibold text-foreground">Vehicle:</span>
          <span className="text-muted-foreground">{vehicleInfo}</span>
          
          <span className="font-semibold text-foreground">Location:</span>
          <span className="text-muted-foreground">{location}</span>
        </div>
      </div>

      <Separator />

      {/* Estimated Price */}
      <div className="space-y-2">
        <Label htmlFor="estimatedPrice">Estimated Price ($)</Label>
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
          Enter your estimated total for labor and parts.
        </p>
        
        {/* Dynamic Referral Fee Preview */}
        {priceNum > 0 && (
          <div className="bg-accent/50 rounded-md p-3 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">💰 Referral Fee:</span>
              <span className="font-semibold">~${referralFee.toFixed(2)} ({feePercentage}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">You'll receive:</span>
              <span className="font-semibold text-primary">~${youReceive.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              (Rounded for clarity. Fee applies only if appointment confirmed.)
            </p>
            
            {/* View Fee Tiers Popover */}
            <div className="pt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:underline">
                    <Info className="h-3 w-3 mr-1" />
                    View Fee Tiers
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Referral Fee Structure</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm font-medium border-b pb-2">
                        <span>Job Total</span>
                        <span>Fee</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Under $1,000</span>
                        <span>5% (min $5)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">$1,000–$4,999</span>
                        <span>3%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">$5,000–$9,999</span>
                        <span>2%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">$10,000+</span>
                        <span>1%</span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* Service Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Service Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the work to be performed..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional information..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="space-y-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit Quote"}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Customer will be notified once your quote is sent.
        </p>
      </div>
    </form>
  );
}
