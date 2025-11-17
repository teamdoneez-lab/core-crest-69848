import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VerifyReferralPaymentSchema = z.object({
  session_id: z.string()
    .min(1, "Session ID is required")
    .startsWith("cs_", "Invalid Stripe session ID format"),
  request_id: z.string().uuid("Invalid request ID format")
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();
    const validation = VerifyReferralPaymentSchema.safeParse(body);

    if (!validation.success) {
      console.error("[VERIFY-PAYMENT] Validation error:", validation.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { session_id, request_id } = validation.data;
    console.log("[VERIFY-PAYMENT] Verifying session:", session_id, "for request:", request_id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      console.log("[VERIFY-PAYMENT] Payment not completed yet");
      return new Response(JSON.stringify({ 
        success: true, 
        paid: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("[VERIFY-PAYMENT] Payment confirmed, updating database");

    const quote_id = session.metadata?.quote_id;
    const pro_id = session.metadata?.pro_id;

    if (!quote_id || !pro_id) {
      throw new Error("Missing quote_id or pro_id in session metadata");
    }

    // Update referral fee as paid
    const { error: feeError } = await supabaseClient
      .from('referral_fees')
      .update({ 
        payment_status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string
      })
      .eq('quote_id', quote_id);

    if (feeError) {
      console.error("[VERIFY-PAYMENT] Failed to update referral fee:", feeError);
      throw new Error(`Failed to update referral fee: ${feeError.message}`);
    }

    console.log("[VERIFY-PAYMENT] Referral fee marked as paid");

    // Update quote status to confirmed
    const { error: quoteError } = await supabaseClient
      .from('quotes')
      .update({ status: 'confirmed' })
      .eq('id', quote_id);

    if (quoteError) {
      console.error("[VERIFY-PAYMENT] Failed to update quote:", quoteError);
      throw new Error(`Failed to update quote: ${quoteError.message}`);
    }

    console.log("[VERIFY-PAYMENT] Quote confirmed");

    // Update service request status to confirmed
    const { error: requestError } = await supabaseClient
      .from('service_requests')
      .update({ status: 'confirmed' })
      .eq('id', request_id);

    if (requestError) {
      console.error("[VERIFY-PAYMENT] Failed to update service request:", requestError);
      throw new Error(`Failed to update service request: ${requestError.message}`);
    }

    console.log("[VERIFY-PAYMENT] Service request confirmed");

    // Update appointment status to confirmed
    const { error: appointmentError } = await supabaseClient
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('request_id', request_id);

    if (appointmentError) {
      console.error("[VERIFY-PAYMENT] Failed to update appointment:", appointmentError);
      throw new Error(`Failed to update appointment: ${appointmentError.message}`);
    }

    console.log("[VERIFY-PAYMENT] Appointment confirmed");

    // Send email notification to customer (non-blocking)
    supabaseClient.functions.invoke('send-appointment-confirmed', {
      body: { request_id, quote_id, pro_id }
    }).then(() => {
      console.log("[VERIFY-PAYMENT] Customer notification sent");
    }).catch((emailError) => {
      console.error("[VERIFY-PAYMENT] Failed to send customer email:", emailError);
    });

    return new Response(JSON.stringify({
      success: true, 
      paid: true,
      appointment_confirmed: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[VERIFY-PAYMENT] ERROR:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
