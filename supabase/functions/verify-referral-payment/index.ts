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
  // Handle CORS preflight
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

    console.log("[VERIFY-PAYMENT] Verifying session:", session_id);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      console.log("[VERIFY-PAYMENT] Payment confirmed, updating fee record");

      // Get quote_id from metadata
      const quote_id = session.metadata?.quote_id;

      // Update fee record
      const { error: updateError } = await supabaseClient
        .from('referral_fees')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent: session.payment_intent as string
        })
        .eq('request_id', request_id)
        .eq('stripe_session_id', session_id);

      if (updateError) {
        console.error("[VERIFY-PAYMENT] Error updating fee:", updateError);
        throw updateError;
      }

      console.log("[VERIFY-PAYMENT] Fee marked as paid");

      // Update quote status to confirmed
      if (quote_id) {
        const { error: quoteError } = await supabaseClient
          .from('quotes')
          .update({ status: 'confirmed' })
          .eq('id', quote_id);

        if (quoteError) {
          console.error("[VERIFY-PAYMENT] Error updating quote:", quoteError);
        }
      }

      // Get the pro_id from the quote or referral fee
      const { data: feeData } = await supabaseClient
        .from('referral_fees')
        .select('pro_id')
        .eq('request_id', request_id)
        .single();

      // Update service request status to in_progress and set accepted_pro_id
      const { error: requestError } = await supabaseClient
        .from('service_requests')
        .update({ 
          status: 'in_progress',
          accepted_pro_id: feeData?.pro_id || null
        })
        .eq('id', request_id);

      if (requestError) {
        console.error("[VERIFY-PAYMENT] Error updating request:", requestError);
      }

      // Update appointment status to confirmed
      const { error: appointmentError } = await supabaseClient
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('request_id', request_id);

      if (appointmentError) {
        console.error("[VERIFY-PAYMENT] Error updating appointment:", appointmentError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        paid: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      paid: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[VERIFY-PAYMENT] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
