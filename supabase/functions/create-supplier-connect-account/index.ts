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

    console.log("Looking up supplier for user:", user.id);

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
      throw new Error("Supplier record not found. Please complete supplier application first.");
    }

    console.log("Found supplier:", supplier.id, "Status:", supplier.status);

    if (supplier.status !== 'approved') {
      throw new Error("Supplier account must be approved before setting up Stripe");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // FORCE FRESH EXPRESS ACCOUNT CREATION
    // Delete any existing stripe_account_id to ensure we create a new Express account
    if (supplier.stripe_connect_account_id) {
      console.log("Removing old Stripe account ID:", supplier.stripe_connect_account_id);
      await supabaseClient
        .from('suppliers')
        .update({ stripe_connect_account_id: null, stripe_onboarding_complete: false })
        .eq('id', supplier.id);
    }

    // Create NEW Stripe Express account (minimal required fields only)
    console.log("Creating NEW Express account for supplier:", supplier.email);
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: supplier.email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    console.log("✅ STRIPE ACCOUNT CREATED - TYPE:", account.type, "ID:", account.id);

    // Save the new Express account ID
    await supabaseClient
      .from('suppliers')
      .update({ stripe_connect_account_id: account.id })
      .eq('id', supplier.id);

    // Create Express account onboarding link
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/supplier/stripe/refresh`,
      return_url: `${origin}/supplier/stripe/complete`,
      type: "account_onboarding",
    });

    console.log("✅ EXPRESS ONBOARDING LINK CREATED:", accountLink.url);

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create Stripe Connect account";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
