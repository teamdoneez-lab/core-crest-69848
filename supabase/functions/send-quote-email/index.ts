import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteEmailRequest {
  quoteId: string;
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

    const { quoteId }: QuoteEmailRequest = await req.json();

    // Fetch quote details with customer and pro information
    const { data: quote, error: quoteError } = await supabaseClient
      .from("quotes")
      .select(`
        id,
        estimated_price,
        description,
        notes,
        request_id,
        service_requests (
          id,
          contact_email,
          vehicle_make,
          model,
          year,
          category_id,
          service_categories (
            name
          ),
          profiles!service_requests_customer_id_fkey (
            name
          )
        ),
        profiles!quotes_pro_id_fkey (
          name,
          pro_profiles (
            business_name,
            phone
          )
        )
      `)
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      console.error("Error fetching quote:", quoteError);
      throw new Error("Quote not found");
    }

    // TypeScript type casting for nested relations
    const serviceRequest = quote.service_requests as any;
    const proProfile = quote.profiles as any;
    
    const customerEmail = serviceRequest.contact_email;
    const customerName = serviceRequest.profiles?.name || "Valued Customer";
    const proName = proProfile?.pro_profiles?.business_name || proProfile?.name || "Professional";
    const proPhone = proProfile?.pro_profiles?.phone || "";
    const serviceName = serviceRequest.service_categories?.name || "Service";
    const vehicleInfo = `${serviceRequest.year} ${serviceRequest.vehicle_make} ${serviceRequest.model}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Quote Received!</h1>
        <p>Hi ${customerName},</p>
        <p>You've received a new quote for your ${serviceName} request.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Quote Details</h2>
          <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Professional:</strong> ${proName}</p>
          ${proPhone ? `<p><strong>Contact:</strong> ${proPhone}</p>` : ''}
          <p><strong>Estimated Price:</strong> $${Number(quote.estimated_price).toFixed(2)}</p>
          <p><strong>Description:</strong> ${quote.description}</p>
          ${quote.notes ? `<p><strong>Additional Notes:</strong> ${quote.notes}</p>` : ''}
        </div>
        
        <p><strong>Important:</strong> This is an estimate only. For repair services, a final price will be determined after an in-person inspection.</p>
        
        <div style="margin: 30px 0;">
          <a href="${req.headers.get("origin")}/my-requests" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Quote & Respond
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Once you accept a quote, the mechanic will be notified to confirm the appointment by paying a referral fee.
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
          subject: `New Quote for Your ${serviceName} - ${vehicleInfo}`,
        }],
        from: { email: "support@doneez.com", name: "DoneEZ" },
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

    console.log("Quote email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-quote-email function:", error);
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
