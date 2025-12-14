import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface QuotesListProps {
  requestId: string;
}

export const QuotesList = ({ requestId }: QuotesListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Quotes
        </CardTitle>
        <CardDescription>
          Quotes from professionals for this service request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p>Quotes feature requires database setup.</p>
          <p className="text-sm mt-2">The quotes table needs to be created.</p>
        </div>
      </CardContent>
    </Card>
  );
};