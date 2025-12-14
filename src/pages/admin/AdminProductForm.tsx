import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { RoleGuard } from "@/components/RoleGuard";

export default function AdminProductForm() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Product Form</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Product form coming soon. Database tables need to be configured.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
