import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadNotificationRequest {
  leadId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { leadId }: LeadNotificationRequest = await req.json();

    console.log("Sending lead notification for lead:", leadId);

    // Fetch lead details with service request, customer, and pro information
    const { data: lead, error: leadError } = await supabaseClient
      .from("leads")
      .select(`
        id,
        created_at,
        service_requests (
          id,
          service_category,
          year,
          vehicle_make,
          model,
          trim,
          mileage,
          description,
          urgency,
          appointment_type,
          zip,
          address,
          formatted_address,
          preferred_time,
          contact_phone,
          contact_email,
          image_url,
          category_id,
          service_categories (
            name
          ),
          profiles!service_requests_customer_id_fkey (
            name,
            email
          )
        ),
        profiles!leads_pro_id_fkey (
          email,
          name,
          pro_profiles (
            business_name
          )
        )
      `)
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Error fetching lead:", leadError);
      throw new Error("Lead not found");
    }

    // TypeScript type casting for nested relations
    const serviceRequest = lead.service_requests as any;
    const proProfile = lead.profiles as any;
    
    const proEmail = proProfile?.email;
    const proName = proProfile?.pro_profiles?.business_name || proProfile?.name || "Professional";
    const serviceName = serviceRequest?.service_categories?.name || "Service";
    const vehicleInfo = `${serviceRequest?.year} ${serviceRequest?.vehicle_make} ${serviceRequest?.model}${serviceRequest?.trim ? ' ' + serviceRequest.trim : ''}`;
    const mileage = serviceRequest?.mileage ? `${serviceRequest.mileage.toLocaleString()} miles` : "Not specified";
    const urgency = serviceRequest?.urgency === "asap" ? "ASAP" : serviceRequest?.urgency === "day" ? "Within 1 day" : serviceRequest?.urgency === "week" ? "Within 1 week" : "Flexible";
    const appointmentType = serviceRequest?.appointment_type === "mobile" ? "Mobile Service" : "In-Shop Service";
    const preferredTime = serviceRequest?.preferred_time ? new Date(serviceRequest.preferred_time).toLocaleString() : "Not specified";
    const description = serviceRequest?.description || "No additional details provided.";

    if (!proEmail) {
      console.error("Pro email not found for lead:", leadId);
      throw new Error("Professional email not found");
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Service Request!</h1>
        <p>Hi ${proName},</p>
        <p>You've received a new service request in your area. Review the details below and submit your quote through the platform.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1f2937;">Request Details</h2>
          
          <h3 style="color: #2563eb; margin-bottom: 10px;">Vehicle Information</h3>
          <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${vehicleInfo}</p>
          <p style="margin: 5px 0;"><strong>Mileage:</strong> ${mileage}</p>
          
          <h3 style="color: #2563eb; margin-top: 20px; margin-bottom: 10px;">Service Details</h3>
          <p style="margin: 5px 0;"><strong>Service Category:</strong> ${serviceName}</p>
          <p style="margin: 5px 0;"><strong>Urgency:</strong> ${urgency}</p>
          <p style="margin: 5px 0;"><strong>Service Type:</strong> ${appointmentType}</p>
          <p style="margin: 5px 0;"><strong>Preferred Time:</strong> ${preferredTime}</p>
          <p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>
          
          <h3 style="color: #2563eb; margin-top: 20px; margin-bottom: 10px;">Service Area</h3>
          <p style="margin: 5px 0;"><strong>ZIP Code:</strong> ${serviceRequest?.zip}</p>
          ${serviceRequest?.appointment_type === "shop" && serviceRequest?.formatted_address ? `<p style="margin: 5px 0;"><strong>General Area:</strong> ${serviceRequest.formatted_address}</p>` : ''}
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong> Customer contact details will be provided after you're selected and the job is confirmed through the platform. Please use the in-platform messaging system to communicate.</p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${req.headers.get("origin")}/pro-dashboard" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Submit Your Quote Now
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          <strong>Next Steps:</strong><br>
          1. Review the request details carefully<br>
          2. Log in to your dashboard<br>
          3. Submit your competitive quote through the platform<br>
          4. Use in-platform messaging for questions<br>
          5. Get customer contact details once selected
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          This is an automated notification. Use the platform's messaging system to communicate with customers. Direct contact outside the platform before job confirmation is prohibited.
        </p>
      </div>
    `;

    // Send email via SendGrid
    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: proEmail }],
            subject: `New Service Request: ${vehicleInfo} - ${serviceName}`,
          },
        ],
        from: {
          email: "noreply@doneez.app",
          name: "Doneez",
        },
        content: [
          {
            type: "text/html",
            value: emailHtml,
          },
        ],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error("SendGrid error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log("Lead notification email sent successfully to:", proEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Lead notification sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-lead-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
