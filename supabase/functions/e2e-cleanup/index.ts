import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const appUrl = Deno.env.get("FRONTEND_URL") || "";
  const isProduction =
    appUrl.includes("rapidomeet.io") &&
    !appUrl.includes("staging") &&
    !appUrl.includes("dev");

  if (isProduction) {
    return new Response(
      JSON.stringify({ error: "Non disponible en production" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { email } = await req.json();

  if (!email?.includes("e2e@rapidomeet.io")) {
    return new Response(
      JSON.stringify({ error: "Email non autorisé pour le nettoyage" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: users } = await admin.auth.admin.listUsers();
  const user = users.users.find((u: any) => u.email === email);

  if (!user) {
    return new Response(
      JSON.stringify({ skipped: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  await Promise.allSettled([
    admin.from("meetings").delete().eq("user_id", user.id),
    admin.from("landing_pages").delete().eq("user_id", user.id),
    admin.from("landing_bookings").delete().eq("user_id", user.id),
    admin.from("kanban_boards").delete().eq("user_id", user.id),
    admin.from("openclaw_conversations").delete().eq("user_id", user.id),
  ]);

  return new Response(
    JSON.stringify({ success: true, cleaned_user: email }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
