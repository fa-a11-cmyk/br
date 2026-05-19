import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useKanban() {
  const [boards, setBoards] = useState<any[]>([]);
  const [currentBoard, setCurrentBoard] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: boardsData } = await supabase
        .from("kanban_boards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");

      if (boardsData?.length) {
        setBoards(boardsData);
        const defaultBoard = boardsData.find((b: any) => b.is_default) || boardsData[0];
        await loadBoard(defaultBoard.id);
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadBoard = async (boardId: string) => {
    setLoading(true);

    const [{ data: board }, { data: cols }, { data: cardsData }, { data: statsData }] =
      await Promise.all([
        supabase.from("kanban_boards").select("*").eq("id", boardId).single(),
        supabase.from("kanban_columns").select("*").eq("board_id", boardId).order("position"),
        supabase.from("kanban_cards")
          .select("*")
          .eq("board_id", boardId)
          .eq("is_archived", false)
          .order("position"),
        supabase.from("kanban_board_stats" as any).select("*").eq("board_id", boardId).maybeSingle(),
      ]);

    setCurrentBoard(board);
    setColumns(cols || []);
    setCards(cardsData || []);
    setStats(statsData);
    setLoading(false);
  };

  // Realtime subscription
  useEffect(() => {
    if (!currentBoard?.id) return;

    const channel = supabase
      .channel(`kanban-${currentBoard.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "kanban_cards",
        filter: `board_id=eq.${currentBoard.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setCards(prev => {
            if (prev.find(c => c.id === (payload.new as any).id)) return prev;
            return [...prev, payload.new as any];
          });
        } else if (payload.eventType === "UPDATE") {
          setCards(prev => prev.map(c =>
            c.id === (payload.new as any).id ? { ...c, ...payload.new } : c
          ));
        } else if (payload.eventType === "DELETE") {
          setCards(prev => prev.filter(c => c.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentBoard?.id]);

  const callAction = async (action: string, payload: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/kanban-actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.code === "WIP_LIMIT_EXCEEDED") return data;
      throw new Error(data.error);
    }
    return data;
  };

  const moveCard = useCallback(async (
    cardId: string,
    targetColumnId: string,
    newPosition: number,
    sourceColumnId: string
  ) => {
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, column_id: targetColumnId, position: newPosition } : c
    ));

    try {
      const result = await callAction("move_card", {
        cardId, targetColumnId, newPosition, sourceColumnId,
      });

      if (result?.code === "WIP_LIMIT_EXCEEDED") {
        setCards(prev => prev.map(c =>
          c.id === cardId ? { ...c, column_id: sourceColumnId } : c
        ));
        toast({ title: "WIP Limit atteinte", description: result.error, variant: "destructive" });
      }
    } catch (e: any) {
      if (currentBoard?.id) await loadBoard(currentBoard.id);
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  }, [currentBoard?.id]);

  const createCard = async (columnId: string, data: any) => {
    try {
      const result = await callAction("create_card", {
        columnId, boardId: currentBoard.id, ...data,
      });
      if (result.card) setCards(prev => [...prev, result.card]);
      toast({ title: "Tâche créée ✓" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const updateCard = async (cardId: string, updates: any) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updates } : c));
    try {
      await callAction("update_card", { cardId, updates });
    } catch (e: any) {
      if (currentBoard?.id) await loadBoard(currentBoard.id);
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const archiveCard = async (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    try {
      await callAction("archive_card", { cardId });
      toast({ title: "Tâche archivée ✓" });
    } catch (e: any) {
      if (currentBoard?.id) await loadBoard(currentBoard.id);
    }
  };

  const createColumn = async (data: any) => {
    try {
      const result = await callAction("create_column", {
        boardId: currentBoard.id, ...data,
      });
      if (result.column) setColumns(prev => [...prev, result.column]);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const importMeetingTasks = async (meetingId: string, columnId: string) => {
    try {
      const result = await callAction("import_tasks_to_kanban", {
        boardId: currentBoard.id, columnId, meetingId,
      });
      toast({ title: `${result.imported} tâche(s) importée(s) ✓` });
      await loadBoard(currentBoard.id);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const getColumnCards = useCallback(
    (columnId: string) =>
      cards.filter(c => c.column_id === columnId).sort((a, b) => a.position - b.position),
    [cards]
  );

  return {
    boards, currentBoard, columns, cards,
    loading, stats,
    loadBoard, moveCard, createCard,
    updateCard, archiveCard, createColumn,
    importMeetingTasks, getColumnCards, setCurrentBoard,
  };
}
