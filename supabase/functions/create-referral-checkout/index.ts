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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("Not authenticated");
    }

    const { quote_id } = await req.json();

    if (!quote_id) {
      throw new Error("Missing quote_id");
    }

    console.log("[REFERRAL-CHECKOUT] Processing quote:", quote_id);

    // Get the quote details first
    const { data: quote, error: quoteError } = await supabaseClient
      .from("quotes")
      .select("*, service_requests(id)")
      .eq("id", quote_id)
      .single();

    if (quoteError || !quote) {
      throw new Error("Quote not found");
    }

    // Get or create the referral fee for this quote
    let { data: referralFee, error: feeError } = await supabaseClient
      .from("referral_fees")
      .select("*")
      .eq("quote_id", quote_id)
      .eq("pro_id", user.id)
      .single();

    // If referral fee doesn't exist, create it (fallback in case trigger didn't run)
    if (feeError || !referralFee) {
      console.log("[REFERRAL-CHECKOUT] Referral fee not found, creating it...");
      
      const { data: newFee, error: createError } = await supabaseAdmin
        .from("referral_fees")
        .insert({
          quote_id,
          pro_id: user.id,
          request_id: quote.request_id,
          amount: quote.estimated_price * 0.10,
          status: "owed",
        })
        .select()
        .single();

      if (createError || !newFee) {
        console.error("[REFERRAL-CHECKOUT] Failed to create referral fee:", createError);
        throw new Error("Failed to create referral fee");
      }

      referralFee = newFee;
    }

    if (referralFee.status === "paid") {
      throw new Error("Referral fee already paid");
    }

    console.log("[REFERRAL-CHECKOUT] Fee amount:", referralFee.amount);

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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Job Referral Fee",
              description: "Fee for accepting this job",
            },
            unit_amount: Math.round(referralFee.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/pro-inbox?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pro-inbox?payment=cancelled`,
      metadata: {
        quote_id,
        referral_fee_id: referralFee.id,
        pro_id: user.id,
      },
    });

    console.log("[REFERRAL-CHECKOUT] Session created:", session.id);

    // Update referral fee record with session ID
    const { error: updateError } = await supabaseAdmin
      .from("referral_fees")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", referralFee.id);

    if (updateError) {
      throw new Error("Failed to update referral fee record");
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[REFERRAL-CHECKOUT] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
