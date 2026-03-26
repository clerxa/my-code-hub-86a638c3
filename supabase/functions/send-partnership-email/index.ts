import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

/**
 * Sanitizes text for safe inclusion in HTML email templates.
 * Prevents XSS attacks by escaping HTML special characters.
 */
const sanitizeForEmail = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes multiline text for email, converting newlines to <br />.
 */
const sanitizeMultilineForEmail = (text: string | null | undefined): string => {
  if (!text) return '';
  return sanitizeForEmail(text).replace(/\n/g, '<br />');
};

/**
 * Validates email format.
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates string length.
 */
const isWithinLength = (text: string | null | undefined, maxLength: number): boolean => {
  if (!text) return true;
  return text.length <= maxLength;
};

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
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
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "partnership_request" | "contact_request";
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // This function accepts both authenticated and unauthenticated requests
    // For unauthenticated requests (landing page visitors), we rely on input validation
    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    console.log(`Email request from user: ${userId}`);

    const { type, data }: EmailRequest = await req.json();

    // Input validation
    if (!type || !data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type and data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate input lengths to prevent abuse
    const MAX_NAME_LENGTH = 100;
    const MAX_EMAIL_LENGTH = 255;
    const MAX_MESSAGE_LENGTH = 5000;
    const MAX_COMPANY_LENGTH = 255;

    // Fetch email configuration from CMS email-config
    const { data: emailConfigData, error: configError } = await supabase
      .from("settings")
      .select("metadata")
      .eq("key", "email_admin_config")
      .maybeSingle();

    if (configError) {
      console.error("Error fetching email config:", configError);
    }

    const emailConfig = emailConfigData?.metadata as any || {};
    const adminEmails = emailConfig.admin_emails || ["xavier.clermont@fincare.fr"];
    let recipientEmail: string;
    let emailSubject: string;
    let emailHtml: string;

    if (type === "partnership_request") {
      // Validate partnership request fields
      if (!isWithinLength(data.sender_first_name, MAX_NAME_LENGTH) ||
          !isWithinLength(data.sender_last_name, MAX_NAME_LENGTH) ||
          !isWithinLength(data.contact_first_name, MAX_NAME_LENGTH) ||
          !isWithinLength(data.contact_last_name, MAX_NAME_LENGTH) ||
          !isWithinLength(data.company_name, MAX_COMPANY_LENGTH) ||
          !isWithinLength(data.message, MAX_MESSAGE_LENGTH)) {
        return new Response(
          JSON.stringify({ error: "Input exceeds maximum length" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (data.sender_email && !isValidEmail(data.sender_email)) {
        return new Response(
          JSON.stringify({ error: "Invalid sender email format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (data.contact_email && !isValidEmail(data.contact_email)) {
        return new Response(
          JSON.stringify({ error: "Invalid contact email format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      recipientEmail = adminEmails[0];
      emailSubject = "Nouvelle demande de partenariat - FinCare";
      
      // Sanitize all user-provided data before including in HTML
      emailHtml = `
        <h2>Nouvelle demande de partenariat</h2>
        <p><strong>Employé demandeur :</strong> ${sanitizeForEmail(data.sender_first_name)} ${sanitizeForEmail(data.sender_last_name)}</p>
        <p><strong>Email employé :</strong> ${sanitizeForEmail(data.sender_email)}</p>
        <p><strong>Entreprise :</strong> ${sanitizeForEmail(data.company_name)}</p>
        <hr />
        <h3>Contact ciblé</h3>
        <p><strong>Nom :</strong> ${sanitizeForEmail(data.contact_first_name)} ${sanitizeForEmail(data.contact_last_name)}</p>
        <p><strong>Email :</strong> ${sanitizeForEmail(data.contact_email)}</p>
        <p><strong>Rôle :</strong> ${sanitizeForEmail(data.contact_role) || "Non spécifié"}</p>
        ${data.message ? `<p><strong>Message :</strong><br />${sanitizeMultilineForEmail(data.message)}</p>` : ""}
        <p><em>Date de la demande : ${new Date().toLocaleDateString("fr-FR")}</em></p>
      `;
    } else if (type === "webinar_theme_proposal") {
      // Validate webinar theme proposal fields
      if (!isWithinLength(data.theme_title, 200) ||
          !isWithinLength(data.theme_description, MAX_MESSAGE_LENGTH) ||
          !isWithinLength(data.contact_name, MAX_NAME_LENGTH)) {
        return new Response(
          JSON.stringify({ error: "Input exceeds maximum length" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (data.contact_email && !isValidEmail(data.contact_email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Fetch company name
      let companyName = "Non spécifié";
      if (data.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("name")
          .eq("id", data.company_id)
          .single();
        if (companyData) companyName = companyData.name;
      }

      recipientEmail = adminEmails[0];
      emailSubject = "Nouvelle proposition de thème webinar - FinCare";

      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">💡 Nouvelle proposition de thème webinar</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold; width: 40%;">Thème proposé</td>
              <td style="padding: 12px; border: 1px solid #e9ecef; font-weight: bold; color: #4f46e5;">${sanitizeForEmail(data.theme_title)}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">Entreprise</td>
              <td style="padding: 12px; border: 1px solid #e9ecef;">${sanitizeForEmail(companyName)}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">Contact</td>
              <td style="padding: 12px; border: 1px solid #e9ecef;">${sanitizeForEmail(data.contact_name)}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">Email</td>
              <td style="padding: 12px; border: 1px solid #e9ecef;"><a href="mailto:${sanitizeForEmail(data.contact_email)}" style="color: #4f46e5;">${sanitizeForEmail(data.contact_email)}</a></td>
            </tr>
          </table>
          
          ${data.theme_description ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #4f46e5; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a1a2e;">📝 Description / Motivation :</p>
            <p style="margin: 0; color: #495057; white-space: pre-wrap;">${sanitizeMultilineForEmail(data.theme_description)}</p>
          </div>
          ` : ""}
          
          <p style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 12px;">
            📅 Date de la proposition : ${new Date().toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      `;
    } else if (type === "contact_request") {
      // Support both camelCase (from frontend) and snake_case field names
      const firstName = data.firstName || data.first_name;
      const lastName = data.lastName || data.last_name;
      const companySize = data.companySize || data.company_size;
      const phone = data.phone;
      const email = data.email;
      const company = data.company;
      const message = data.message;

      // Validate contact request fields
      if (!isWithinLength(firstName, MAX_NAME_LENGTH) ||
          !isWithinLength(lastName, MAX_NAME_LENGTH) ||
          !isWithinLength(company, MAX_COMPANY_LENGTH) ||
          !isWithinLength(message, MAX_MESSAGE_LENGTH)) {
        return new Response(
          JSON.stringify({ error: "Input exceeds maximum length" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (email && !isValidEmail(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      recipientEmail = adminEmails[0];
      emailSubject = "Nouvelle demande de démo B2B - FinCare";
      
      // Sanitize all user-provided data before including in HTML
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">🤝 Nouvelle demande de démo B2B</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold; width: 40%;">Prénom</td>
              <td style="padding: 12px; border: 1px solid #e9ecef;">${sanitizeForEmail(firstName)}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">Nom</td>
              <td style="padding: 12px; border: 1px solid #e9ecef;">${sanitizeForEmail(lastName)}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">Email</td>
              <td style="padding: 12px; border: 1px solid #e9ecef;"><a href="mailto:${sanitizeForEmail(email)}" style="color: #4f46e5;">${sanitizeForEmail(email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">Téléphone</td>
              <td style="padding: 12px; border: 1px solid #e9ecef;">${sanitizeForEmail(phone) || "<em style='color: #6c757d;'>Non spécifié</em>"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">Entreprise</td>
              <td style="padding: 12px; border: 1px solid #e9ecef;">${sanitizeForEmail(company)}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; font-weight: bold;">Taille de l'entreprise</td>
              <td style="padding: 12px; border: 1px solid #e9ecef;">${sanitizeForEmail(companySize) || "<em style='color: #6c757d;'>Non spécifié</em>"}</td>
            </tr>
          </table>
          
          ${message ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #4f46e5; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a1a2e;">💬 Commentaire :</p>
            <p style="margin: 0; color: #495057; white-space: pre-wrap;">${sanitizeMultilineForEmail(message)}</p>
          </div>
          ` : ""}
          
          <p style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 12px;">
            📅 Date de la demande : ${new Date().toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid email type" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!recipientEmail) {
      console.error("Recipient email not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email recipient not configured" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResponse = await sendEmail(
      recipientEmail,
      emailSubject,
      emailHtml
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-partnership-email function:", error);
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
