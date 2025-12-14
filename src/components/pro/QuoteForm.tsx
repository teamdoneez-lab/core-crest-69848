import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface QuoteFormProps {
  requestId: string;
  onSuccess: () => void;
}

export function QuoteForm({ requestId, onSuccess }: QuoteFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submit Quote
        </CardTitle>
        <CardDescription>
          Create a quote for this service request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p>Quote form requires database setup.</p>
          <p className="text-sm mt-2">The quotes and service_requests tables need to be created.</p>
        </div>
      </CardContent>
    </Card>
  );
}