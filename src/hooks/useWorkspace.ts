import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [sharedMeetings, setSharedMeetings] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const callAction = async (
    action: string,
    workspaceId: string | null,
    payload: any = {}
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(
      `${supabaseUrl}/functions/v1/workspace-actions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action, workspaceId, payload }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const fetchData = async (section: string, workspaceId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(
      `${supabaseUrl}/functions/v1/get-workspace-data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ section, workspaceId }),
      }
    );
    return res.json();
  };

  const loadMyWorkspaces = async () => {
    try {
      const data = await fetchData("my_workspaces");
      if (data.workspaces) {
        setWorkspaces(data.workspaces);
        if (data.workspaces.length > 0 && !currentWorkspace) {
          await loadWorkspaceDetail(data.workspaces[0].id);
        }
      }
    } catch (e) {
      console.error("loadMyWorkspaces error:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceDetail = async (id: string) => {
    const data = await fetchData("workspace_detail", id);
    if (data.workspace) {
      setCurrentWorkspace({ ...data.workspace, my_role: data.my_role });
      setMembers(data.members || []);
      setInvitations(data.pending_invitations || []);
      setSharedMeetings(data.shared_meetings || []);
    }
  };

  useEffect(() => {
    loadMyWorkspaces();
  }, []);

  const createWorkspace = async (name: string, description?: string) => {
    const data = await callAction("create_workspace", null, { name, description });
    toast({ title: "Workspace créé ✓" });
    await loadMyWorkspaces();
    return data.workspace;
  };

  const inviteMember = async (email: string, role = "member") => {
    if (!currentWorkspace) return;
    const data = await callAction("invite_member", currentWorkspace.id, { email, role });
    toast({
      title: "Invitation envoyée ✓",
      description: data.email_sent
        ? `Email envoyé à ${email}`
        : "Invitation créée (email non configuré)",
    });
    await loadWorkspaceDetail(currentWorkspace.id);
  };

  const removeMember = async (userId: string) => {
    if (!currentWorkspace) return;
    await callAction("remove_member", currentWorkspace.id, { userId });
    toast({ title: "Membre retiré ✓" });
    await loadWorkspaceDetail(currentWorkspace.id);
  };

  const shareMeeting = async (meetingId: string, permissions = "view") => {
    if (!currentWorkspace) return;
    await callAction("share_meeting", currentWorkspace.id, { meetingId, permissions });
    toast({ title: "Réunion partagée avec l'équipe ✓" });
    await loadWorkspaceDetail(currentWorkspace.id);
  };

  const changeRole = async (userId: string, newRole: string) => {
    if (!currentWorkspace) return;
    await callAction("change_member_role", currentWorkspace.id, { userId, newRole });
    toast({ title: "Rôle mis à jour ✓" });
    await loadWorkspaceDetail(currentWorkspace.id);
  };

  const isAdmin =
    currentWorkspace?.my_role &&
    ["owner", "admin"].includes(currentWorkspace.my_role);

  return {
    workspaces,
    currentWorkspace,
    members,
    sharedMeetings,
    invitations,
    loading,
    isAdmin,
    loadWorkspaceDetail,
    createWorkspace,
    inviteMember,
    removeMember,
    shareMeeting,
    changeRole,
    reload: loadMyWorkspaces,
  };
}
