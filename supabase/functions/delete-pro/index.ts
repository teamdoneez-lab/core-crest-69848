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

    const { proId } = await req.json();

    if (!proId) {
      throw new Error('Pro ID is required');
    }

    console.log('Deleting pro:', proId);

    // Get all data related to this pro
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('service_requests')
      .select('id')
      .eq('accepted_pro_id', proId);

    if (requestsError) {
      console.error('Error fetching service requests:', requestsError);
      throw requestsError;
    }

    let deletedJobsCount = 0;

    if (requests && requests.length > 0) {
      const requestIds = requests.map((r: any) => r.id);
      deletedJobsCount = requests.length;

      console.log('Clearing pro assignment from service requests:', requestIds);

      // Clear accepted_pro_id from service requests (don't delete customer requests)
      const { error: clearRequestsError } = await supabaseAdmin
        .from('service_requests')
        .update({ 
          accepted_pro_id: null, 
          accept_expires_at: null,
          status: 'pending'
        })
        .in('id', requestIds);
      
      if (clearRequestsError) {
        console.error('Error clearing service requests:', clearRequestsError);
      }
    }

    // Delete pro-specific data
    console.log('Deleting pro-specific data...');

    // 1. Delete leads
    const { error: leadsError } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('pro_id', proId);
    
    if (leadsError) console.error('Error deleting leads:', leadsError);

    // 2. Delete quotes
    const { error: quotesError } = await supabaseAdmin
      .from('quotes')
      .delete()
      .eq('pro_id', proId);
    
    if (quotesError) console.error('Error deleting quotes:', quotesError);

    // 3. Delete appointments
    const { error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('pro_id', proId);
    
    if (appointmentsError) console.error('Error deleting appointments:', appointmentsError);

    // 4. Delete referral fees
    const { error: referralFeesError } = await supabaseAdmin
      .from('referral_fees')
      .delete()
      .eq('pro_id', proId);
    
    if (referralFeesError) console.error('Error deleting referral fees:', referralFeesError);

    // 5. Delete service fees
    const { error: feesError } = await supabaseAdmin
      .from('fees')
      .delete()
      .eq('pro_id', proId);
    
    if (feesError) console.error('Error deleting fees:', feesError);

    // 6. Delete pro service categories
    const { error: categoriesError } = await supabaseAdmin
      .from('pro_service_categories')
      .delete()
      .eq('pro_id', proId);
    
    if (categoriesError) console.error('Error deleting service categories:', categoriesError);

    // 7. Delete pro service areas
    const { error: areasError } = await supabaseAdmin
      .from('pro_service_areas')
      .delete()
      .eq('pro_id', proId);
    
    if (areasError) console.error('Error deleting service areas:', areasError);

    // 8. Delete pro profile
    const { error: proProfileError } = await supabaseAdmin
      .from('pro_profiles')
      .delete()
      .eq('pro_id', proId);
    
    if (proProfileError) console.error('Error deleting pro profile:', proProfileError);

    // Finally, delete pro auth user (this will cascade delete the profile)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(proId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw deleteError;
    }

    console.log('Successfully deleted pro and related data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedJobsCount 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in delete-pro function:', error);
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
