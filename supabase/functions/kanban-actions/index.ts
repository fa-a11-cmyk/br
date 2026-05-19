import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  try {
    const { action, payload } = await req.json();
    let result: Record<string, unknown> = {};

    switch (action) {
      case "move_card": {
        const { cardId, targetColumnId, newPosition, sourceColumnId } = payload;

        const { data: card } = await admin.from("kanban_cards")
          .select("id, board_id, column_id, position, title, extracted_task_id")
          .eq("id", cardId).eq("user_id", userId).single();
        if (!card) throw new Error("Card introuvable");

        const { data: targetCol } = await admin.from("kanban_columns")
          .select("wip_limit, is_done_column, name").eq("id", targetColumnId).single();

        if (targetCol?.wip_limit) {
          const { count } = await admin.from("kanban_cards")
            .select("id", { count: "exact", head: true })
            .eq("column_id", targetColumnId).eq("is_archived", false).neq("id", cardId);
          if ((count || 0) >= targetCol.wip_limit) {
            return new Response(JSON.stringify({
              error: `WIP limit atteinte pour "${targetCol.name}" (max: ${targetCol.wip_limit})`,
              code: "WIP_LIMIT_EXCEEDED",
            }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }

        // Shift positions in target column
        await admin.rpc("shift_kanban_positions", {
          p_column_id: targetColumnId,
          p_from_position: newPosition,
          p_exclude_card_id: cardId,
        }).catch(() => {});

        const updates: Record<string, unknown> = {
          column_id: targetColumnId,
          position: newPosition,
          updated_at: new Date().toISOString(),
        };

        if (targetCol?.is_done_column) {
          updates.completed_at = new Date().toISOString();
          if (card.extracted_task_id) {
            await admin.from("extracted_tasks")
              .update({ status: "done" })
              .eq("id", card.extracted_task_id).catch(() => {});
          }
        } else if (sourceColumnId !== targetColumnId) {
          updates.completed_at = null;
        }

        await admin.from("kanban_cards").update(updates).eq("id", cardId);

        await admin.from("kanban_activity").insert({
          board_id: card.board_id, card_id: cardId, user_id: userId,
          action: "card_moved",
          metadata: { from_column: sourceColumnId, to_column: targetColumnId, card_title: card.title },
        }).catch(() => {});

        result = { success: true };
        break;
      }

      case "create_card": {
        const { columnId, boardId } = payload;
        const { data: maxPos } = await admin.from("kanban_cards")
          .select("position").eq("column_id", columnId).eq("is_archived", false)
          .order("position", { ascending: false }).limit(1).maybeSingle();

        const { data: card, error } = await admin.from("kanban_cards").insert({
          column_id: columnId, board_id: boardId, user_id: userId,
          title: payload.title || "Nouvelle tâche",
          description: payload.description || null,
          priority: payload.priority || "medium",
          assignee: payload.assignee || null,
          due_date: payload.due_date || null,
          labels: payload.labels || [],
          position: (maxPos?.position ?? -1) + 1,
        }).select().single();
        if (error) throw error;

        await admin.from("kanban_activity").insert({
          board_id: boardId, card_id: card.id, user_id: userId,
          action: "card_created", metadata: { title: card.title },
        }).catch(() => {});

        result = { success: true, card };
        break;
      }

      case "update_card": {
        const { cardId, updates } = payload;
        const { data: existing } = await admin.from("kanban_cards")
          .select("board_id, title").eq("id", cardId).eq("user_id", userId).single();
        if (!existing) throw new Error("Card introuvable");

        const allowedFields = [
          "title", "description", "priority", "assignee", "due_date",
          "labels", "checklist", "estimated_hours", "actual_hours",
        ];
        const safeUpdates = Object.fromEntries(
          Object.entries(updates).filter(([k]) => allowedFields.includes(k))
        );

        await admin.from("kanban_cards").update({
          ...safeUpdates, updated_at: new Date().toISOString(),
        }).eq("id", cardId);

        await admin.from("kanban_activity").insert({
          board_id: existing.board_id, card_id: cardId, user_id: userId,
          action: "card_updated", metadata: { fields: Object.keys(safeUpdates) },
        }).catch(() => {});

        result = { success: true };
        break;
      }

      case "archive_card": {
        const { cardId } = payload;
        const { data: card } = await admin.from("kanban_cards")
          .select("board_id, title").eq("id", cardId).eq("user_id", userId).single();
        if (!card) throw new Error("Card introuvable");

        await admin.from("kanban_cards").update({
          is_archived: true, archived_at: new Date().toISOString(),
        }).eq("id", cardId);

        await admin.from("kanban_activity").insert({
          board_id: card.board_id, card_id: cardId, user_id: userId,
          action: "card_archived", metadata: { title: card.title },
        }).catch(() => {});

        result = { success: true };
        break;
      }

      case "add_comment": {
        const { cardId, content } = payload;
        const { data: card } = await admin.from("kanban_cards")
          .select("board_id, comments_count").eq("id", cardId).single();
        if (!card) throw new Error("Card introuvable");

        const { data: comment } = await admin.from("kanban_comments")
          .insert({ card_id: cardId, user_id: userId, content })
          .select().single();

        await admin.from("kanban_cards")
          .update({ comments_count: (card.comments_count || 0) + 1 })
          .eq("id", cardId).catch(() => {});

        result = { success: true, comment };
        break;
      }

      case "create_column": {
        const { boardId } = payload;
        const { data: maxPos } = await admin.from("kanban_columns")
          .select("position").eq("board_id", boardId)
          .order("position", { ascending: false }).limit(1).maybeSingle();

        const { data: col, error } = await admin.from("kanban_columns").insert({
          board_id: boardId,
          name: payload.name || "Nouvelle colonne",
          color: payload.color || "#6b7280",
          icon: payload.icon || "📋",
          position: (maxPos?.position ?? -1) + 1,
          wip_limit: payload.wip_limit || null,
          is_done_column: payload.is_done_column || false,
        }).select().single();
        if (error) throw error;

        result = { success: true, column: col };
        break;
      }

      case "reorder_columns": {
        const { columnOrders } = payload;
        await Promise.all(
          columnOrders.map(({ id, position }: { id: string; position: number }) =>
            admin.from("kanban_columns").update({ position }).eq("id", id)
          )
        );
        result = { success: true };
        break;
      }

      case "import_tasks_to_kanban": {
        const { boardId, columnId, meetingId } = payload;
        const { data: tasks } = await admin.from("extracted_tasks")
          .select("*").eq("meeting_id", meetingId).eq("user_id", userId);

        if (!tasks?.length) { result = { success: true, imported: 0 }; break; }

        const { data: maxPos } = await admin.from("kanban_cards")
          .select("position").eq("column_id", columnId)
          .order("position", { ascending: false }).limit(1).maybeSingle();

        let pos = (maxPos?.position ?? -1) + 1;
        const cards = tasks.map((t) => ({
          column_id: columnId, board_id: boardId, user_id: userId,
          extracted_task_id: t.id, meeting_id: meetingId,
          title: t.title, priority: t.priority || "medium",
          assignee: t.assignee || null,
          due_date: t.deadline ? new Date(t.deadline).toISOString().split("T")[0] : null,
          position: pos++,
        }));

        const { data: created } = await admin.from("kanban_cards").insert(cards).select();
        result = { success: true, imported: created?.length || 0 };
        break;
      }

      default:
        throw new Error(`Action inconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
