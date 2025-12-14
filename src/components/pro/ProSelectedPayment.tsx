import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export function ProSelectedPayment() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pending Payments
        </CardTitle>
        <CardDescription>
          Pay referral fees for accepted quotes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p>Payment feature requires database setup.</p>
          <p className="text-sm mt-2">The referral_fees table needs to be created.</p>
        </div>
      </CardContent>
    </Card>
  );
}