import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";

export default function ProMarketplace() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Pro Marketplace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Marketplace feature coming soon. Database tables need to be configured.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
