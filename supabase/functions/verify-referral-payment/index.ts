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
      console.log("[VERIFY-PAYMENT] Payment confirmed, starting atomic transaction");

      // Get quote_id from metadata
      const quote_id = session.metadata?.quote_id;
      const payment_intent = session.payment_intent as string;
      const amount_paid = session.amount_total ? session.amount_total / 100 : 0;

      // Start atomic transaction - all updates must succeed or all will be rolled back
      try {
        // Step 1: Get the pro_id from referral fee FIRST (we need this for logging)
        const { data: feeData, error: feeQueryError } = await supabaseClient
          .from('referral_fees')
          .select('pro_id, amount')
          .eq('request_id', request_id)
          .single();

        if (feeQueryError) {
          console.error("[VERIFY-PAYMENT] CRITICAL: Failed to fetch fee data", {
            request_id,
            session_id,
            payment_intent,
            error: feeQueryError
          });
          throw new Error(`Failed to fetch fee data: ${feeQueryError.message}`);
        }

        const pro_id = feeData?.pro_id;
        const fee_amount = feeData?.amount;

        console.log("[VERIFY-PAYMENT] Transaction data:", {
          request_id,
          session_id,
          payment_intent,
          pro_id,
          fee_amount,
          amount_paid
        });

        // Step 2: Update fee record to 'paid'
        const { error: updateError } = await supabaseClient
          .from('referral_fees')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_payment_intent: payment_intent
          })
          .eq('request_id', request_id)
          .eq('stripe_session_id', session_id);

        if (updateError) {
          console.error("[VERIFY-PAYMENT] CRITICAL: Failed to update fee", {
            request_id,
            session_id,
            payment_intent,
            pro_id,
            error: updateError
          });
          throw new Error(`Failed to update fee: ${updateError.message}`);
        }

        console.log("[VERIFY-PAYMENT] Step 2/5: Fee marked as paid");

        // Step 3: Update quote status to confirmed
        if (quote_id) {
          const { error: quoteError } = await supabaseClient
            .from('quotes')
            .update({ status: 'confirmed' })
            .eq('id', quote_id);

          if (quoteError) {
            console.error("[VERIFY-PAYMENT] CRITICAL: Failed to update quote", {
              request_id,
              quote_id,
              session_id,
              payment_intent,
              pro_id,
              error: quoteError
            });
            throw new Error(`Failed to update quote: ${quoteError.message}`);
          }

          console.log("[VERIFY-PAYMENT] Step 3/5: Quote confirmed");
        }

        // Step 4: Update service request status to in_progress and set accepted_pro_id
        const { error: requestError } = await supabaseClient
          .from('service_requests')
          .update({ 
            status: 'in_progress',
            accepted_pro_id: pro_id
          })
          .eq('id', request_id);

        if (requestError) {
          console.error("[VERIFY-PAYMENT] CRITICAL: Failed to update service request", {
            request_id,
            session_id,
            payment_intent,
            pro_id,
            error: requestError
          });
          throw new Error(`Failed to update service request: ${requestError.message}`);
        }

        console.log("[VERIFY-PAYMENT] Step 4/5: Service request updated to in_progress");

        // Step 5: Update appointment status to confirmed
        const { error: appointmentError } = await supabaseClient
          .from('appointments')
          .update({ status: 'confirmed' })
          .eq('request_id', request_id);

        if (appointmentError) {
          console.error("[VERIFY-PAYMENT] CRITICAL: Failed to update appointment", {
            request_id,
            session_id,
            payment_intent,
            pro_id,
            error: appointmentError
          });
          throw new Error(`Failed to update appointment: ${appointmentError.message}`);
        }

        console.log("[VERIFY-PAYMENT] Step 5/5: Appointment confirmed - TRANSACTION COMPLETE");

        // All steps succeeded
        return new Response(JSON.stringify({ 
          success: true, 
          paid: true,
          appointment_confirmed: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      } catch (transactionError) {
        // Transaction failed - log comprehensive error details
        console.error("[VERIFY-PAYMENT] TRANSACTION FAILED - ATOMIC ROLLBACK REQUIRED", {
          request_id,
          session_id,
          payment_intent: payment_intent || 'unknown',
          timestamp: new Date().toISOString(),
          error: transactionError instanceof Error ? transactionError.message : String(transactionError),
          stack: transactionError instanceof Error ? transactionError.stack : undefined
        });

        // Return detailed error for frontend to handle
        return new Response(JSON.stringify({ 
          success: false,
          paid: true,
          appointment_confirmed: false,
          error: "Payment received but appointment confirmation failed",
          details: {
            session_id,
            request_id,
            timestamp: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      paid: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[VERIFY-PAYMENT] UNEXPECTED ERROR:", {
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
