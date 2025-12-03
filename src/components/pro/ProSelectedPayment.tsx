import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function ProSelectedPayment() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Processing</CardTitle>
      </CardHeader>
      <CardContent className="py-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Payment functionality requires additional database setup.
        </p>
        <p className="text-xs text-muted-foreground">
          The referral_fees and quotes tables need to be created.
        </p>
      </CardContent>
    </Card>
  );
}
