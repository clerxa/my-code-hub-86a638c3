import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const APP_URL = "https://myfincare-perlib.lovable.app";

/**
 * Reminder thresholds: each type with the number of days before the webinar
 */
const REMINDER_THRESHOLDS = [
  { type: "M-1", days: 30 },
  { type: "S-2", days: 14 },
  { type: "S-1", days: 7 },
  { type: "J-1", days: 1 },
];

const sanitize = (text: string | null | undefined): string => {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  };
  return date.toLocaleDateString("fr-FR", options);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getFirstName(nom: string): string {
  // company_contacts.nom can be "Prénom Nom" or just "Prénom"
  const parts = nom.trim().split(/\s+/);
  return parts[0] || nom;
}

function buildEmailHtml(
  contactName: string,
  webinarDate: string,
  daysLeft: number,
  companyName: string,
  webinarPageUrl: string,
  webinarTitle: string
): string {
  const firstName = sanitize(getFirstName(contactName));
  const formattedDate = formatDate(webinarDate);
  const safeName = sanitize(companyName);
  const safeTitle = sanitize(webinarTitle);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rappel Webinar</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 600;">
                📅 Rappel Webinar
              </h1>
              <p style="color: #e2b75e; font-size: 14px; margin: 8px 0 0; font-weight: 500;">
                ${safeTitle}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px;">
                Bonjour ${firstName},
              </p>
              
              <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px;">
                Votre prochain webinar est prévu le <strong>${formattedDate}</strong>, soit dans <strong>${daysLeft} jour${daysLeft > 1 ? "s" : ""}</strong>.
              </p>

              <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 24px;">
                N'oubliez pas d'envoyer la relance de communication aux salariés de <strong>${safeName}</strong>.
              </p>

              <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 24px;">
                Vous retrouverez les éléments de communication via ce lien :
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${webinarPageUrl}" style="display: inline-block; background-color: #e2b75e; color: #1a1a2e; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      Accéder à la page du webinar
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

              <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 8px;">
                FinCare par Perlib vous remercie pour votre confiance et se tient à votre disposition pour tout renseignement complémentaire.
              </p>

              <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 24px 0 0; font-weight: 500;">
                Xavier de FinCare
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #999999; margin: 0;">
                FinCare est l'application d'éducation financière de Perlib.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "FinCare <noreply@notifications.fincare.fr>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email to ${to}: ${error}`);
  }

  return response.json();
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all upcoming webinars that have been selected by companies
    const { data: selections, error: selError } = await supabase
      .from("company_webinar_selections")
      .select(`
        id,
        company_id,
        module_id,
        session_id,
        companies!company_webinar_selections_company_id_fkey (
          id,
          name
        ),
        webinar_sessions!company_webinar_selections_session_id_fkey (
          id,
          session_date
        ),
        modules!company_webinar_selections_module_id_fkey (
          id,
          title
        )
      `);

    if (selError) throw new Error(`Error fetching selections: ${selError.message}`);

    const now = new Date();
    let totalSent = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (const sel of selections || []) {
      const session = (sel as any).webinar_sessions;
      const company = (sel as any).companies;
      const module = (sel as any).modules;

      if (!session?.session_date || !company?.id || !module?.title) continue;

      const sessionDate = new Date(session.session_date);
      if (sessionDate <= now) continue; // past webinar

      const daysLeft = daysUntil(session.session_date);

      // Check which reminders should be sent today
      for (const threshold of REMINDER_THRESHOLDS) {
        // Allow a 1-day window for each reminder (in case cron runs slightly off)
        if (daysLeft > threshold.days + 1 || daysLeft < threshold.days - 1) continue;

        // Get all contacts for this company
        const { data: contacts, error: contactError } = await supabase
          .from("company_contacts")
          .select("id, nom, email")
          .eq("company_id", company.id);

        if (contactError) {
          errors.push(`Error fetching contacts for ${company.name}: ${contactError.message}`);
          continue;
        }

        for (const contact of contacts || []) {
          if (!contact.email) continue;

          // Check if this reminder was already sent (anti-doublon)
          const { data: existing } = await supabase
            .from("webinar_reminder_logs")
            .select("id")
            .eq("company_id", company.id)
            .eq("session_id", session.id)
            .eq("contact_id", contact.id)
            .eq("reminder_type", threshold.type)
            .maybeSingle();

          if (existing) {
            totalSkipped++;
            continue;
          }

          // Build the webinar page URL
          const webinarPageUrl = `${APP_URL}/company/${company.id}/dashboard/webinar/${sel.module_id}`;

          const subject = `📅 Rappel : Webinar "${module.title}" dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`;

          const html = buildEmailHtml(
            contact.nom,
            session.session_date,
            daysLeft,
            company.name,
            webinarPageUrl,
            module.title
          );

          try {
            await sendEmail(contact.email, subject, html);

            // Log the sent reminder
            await supabase.from("webinar_reminder_logs").insert({
              company_id: company.id,
              session_id: session.id,
              contact_id: contact.id,
              reminder_type: threshold.type,
            });

            totalSent++;
            console.log(`✅ Sent ${threshold.type} reminder to ${contact.email} for ${module.title} (${company.name})`);
          } catch (emailError: any) {
            errors.push(`Failed to send to ${contact.email}: ${emailError.message}`);
          }
        }
      }
    }

    const result = {
      success: true,
      totalSent,
      totalSkipped,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log("Webinar reminder run:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-webinar-reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
