import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRIMARY_FROM = "FinCare <noreply@notifications.fincare.fr>";
const FALLBACK_FROM = "FinCare <onboarding@resend.dev>";
const SITE_URL = "https://myfincare.fr";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Auth: get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, first_name, email_verified, email_verification_sent_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Profile not found");
    if (profile.email_verified) {
      return new Response(
        JSON.stringify({ success: true, already_verified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: 1 email per 60 seconds
    if (profile.email_verification_sent_at) {
      const lastSent = new Date(profile.email_verification_sent_at).getTime();
      if (Date.now() - lastSent < 60000) {
        return new Response(
          JSON.stringify({ success: false, error: "Veuillez patienter avant de renvoyer un email." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate token
    const token = crypto.randomUUID();

    // Save token
    await supabaseAdmin
      .from("profiles")
      .update({
        email_verification_token: token,
        email_verification_sent_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Build verification link
    const verificationLink = `${SITE_URL}/verify-email?token=${token}`;
    const firstName = profile.first_name || "là";

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">Vérification de votre email</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#333;line-height:1.6;">Bonjour ${firstName} 👋</p>
      <p style="font-size:14px;color:#555;line-height:1.6;">
        Pour finaliser votre inscription sur <strong>MyFinCare</strong>, 
        veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verificationLink}" 
           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
          Confirmer mon email
        </a>
      </div>
      <p style="font-size:12px;color:#999;line-height:1.5;text-align:center;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${verificationLink}" style="color:#6366f1;word-break:break-all;">${verificationLink}</a>
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="font-size:11px;color:#999;margin:0;">© ${new Date().getFullYear()} MyFinCare — Cet email a été envoyé automatiquement.</p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const resend = new Resend(resendApiKey);
    
    let sendResult;
    try {
      const { error } = await resend.emails.send({
        from: PRIMARY_FROM,
        to: [profile.email],
        subject: "Confirmez votre adresse email — MyFinCare",
        html,
      });
      if (error) throw error;
      sendResult = { sent: true, from: PRIMARY_FROM };
    } catch {
      // Fallback
      const { error } = await resend.emails.send({
        from: FALLBACK_FROM,
        to: [profile.email],
        subject: "Confirmez votre adresse email — MyFinCare",
        html,
      });
      if (error) throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
      sendResult = { sent: true, from: FALLBACK_FROM };
    }

    console.log(`Verification email sent to ${profile.email} from ${sendResult.from}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-verification-email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
