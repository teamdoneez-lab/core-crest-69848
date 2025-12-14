import { Card, CardContent } from "@/components/ui/card";

interface JobSummaryPanelProps {
  serviceName: string;
  vehicleInfo: string;
  mileageInfo: string;
  location: string;
  photoUrls: string[];
  customerNotes?: string;
  serviceDescription?: string;
}

export function JobSummaryPanel(props: JobSummaryPanelProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm">Job summary coming soon.</p>
      </CardContent>
    </Card>
  );
}

export default JobSummaryPanel;
