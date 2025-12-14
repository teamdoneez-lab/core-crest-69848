import { Card, CardContent } from "@/components/ui/card";

interface GuidedServiceSelectionProps {
  onComplete: (selectedServices: string[], descriptions: string) => void;
  isWalkIn?: boolean;
}

export function GuidedServiceSelection({ onComplete, isWalkIn }: GuidedServiceSelectionProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm">Service selection coming soon.</p>
      </CardContent>
    </Card>
  );
}

export default GuidedServiceSelection;
