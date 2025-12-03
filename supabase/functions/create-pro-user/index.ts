import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateProUserRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  serviceRadius: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    // Parse request body
    const requestData: CreateProUserRequest = await req.json();

    // Validate required fields
    if (!requestData.email || !requestData.password || !requestData.name || !requestData.businessName) {
      throw new Error("Missing required fields");
    }

    // Create the new pro user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true,
      user_metadata: {
        name: requestData.name,
        role: "pro",
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(authError.message);
    }

    const userId = authData.user.id;

    // Update profile with pro role
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        name: requestData.name,
        phone: requestData.phone || null,
        role: "pro",
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      throw new Error(profileUpdateError.message);
    }

    // Create pro profile
    const { error: proProfileError } = await supabaseAdmin
      .from("pro_profiles")
      .insert({
        pro_id: userId,
        business_name: requestData.businessName,
        phone: requestData.phone || null,
        address: requestData.address,
        city: requestData.city,
        state: requestData.state,
        zip_code: requestData.zipCode,
        radius_km: requestData.serviceRadius,
        is_verified: false,
        profile_complete: false,
      });

    if (proProfileError) {
      console.error("Pro profile error:", proProfileError);
      throw new Error(proProfileError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-pro-user function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
