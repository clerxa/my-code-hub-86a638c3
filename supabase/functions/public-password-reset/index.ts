import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResetRequest {
  email: string;
}

const PRIMARY_FROM = "FinCare <noreply@notifications.fincare.fr>";
const FALLBACK_FROM = "FinCare <onboarding@resend.dev>";

async function sendResendEmailWithFallback(
  resend: Resend,
  params: { to: string[]; subject: string; html: string }
): Promise<{ sent: boolean; usedFrom?: string; error?: unknown }> {
  const attempt = async (from: string) => {
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { error };
  };

  // Try primary sender
  const primary = await attempt(PRIMARY_FROM);
  if (!primary.error) return { sent: true, usedFrom: PRIMARY_FROM };

  const msg =
    typeof primary.error === "object" && primary.error && "message" in primary.error
      ? String((primary.error as any).message)
      : String(primary.error);

  // If the custom domain is not verified, retry with fallback
  if (msg.toLowerCase().includes("domain") && msg.toLowerCase().includes("not verified")) {
    console.warn(`Domain not verified, retrying with fallback sender`);
    const fallback = await attempt(FALLBACK_FROM);
    if (!fallback.error) return { sent: true, usedFrom: FALLBACK_FROM };
    return { sent: false, usedFrom: FALLBACK_FROM, error: fallback.error };
  }

  return { sent: false, usedFrom: PRIMARY_FROM, error: primary.error };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: ResetRequest = await req.json();
    const { email } = body;

    if (!email) {
      throw new Error("Email is required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Password reset requested for: ${normalizedEmail}`);

    // Get user profile by email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, first_name, last_name, company_id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // For security reasons, always return success even if user doesn't exist
    // to prevent email enumeration attacks
    if (!profile) {
      console.log(`No profile found for email: ${normalizedEmail}, returning success anyway`);
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get company name if exists
    let companyName = "";
    if (profile.company_id) {
      const { data: company } = await supabaseAdmin
        .from("companies")
        .select("name")
        .eq("id", profile.company_id)
        .maybeSingle();
      companyName = company?.name || "";
    }

    // Always use the production domain for password reset links
    const origin = "https://myfincare.fr";

    // Generate password recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: profile.email.toLowerCase(),
      options: {
        redirectTo: `${origin}/reset-password`,
      },
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Failed to generate reset link:", linkError);
      throw new Error(`Failed to generate reset link: ${linkError?.message || "Unknown error"}`);
    }

    // Build a link to our app page with the token_hash as a query param.
    // This prevents email scanners (Outlook Safe Links) from consuming the one-time token
    // by pre-fetching the Supabase /verify endpoint.
    const resetLink = `${origin}/reset-password?token_hash=${linkData.properties.hashed_token}&type=recovery`;

    console.log(`Generated reset link for ${profile.email}`);

    // Send email via Resend
    const resend = new Resend(resendApiKey);
    const displayName = profile.first_name || "Bonjour";

    const sendResult = await sendResendEmailWithFallback(resend, {
      to: [profile.email.toLowerCase()],
      subject: "Réinitialisez votre mot de passe FinCare",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">FinCare</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Votre bien-être financier</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 20px;">${displayName},</h2>
              
              <p style="color: #52525b; line-height: 1.6; margin: 0 0 16px;">
                Vous avez demandé la réinitialisation de votre mot de passe pour accéder à votre compte FinCare${companyName ? ` (${companyName})` : ""}.
              </p>
              
              <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px;">
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                Ce lien est valable pendant 24 heures. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f4f4f5; padding: 24px 32px; text-align: center;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} FinCare. Tous droits réservés.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (!sendResult.sent) {
      console.error("Failed to send password reset email:", sendResult.error);
      throw new Error("Failed to send email");
    }

    console.log(`Password reset email sent to ${profile.email} (from: ${sendResult.usedFrom})`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in public-password-reset:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
