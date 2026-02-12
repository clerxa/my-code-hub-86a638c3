import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !userData.user) {
      throw new Error('Unauthorized');
    }

    // Vérifier que l'utilisateur est admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('Unauthorized: Admin role required');
    }

    const { userIds } = await req.json() as { userIds: string[] };

    if (!userIds || userIds.length === 0) {
      throw new Error('No user IDs provided');
    }

    const report = {
      total: userIds.length,
      sent: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const userId of userIds) {
      try {
        // Récupérer le profil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, statut_invitation')
          .eq('id', userId)
          .single();

        if (profileError || !profile) {
          report.errors.push(`Utilisateur ${userId}: profil introuvable`);
          continue;
        }

        // Ignorer les utilisateurs déjà inscrits (sauf si on veut permettre de renvoyer)
        if (profile.statut_invitation === 'inscrit') {
          report.skipped++;
          continue;
        }

        // Générer un magic link avec Supabase Auth
        const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: profile.email,
          options: {
            redirectTo: `${supabaseUrl.replace('.supabase.co', '')}/`,
          },
        });

        if (magicLinkError) {
          report.errors.push(`${profile.email}: Erreur génération lien - ${magicLinkError.message}`);
          continue;
        }

        // Note: Ici, vous devriez envoyer un vrai email via un service comme Resend, SendGrid, etc.
        // Pour l'instant, on log juste le lien et on met à jour le statut
        console.log(`Magic link for ${profile.email}:`, magicLinkData);

        // Mettre à jour le statut
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            statut_invitation: 'invitation_envoyée_en_attente_d_inscription',
            date_derniere_invitation: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          report.errors.push(`${profile.email}: Erreur mise à jour statut - ${updateError.message}`);
          continue;
        }

        report.sent++;
      } catch (error: any) {
        report.errors.push(`Utilisateur ${userId}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, report }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Send invitations error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});