import { Card, CardContent } from "@/components/ui/card";

interface QuotesSectionProps {
  requestId: string;
  initialOpen?: boolean;
}

export function QuotesSection({ requestId, initialOpen = true }: QuotesSectionProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm">Quotes feature coming soon.</p>
      </CardContent>
    </Card>
  );
}

export default QuotesSection;
