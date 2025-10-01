import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    console.log("[REFERRAL-CHECKOUT] User authenticated:", user.id);

    // Get request data
    const { request_id, lead_id } = await req.json();
    if (!request_id || !lead_id) {
      throw new Error("Missing request_id or lead_id");
    }

    console.log("[REFERRAL-CHECKOUT] Processing request:", request_id);

    // Get platform settings for fee amount
    const { data: feeSettings } = await supabaseClient
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'referral_fee_value')
      .single();

    const feeAmount = feeSettings?.setting_value || 25.00;
    console.log("[REFERRAL-CHECKOUT] Fee amount:", feeAmount);

    // Check if fee record already exists
    const { data: existingFee } = await supabaseClient
      .from('referral_fees')
      .select('id, status')
      .eq('request_id', request_id)
      .eq('pro_id', user.id)
      .single();

    if (existingFee && existingFee.status === 'paid') {
      throw new Error("Fee already paid for this request");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    console.log("[REFERRAL-CHECKOUT] Creating checkout session");

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: "price_1SDZlARoOODDClgY3yZbb6yt",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/pro-inbox?payment=success&request_id=${request_id}`,
      cancel_url: `${req.headers.get("origin")}/pro-inbox?payment=canceled`,
      metadata: {
        pro_id: user.id,
        request_id: request_id,
        lead_id: lead_id,
        type: 'referral_fee'
      },
    });

    console.log("[REFERRAL-CHECKOUT] Session created:", session.id);

    // Create or update referral fee record
    if (existingFee) {
      await supabaseClient
        .from('referral_fees')
        .update({ 
          stripe_session_id: session.id,
          status: 'owed'
        })
        .eq('id', existingFee.id);
    } else {
      await supabaseClient
        .from('referral_fees')
        .insert({
          pro_id: user.id,
          request_id: request_id,
          amount: feeAmount,
          status: 'owed',
          stripe_session_id: session.id
        });
    }

    console.log("[REFERRAL-CHECKOUT] Fee record created/updated");

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[REFERRAL-CHECKOUT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
