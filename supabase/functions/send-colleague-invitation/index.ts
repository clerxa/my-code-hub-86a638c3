import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invitationId }: InvitationEmailRequest = await req.json();

    console.log("Processing invitation:", invitationId);

    // Fetch invitation details
    const { data: invitation, error: invError } = await supabase
      .from("colleague_invitations")
      .select("*")
      .eq("id", invitationId)
      .maybeSingle();

    if (invError) {
      console.error("Error fetching invitation:", invError);
      throw new Error(`Database error: ${invError.message}`);
    }

    if (!invitation) {
      console.error("Invitation not found for ID:", invitationId);
      throw new Error("Invitation not found");
    }

    console.log("Found invitation:", invitation);

    // Fetch inviter profile
    const { data: inviter, error: inviterError } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", invitation.inviter_id)
      .maybeSingle();

    if (inviterError) {
      console.error("Error fetching inviter:", inviterError);
    }

    console.log("Inviter:", inviter);

    // Fetch company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name, logo_url, primary_color")
      .eq("id", invitation.company_id)
      .maybeSingle();

    if (companyError) {
      console.error("Error fetching company:", companyError);
    }

    console.log("Company:", company);

    // Generate onboarding link with tracking token
    // Users will complete onboarding first, then be redirected to signup
    const baseUrl = Deno.env.get("SITE_URL") || "https://fincare.app";
    const trackingParams = `invitation=${invitation.invitation_token}&company=${invitation.company_id}`;
    const registrationLink = `${baseUrl}/onboarding?${trackingParams}`;
    const inviterName = `${inviter?.first_name || ""} ${inviter?.last_name || ""}`.trim() || "Un collègue";
    const primaryColor = company?.primary_color || "#3b82f6";

    // Fetch email template from admin settings
    const { data: templateData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "invite_colleague_email_template")
      .maybeSingle();

    const defaultTemplate = {
      subject: "{{inviter_name}} vous invite à rejoindre FinCare",
      buttonLink: "{{registration_link}}",
      buttonText: "Rejoindre FinCare",
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: {{primary_color}}; font-family: Arial, sans-serif; font-size: 24px; margin: 0 0 20px 0;">Bonjour {{colleague_first_name}},</h1>
              <p style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">{{inviter_name}} vous invite à rejoindre <strong>{{company_name}}</strong> sur FinCare.</p>
              <p style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; margin: 0 0 10px 0;">FinCare est une plateforme d'éducation financière qui vous permettra de :</p>
              <ul style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; margin: 0 0 30px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Simuler vos économies d'impôts</li>
                <li style="margin-bottom: 8px;">Suivre des formations sur la gestion de patrimoine</li>
                <li style="margin-bottom: 8px;">Prendre rendez-vous avec un expert financier</li>
              </ul>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: {{primary_color}};">
                    <a href="{{button_link}}" target="_blank" style="display: inline-block; padding: 15px 30px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold;">{{button_text}}</a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-family: Arial, sans-serif; font-size: 12px; line-height: 18px; margin: 30px 0 0 0;">Ce lien est unique et permet de suivre votre inscription.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    };

    const template = templateData?.value ? JSON.parse(templateData.value) : defaultTemplate;
    
    // Determine button link - ALWAYS use /onboarding path for colleague invitations
    let buttonLink = template.buttonLink || defaultTemplate.buttonLink;
    
    // If buttonLink is the placeholder or empty, use the registration link (which already points to /onboarding)
    if (!buttonLink || buttonLink === "{{registration_link}}") {
      buttonLink = registrationLink;
    } else {
      // Custom URL provided - we need to ensure it goes to /onboarding
      // Parse the custom URL and replace the path with /onboarding
      try {
        const customUrl = new URL(buttonLink);
        // Force the path to /onboarding for colleague invitations
        customUrl.pathname = '/onboarding';
        // Add tracking parameters
        customUrl.searchParams.set('invitation', invitation.invitation_token);
        customUrl.searchParams.set('company', invitation.company_id);
        buttonLink = customUrl.toString();
      } catch (e) {
        // If URL parsing fails, fall back to default registration link
        console.error("Error parsing custom URL, using default:", e);
        buttonLink = registrationLink;
      }
    }
    
    const buttonText = template.buttonText || defaultTemplate.buttonText;

    console.log("Custom buttonLink from admin:", template.buttonLink);
    console.log("Final buttonLink with tracking:", buttonLink);

    // Replace all placeholders
    const subject = (template.subject || defaultTemplate.subject)
      .replace(/\{\{inviter_name\}\}/g, inviterName)
      .replace(/\{\{company_name\}\}/g, company?.name || "")
      .replace(/\{\{colleague_first_name\}\}/g, invitation.colleague_first_name);

    // IMPORTANT: Replace {{registration_link}} with the custom buttonLink from admin settings
    // This allows admins to customize the destination URL in the email
    let body = (template.body || defaultTemplate.body)
      .replace(/\{\{inviter_name\}\}/g, inviterName)
      .replace(/\{\{company_name\}\}/g, company?.name || "")
      .replace(/\{\{colleague_first_name\}\}/g, invitation.colleague_first_name)
      .replace(/\{\{colleague_last_name\}\}/g, invitation.colleague_last_name)
      .replace(/\{\{primary_color\}\}/g, primaryColor)
      .replace(/\{\{button_link\}\}/g, buttonLink)
      .replace(/\{\{button_text\}\}/g, buttonText)
      .replace(/\{\{registration_link\}\}/g, buttonLink);

    // Remove any conditional message blocks since we no longer use message field
    body = body.replace(/\{\{#if message\}\}[\s\S]*?\{\{\/if\}\}/g, "");
    body = body.replace(/\{\{message\}\}/g, "");

    // Add tracking pixel for email open detection (insert before closing </body> tag)
    const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-invitation?token=${invitation.invitation_token}&action=open`;
    const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
    body = body.replace(/<\/body>/i, `${trackingPixel}</body>`);
      
    console.log("Using admin template, button link:", buttonLink);
    console.log("Sending email to:", invitation.colleague_email);
    console.log("Subject:", subject);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "FinCare <noreply@notifications.fincare.fr>",
      to: [invitation.colleague_email],
      subject: subject,
      html: body,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update invitation with email_sent_at
    await supabase
      .from("colleague_invitations")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", invitationId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-colleague-invitation:", error);
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
