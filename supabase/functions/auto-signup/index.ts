import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Personal email domains to block
const PERSONAL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'live.fr', 'live.com', 'protonmail.com', 'icloud.com',
  'aol.com', 'mail.com', 'yandex.com', 'zoho.com',
  'gmx.com', 'inbox.com', 'me.com', 'yahoo.fr',
  'orange.fr', 'free.fr', 'laposte.net', 'wanadoo.fr',
  'sfr.fr', 'bbox.fr'
];

// Validate email format strictly
function isValidEmail(email: string): boolean {
  // RFC 5322 simplified: no multiple @, valid domain, reasonable length
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) return false;
  if (email.length > 254) return false;
  // Reject multiple @ symbols
  if ((email.match(/@/g) || []).length !== 1) return false;
  return true;
}

// Extract main domain from email (handle subdomains)
function extractMainDomain(email: string): string {
  const emailLower = email.toLowerCase().trim();
  
  if (!isValidEmail(emailLower)) {
    throw new Error('Invalid email format');
  }
  
  const domain = emailLower.split('@')[1];
  
  // Validate domain length
  if (domain.length > 255) throw new Error('Invalid email domain');
  
  // Validate domain has valid TLD (at least 2 chars)
  const parts = domain.split('.');
  if (parts.length < 2 || parts[parts.length - 1].length < 2) {
    throw new Error('Invalid email domain');
  }
  
  // Handle subdomains by keeping only the last two parts
  if (parts.length > 2) {
    return parts.slice(-2).join('.');
  }
  
  return domain;
}

// Check if user is admin
async function isUserAdmin(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
  
  return !error && data !== null;
}

// Find or create company by domain
async function findOrCreateCompany(supabaseAdmin: any, domain: string): Promise<{ id: string; name: string; partnership_type: string | null }> {
  // Try to find existing company with this domain in email_domains array
  // Check both with and without @ prefix
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('id, name, partnership_type, email_domains');
  
  if (companies) {
    for (const company of companies) {
      const emailDomains = company.email_domains || [];
      // Check if domain matches any entry in the array (with or without @)
      if (emailDomains.includes(domain) || emailDomains.includes(`@${domain}`)) {
        console.log('Found existing company:', company.name);
        return {
          id: company.id,
          name: company.name,
          partnership_type: company.partnership_type
        };
      }
    }
  }
  
  // Create new company
  const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  
  const { data: newCompany, error } = await supabaseAdmin
    .from('companies')
    .insert({
      name: companyName,
      email_domains: [`@${domain}`, domain],
      partnership_type: null, // Non-partner by default
      primary_color: '#3b82f6',
      secondary_color: '#8b5cf6'
    })
    .select('id, name, partnership_type')
    .single();
  
  if (error) {
    console.error('Error creating company:', error);
    throw error;
  }
  
  console.log('Created new company:', newCompany.name);
  return newCompany;
}

