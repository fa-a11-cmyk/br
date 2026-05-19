import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("authorization");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader || "" } } });

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { type, format = "csv", dateFrom, dateTo } = await req.json();

  const dateFilter = (query: any) => {
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);
    return query;
  };

  try {
    let csvContent = "";
    let filename = "";

    if (type === "meetings") {
      let query = admin.from("meetings").select("id, title, meeting_type, status, duration_seconds, summary, sentiment_score, language, created_at, completed_at").eq("user_id", user.id).order("created_at", { ascending: false });
      query = dateFilter(query);
      const { data } = await query;

      const rows = (data || []).map((m: any) => ({
        "ID": m.id, "Titre": m.title, "Type": m.meeting_type, "Statut": m.status,
        "Durée (min)": m.duration_seconds ? Math.round(m.duration_seconds / 60) : "",
        "Résumé": (m.summary || "").replace(/"/g, '""'),
        "Score sentiment": m.sentiment_score || "", "Langue": m.language || "fr",
        "Créé le": new Date(m.created_at).toLocaleDateString("fr-FR"),
        "Terminé le": m.completed_at ? new Date(m.completed_at).toLocaleDateString("fr-FR") : "",
      }));
      csvContent = toCSV(rows);
      filename = `rapidomeet-reunions-${new Date().toISOString().split("T")[0]}.csv`;

    } else if (type === "tasks") {
      let query = admin.from("extracted_tasks").select("id, title, priority, status, assignee, deadline, meeting_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
      query = dateFilter(query);
      const { data } = await query;

      const rows = (data || []).map((t: any) => ({
        "ID": t.id, "Tâche": t.title, "Priorité": t.priority, "Statut": t.status,
        "Assigné à": t.assignee || "", "Deadline": t.deadline ? new Date(t.deadline).toLocaleDateString("fr-FR") : "",
        "ID Réunion": t.meeting_id,
        "Créé le": new Date(t.created_at).toLocaleDateString("fr-FR"),
      }));
      csvContent = toCSV(rows);
      filename = `rapidomeet-taches-${new Date().toISOString().split("T")[0]}.csv`;

    } else if (type === "invoices") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY non configuré");

      const { data: sub } = await admin.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
      if (!sub?.stripe_customer_id) {
        return new Response(JSON.stringify({ error: "Aucun abonnement Stripe trouvé", invoices: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const params = new URLSearchParams({ customer: sub.stripe_customer_id, limit: "100", status: "paid" });
      if (dateFrom) params.set("created[gte]", String(Math.floor(new Date(dateFrom).getTime() / 1000)));
      if (dateTo) params.set("created[lte]", String(Math.floor(new Date(dateTo).getTime() / 1000)));

      const stripeRes = await fetch(`https://api.stripe.com/v1/invoices?${params}`, { headers: { Authorization: `Bearer ${stripeKey}` } });
      if (!stripeRes.ok) throw new Error(`Stripe error: ${stripeRes.status}`);

      const stripeData = await stripeRes.json();
      const invoices = stripeData.data || [];

      if (format === "json") {
        return new Response(JSON.stringify({ invoices }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const rows = invoices.map((inv: any) => ({
        "Numéro facture": inv.number || inv.id,
        "Date": new Date(inv.created * 1000).toLocaleDateString("fr-FR"),
        "Description": inv.lines?.data?.[0]?.description || "Abonnement RapidoMeet",
        "HT (€)": (inv.subtotal / 100).toFixed(2),
        "TVA (€)": ((inv.tax || 0) / 100).toFixed(2),
        "TTC (€)": (inv.total / 100).toFixed(2),
        "Devise": (inv.currency || "eur").toUpperCase(),
        "Statut": inv.status,
        "PDF": inv.invoice_pdf || "",
        "Stripe ID": inv.id,
      }));
      csvContent = toCSV(rows);
      filename = `rapidomeet-factures-${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      throw new Error("Type d'export invalide. Utilisez: meetings, tasks, invoices");
    }

    return new Response(csvContent, {
      headers: { ...corsHeaders, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
