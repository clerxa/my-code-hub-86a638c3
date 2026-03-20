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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate caller
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const body = await req.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No user IDs provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const results = [];

    for (const userId of userIds) {
      try {
        console.log(`Resetting all data for user ${userId}...`);

        // ── Delete all related data (same as delete-users but keep profile & auth) ──

        // Points & logins
        await supabaseAdmin.from('daily_logins').delete().eq('user_id', userId);

        // Appointments
        await supabaseAdmin.from('appointments').delete().eq('user_id', userId);
        await supabaseAdmin.from('appointment_preparation').delete().eq('user_id', userId);
        await supabaseAdmin.from('appointment_preparation_documents').delete().eq('user_id', userId);
        await supabaseAdmin.from('hubspot_appointments').delete().eq('user_id', userId);

        // Webinars
        await supabaseAdmin.from('webinar_registrations').delete().eq('user_id', userId);

        // Modules & parcours
        await supabaseAdmin.from('module_validations').delete().eq('user_id', userId);
        await supabaseAdmin.from('user_parcours').delete().eq('user_id', userId);
        await supabaseAdmin.from('parcours_progress').delete().eq('user_id', userId);

        // Simulations (all types)
        await supabaseAdmin.from('simulation_logs').delete().eq('user_id', userId);
        await supabaseAdmin.from('capacite_emprunt_simulations').delete().eq('user_id', userId);
        await supabaseAdmin.from('epargne_precaution_simulations').delete().eq('user_id', userId);
        await supabaseAdmin.from('bspce_simulations').delete().eq('user_id', userId);
        await supabaseAdmin.from('simulations').delete().eq('user_id', userId);

        // Financial profile
        await supabaseAdmin.from('user_financial_profiles').delete().eq('user_id', userId);

        // ATLAS / OCR analyses
        await supabaseAdmin.from('ocr_avis_imposition_analyses').delete().eq('user_id', userId);

        // ESPP plans & lots
        const { data: esppPlans } = await supabaseAdmin
          .from('espp_plans')
          .select('id')
          .eq('user_id', userId);
        if (esppPlans && esppPlans.length > 0) {
          const planIds = esppPlans.map((p: any) => p.id);
          await supabaseAdmin.from('espp_lots').delete().in('plan_id', planIds);
          await supabaseAdmin.from('espp_plans').delete().eq('user_id', userId);
        }

        // Diagnostic results
        await supabaseAdmin.from('diagnostic_results').delete().eq('user_id', userId);

        // Risk profile
        await supabaseAdmin.from('risk_profiles').delete().eq('user_id', userId);

        // Forum content
        await supabaseAdmin.from('forum_comment_likes').delete().eq('user_id', userId);
        await supabaseAdmin.from('forum_post_likes').delete().eq('user_id', userId);
        await supabaseAdmin.from('forum_comments').delete().eq('author_id', userId);
        await supabaseAdmin.from('forum_posts').delete().eq('author_id', userId);

        // Tax declarations
        await supabaseAdmin.from('tax_declaration_requests').delete().eq('user_id', userId);

        // Booking referrers
        await supabaseAdmin.from('booking_referrers').delete().eq('user_id', userId);

        // Coach marks
        await supabaseAdmin.from('coach_mark_progress').delete().eq('user_id', userId);

        // CSAT
        await supabaseAdmin.from('csat_responses').delete().eq('user_id', userId);

        // Notifications
        await supabaseAdmin.from('notifications').delete().eq('user_id', userId);

        // Onboarding
        await supabaseAdmin.from('onboarding_responses').delete().eq('user_id', userId);

        // Video progress
        await supabaseAdmin.from('video_progress').delete().eq('user_id', userId);

        // Colleague invitations
        await supabaseAdmin.from('colleague_invitations').delete().eq('inviter_id', userId);
        await supabaseAdmin.from('colleague_invitations').delete().eq('registered_user_id', userId);

        // Feedbacks
        await supabaseAdmin.from('feedbacks').delete().eq('user_id', userId);

        // Contact messages
        await supabaseAdmin.from('contact_messages').delete().eq('sender_id', userId);

        // VEGA plans
        await supabaseAdmin.from('vega_rsu_plans').delete().eq('user_id', userId);

        // ── Reset profile to blank (keep first_name, last_name, email, company_id, id) ──
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            total_points: 0,
            completed_modules: [],
            onboarding_completed: false,
            last_login: null,
            statut_invitation: 'en_attente',
            avatar_url: null,
            forum_anonymous: false,
            forum_pseudo: null,
          })
          .eq('id', userId);

        if (profileError) {
          console.error(`Error resetting profile ${userId}:`, profileError);
          results.push({ userId, success: false, error: 'Profile reset failed' });
        } else {
          console.log(`Successfully reset user ${userId}`);
          results.push({ userId, success: true });
        }
      } catch (err) {
        console.error(`Exception resetting user ${userId}:`, err);
        results.push({ userId, success: false, error: 'Reset failed' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ success: true, results, summary: { reset: successCount, failed: failCount } }),
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
