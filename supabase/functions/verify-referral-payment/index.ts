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
        console.log("[VERIFY-PAYMENT] Payment confirmed, starting updates");

        // Update service request and appointment statuses
        await supabaseClient
          .from('service_requests')
          .update({ status: 'confirmed' })
          .eq('id', request_id);

        await supabaseClient
          .from('appointments')
          .update({ status: 'confirmed' })
          .eq('request_id', request_id);

        await supabaseClient
          .from('quotes')
          .update({ status: 'confirmed' })
          .eq('id', quote_id);

        console.log("[VERIFY-PAYMENT] All statuses updated successfully");

        // Send notification to customer
        try {
          await supabaseClient.functions.invoke('send-customer-appointment-confirmed', {
            body: { request_id }
          });
          console.log("[VERIFY-PAYMENT] Customer notification sent");
        } catch (emailError) {
          console.error("[VERIFY-PAYMENT] Failed to send customer email:", emailError);
          // Don't fail the payment verification if email fails
        }
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

        // Step 3: Update quote status to confirmed
        const { error: quoteError } = await supabaseClient
          .from('quotes')
          .update({ status: 'confirmed' })
          .eq('id', quote_id);

        if (quoteError) {
          console.error("[VERIFY-PAYMENT] CRITICAL: Failed to update quote", {
            request_id,
            session_id,
            payment_intent,
            error: quoteError
          });
          throw new Error(`Failed to update quote: ${quoteError.message}`);
        }

        console.log("[VERIFY-PAYMENT] Step 3/5: Quote confirmed");

        // Step 4: Update service request status to confirmed and set accepted_pro_id
        const { error: requestError } = await supabaseClient
          .from('service_requests')
          .update({ 
            status: 'confirmed',
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

        console.log("[VERIFY-PAYMENT] Step 4/5: Service request updated to confirmed");

        // Step 5: Update or create appointment with confirmed status
        const { error: appointmentError } = await supabaseClient
          .from('appointments')
          .upsert({ 
            request_id,
            pro_id,
            starts_at: new Date().toISOString(),
            status: 'confirmed'
          }, {
            onConflict: 'request_id'
          });

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

        // Send notification to customer (TODO: implement email)
        console.log("[VERIFY-PAYMENT] Customer notification should be sent for request:", request_id);

        // All steps succeeded
        return new Response(JSON.stringify({ 
          success: true, 
          paid: true,
          appointment_confirmed: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

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