// Link onboarding responses to user and assign parcours
// Returns true if onboarding responses were found and linked
async function linkOnboardingAndAssignParcours(
  supabaseAdmin: any,
  userId: string,
  onboardingSessionId: string | null
): Promise<boolean> {
  if (!onboardingSessionId) {
    console.log('No onboarding session ID provided, skipping parcours assignment');
    return false;
  }

  console.log('Linking onboarding session:', onboardingSessionId);

  // 1. Update onboarding responses to link them to the user
  const { error: updateError } = await supabaseAdmin
    .from('onboarding_responses')
    .update({ user_id: userId })
    .eq('session_id', onboardingSessionId)
    .is('user_id', null);

  if (updateError) {
    console.error('Error linking onboarding responses:', updateError);
    return false;
  }

  // 2. Get all responses with their screen options
  const { data: responses, error: fetchError } = await supabaseAdmin
    .from('onboarding_responses')
    .select(`
      screen_id,
      response_value,
      onboarding_screens!inner(options)
    `)
    .eq('session_id', onboardingSessionId);

  if (fetchError) {
    console.error('Error fetching onboarding responses:', fetchError);
    return false;
  }

  const responsesCount = responses?.length || 0;
  console.log('Found', responsesCount, 'onboarding responses');
  
  // If we found onboarding responses, user has completed the public onboarding
  const hasCompletedOnboarding = responsesCount > 0;

  // 3. Find parcours to assign based on selected options
  const parcoursToAssign: Set<string> = new Set();

  for (const response of responses || []) {
    const options = response.onboarding_screens?.options || [];
    const responseValue = response.response_value;

    for (const option of options) {
      // Check if this option was selected
      const isSelected = 
        responseValue === option.value ||
        responseValue === String(option.value) ||
        (Array.isArray(responseValue) && responseValue.includes(option.value));

      if (isSelected && option.parcoursId) {
        console.log('Found parcours to assign:', option.parcoursId, 'from option:', option.label);
        parcoursToAssign.add(option.parcoursId);
      }
    }
  }

  // 4. Insert user_parcours entries
  if (parcoursToAssign.size > 0) {
    const entries = Array.from(parcoursToAssign).map(parcoursId => ({
      user_id: userId,
      parcours_id: parcoursId,
      source: 'onboarding',
      onboarding_session_id: onboardingSessionId,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('user_parcours')
      .upsert(entries, { onConflict: 'user_id,parcours_id' });

    if (insertError) {
      console.error('Error assigning parcours:', insertError);
    } else {
      console.log('Assigned', entries.length, 'parcours to user');
    }
  }

  return hasCompletedOnboarding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password, firstName, lastName, onboardingSessionId, invitationToken } = await req.json();

    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and normalize domain
    const domain = extractMainDomain(email);
    console.log('Extracted domain:', domain);

    // Check if it's a personal email domain
    if (PERSONAL_DOMAINS.includes(domain)) {
      // Check if personal emails are allowed in beta mode
      const { data: betaSetting } = await supabaseAdmin
        .from('global_settings')
        .select('value')
        .eq('category', 'beta')
        .eq('key', 'allow_personal_emails')
        .single();

      const allowPersonalEmails = betaSetting?.value === true || betaSetting?.value === 'true';
      
      if (!allowPersonalEmails) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'personal_email',
            message: 'Votre email doit être un email professionnel. Les adresses personnelles ne sont pas autorisées.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Personal email allowed in beta mode:', email);
    }

    // Find or create company
    const company = await findOrCreateCompany(supabaseAdmin, domain);

    // Create user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Auto-confirm for better UX
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_id: company.id
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: authError.message.includes('already') ? 'already_exists' : 'auth_error',
          message: authError.message.includes('already') 
            ? 'Cet email est déjà utilisé' 
            : 'Erreur lors de la création du compte'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', authData.user.id);

// Link onboarding responses and assign parcours
    const hasCompletedOnboarding = await linkOnboardingAndAssignParcours(supabaseAdmin, authData.user.id, onboardingSessionId);

    // If user completed public onboarding, mark employee_onboarding_completed = true
    if (hasCompletedOnboarding) {
      console.log('Marking employee_onboarding_completed = true for user:', authData.user.id);
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ employee_onboarding_completed: true })
        .eq('id', authData.user.id);
      
      if (profileUpdateError) {
        console.error('Error updating profile onboarding status:', profileUpdateError);
      }
    }

    // Track invitation registration if token provided
    if (invitationToken) {
      console.log('Tracking invitation registration for token:', invitationToken);
      const { error: inviteError } = await supabaseAdmin
        .from('colleague_invitations')
        .update({
          status: 'registered',
          registered_at: new Date().toISOString(),
          registered_user_id: authData.user.id
        })
        .eq('invitation_token', invitationToken);

      if (inviteError) {
        console.error('Error updating invitation status:', inviteError);
      } else {
        console.log('Invitation marked as registered');
      }
    }

    // Return success with company info
    return new Response(
      JSON.stringify({ 
        success: true,
        user: authData.user,
        company: {
          id: company.id,
          name: company.name,
          has_partnership: company.partnership_type !== null
        },
        onboarding_completed: hasCompletedOnboarding
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'server_error',
        message: 'Erreur serveur inattendue'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

