import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  emails: string[];
  companyId: string;
  firstName?: string | null;
  lastName?: string | null;
  sendEmail?: boolean;
}

type ResendSendParams = {
  to: string[];
  subject: string;
  html: string;
};

const PRIMARY_FROM = "FinCare <noreply@notifications.fincare.fr>";
// Fallback sender that works without custom domain verification in Resend.
// Once mail.fincare.fr is verified in Resend, the primary sender will be used.
const FALLBACK_FROM = "FinCare <onboarding@resend.dev>";

async function sendResendEmailWithFallback(
  resend: Resend,
  params: ResendSendParams
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

  // 1) Try primary sender
  const primary = await attempt(PRIMARY_FROM);
  if (!primary.error) return { sent: true, usedFrom: PRIMARY_FROM };

  const msg =
    typeof primary.error === "object" && primary.error && "message" in primary.error
      ? String((primary.error as any).message)
      : String(primary.error);

  // 2) If the custom domain is not verified, retry with Resend's verified domain.
  if (msg.toLowerCase().includes("domain") && msg.toLowerCase().includes("not verified")) {
    console.warn(
      `Resend domain not verified for sender ${PRIMARY_FROM}. Retrying with fallback sender ${FALLBACK_FROM}. Error:`,
      primary.error
    );
    const fallback = await attempt(FALLBACK_FROM);
    if (!fallback.error) return { sent: true, usedFrom: FALLBACK_FROM };
    return { sent: false, usedFrom: FALLBACK_FROM, error: fallback.error };
  }

  return { sent: false, usedFrom: PRIMARY_FROM, error: primary.error };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Create admin client for privileged operations (matching create-test-users pattern)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is authenticated by decoding the JWT payload directly
    // This avoids session-based validation which fails when sessions are invalidated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Decode JWT payload to extract user ID (no signature check needed - admin API will verify user exists)
    let userId: string;
    try {
      const payloadBase64 = token.split(".")[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson);
      userId = payload.sub;
      if (!userId) throw new Error("No sub in token");
      
      // Check token expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error("Token expired");
      }
    } catch (e: any) {
      console.error("JWT decode failed:", e.message);
      throw new Error("Unauthorized");
    }

    // Verify user actually exists via admin API (doesn't depend on session)
    const { data: adminUser, error: adminUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (adminUserError || !adminUser?.user) {
      console.error("User verification failed:", adminUserError?.message);
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      throw new Error("Admin access required");
    }

    const body: InviteRequest = await req.json();
    const { emails, companyId, firstName, lastName, sendEmail = true } = body;

    if (!emails || emails.length === 0) {
      throw new Error("No emails provided");
    }

    if (!companyId) {
      throw new Error("Company ID is required");
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError || !company) {
      throw new Error("Company not found");
    }

    // Always use production URL for email links so users land on the correct domain
    const origin = "https://myfincare.fr";

    console.log(
      `Creating ${emails.length} beta user(s) for company: ${company.name}`
    );

    const results: Array<{
      email: string;
      success: boolean;
      error?: string;
      userId?: string;
      emailSent?: boolean;
    }> = [];

    // Initialize Resend if API key is available
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    for (const email of emails) {
      try {
        // Check if user already exists
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, email")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          // User exists - update company_id if needed
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ company_id: companyId })
            .eq("id", existingProfile.id);

          if (updateError) {
            results.push({
              email,
              success: false,
              error: `Failed to update existing user: ${updateError.message}`,
            });
            continue;
          }
          
          console.log(`Updated existing user ${email} to company ${companyId}`);
          
          // Send email even for existing users
          let emailSent = false;
          if (sendEmail && resend) {
            try {
              // Generate password recovery link
              const { data: linkData, error: linkError } =
                await supabaseAdmin.auth.admin.generateLink({
                  type: "recovery",
                  email: email.toLowerCase(),
                  options: {
                    redirectTo: `${origin}/reset-password`,
                  },
                });

              if (linkError) {
                console.warn(`Failed to generate reset link for ${email}:`, linkError.message);
              } else if (linkData?.properties?.action_link) {
                const displayName = firstName || "Bonjour";

                 const sendResult = await sendResendEmailWithFallback(resend, {
                   to: [email.toLowerCase()],
                   subject: `Rappel : Votre accès à FinCare - ${company.name}`,
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
                            Votre compte FinCare est prêt ! Vous êtes rattaché(e) à <strong>${company.name}</strong>.
                          </p>
                          
                          <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px;">
                            Si vous avez oublié votre mot de passe ou souhaitez le réinitialiser, cliquez sur le bouton ci-dessous :
                          </p>
                          
                          <div style="text-align: center; margin: 32px 0;">
                            <a href="${linkData.properties.action_link}" 
                               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Réinitialiser mon mot de passe
                            </a>
                          </div>
                          
                          <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                            Ce lien est valable pendant 24 heures. Si vous n'avez pas demandé cet accès, vous pouvez ignorer cet email.
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
                   console.error(`Failed to send email to ${email}:`, sendResult.error);
                 } else {
                   emailSent = true;
                   console.log(
                     `Reminder email sent to existing user ${email} (from: ${sendResult.usedFrom})`
                   );
                 }
              }
            } catch (emailErr: any) {
              console.error(`Email sending error for ${email}:`, emailErr.message);
            }
            
            // Small delay to respect Resend rate limits
            await new Promise((resolve) => setTimeout(resolve, 600));
          }
          
          results.push({
            email,
            success: true,
            userId: existingProfile.id,
            emailSent,
          });
          continue;
        }

        // Generate a random password (user will reset it)
        const tempPassword = crypto.randomUUID();

        // Create the user
        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: email.toLowerCase(),
            password: tempPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              first_name: firstName || null,
              last_name: lastName || null,
              company_id: companyId,
            },
          });

        if (createError) {
          results.push({
            email,
            success: false,
            error: createError.message,
          });
          console.error(`Failed to create user ${email}:`, createError.message);
          continue;
        }

        // The profile should be created automatically via trigger
        // But as a safety net, upsert the profile in case the trigger didn't fire
        await supabaseAdmin
          .from("profiles")
          .upsert({
            id: newUser.user.id,
            email: email.toLowerCase(),
            company_id: companyId,
            first_name: firstName || null,
            last_name: lastName || null,
          }, { onConflict: "id" });

        let emailSent = false;

        // Send invitation email via Resend if requested
        if (sendEmail && resend) {
          try {
            // Generate password recovery link
            const { data: linkData, error: linkError } =
              await supabaseAdmin.auth.admin.generateLink({
                type: "recovery",
                email: email.toLowerCase(),
                options: {
                  redirectTo: `${origin}/reset-password`,
                },
              });

            if (linkError) {
              console.warn(`Failed to generate reset link for ${email}:`, linkError.message);
            } else if (linkData?.properties?.action_link) {
              // Send email via Resend
              const displayName = firstName ? `${firstName}` : "Bienvenue";

              const sendResult = await sendResendEmailWithFallback(resend, {
                to: [email.toLowerCase()],
                subject: `Votre accès à FinCare - ${company.name}`,
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
                        <h2 style="color: #18181b; margin: 0 0 16px; font-size: 20px;">Bonjour ${displayName},</h2>
                        
                        <p style="color: #52525b; line-height: 1.6; margin: 0 0 16px;">
                          Vous avez été invité(e) à rejoindre la plateforme FinCare dans le cadre du partenariat avec <strong>${company.name}</strong>.
                        </p>
                        
                        <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px;">
                          Pour accéder à votre espace personnel et découvrir tous les outils mis à votre disposition, veuillez créer votre mot de passe en cliquant sur le bouton ci-dessous :
                        </p>
                        
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${linkData.properties.action_link}" 
                             style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Créer mon mot de passe
                          </a>
                        </div>
                        
                        <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                          Ce lien est valable pendant 24 heures. Si vous n'avez pas demandé cet accès, vous pouvez ignorer cet email.
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
                console.error(`Failed to send email to ${email}:`, sendResult.error);
              } else {
                emailSent = true;
                console.log(`Invitation email sent to ${email} (from: ${sendResult.usedFrom})`);
              }
            }
          } catch (emailErr: any) {
            console.error(`Email sending error for ${email}:`, emailErr.message);
          }
        }

        results.push({
          email,
          success: true,
          userId: newUser.user.id,
          emailSent,
        });
        console.log(`Created beta user: ${email} (email sent: ${emailSent})`);

        // Small delay to respect Resend rate limits
        if (sendEmail && resend) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      } catch (error: any) {
        results.push({
          email,
          success: false,
          error: error.message,
        });
        console.error(`Error processing ${email}:`, error.message);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const emailsSent = results.filter((r) => r.emailSent).length;

    console.log(`Completed: ${successCount} success, ${failCount} failed, ${emailsSent} emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: emails.length,
          created: successCount,
          failed: failCount,
          emailsSent,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-beta-users:", error);
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
