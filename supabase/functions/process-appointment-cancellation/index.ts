import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CancellationSchema = z.object({
  appointment_id: z.string().uuid("Invalid appointment ID"),
  cancellation_reason: z.enum([
    'cancelled_by_customer',
    'cancelled_after_requote',
    'no_show',
    'cancelled_off_platform'
  ])
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
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("Not authenticated");
    }

    const body = await req.json();
    const validation = CancellationSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid input", 
          details: validation.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { appointment_id, cancellation_reason } = validation.data;

    console.log("[CANCEL] Processing cancellation:", { appointment_id, cancellation_reason });

    // Call the database validation function
    const { data: validationResult, error: validationError } = await supabaseClient
      .rpc('cancel_appointment_with_validation', {
        appointment_id_input: appointment_id,
        cancellation_reason_input: cancellation_reason
      });

    if (validationError) {
      console.error("[CANCEL] Validation error:", validationError);
      throw validationError;
    }

    const result = validationResult as { success: boolean; error?: string };

    if (!result.success) {
      return new Response(
        JSON.stringify(result),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get appointment details to check if refund is needed
    const { data: appointment } = await supabaseClient
      .from('appointments')
      .select('request_id')
      .eq('id', appointment_id)
      .single();

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Check if this cancellation reason requires a refund
    const refundReasons = ['cancelled_by_customer', 'cancelled_after_requote', 'no_show'];
    
    if (refundReasons.includes(cancellation_reason)) {
      console.log("[CANCEL] Processing Stripe refund for:", cancellation_reason);

      // Get the referral fee record
      const { data: referralFee } = await supabaseClient
        .from('referral_fees')
        .select('*')
        .eq('request_id', appointment.request_id)
        .eq('status', 'refunded') // Status already updated by DB function
        .single();

      if (referralFee && referralFee.stripe_payment_intent) {
        // Initialize Stripe and process refund
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        try {
          const refund = await stripe.refunds.create({
            payment_intent: referralFee.stripe_payment_intent,
            reason: cancellation_reason === 'no_show' ? 'requested_by_customer' : 'requested_by_customer',
            metadata: {
              appointment_id,
              request_id: appointment.request_id,
              cancellation_reason
            }
          });

          console.log("[CANCEL] Stripe refund processed:", refund.id);

          // Update referral fee with refund details
          await supabaseClient
            .from('referral_fees')
            .update({
              stripe_refund_id: refund.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', referralFee.id);

        } catch (stripeError) {
          console.error("[CANCEL] Stripe refund error:", stripeError);
          // Don't fail the entire cancellation if refund fails
          // Admin can manually process refund later
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("[CANCEL] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
