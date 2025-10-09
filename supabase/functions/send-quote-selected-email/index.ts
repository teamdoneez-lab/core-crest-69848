import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteSelectedEmailRequest {
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

    const { quoteId }: QuoteSelectedEmailRequest = await req.json();

    // Fetch quote details with professional and request information
    const { data: quote, error: quoteError } = await supabaseClient
      .from("quotes")
      .select(`
        id,
        estimated_price,
        description,
        confirmation_timer_expires_at,
        request_id,
        service_requests (
          id,
          vehicle_make,
          model,
          year,
          service_categories (
            name
          ),
          profiles!service_requests_customer_id_fkey (
            name
          )
        ),
        profiles!quotes_pro_id_fkey (
          name,
          phone,
          pro_profiles (
            business_name
          )
        )
      `)
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      console.error("Error fetching quote:", quoteError);
      throw new Error("Quote not found");
    }

    // Get professional's email from auth.users
    const { data: proAuthData, error: proAuthError } = await supabaseClient.auth.admin.getUserById(
      (quote.profiles as any).id
    );

    if (proAuthError || !proAuthData?.user?.email) {
      console.error("Error fetching professional email:", proAuthError);
      throw new Error("Professional email not found");
    }

    const serviceRequest = quote.service_requests as any;
    const proProfile = quote.profiles as any;
    
    const proEmail = proAuthData.user.email;
    const proName = proProfile?.pro_profiles?.business_name || proProfile?.name || "Professional";
    const customerName = serviceRequest.profiles?.name || "Customer";
    const serviceName = serviceRequest.service_categories?.name || "Service";
    const vehicleInfo = `${serviceRequest.year} ${serviceRequest.vehicle_make} ${serviceRequest.model}`;
    
    // Calculate time remaining
    const expiresAt = new Date(quote.confirmation_timer_expires_at);
    const now = new Date();
    const minutesRemaining = Math.round((expiresAt.getTime() - now.getTime()) / 60000);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">🎉 Customer Selected Your Quote!</h1>
        <p>Hi ${proName},</p>
        <p><strong>Great news!</strong> ${customerName} has selected your quote.</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">⏰ Action Required - ${minutesRemaining} Minutes Remaining</h3>
          <p style="color: #78350f; margin: 0;">
            You have <strong>${minutesRemaining} minutes</strong> to confirm this quote by paying the referral fee.
          </p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Job Details</h2>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Quote Amount:</strong> $${Number(quote.estimated_price).toFixed(2)}</p>
          <p><strong>Description:</strong> ${quote.description}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${req.headers.get("origin")}/service-requests" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Confirm Quote Now
          </a>
        </div>
        
        <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #991b1b; margin: 0; font-size: 14px;">
            <strong>Important:</strong> If you don't confirm within ${minutesRemaining} minutes, this quote will expire and the job will become available to other professionals.
          </p>
        </div>
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
          to: [{ email: proEmail }],
          subject: `🎉 Quote Selected - Confirm Within ${minutesRemaining} Minutes`,
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

    console.log("Quote selected email sent successfully to professional");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-quote-selected-email function:", error);
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
