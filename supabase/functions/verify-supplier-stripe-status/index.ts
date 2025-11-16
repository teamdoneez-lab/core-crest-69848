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
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client with auth token for RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      throw new Error("User not authenticated");
    }

    console.log("Verifying Stripe status for user:", user.id);

    // Get supplier record
    const { data: supplier, error: supplierError } = await supabaseClient
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (supplierError) {
      console.error("Error fetching supplier:", supplierError);
      throw new Error(`Database error: ${supplierError.message}`);
    }

    if (!supplier) {
      console.error("No supplier record found for user:", user.id);
      throw new Error("Supplier record not found");
    }

    console.log("Checking Stripe status for supplier:", supplier.id);

    if (!supplier.stripe_connect_account_id) {
      return new Response(JSON.stringify({ onboarding_complete: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check Stripe account status
    const account = await stripe.accounts.retrieve(supplier.stripe_connect_account_id);
    
    const isComplete = account.details_submitted === true;

    // Update supplier record if onboarding is complete
    if (isComplete && !supplier.stripe_onboarding_complete) {
      await supabaseClient
        .from('suppliers')
        .update({ stripe_onboarding_complete: true })
        .eq('id', supplier.id);
    }

    return new Response(
      JSON.stringify({ 
        onboarding_complete: isComplete,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error verifying Stripe status:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to verify Stripe status";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
