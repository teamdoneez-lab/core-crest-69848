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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin using the has_role security definer function
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      throw new Error("Unauthorized - Admin access required");
    }

    const { referral_fee_id } = await req.json();

    // Get the referral fee
    const { data: referralFee, error: feeError } = await supabaseClient
      .from("referral_fees")
      .select("*")
      .eq("id", referral_fee_id)
      .single();

    if (feeError || !referralFee) {
      throw new Error("Referral fee not found");
    }

    if (referralFee.status !== "paid") {
      throw new Error("Can only refund paid fees");
    }

    if (!referralFee.refundable) {
      throw new Error("This referral fee is not refundable");
    }

    if (!referralFee.stripe_payment_intent) {
      throw new Error("No payment intent found for refund");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: referralFee.stripe_payment_intent,
    });

    if (refund.status === "succeeded") {
      // Update referral fee status
      await supabaseClient
        .from("referral_fees")
        .update({
          status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", referral_fee_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          refund_id: refund.id 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      throw new Error("Refund failed");
    }
  } catch (error) {
    console.error("Error in refund-referral-fee:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
