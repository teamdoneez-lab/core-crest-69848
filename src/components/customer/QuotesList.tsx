import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface QuotesListProps {
  requestId: string;
}

export const QuotesList = ({ requestId }: QuotesListProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quotes</CardTitle>
      </CardHeader>
      <CardContent className="py-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Quotes functionality requires additional database setup.
        </p>
        <p className="text-xs text-muted-foreground">
          Request ID: {requestId}
        </p>
      </CardContent>
    </Card>
  );
};
