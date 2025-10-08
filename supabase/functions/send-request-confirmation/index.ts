import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestConfirmationEmail {
  requestId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) throw new Error("Not authenticated");

    const { requestId }: RequestConfirmationEmail = await req.json();

    // Fetch request details
    const { data: request, error: requestError } = await supabaseClient
      .from("service_requests")
      .select(`
        id,
        contact_email,
        vehicle_make,
        model,
        year,
        zip,
        category_id,
        service_categories (
          name
        ),
        profiles!service_requests_customer_id_fkey (
          name
        )
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching request:", requestError);
      throw new Error("Request not found");
    }

    const serviceRequest = request as any;
    const customerName = serviceRequest.profiles?.name || "Valued Customer";
    const customerEmail = serviceRequest.contact_email;
    const serviceName = serviceRequest.service_categories?.name || "Service";
    const vehicleInfo = `${serviceRequest.year} ${serviceRequest.vehicle_make} ${serviceRequest.model}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Service Request Confirmed!</h1>
        <p>Hi ${customerName},</p>
        <p>We've received your service request and qualified professionals in your area will be notified.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Request Details</h2>
          <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Service Area:</strong> ${serviceRequest.zip}</p>
        </div>
        
        <h3>What happens next?</h3>
        <ul style="color: #4b5563;">
          <li>Qualified professionals in your area will review your request</li>
          <li>You'll receive quotes and availability from interested providers</li>
          <li>Compare options and choose the best fit for your needs</li>
          <li>Schedule your service appointment</li>
        </ul>
        
        <div style="margin: 30px 0;">
          <a href="${req.headers.get("origin")}/my-requests" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Your Requests
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          You'll receive email notifications when professionals send you quotes.
        </p>
      </div>
    `;

    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: customerEmail }],
          subject: `Service Request Confirmed - ${serviceName} for ${vehicleInfo}`,
        }],
        from: { email: "andyredlands@gmail.com", name: "DoneEZ" },
        content: [{
          type: "text/html",
          value: emailHtml,
        }],
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("SendGrid error:", errorText);
      throw new Error(`SendGrid API error: ${errorText}`);
    }

    console.log("Request confirmation email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-request-confirmation function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
