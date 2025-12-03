import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin using the has_role security definer function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      throw new Error('Unauthorized - Admin access required');
    }

    const { customerId } = await req.json();

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    console.log('Deleting customer:', customerId);

    // Get all service requests for this customer
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('service_requests')
      .select('id')
      .eq('customer_id', customerId);

    if (requestsError) {
      console.error('Error fetching service requests:', requestsError);
      throw requestsError;
    }

    let deletedRequestsCount = 0;

    if (requests && requests.length > 0) {
      const requestIds = requests.map((r: any) => r.id);
      deletedRequestsCount = requests.length;

      console.log('Deleting related data for requests:', requestIds);

      // Delete all related data in correct order to avoid foreign key issues
      
      // 1. Delete chat messages
      const { error: chatError } = await supabaseAdmin
        .from('chat_messages')
        .delete()
        .in('request_id', requestIds);
      
      if (chatError) console.error('Error deleting chat messages:', chatError);

      // 2. Delete leads
      const { error: leadsError } = await supabaseAdmin
        .from('leads')
        .delete()
        .in('request_id', requestIds);
      
      if (leadsError) console.error('Error deleting leads:', leadsError);

      // 3. Delete quotes
      const { error: quotesError } = await supabaseAdmin
        .from('quotes')
        .delete()
        .in('request_id', requestIds);
      
      if (quotesError) console.error('Error deleting quotes:', quotesError);

      // 4. Delete appointments
      const { error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .delete()
        .in('request_id', requestIds);
      
      if (appointmentsError) console.error('Error deleting appointments:', appointmentsError);

      // 5. Delete referral fees
      const { error: referralFeesError } = await supabaseAdmin
        .from('referral_fees')
        .delete()
        .in('request_id', requestIds);
      
      if (referralFeesError) console.error('Error deleting referral fees:', referralFeesError);

      // 6. Delete service fees
      const { error: feesError } = await supabaseAdmin
        .from('fees')
        .delete()
        .in('request_id', requestIds);
      
      if (feesError) console.error('Error deleting fees:', feesError);

      // 7. Delete service requests
      const { error: requestsDeleteError } = await supabaseAdmin
        .from('service_requests')
        .delete()
        .in('id', requestIds);
      
      if (requestsDeleteError) {
        console.error('Error deleting service requests:', requestsDeleteError);
        throw requestsDeleteError;
      }
    }

    // Finally, delete customer auth user (this will cascade delete the profile)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(customerId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw deleteError;
    }

    console.log('Successfully deleted customer and related data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedRequestsCount 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in delete-customer function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
