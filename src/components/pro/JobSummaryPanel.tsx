import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Car, MapPin, Wrench, X, ZoomIn } from "lucide-react";

interface JobSummaryPanelProps {
  serviceName: string;
  vehicleInfo: string;
  mileageInfo: string;
  location: string;
  photoUrls: string[];
  customerNotes?: string;
  serviceDescription?: string;
}

export function JobSummaryPanel({
  serviceName,
  vehicleInfo,
  mileageInfo,
  location,
  photoUrls,
  customerNotes,
  serviceDescription
}: JobSummaryPanelProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Service Header */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight text-foreground">
              {serviceName}
            </h3>
            <Badge variant="outline" className="mt-1.5 text-xs">
              Quote Request
            </Badge>
          </div>
        </div>
      </div>

      {/* Vehicle & Location Info */}
      <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-start gap-2">
          <Car className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {vehicleInfo}
            </p>
            {mileageInfo && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {mileageInfo}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              {location}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Notes */}
      {(customerNotes || serviceDescription) && (
        <div className="p-3 rounded-lg bg-accent/30 border border-border/50">
          <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Customer Notes
          </h4>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {serviceDescription || customerNotes}
          </p>
        </div>
      )}

      {/* Photos Grid */}
      {photoUrls.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Photos ({photoUrls.length})
            </h4>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.slice(0, 6).map((url, index) => (
              <div
                key={index}
                className="group relative aspect-square rounded-md overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => setLightboxImage(url)}
              >
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
          {photoUrls.length > 6 && (
            <p className="text-xs text-muted-foreground mt-2">
              +{photoUrls.length - 6} more photos
            </p>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-0">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={lightboxImage}
              alt="Full size preview"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
