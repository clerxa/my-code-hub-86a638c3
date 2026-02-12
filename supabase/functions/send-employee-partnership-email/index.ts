import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Contact {
  firstName: string;
  lastName?: string;
  email: string;
}

interface EmployeePartnershipRequest {
  sender: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  company: string;
  contacts: Contact[];
  message: string;
}

interface EmailAdminConfig {
  admin_emails: string[];
  sender_domain: string;
  sender_name: string;
}

const defaultEmailConfig: EmailAdminConfig = {
  admin_emails: ["xavier.clermont@fincare.fr", "xavier.clermont@perlib.fr"],
  sender_domain: "notifications.fincare.fr",
  sender_name: "FinCare",
};

// Helper to delay between API calls to respect rate limit (2 req/s)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch email configuration from database
    const { data: emailConfigData } = await supabase
      .from("settings")
      .select("metadata")
      .eq("key", "email_admin_config")
      .maybeSingle();

    const emailConfig: EmailAdminConfig = emailConfigData?.metadata
      ? { ...defaultEmailConfig, ...(emailConfigData.metadata as EmailAdminConfig) }
      : defaultEmailConfig;

    console.log("Email config loaded:", { 
      requestId,
      adminEmails: emailConfig.admin_emails,
      senderDomain: emailConfig.sender_domain 
    });

    const {
      sender,
      company,
      contacts,
      message,
    }: EmployeePartnershipRequest = await req.json();

    console.log("send-employee-partnership-email: request received", {
      requestId,
      company,
      senderEmail: sender?.email,
      contactsCount: Array.isArray(contacts) ? contacts.length : 0,
      contactEmails: Array.isArray(contacts)
        ? contacts.map((c) => c?.email).filter(Boolean)
        : [],
    });

    if (!sender?.firstName || !sender?.lastName || !sender?.email) {
      throw new Error("Missing required sender fields");
    }
    // company can be empty for NoPartner users
    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new Error("Missing contacts");
    }
    if (!message) {
      throw new Error("Missing message");
    }

    const companyName = company || "votre entreprise";
    const fromAddress = `${emailConfig.sender_name} <noreply@${emailConfig.sender_domain}>`;

    // Email à l'équipe FinCare (tous les admins)
    const contactsList = contacts
      .map((c) => `<li>${c.firstName} ${c.lastName || ""} - ${c.email}</li>`)
      .join("");

    const adminEmailResponse = await resend.emails.send({
      from: fromAddress,
      to: emailConfig.admin_emails,
      subject: `Nouvelle demande de partenariat - ${companyName}`,
      html: `
        <h1>Nouvelle demande de partenariat salarié</h1>
        <p>Un collaborateur souhaite proposer FinCare à son entreprise :</p>
        
        <h2>Informations du salarié</h2>
        <ul>
          <li><strong>Nom :</strong> ${sender.firstName} ${sender.lastName}</li>
          <li><strong>Email :</strong> ${sender.email}</li>
          ${sender.phone ? `<li><strong>Téléphone :</strong> ${sender.phone}</li>` : ""}
          <li><strong>Entreprise :</strong> ${companyName}</li>
        </ul>

        <h2>Contacts à contacter dans l'entreprise</h2>
        <ul>
          ${contactsList}
        </ul>
        
        <p>Merci de contacter ${sender.firstName} pour poursuivre cette opportunité.</p>
      `,
    });

    if (adminEmailResponse?.error) {
      console.error("Admin email error", {
        requestId,
        error: adminEmailResponse.error,
      });
      throw new Error(
        `Admin email failed: ${
          // @ts-ignore
          adminEmailResponse.error?.message ||
          JSON.stringify(adminEmailResponse.error)
        }`
      );
    }

    // Wait 600ms to respect rate limit before sending next email
    await delay(600);

    // Envoyer un email à chaque contact (sequentially to respect rate limit)
    const contactEmailResponses: Array<{
      contactEmail: string;
      response: any;
    }> = [];

    for (const contact of contacts) {
      const personalizedMessage = message
        .replace(/{contact_first_name}/g, contact.firstName)
        .replace(/{sender_first_name}/g, sender.firstName);

      const response = await resend.emails.send({
        from: fromAddress,
        to: [contact.email],
        reply_to: [sender.email],
        subject: `${sender.firstName} ${sender.lastName} vous recommande FinCare`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            ${personalizedMessage.replace(/\n/g, "<br>")}
          </div>
        `,
      });

      contactEmailResponses.push({ contactEmail: contact.email, response });

      // Wait 600ms between each contact email
      await delay(600);
    }

    const contactErrors = contactEmailResponses
      .filter((r) => r.response?.error)
      .map((r) => ({ contactEmail: r.contactEmail, error: r.response.error }));

    if (contactErrors.length > 0) {
      console.error("Contact email errors", { requestId, contactErrors });
      throw new Error(
        `Contact email failed for: ${contactErrors
          .map((e) => e.contactEmail)
          .join(", ")}`
      );
    }

    // Email de confirmation au salarié
    const employeeEmailResponse = await resend.emails.send({
      from: fromAddress,
      to: [sender.email],
      subject: "Votre recommandation a été envoyée !",
      html: `
        <h1>Merci ${sender.firstName} !</h1>
        <p>Votre recommandation FinCare a été envoyée avec succès à ${contacts.length} contact(s) de <strong>${companyName}</strong>.</p>
        
        <h2>Contacts informés :</h2>
        <ul>
          ${contactsList}
        </ul>
        
        <h2>Prochaines étapes</h2>
        <ol>
          <li>Vos contacts vont recevoir votre message personnalisé</li>
          <li>Notre équipe se tient prête à accompagner ${companyName}</li>
          <li>Vous recevrez un suivi de l'avancement par email</li>
        </ol>
        
        <p>En tant qu'ambassadeur FinCare, vous bénéficierez d'avantages exclusifs une fois le partenariat établi :</p>
        <ul>
          <li>✨ Accès anticipé aux nouvelles fonctionnalités</li>
          <li>🎯 Support prioritaire</li>
          <li>📚 Contenu exclusif premium</li>
          <li>🏆 Reconnaissance en tant que pionnier</li>
        </ul>
        
        <p>Merci pour votre confiance,<br>L'équipe FinCare</p>
      `,
    });

    if (employeeEmailResponse?.error) {
      console.error("Employee confirmation email error", {
        requestId,
        error: employeeEmailResponse.error,
      });
      throw new Error(
        `Employee confirmation failed: ${
          // @ts-ignore
          employeeEmailResponse.error?.message ||
          JSON.stringify(employeeEmailResponse.error)
        }`
      );
    }

    console.log("Emails sent successfully:", {
      requestId,
      admin: adminEmailResponse,
      employee: employeeEmailResponse,
      contactsSent: contacts.length,
      contacts: contactEmailResponses.map((r) => ({
        contactEmail: r.contactEmail,
        id: r.response?.data?.id,
        error: r.response?.error ?? null,
      })),
    });

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
        adminEmailId: adminEmailResponse?.data?.id ?? null,
        employeeEmailId: employeeEmailResponse?.data?.id ?? null,
        contacts: contactEmailResponses.map((r) => ({
          email: r.contactEmail,
          id: r.response?.data?.id ?? null,
        })),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-employee-partnership-email function:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
