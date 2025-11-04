import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [CHECK-EXPIRED] ${step}${detailsStr}`);
};

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
    logStep("Starting expiration check");

    // Get quotes that are about to expire or already expired
    const { data: expiringQuotes, error: fetchError } = await supabaseClient
      .from("quotes")
      .select(`
        id,
        estimated_price,
        confirmation_timer_expires_at,
        request_id,
        pro_id,
        service_requests (
          customer_id,
          vehicle_make,
          model,
          year,
          profiles (
            email,
            name
          )
        ),
        pro_profiles:pro_id (
          business_name
        )
      `)
      .eq("status", "pending_confirmation")
      .lt("confirmation_timer_expires_at", new Date().toISOString());

    if (fetchError) {
      logStep("Error fetching expiring quotes", { error: fetchError });
      throw fetchError;
    }

    if (!expiringQuotes || expiringQuotes.length === 0) {
      logStep("No expired quotes found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          expired_count: 0,
          message: "No expired quotes to process"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    logStep("Found expired quotes", { count: expiringQuotes.length });

    // Call the database function to expire quotes
    const { data: expireResult, error: expireError } = await supabaseClient
      .rpc("expire_timed_out_quotes");

    if (expireError) {
      logStep("Error expiring quotes", { error: expireError });
      throw expireError;
    }

    logStep("Expired quotes in database", { count: expireResult });

    // Send notification emails to customers
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      logStep("RESEND_API_KEY not configured, skipping email notifications");
    } else {
      logStep("Sending email notifications to customers");

      for (const quote of expiringQuotes) {
        try {
          // Handle nested data structures
          const serviceRequest = Array.isArray(quote.service_requests) ? quote.service_requests[0] : quote.service_requests;
          const profile = Array.isArray(serviceRequest?.profiles) ? serviceRequest.profiles[0] : serviceRequest?.profiles;
          const proProfile = Array.isArray(quote.pro_profiles) ? quote.pro_profiles[0] : quote.pro_profiles;
          
          const customerEmail = profile?.email;
          const customerName = profile?.name || "Customer";
          const businessName = proProfile?.business_name || "Professional";
          const vehicle = `${serviceRequest?.year} ${serviceRequest?.vehicle_make} ${serviceRequest?.model}`;

          if (!customerEmail) {
            logStep("No customer email found for quote", { quote_id: quote.id });
            continue;
          }

          // Send email notification
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "DoneEZ <notifications@resend.dev>",
              to: [customerEmail],
              subject: "⏰ Quote Confirmation Expired - Action Required",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #dc2626;">Quote Confirmation Time Expired</h1>
                  
                  <p>Hi ${customerName},</p>
                  
                  <p>Unfortunately, <strong>${businessName}</strong> did not confirm your selected quote within the time limit.</p>
                  
                  <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #991b1b;">Quote Details:</h3>
                    <p style="margin: 8px 0;"><strong>Vehicle:</strong> ${vehicle}</p>
                    <p style="margin: 8px 0;"><strong>Amount:</strong> $${quote.estimated_price.toFixed(2)}</p>
                    <p style="margin: 8px 0;"><strong>Professional:</strong> ${businessName}</p>
                  </div>
                  
                  <h3 style="color: #2563eb;">What happens next?</h3>
                  <p>Don't worry! You can select another quote from your available options. Your service request is still active.</p>
                  
                  <div style="margin: 30px 0;">
                    <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.doneez.com'}/my-requests" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      View Available Quotes
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Need help? Contact our support team at support@doneez.com
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="color: #9ca3af; font-size: 12px;">
                    This is an automated notification from DoneEZ. Please do not reply to this email.
                  </p>
                </div>
              `,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            logStep("Failed to send email", { 
              quote_id: quote.id, 
              customer_email: customerEmail,
              error: errorText 
            });
          } else {
            logStep("Email sent successfully", { 
              quote_id: quote.id,
              customer_email: customerEmail 
            });
          }
        } catch (emailError) {
          logStep("Error sending email for quote", { 
            quote_id: quote.id,
            error: emailError instanceof Error ? emailError.message : String(emailError)
          });
        }
      }
    }

    logStep("Expiration check completed", { expired_count: expireResult });

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired_count: expireResult,
        notifications_sent: expiringQuotes.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-expired-quotes", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
