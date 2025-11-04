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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Get supplier record
    const { data: supplier, error: supplierError } = await supabaseClient
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      throw new Error("Supplier not found");
    }

    if (supplier.status !== 'approved') {
      throw new Error("Supplier account must be approved before setting up Stripe");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let accountId = supplier.stripe_connect_account_id;

    // Create Stripe Connect account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: supplier.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'company',
        company: {
          name: supplier.business_name,
        },
      });

      accountId = account.id;

      // Update supplier with Stripe account ID
      await supabaseClient
        .from('suppliers')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', supplier.id);
    }

    // Create account link for onboarding
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/supplier-dashboard?stripe_refresh=true`,
      return_url: `${origin}/supplier-dashboard?stripe_success=true`,
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create Stripe Connect account" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
