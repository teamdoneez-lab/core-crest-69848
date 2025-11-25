import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated");

    // Lookup supplier
    const { data: supplier, error: supplierError } =
      await supabase.from("suppliers").select("*").eq("user_id", user.id).maybeSingle();

    if (supplierError) throw new Error(supplierError.message);
    if (!supplier) throw new Error("Supplier record not found");
    if (supplier.status !== "approved") throw new Error("Supplier must be approved first");

    // Stripe
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-06-20",
    });

    let accountId = supplier.stripe_connect_account_id;

    // Create STANDARD connect account
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        country: "US",
        email: supplier.email,
        business_type: "company",
        company: {
          name: supplier.business_name,
        },
      });

      accountId = account.id;

      await supabase
        .from("suppliers")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", supplier.id);
    }

    // Create onboarding link
    const origin = req.headers.get("origin") || "https://www.doneez.com";

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${origin}/supplier-dashboard?stripe_refresh=true`,
      return_url: `${origin}/supplier-dashboard?stripe_success=true`,
    });

    return new Response(JSON.stringify({ url: link.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Stripe Setup Error:", err);
    return new Response(JSON.stringify({ error: `${err}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
