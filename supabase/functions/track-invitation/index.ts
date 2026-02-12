import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent GIF for email open tracking
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 
  0x01, 0x00, 0x3b
]);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action"); // "open" or "click"

    if (!token || typeof token !== 'string' || token.length > 100) {
      // Return uniform response to prevent enumeration
      if (action === "open") {
        return new Response(TRACKING_PIXEL, {
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Tracking invitation: action=${action}`);

    // Find the invitation by token
    const { data: invitation, error: fetchError } = await supabase
      .from("colleague_invitations")
      .select("id, status, email_opened_at, link_clicked_at")
      .eq("invitation_token", token)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching invitation:", fetchError);
      return new Response("Database error", { status: 500 });
    }

    if (!invitation) {
      console.log("Invitation not found for token");
      // Return same response for valid and invalid tokens to prevent enumeration
      if (action === "open") {
        return new Response(TRACKING_PIXEL, {
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const now = new Date().toISOString();
    const updates: Record<string, any> = {};

    if (action === "open" && !invitation.email_opened_at) {
      updates.email_opened_at = now;
      updates.status = "opened";
      console.log("Marking invitation as opened");
    } else if (action === "click" && !invitation.link_clicked_at) {
      updates.link_clicked_at = now;
      updates.status = "clicked";
      console.log("Marking invitation as clicked");
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("colleague_invitations")
        .update(updates)
        .eq("id", invitation.id);

      if (updateError) {
        console.error("Error updating invitation:", updateError);
      } else {
        console.log("Invitation updated successfully:", updates);
      }
    }

    // Return appropriate response based on action
    if (action === "open") {
      // Return tracking pixel for email open
      return new Response(TRACKING_PIXEL, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // For click tracking, return JSON
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in track-invitation:", error);
    // Return uniform response even on errors
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
