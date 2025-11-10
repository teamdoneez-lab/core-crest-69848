import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-EXPIRED-APPOINTMENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Call the database function to expire pending confirmations
    const { data: expiredCount, error: expireError } = await supabaseClient
      .rpc("expire_pending_confirmations");

    if (expireError) {
      logStep("ERROR calling expire_pending_confirmations", { error: expireError });
      throw expireError;
    }

    logStep("Expired appointments count", { count: expiredCount });

    // If no appointments expired, return early
    if (!expiredCount || expiredCount === 0) {
      logStep("No expired appointments found");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No expired appointments",
          expired_count: 0,
          notifications_sent: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Fetch expired appointments to send notifications
    const { data: expiredAppointments, error: fetchError } = await supabaseClient
      .from("appointments")
      .select(`
        id,
        request_id,
        pro_id,
        expired_at,
        service_requests (
          id,
          customer_id,
          service_category,
          vehicle_make,
          model,
          year,
          urgency,
          profiles!service_requests_customer_id_fkey (
            id,
            email,
            name
          )
        ),
        profiles!appointments_pro_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq("status", "expired")
      .not("expired_at", "is", null)
      .gte("expired_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Only recent expirations

    if (fetchError) {
      logStep("ERROR fetching expired appointments", { error: fetchError });
      throw fetchError;
    }

    logStep("Fetched expired appointments", { count: expiredAppointments?.length || 0 });

    // Send email notifications if Resend is configured
    let notificationsSent = 0;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (resendApiKey && expiredAppointments && expiredAppointments.length > 0) {
      const resend = new Resend(resendApiKey);

      for (const appointment of expiredAppointments) {
        try {
          const customer = appointment.service_requests?.profiles;
          const pro = appointment.profiles;

          if (!customer?.email) {
            logStep("Skipping notification - no customer email", { appointmentId: appointment.id });
            continue;
          }

          const serviceCategory = appointment.service_requests?.service_category?.[0] || "service";
          const vehicle = `${appointment.service_requests?.vehicle_make} ${appointment.service_requests?.model} ${appointment.service_requests?.year}`;

          // Send notification to customer
          await resend.emails.send({
            from: "DoneEZ <noreply@resend.dev>",
            to: [customer.email],
            subject: "Appointment Confirmation Expired - Action Required",
            html: `
              <h2>Appointment Confirmation Expired</h2>
              <p>Hi ${customer.name || "there"},</p>
              <p>The mechanic did not confirm your appointment within the required timeframe.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Service:</strong> ${serviceCategory}</p>
                <p><strong>Vehicle:</strong> ${vehicle}</p>
                <p><strong>Mechanic:</strong> ${pro?.name || "Professional"}</p>
              </div>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Return to your dashboard to select another quote</li>
                <li>All other quotes are still available for selection</li>
              </ul>
              <p>
                <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com")}/my-requests" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View My Requests
                </a>
              </p>
              <p>Best regards,<br>The DoneEZ Team</p>
            `,
          });

          notificationsSent++;
          logStep("Notification sent to customer", { 
            appointmentId: appointment.id, 
            customerEmail: customer.email 
          });
        } catch (emailError) {
          logStep("ERROR sending notification", { 
            appointmentId: appointment.id, 
            error: emailError 
          });
        }
      }
    }

    logStep("Function completed successfully", {
      expired_count: expiredCount,
      notifications_sent: notificationsSent,
    });

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredCount,
        notifications_sent: notificationsSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    logStep("ERROR in check-expired-appointments", { 
      message: error instanceof Error ? error.message : String(error) 
    });
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
