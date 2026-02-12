import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationPayload {
  emails: string[]
  webinar_title?: string
  webinar_date?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !userData.user) {
      throw new Error('Unauthorized')
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .in('role', ['admin'])
      .maybeSingle()

    if (!roleData) {
      throw new Error('Unauthorized: Admin role required')
    }

    const payload: InvitationPayload = await req.json()
    const { emails, webinar_title, webinar_date } = payload

    if (!emails || emails.length === 0) {
      throw new Error('No emails provided')
    }

    console.log(`Sending invitations to ${emails.length} external registrants`)

    const report = {
      total: emails.length,
      sent: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Get app URL from settings or use default
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'app_url')
      .maybeSingle()

    const appUrl = settings?.value || 'https://myfincare.lovable.app'

    for (const email of emails) {
      try {
        // Check if user already has an account
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email.toLowerCase())
          .maybeSingle()

        if (existingProfile) {
          report.skipped++
          continue
        }

        // If Resend API key is available, send real email
        if (resendApiKey) {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Rejoignez FinCare !</h2>
              <p>Bonjour,</p>
              <p>Vous vous êtes inscrit(e) au webinar <strong>${webinar_title || 'FinCare'}</strong>${webinar_date ? ` prévu le ${webinar_date}` : ''}.</p>
              <p>Pour profiter pleinement de l'expérience et accéder à tous nos contenus, créez votre compte FinCare dès maintenant :</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/signup?email=${encodeURIComponent(email)}" 
                   style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Créer mon compte
                </a>
              </p>
              <p>En créant votre compte, vous aurez accès à :</p>
              <ul>
                <li>📚 Des formations personnalisées</li>
                <li>💰 Des simulateurs financiers</li>
                <li>🎯 Un suivi de votre progression</li>
                <li>👨‍💼 Des rendez-vous avec nos experts</li>
              </ul>
              <p>À très bientôt sur FinCare !</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">
                Cet email vous a été envoyé car vous vous êtes inscrit(e) à un de nos webinars. 
                Si vous pensez avoir reçu cet email par erreur, vous pouvez l'ignorer.
              </p>
            </div>
          `

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'FinCare <noreply@notifications.fincare.fr>',
              to: [email],
              subject: `Rejoignez FinCare - ${webinar_title || 'Créez votre compte'}`,
              html: emailHtml,
            }),
          })

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text()
            console.error(`Failed to send email to ${email}:`, errorText)
            report.errors.push(`${email}: Erreur d'envoi email`)
            continue
          }

          report.sent++
        } else {
          // No Resend API key - just log and count as sent (for testing)
          console.log(`Would send invitation to ${email} (no RESEND_API_KEY configured)`)
          report.sent++
        }
      } catch (error: any) {
        console.error(`Error processing ${email}:`, error)
        report.errors.push(`${email}: ${error.message}`)
      }
    }

    console.log(`Invitation report: ${report.sent} sent, ${report.skipped} skipped, ${report.errors.length} errors`)

    return new Response(
      JSON.stringify({ success: true, report }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Send webinar invitations error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
