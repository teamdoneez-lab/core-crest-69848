import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

serve(async (req) => {
  console.log("=== Marketplace Checkout Request Started ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://d055c5e3-dbb3-4500-9756-62e77f9413ae.lovableproject.com";
    console.log("Origin:", origin);
    
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Unauthorized");
    }

    console.log("Authenticated user:", user.id, user.email);

    // Parse cart items
    const { cartItems } = await req.json();
    console.log("Cart items received:", cartItems?.length || 0);
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe secret key not found");
      throw new Error("Stripe is not connected. Please contact support.");
    }

    console.log("Using Stripe key:", stripeKey.substring(0, 10) + "...");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate total
    const totalAmount = cartItems.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );

    // Create line items for Stripe
    const lineItems = cartItems.map((item: CartItem) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Create pending order in database
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        user_id: user.id,
        cart_items: cartItems,
        total_amount: totalAmount,
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error("Failed to create order");
    }

    // Create Stripe checkout session
    console.log("Creating Stripe checkout session...");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        user_email: user.email!,
      },
    });

    console.log("✅ Stripe session created:", session.id);
    console.log("Checkout URL:", session.url);

    // Update order with session ID
    await adminClient
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    console.log("=== Checkout Success - Returning URL ===");
    
    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("=== Checkout Error ===");
    console.error("Error details:", error);
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
