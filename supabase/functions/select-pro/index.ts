import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SelectProSchema = z.object({
  request_id: z.string().uuid("Invalid request ID format"),
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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("[SELECT-PRO] Auth error:", userError);
      throw new Error("Not authenticated");
    }
    
    console.log("[SELECT-PRO] Authenticated user:", user.id);

    const body = await req.json();
    const validation = SelectProSchema.safeParse(body);

    if (!validation.success) {
      console.error("[SELECT-PRO] Validation error:", validation.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { request_id, quote_id } = validation.data;

    console.log("[SELECT-PRO] Selecting pro:", { request_id, quote_id, customer_id: user.id });

    // Call the database function to handle the selection
    const { data, error } = await supabaseClient.rpc('select_pro_for_request', {
      p_request_id: request_id,
      p_quote_id: quote_id,
      p_customer_id: user.id
    });

    if (error) {
      console.error("[SELECT-PRO] Error selecting pro:", error);
      throw error;
    }

    console.log("[SELECT-PRO] Pro selected successfully:", data);

    // TODO: Send notification to selected pro
    // This could be done via email or push notification

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Pro selected successfully. They will be notified to confirm payment.",
        data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("[SELECT-PRO] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
