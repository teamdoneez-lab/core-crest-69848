import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  appointment_id: string;
  status: string;
  recipient_type: 'customer' | 'pro';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { appointment_id, status, recipient_type }: EmailRequest = await req.json();
    
    // Fetch appointment details
    const { data: appointment, error: aptError } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        status,
        starts_at,
        confirmation_expires_at,
        service_requests (
          id,
          vehicle_make,
          model,
          year,
          customer_id,
          urgency
        ),
        profiles!appointments_pro_id_fkey (
          name,
          email
        )
      `)
      .eq('id', appointment_id)
      .single();

    if (aptError || !appointment) {
      throw new Error('Appointment not found');
    }

    // Get customer info
    const { data: customer, error: custError } = await supabaseClient
      .from('profiles')
      .select('name, email')
      .eq('id', appointment.service_requests.customer_id)
      .single();

    if (custError || !customer) {
      throw new Error('Customer not found');
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log('No Resend API key found, skipping email notification');
      return new Response(JSON.stringify({ success: true, message: 'Email skipped - no API key' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const resend = new Resend(resendApiKey);

    // Prepare email content based on status and recipient
    let subject = '';
    let htmlContent = '';
    let recipientEmail = '';
    let recipientName = '';

    if (recipient_type === 'customer') {
      recipientEmail = customer.email;
      recipientName = customer.name;

      if (status === 'pending_confirmation') {
        const timerMinutes = getTimerMinutes(appointment.service_requests.urgency);
        subject = `⏰ Appointment Confirmation Required - ${timerMinutes} min timer`;
        htmlContent = `
          <h2>Appointment Confirmation Pending</h2>
          <p>Hi ${customer.name},</p>
          <p>A mechanic has been assigned to your service request for your <strong>${appointment.service_requests.year} ${appointment.service_requests.vehicle_make} ${appointment.service_requests.model}</strong>.</p>
          <p><strong>⏰ Action Required:</strong> The mechanic has ${timerMinutes} minutes to confirm this appointment and pay the referral fee.</p>
          <p>You will be notified once the mechanic confirms, or if the appointment expires.</p>
          <p>Thank you for using our service!</p>
        `;
      } else if (status === 'confirmed') {
        subject = `✅ Appointment Confirmed`;
        htmlContent = `
          <h2>Your Appointment is Confirmed!</h2>
          <p>Hi ${customer.name},</p>
          <p>Great news! The mechanic has confirmed your appointment for your <strong>${appointment.service_requests.year} ${appointment.service_requests.vehicle_make} ${appointment.service_requests.model}</strong>.</p>
          <p><strong>Professional:</strong> ${appointment.profiles.name}</p>
          ${appointment.starts_at ? `<p><strong>Scheduled Time:</strong> ${new Date(appointment.starts_at).toLocaleString()}</p>` : ''}
          <p>The mechanic will contact you shortly to finalize the details.</p>
          <p>Thank you for using our service!</p>
        `;
      } else if (status === 'expired') {
        subject = `⏰ Appointment Expired - Select Another Quote`;
        htmlContent = `
          <h2>Appointment Confirmation Expired</h2>
          <p>Hi ${customer.name},</p>
          <p>Unfortunately, the mechanic did not confirm your appointment within the required time period.</p>
          <p><strong>Vehicle:</strong> ${appointment.service_requests.year} ${appointment.service_requests.vehicle_make} ${appointment.service_requests.model}</p>
          <p>Please return to your dashboard to select another quote from the available mechanics.</p>
          <p><a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/my-requests" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View My Requests</a></p>
          <p>We apologize for the inconvenience.</p>
        `;
      } else if (status === 'declined') {
        subject = `Appointment Declined - Select Another Quote`;
        htmlContent = `
          <h2>Appointment Declined</h2>
          <p>Hi ${customer.name},</p>
          <p>The mechanic has declined your appointment request.</p>
          <p><strong>Vehicle:</strong> ${appointment.service_requests.year} ${appointment.service_requests.vehicle_make} ${appointment.service_requests.model}</p>
          <p>Please return to your dashboard to select another quote from the available mechanics.</p>
          <p><a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/my-requests" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View My Requests</a></p>
        `;
      }
    } else if (recipient_type === 'pro') {
      recipientEmail = appointment.profiles.email;
      recipientName = appointment.profiles.name;

      if (status === 'completed') {
        subject = `✅ Job Marked Complete by Customer`;
        htmlContent = `
          <h2>Job Completed</h2>
          <p>Hi ${appointment.profiles.name},</p>
          <p>The customer has marked the job as complete for the <strong>${appointment.service_requests.year} ${appointment.service_requests.vehicle_make} ${appointment.service_requests.model}</strong>.</p>
          <p>Thank you for providing excellent service!</p>
        `;
      }
    }

    if (!subject || !htmlContent) {
      console.log(`No email template for status: ${status}, recipient: ${recipient_type}`);
      return new Response(JSON.stringify({ success: true, message: 'No email template' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "AutoRepair Platform <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error sending appointment status email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function getTimerMinutes(urgency?: string): number {
  switch (urgency) {
    case 'immediate': return 15;
    case '1-2 days': return 30;
    case '1 week': return 60;
    case '1 month': return 120;
    default: return 60;
  }
}
