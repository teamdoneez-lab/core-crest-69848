import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { useRole } from "@/hooks/useRole";

export default function CustomerProfile() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Customer Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Customer profile feature coming soon. Database tables need to be configured.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
