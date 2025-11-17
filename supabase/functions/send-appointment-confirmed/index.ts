import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const createEmailHTML = (customerName: string, proName: string, serviceName: string, quoteAmount: number, dashboardUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold; line-height: 1.4;">
                Great News! Your Appointment is Confirmed 🎉
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <p style="margin: 0 0 16px; color: #333; font-size: 16px; line-height: 26px;">
                Hi ${customerName},
              </p>
              <p style="margin: 0 0 24px; color: #333; font-size: 16px; line-height: 26px;">
                <strong>${proName}</strong> has confirmed your appointment and is ready to help with your <strong>${serviceName}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e1e8ed; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; color: #1a1a1a; font-size: 18px; font-weight: bold;">
                      Service Details:
                    </p>
                    <p style="margin: 8px 0; color: #333; font-size: 15px; line-height: 24px;">
                      <strong>Professional:</strong> ${proName}
                    </p>
                    <p style="margin: 8px 0; color: #333; font-size: 15px; line-height: 24px;">
                      <strong>Service:</strong> ${serviceName}
                    </p>
                    <p style="margin: 8px 0; color: #333; font-size: 15px; line-height: 24px;">
                      <strong>Quote Amount:</strong> $${quoteAmount.toFixed(2)}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0; color: #333; font-size: 16px; line-height: 26px;">
                You can now schedule your appointment time through your dashboard.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 32px;">
              <a href="${dashboardUrl}" style="display: block; background-color: #0070f3; color: #ffffff; text-align: center; padding: 14px 20px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
                Schedule Appointment Time
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0; color: #666; font-size: 14px; line-height: 22px;">
                If you have any questions, feel free to message ${proName} directly through the platform.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; border-top: 1px solid #e1e8ed;">
              <p style="margin: 0; color: #898989; font-size: 12px; line-height: 22px;">
                <a href="https://doneez.app" style="color: #0070f3; text-decoration: underline;">DoneEZ</a><br>
                Your trusted service marketplace
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request_id, quote_id, pro_id } = await req.json();

    console.log("[SEND-CONFIRMATION] Processing email for request:", request_id);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch service request with customer info
    const { data: requestData, error: requestError } = await supabaseClient
      .from('service_requests')
      .select('*, service_type, customer:profiles!service_requests_customer_id_fkey(full_name, email)')
      .eq('id', request_id)
      .single();

    if (requestError || !requestData) {
      throw new Error(`Failed to fetch request: ${requestError?.message}`);
    }

    // Fetch quote details
    const { data: quoteData, error: quoteError } = await supabaseClient
      .from('quotes')
      .select('amount')
      .eq('id', quote_id)
      .single();

    if (quoteError || !quoteData) {
      throw new Error(`Failed to fetch quote: ${quoteError?.message}`);
    }

    // Fetch pro details
    const { data: proData, error: proError } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', pro_id)
      .single();

    if (proError || !proData) {
      throw new Error(`Failed to fetch pro: ${proError?.message}`);
    }

    const customerEmail = requestData.customer?.email;
    const customerName = requestData.customer?.full_name || 'Customer';
    const proName = proData.full_name || 'Your Pro';
    const serviceName = requestData.service_type || 'service';
    const quoteAmount = quoteData.amount || 0;
    const dashboardUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/supabase', '')}/appointments`;

    if (!customerEmail) {
      throw new Error("Customer email not found");
    }

    console.log("[SEND-CONFIRMATION] Sending email to:", customerEmail);

    const html = createEmailHTML(customerName, proName, serviceName, quoteAmount, dashboardUrl);

    // Send email using SendGrid
    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: customerEmail, name: customerName }],
          subject: `${proName} Confirmed Your Appointment - Schedule Now!`,
        }],
        from: { email: "noreply@doneez.app", name: "DoneEZ" },
        content: [{ type: "text/html", value: html }],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error("[SEND-CONFIRMATION] SendGrid error:", errorText);
      throw new Error(`SendGrid API error: ${errorText}`);
    }

    console.log("[SEND-CONFIRMATION] Email sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[SEND-CONFIRMATION] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
