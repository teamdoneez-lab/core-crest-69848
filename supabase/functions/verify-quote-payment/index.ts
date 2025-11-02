import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VerifyPaymentSchema = z.object({
  session_id: z.string()
    .min(1, "Session ID is required")
    .startsWith("cs_", "Invalid Stripe session ID format")
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
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

    const body = await req.json();
    const validation = VerifyPaymentSchema.safeParse(body);

    if (!validation.success) {
      console.error("[VERIFY-QUOTE-PAYMENT] Validation error:", validation.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { session_id } = validation.data;

    console.log("[VERIFY-QUOTE-PAYMENT] Verifying session:", session_id);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    console.log("[VERIFY-QUOTE-PAYMENT] Payment verified, creating quote");

    const metadata = session.metadata!;
    
    // Validate metadata from Stripe
    const MetadataSchema = z.object({
      request_id: z.string().uuid(),
      pro_id: z.string().uuid(),
      estimated_price: z.string().transform(val => {
        const num = parseFloat(val);
        if (isNaN(num) || num < 1 || num > 999999) {
          throw new Error("Invalid estimated_price in metadata");
        }
        return num;
      }),
      description: z.string().min(1).max(1000),
      notes: z.string().optional(),
      fee_amount: z.string().transform(val => {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new Error("Invalid fee_amount in metadata");
        }
        return num;
      })
    });

    const metadataValidation = MetadataSchema.safeParse(metadata);
    
    if (!metadataValidation.success) {
      console.error("[VERIFY-QUOTE-PAYMENT] Metadata validation error:", metadataValidation.error);
      throw new Error("Invalid payment metadata");
    }

    const { request_id, pro_id, estimated_price, description, notes, fee_amount } = metadataValidation.data;

    // Create the quote
    const { data: quoteData, error: quoteError } = await supabaseClient
      .from("quotes")
      .insert({
        request_id,
        pro_id,
        estimated_price,
        description,
        notes: notes || null,
        status: "pending",
        payment_status: "paid",
      })
      .select()
      .single();

    if (quoteError) {
      console.error("[VERIFY-QUOTE-PAYMENT] Error creating quote:", quoteError);
      throw quoteError;
    }

    console.log("[VERIFY-QUOTE-PAYMENT] Quote created:", quoteData.id);

    // Create the referral fee record
    const { error: feeError } = await supabaseClient
      .from("referral_fees")
      .insert({
        request_id,
        pro_id,
        quote_id: quoteData.id,
        amount: fee_amount,
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_session_id: session_id,
        stripe_payment_intent: session.payment_intent as string,
        refundable: true,
      });

    if (feeError) {
      console.error("[VERIFY-QUOTE-PAYMENT] Error creating referral fee:", feeError);
      throw feeError;
    }

    console.log("[VERIFY-QUOTE-PAYMENT] Referral fee created");

    // Send email notification to customer
    try {
      await supabaseClient.functions.invoke("send-quote-email", {
        body: { quoteId: quoteData.id },
      });
      console.log("[VERIFY-QUOTE-PAYMENT] Email sent successfully");
    } catch (emailError) {
      console.error("[VERIFY-QUOTE-PAYMENT] Error sending email:", emailError);
      // Don't fail the entire operation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        quote_id: quoteData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[VERIFY-QUOTE-PAYMENT] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
