import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DollarSign, Info, Plus, Camera } from "lucide-react";

interface QuoteFormFieldsProps {
  estimatedPrice: string;
  setEstimatedPrice: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onRequestPhotos: () => void;
}

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

export function QuoteFormFields({
  estimatedPrice,
  setEstimatedPrice,
  description,
  setDescription,
  notes,
  setNotes,
  isSubmitting,
  onSubmit,
  onRequestPhotos
}: QuoteFormFieldsProps) {
  const [showNotes, setShowNotes] = useState(false);

  const priceNum = parseFloat(estimatedPrice) || 0;
  const referralFee = calculateReferralFee(priceNum);
  const feePercentage = getFeePercentage(priceNum);
  const youReceive = priceNum - referralFee;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Estimated Price */}
      <div className="space-y-2">
        <Label htmlFor="estimatedPrice" className="text-sm font-medium">
          Total Quote Amount
        </Label>
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
            className="pl-10 h-11 text-base"
          />
        </div>
        
        {/* Fee Preview */}
        {priceNum > 0 && (
          <div className="flex items-center justify-between text-xs bg-primary/5 rounded-md px-3 py-2.5 border border-primary/10">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">
                Platform Fee ({feePercentage}%):
              </span>
              <span className="font-semibold text-foreground">
                ${referralFee.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">You receive:</span>
              <span className="font-bold text-primary text-sm">
                ${youReceive.toFixed(2)}
              </span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                  <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" side="top">
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs">Fee Structure</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Under $1,000</span>
                      <span className="font-medium">5% (min $5)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">$1,000 – $4,999</span>
                      <span className="font-medium">3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">$5,000 – $9,999</span>
                      <span className="font-medium">2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">$10,000+</span>
                      <span className="font-medium">1%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1 border-t">
                    Fee applies only after customer confirms appointment.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Service Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Service Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the work to be performed, parts needed, labor time..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="resize-none text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Be specific about parts, labor, and timeline
        </p>
      </div>

      {/* Additional Notes (Collapsible) */}
      <Collapsible open={showNotes} onOpenChange={setShowNotes}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
          >
            <Plus className={`h-3 w-3 mr-1 transition-transform ${showNotes ? "rotate-45" : ""}`} />
            {showNotes ? "Hide" : "Add"} Additional Notes
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Additional Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="Any warranty info, special considerations, or additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onRequestPhotos}
          className="w-full"
        >
          <Camera className="h-4 w-4 mr-2" />
          Request More Photos
        </Button>
        
        <Button type="submit" disabled={isSubmitting} className="w-full h-11">
          {isSubmitting ? "Submitting Quote..." : "Submit Quote"}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Customer will be notified via email
        </p>
      </div>
    </form>
  );
}
