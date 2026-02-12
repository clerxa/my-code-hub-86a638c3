import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactMessageRequest {
  senderName: string;
  senderEmail: string;
  companyName: string;
  subject: string;
  message: string;
}

interface EmailConfig {
  admin_emails: string[];
  sender_domain: string;
  sender_name: string;
}

const defaultConfig: EmailConfig = {
  admin_emails: ["xavier.clermont@fincare.fr"],
  sender_domain: "notifications.fincare.fr",
  sender_name: "FinCare",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { senderName, senderEmail, companyName, subject, message }: ContactMessageRequest = await req.json();

    // Validate required fields
    if (!senderName || !senderEmail || !subject || !message) {
      throw new Error("Missing required fields");
    }

    // Get email configuration from settings
    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("metadata")
      .eq("key", "email_admin_config")
      .maybeSingle();

    const emailConfig: EmailConfig = settingsData?.metadata
      ? { ...defaultConfig, ...(settingsData.metadata as EmailConfig) }
      : defaultConfig;

    const adminEmails = emailConfig.admin_emails;
    const senderDomain = emailConfig.sender_domain;
    const senderDisplayName = emailConfig.sender_name;

    if (!adminEmails || adminEmails.length === 0) {
      throw new Error("No admin emails configured");
    }

    console.log(`Sending contact message to ${adminEmails.length} admin(s)`);

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📩 Nouveau message utilisateur</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
              <h2 style="margin-top: 0; color: #1e293b; font-size: 18px;">Informations de l'expéditeur</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 120px;">Nom :</td>
                  <td style="padding: 8px 0; font-weight: 600;">${senderName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Email :</td>
                  <td style="padding: 8px 0;"><a href="mailto:${senderEmail}" style="color: #0ea5e9; text-decoration: none;">${senderEmail}</a></td>
                </tr>
                ${companyName ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Entreprise :</td>
                  <td style="padding: 8px 0; font-weight: 600;">${companyName}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h2 style="margin-top: 0; color: #1e293b; font-size: 18px;">Message</h2>
              <p style="color: #64748b; margin-bottom: 8px;"><strong>Sujet :</strong> ${subject}</p>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin-top: 10px;">
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                💡 <strong>Action requise :</strong> Répondez directement à cet email ou contactez l'utilisateur via <a href="mailto:${senderEmail}" style="color: #0ea5e9;">${senderEmail}</a>
              </p>
            </div>
          </div>

          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
            Ce message a été envoyé depuis la plateforme ${senderDisplayName}
          </p>
        </body>
      </html>
    `;

    // Try sending with configured domain, fallback to resend.dev
    let emailSent = false;
    let lastError: Error | null = null;

    // Try with configured domain first
    try {
      const { error } = await resend.emails.send({
        from: `${senderDisplayName} Contact <noreply@${senderDomain}>`,
        to: adminEmails,
        reply_to: senderEmail,
        subject: `[Contact ${senderDisplayName}] ${subject}`,
        html: emailHtml,
      });

      if (error) {
        throw error;
      }
      emailSent = true;
      console.log("Email sent successfully with configured domain");
    } catch (error) {
      console.warn("Failed to send with configured domain, trying fallback:", error);
      lastError = error as Error;
    }

    // Fallback to resend.dev if configured domain failed
    if (!emailSent) {
      try {
        const { error } = await resend.emails.send({
          from: `${senderDisplayName} Contact <onboarding@resend.dev>`,
          to: adminEmails,
          reply_to: senderEmail,
          subject: `[Contact ${senderDisplayName}] ${subject}`,
          html: emailHtml,
        });

        if (error) {
          throw error;
        }
        emailSent = true;
        console.log("Email sent successfully with fallback domain");
      } catch (error) {
        console.error("Failed to send with fallback domain:", error);
        lastError = error as Error;
      }
    }

    if (!emailSent) {
      throw lastError || new Error("Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, recipientCount: adminEmails.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-contact-message function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
