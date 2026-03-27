import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();
    if (!token) throw new Error("Token manquant");

    // Find user with this token
    const { data: profile, error: findError } = await supabaseAdmin
      .from("profiles")
      .select("id, email_verified, email_verification_token")
      .eq("email_verification_token", token)
      .single();

    if (findError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: "Lien invalide ou expiré." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.email_verified) {
      return new Response(
        JSON.stringify({ success: true, already_verified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as verified, clear token
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        email_verified: true,
        email_verification_token: null,
      })
      .eq("id", profile.id);

    if (updateError) throw new Error("Erreur lors de la vérification.");

    console.log(`Email verified for user ${profile.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("verify-email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
