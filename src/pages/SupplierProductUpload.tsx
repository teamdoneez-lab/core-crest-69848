import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";

export default function SupplierProductUpload() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Product upload feature coming soon. Database tables need to be configured.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
