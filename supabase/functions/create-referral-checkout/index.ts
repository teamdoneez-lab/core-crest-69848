import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ReferralCheckoutSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID format")
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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      console.error("[REFERRAL-CHECKOUT] Auth error:", userError);
      throw new Error("Not authenticated");
    }
    
    console.log("[REFERRAL-CHECKOUT] Authenticated user:", user.id, user.email);

    const body = await req.json();
    const validation = ReferralCheckoutSchema.safeParse(body);

    if (!validation.success) {
      console.error("[REFERRAL-CHECKOUT] Validation error:", validation.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { quote_id } = validation.data;

    console.log("[REFERRAL-CHECKOUT] Processing quote:", quote_id);

    // Get the quote details using admin client to bypass RLS
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .select("estimated_price, request_id, pro_id")
      .eq("id", quote_id)
      .single();

    if (quoteError || !quote) {
      console.error("[REFERRAL-CHECKOUT] Quote fetch error:", quoteError);
      throw new Error("Quote not found");
    }

    // Verify the quote belongs to the authenticated user
    if (quote.pro_id !== user.id) {
      throw new Error("Unauthorized: Quote does not belong to this professional");
    }

    // Use admin client to bypass RLS and get referral fee
    console.log("[REFERRAL-CHECKOUT] Getting referral fee...");
    
    let { data: referralFee, error: feeError } = await supabaseAdmin
      .from("referral_fees")
      .select("*")
      .eq("request_id", quote.request_id)
      .eq("pro_id", user.id)
      .maybeSingle();

    if (!referralFee) {
      // Try to create it if it doesn't exist - use tiered calculation
      console.log("[REFERRAL-CHECKOUT] No fee found, calculating tiered fee...");
      
      // Calculate tiered referral fee with min/max caps
      let calculatedFee: number;
      let minFee: number;
      let maxFee: number;
      const estimatedPrice = quote.estimated_price;
      
      if (estimatedPrice < 1000) {
        calculatedFee = estimatedPrice * 0.05;
        minFee = 5.00;
        maxFee = 50.00;
      } else if (estimatedPrice < 5000) {
        calculatedFee = estimatedPrice * 0.03;
        minFee = 50.00;
        maxFee = 150.00;
      } else if (estimatedPrice < 10000) {
        calculatedFee = estimatedPrice * 0.02;
        minFee = 150.00;
        maxFee = 200.00;
      } else {
        calculatedFee = estimatedPrice * 0.01;
        minFee = 200.00;
        maxFee = 300.00;
      }
      
      // Apply min/max caps
      calculatedFee = Math.min(Math.max(calculatedFee, minFee), maxFee);
      
      // Round to 2 decimal places
      calculatedFee = Math.round(calculatedFee * 100) / 100;
      
      console.log("[REFERRAL-CHECKOUT] Calculated fee:", calculatedFee, "for job total:", estimatedPrice);
      
      const { data: newFee, error: createError } = await supabaseAdmin
        .from("referral_fees")
        .insert({
          quote_id,
          pro_id: user.id,
          request_id: quote.request_id,
          amount: calculatedFee,
          status: "owed",
        })
        .select()
        .maybeSingle();

      if (createError) {
        // If duplicate key error, fetch the existing one
        if (createError.code === '23505') {
          console.log("[REFERRAL-CHECKOUT] Fee already exists, fetching it...");
          const { data: existingFee } = await supabaseAdmin
            .from("referral_fees")
            .select("*")
            .eq("request_id", quote.request_id)
            .eq("pro_id", user.id)
            .single();
          
          if (!existingFee) {
            throw new Error("Failed to get referral fee");
          }

          // Update with quote_id if needed
          if (existingFee.quote_id !== quote_id) {
            const { data: updated } = await supabaseAdmin
              .from("referral_fees")
              .update({ quote_id })
              .eq("id", existingFee.id)
              .select()
              .single();
            
            referralFee = updated || existingFee;
          } else {
            referralFee = existingFee;
          }
        } else {
          console.error("[REFERRAL-CHECKOUT] Failed to create referral fee:", createError);
          throw new Error("Failed to create referral fee");
        }
      } else {
        referralFee = newFee;
      }
    } else {
      // Update with quote_id if not set
      if (!referralFee.quote_id || referralFee.quote_id !== quote_id) {
        console.log("[REFERRAL-CHECKOUT] Updating fee with quote_id...");
        const { data: updated } = await supabaseAdmin
          .from("referral_fees")
          .update({ quote_id })
          .eq("id", referralFee.id)
          .select()
          .single();
        
        if (updated) {
          referralFee = updated;
        }
      }
    }

    if (!referralFee) {
      throw new Error("Failed to get or create referral fee");
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
      success_url: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://doneez.com'}/payment-success?session_id={CHECKOUT_SESSION_ID}&request_id=${quote.request_id}`,
      cancel_url: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://doneez.com'}/pro-dashboard`,
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
