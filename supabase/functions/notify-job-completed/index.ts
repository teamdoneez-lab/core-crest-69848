import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { appointment_id, pro_id } = await req.json();

    if (!appointment_id || !pro_id) {
      throw new Error("Missing required parameters");
    }

    // Get appointment and customer details
    const { data: appointmentData, error: appointmentError } = await supabaseClient
      .from("appointments")
      .select(`
        id,
        starts_at,
        service_requests!inner (
          id,
          vehicle_make,
          model,
          year,
          customer_id,
          profiles:customer_id (
            name
          )
        )
      `)
      .eq("id", appointment_id)
      .single();

    if (appointmentError || !appointmentData) {
      throw new Error("Appointment not found");
    }

    // Type assertion since we know service_requests is a single object due to !inner
    const appointment = appointmentData as unknown as {
      id: string;
      starts_at: string;
      service_requests: {
        id: string;
        vehicle_make: string;
        model: string;
        year: number;
        customer_id: string;
        profiles: { name: string };
      };
    };

    // Get professional details
    const { data: proProfile, error: proError } = await supabaseClient
      .from("profiles")
      .select("name")
      .eq("id", pro_id)
      .single();

    if (proError || !proProfile) {
      throw new Error("Professional profile not found");
    }

    // Get customer email from auth.users
    const { data: customerData } = await supabaseClient.auth.admin.getUserById(
      appointment.service_requests.customer_id
    );

    // Log the notification (you can extend this to send email/SMS)
    console.log("[JOB-COMPLETED] Notification details:", {
      pro_name: proProfile.name,
      customer_name: appointment.service_requests.profiles?.name,
      customer_email: customerData?.user?.email,
      vehicle: `${appointment.service_requests.year} ${appointment.service_requests.vehicle_make} ${appointment.service_requests.model}`,
      appointment_time: appointment.starts_at,
    });

    // TODO: Add email notification using Resend if configured
    // For now, just log the notification

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Professional notified successfully" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[JOB-COMPLETED] Error:", error);
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
