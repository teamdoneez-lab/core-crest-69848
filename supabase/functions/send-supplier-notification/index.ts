import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  supplierEmail: string;
  supplierName: string;
  status: 'approved' | 'rejected';
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supplierEmail, supplierName, status, notes }: NotificationRequest = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const subject = status === 'approved' 
      ? '✅ Your DoneEZ Supplier Application Has Been Approved!'
      : '❌ Update on Your DoneEZ Supplier Application';

    const htmlContent = status === 'approved' 
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Welcome to DoneEZ!</h1>
          <p>Hi ${supplierName},</p>
          <p>Great news! Your supplier application has been <strong>approved</strong>.</p>
          <p>You can now log in to your supplier dashboard and start:</p>
          <ul>
            <li>Uploading your product catalog</li>
            <li>Managing orders</li>
            <li>Connecting your Stripe account for payouts</li>
          </ul>
          <div style="margin: 30px 0;">
            <a href="${req.headers.get("origin")}/supplier-login" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Log In to Dashboard
            </a>
          </div>
          ${notes ? `<p style="background-color: #f3f4f6; padding: 12px; border-left: 4px solid #2563eb;"><strong>Admin Note:</strong> ${notes}</p>` : ''}
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The DoneEZ Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Application Status Update</h1>
          <p>Hi ${supplierName},</p>
          <p>Thank you for your interest in becoming a DoneEZ supplier.</p>
          <p>After careful review, we are unable to approve your application at this time.</p>
          ${notes ? `<p style="background-color: #fee2e2; padding: 12px; border-left: 4px solid #dc2626;"><strong>Reason:</strong> ${notes}</p>` : ''}
          <p>If you believe this was an error or would like to discuss your application, please contact our support team.</p>
          <p>Best regards,<br>The DoneEZ Team</p>
        </div>
      `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DoneEZ <onboarding@resend.dev>',
        to: [supplierEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    console.log("Supplier notification sent:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-supplier-notification:", error);
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
