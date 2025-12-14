import { Card, CardContent } from "@/components/ui/card";

interface AppointmentCancellationProps {
  appointmentId: string;
  requestId: string;
  onCancelled?: () => void;
}

export function AppointmentCancellation({ onCancelled }: AppointmentCancellationProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm">Cancellation feature coming soon.</p>
      </CardContent>
    </Card>
  );
}

export default AppointmentCancellation;
