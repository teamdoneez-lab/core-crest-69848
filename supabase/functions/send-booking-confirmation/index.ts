import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  email: string;
  name: string;
  services: string[];
  vehicle: string;
  preferredTime: string;
  appointmentType: string;
  zip: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      name,
      services,
      vehicle,
      preferredTime,
      appointmentType,
      zip,
    }: BookingConfirmationRequest = await req.json();

    console.log("Sending booking confirmation to:", email);

    const servicesHtml = services.map((s) => `<li style="margin: 5px 0;">${s}</li>`).join("");

    const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Service Request Confirmed!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name || 'valued customer'},</p>
              
              <p style="font-size: 16px; margin-bottom: 25px;">Thank you for choosing DoneEZ! Your service request has been successfully submitted and our network of qualified professionals will review it shortly.</p>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #667eea; margin-top: 0; font-size: 20px;">Request Details</h2>
                
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Vehicle:</strong>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">${vehicle}</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Services Requested:</strong>
                  <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #6b7280;">
                    ${servicesHtml}
                  </ul>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Appointment Type:</strong>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">${appointmentType === 'mobile' ? 'Mobile Service (We come to you)' : 'Shop Service'}</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Location:</strong>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">${zip}</p>
                </div>
                
                <div>
                  <strong style="color: #374151;">Preferred Time:</strong>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">${preferredTime}</p>
                </div>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">What Happens Next?</h3>
                <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #78350f;">
                  <li style="margin-bottom: 8px;">Qualified professionals in your area will review your request</li>
                  <li style="margin-bottom: 8px;">You'll receive quotes and availability from interested providers</li>
                  <li style="margin-bottom: 8px;">Compare options and choose the best fit for your needs</li>
                  <li>Schedule your service appointment</li>
                </ol>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">You can track the status of your request and view incoming quotes by logging into your DoneEZ dashboard.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://cxraykdmlshcntqjumpc.supabase.co', 'https://d055c5e3-dbb3-4500-9756-62e77f9413ae.lovableproject.com')}/my-requests" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View My Requests</a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #9ca3af; margin: 0; text-align: center;">If you have any questions, please don't hesitate to contact us.</p>
              <p style="font-size: 14px; color: #9ca3af; margin: 10px 0 0 0; text-align: center;">© ${new Date().getFullYear()} DoneEZ. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;

    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: email }],
          subject: "Service Request Confirmed - DoneEZ",
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

    console.log("Email sent successfully");

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
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
