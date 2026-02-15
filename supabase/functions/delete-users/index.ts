import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Privileged operations use service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the session token server-side
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const requestingUserId = user.id;

    // Check if user is admin (roles are stored server-side)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Error checking admin role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Authorization check failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No user IDs provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Prevent self-deletion
    if (userIds.includes(requestingUserId)) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const results = [];

    for (const userId of userIds) {
      try {
        console.log(`Hard deleting user ${userId}...`);

        // 1. Delete related data first (to avoid foreign key issues)
        // Delete user roles
        await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
        
        // Delete daily logins
        await supabaseAdmin.from('daily_logins').delete().eq('user_id', userId);
        
        // Delete appointments
        await supabaseAdmin.from('appointments').delete().eq('user_id', userId);
        
        // Delete webinar registrations
        await supabaseAdmin.from('webinar_registrations').delete().eq('user_id', userId);
        
        // Delete module validations
        await supabaseAdmin.from('module_validations').delete().eq('user_id', userId);
        
        // Delete user parcours
        await supabaseAdmin.from('user_parcours').delete().eq('user_id', userId);
        
        // Delete simulations
        await supabaseAdmin.from('capacite_emprunt_simulations').delete().eq('user_id', userId);
        await supabaseAdmin.from('epargne_precaution_simulations').delete().eq('user_id', userId);
        await supabaseAdmin.from('simulation_logs').delete().eq('user_id', userId);
        
        // Delete financial profile
        await supabaseAdmin.from('user_financial_profiles').delete().eq('user_id', userId);
        
        // Delete forum content (likes first, then comments, then posts)
        await supabaseAdmin.from('forum_comment_likes').delete().eq('user_id', userId);
        await supabaseAdmin.from('forum_post_likes').delete().eq('user_id', userId);
        await supabaseAdmin.from('forum_comments').delete().eq('author_id', userId);
        await supabaseAdmin.from('forum_posts').delete().eq('author_id', userId);
        
        // Delete hubspot appointments
        await supabaseAdmin.from('hubspot_appointments').delete().eq('user_id', userId);
        
        // Delete tax declaration requests
        await supabaseAdmin.from('tax_declaration_requests').delete().eq('user_id', userId);
        
        // Delete booking referrers
        await supabaseAdmin.from('booking_referrers').delete().eq('user_id', userId);
        
        // Delete simulations (generic table)
        await supabaseAdmin.from('simulations').delete().eq('user_id', userId);
        
        // Delete coach mark progress
        await supabaseAdmin.from('coach_mark_progress').delete().eq('user_id', userId);
        
        // Delete CSAT responses
        await supabaseAdmin.from('csat_responses').delete().eq('user_id', userId);
        
        // Delete notifications
        await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
        
        // Delete onboarding responses
        await supabaseAdmin.from('onboarding_responses').delete().eq('user_id', userId);
        
        // Delete video progress
        await supabaseAdmin.from('video_progress').delete().eq('user_id', userId);
        
        // Delete colleague invitations (as inviter AND as registered user)
        await supabaseAdmin.from('colleague_invitations').delete().eq('inviter_id', userId);
        await supabaseAdmin.from('colleague_invitations').delete().eq('registered_user_id', userId);
        
        // 2. Delete the profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) {
          console.error(`Error deleting profile ${userId}:`, profileError);
        }

        // 3. Hard delete from auth.users
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
          // 404 means user was already deleted from auth - treat as success
          if (authError.message?.includes('not found') || authError.message?.includes('404')) {
            console.log(`Auth user ${userId} already deleted, treating as success`);
            results.push({ userId, success: true });
          } else {
            console.error(`Error deleting auth user ${userId}:`, authError);
            results.push({ userId, success: false, error: 'Failed to delete user' });
          }
        } else {
          console.log(`Successfully deleted user ${userId}`);
          results.push({ userId, success: true });
        }
      } catch (err) {
        console.error(`Exception deleting user ${userId}:`, err);
        results.push({ userId, success: false, error: 'Failed to process user deletion' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: { deleted: successCount, failed: failCount }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
