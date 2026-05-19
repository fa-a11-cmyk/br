import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save, Trash2, Camera, Shield, Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const Profil = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation("app");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [lang, setLang] = useState("🇫🇷 Français");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [updatingPw, setUpdatingPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) { setFirstName(data.first_name || ""); setLastName(data.last_name || ""); setPhone(data.phone || ""); setCompany(data.company || ""); setAvatarUrl(data.avatar_url || ""); }
      setLoading(false);
    })();
  }, [user]);

  const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : user?.email?.substring(0, 2).toUpperCase() || "??";

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, first_name: firstName, last_name: lastName, phone, company, avatar_url: avatarUrl, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast({ title: t("newMeeting.error"), description: error.message, variant: "destructive" });
    else toast({ title: t("profile.profileSaved"), description: t("profile.profileSavedDesc") });
  };

  const handleUpdatePassword = async () => {
    if (newPw !== confirmPw) { toast({ title: t("newMeeting.error"), description: t("profile.passwordMismatchToast"), variant: "destructive" }); return; }
    if (newPw.length < 6) { toast({ title: t("newMeeting.error"), description: t("profile.minCharsToast"), variant: "destructive" }); return; }
    setUpdatingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setUpdatingPw(false);
    if (error) toast({ title: t("newMeeting.error"), description: error.message, variant: "destructive" });
    else { toast({ title: t("profile.passwordUpdated") }); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
  };

  const handleExport = async (format: "json" | "csv") => {
    setExporting(format);
    try {
      const [{ data: meetings }, { data: tasks }, { data: decisions }, { data: contacts }] = await Promise.all([
        supabase.from("meetings").select("*").order("created_at", { ascending: false }),
        supabase.from("extracted_tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("extracted_decisions").select("*").order("created_at", { ascending: false }),
        supabase.from("detected_contacts").select("*").order("created_at", { ascending: false }),
      ]);
      let blob: Blob; let filename: string;
      if (format === "json") {
        blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), meetings, tasks, decisions, contacts }, null, 2)], { type: "application/json" });
        filename = `rapidomeet-export-${new Date().toISOString().slice(0, 10)}.json`;
      } else {
        const rows = [["type", "id", "title", "status", "created_at", "details"].join(",")];
        meetings?.forEach(m => rows.push(["meeting", m.id, `"${m.title}"`, m.status, m.created_at, `"${m.summary || ""}"`.replace(/\n/g, " ")].join(",")));
        tasks?.forEach(tk => rows.push(["task", tk.id, `"${tk.title}"`, tk.status, tk.created_at, `"${tk.assignee || ""}"`.replace(/\n/g, " ")].join(",")));
        decisions?.forEach(d => rows.push(["decision", d.id, `"${d.content.slice(0, 60)}"`, "", d.created_at, ""].join(",")));
        contacts?.forEach(c => rows.push(["contact", c.id, `"${c.name}"`, "", c.created_at, `"${c.company || ""}"`.replace(/\n/g, " ")].join(",")));
        blob = new Blob([rows.join("\n")], { type: "text/csv" });
        filename = `rapidomeet-export-${new Date().toISOString().slice(0, 10)}.csv`;
      }
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
      toast({ title: t("profile.exportDone"), description: t("profile.exportDoneDesc", { filename }) });
    } catch { toast({ title: t("newMeeting.error"), description: t("profile.exportFailed"), variant: "destructive" }); }
    setExporting(null);
  };

  const handleLogout = async () => { await signOut(); navigate("/connexion"); };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-3 sm:p-6 md:p-10 max-w-[900px] space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold text-xl sm:text-[28px] tracking-tight text-foreground">{t("profile.title")}</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 sm:gap-2 font-body text-xs sm:text-sm text-destructive border border-destructive/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-destructive/10 transition-colors">
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">{t("profile.logout")}</span>
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
        <div className="relative group">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-primary flex items-center justify-center font-display font-extrabold text-xl sm:text-2xl text-white">{initials}</div>
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="h-5 w-5 text-white" /></div>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="font-display font-bold text-lg sm:text-[22px] text-foreground">{firstName && lastName ? `${firstName} ${lastName}` : user?.email || "User"}</h2>
          <p className="font-mono text-[12px] sm:text-[13px] text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
            <span className="font-mono text-[10px] bg-violet-d text-[hsl(var(--violet-l))] px-2.5 py-0.5 rounded-full">Plan Pro</span>
            {company && <span className="font-body text-xs text-muted-foreground">· {company}</span>}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-8">
        <h3 className="font-display font-bold text-base sm:text-lg text-foreground mb-4 sm:mb-5">{t("profile.personalInfo")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: t("profile.firstName"), value: firstName, onChange: setFirstName, ph: t("profile.firstNamePh") },
            { label: t("profile.lastName"), value: lastName, onChange: setLastName, ph: t("profile.lastNamePh") },
            { label: t("profile.phone"), value: phone, onChange: setPhone, ph: t("profile.phonePh"), type: "tel" },
            { label: t("profile.company"), value: company, onChange: setCompany, ph: t("profile.companyPh") },
          ].map(f => (
            <div key={f.label}>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{f.label}</label>
              <input value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.ph} type={f.type || "text"}
                className="w-full bg-secondary border border-border rounded-[10px] px-3 sm:px-4 py-2.5 sm:py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary outline-none transition-colors" />
            </div>
          ))}
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("profile.email")}</label>
            <input value={user?.email || ""} disabled className="w-full bg-secondary/50 border border-border rounded-[10px] px-3 sm:px-4 py-2.5 sm:py-3 font-body text-sm text-muted-foreground cursor-not-allowed" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("profile.language")}</label>
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="w-full bg-secondary border border-border rounded-[10px] px-3 sm:px-4 py-2.5 sm:py-3 font-body text-sm text-foreground focus:border-primary outline-none appearance-none">
              <option>🇫🇷 Français</option><option>🇬🇧 English</option><option>🇹🇳 تونسي</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("profile.bio")}</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={160} placeholder={t("profile.bioPh")}
              className="w-full bg-secondary border border-border rounded-[10px] px-3 sm:px-4 py-2.5 sm:py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary outline-none resize-none h-20 transition-colors" />
            <p className="font-mono text-[10px] text-muted-foreground/40 mt-1 text-right">{bio.length}/160</p>
          </div>
        </div>
        <button onClick={handleSaveProfile} disabled={saving}
          className="mt-4 sm:mt-5 flex items-center gap-2 font-display font-bold text-sm text-white bg-gradient-primary px-5 sm:px-6 py-2.5 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-50 w-full sm:w-auto justify-center">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? t("profile.saving") : t("profile.save")}
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-8">
        <h3 className="font-display font-bold text-base sm:text-lg text-foreground mb-4 sm:mb-5 flex items-center gap-2">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> {t("profile.security")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="sm:col-span-2">
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("profile.currentPassword")}</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••"
              className="w-full bg-secondary border border-border rounded-[10px] px-3 sm:px-4 py-2.5 sm:py-3 font-body text-sm text-foreground focus:border-primary outline-none transition-colors" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("profile.newPassword")}</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••"
              className="w-full bg-secondary border border-border rounded-[10px] px-3 sm:px-4 py-2.5 sm:py-3 font-body text-sm text-foreground focus:border-primary outline-none transition-colors" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("profile.confirmPassword")}</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••"
              className="w-full bg-secondary border border-border rounded-[10px] px-3 sm:px-4 py-2.5 sm:py-3 font-body text-sm text-foreground focus:border-primary outline-none transition-colors" />
          </div>
        </div>
        {newPw && newPw.length < 6 && <p className="font-mono text-[11px] text-destructive mb-3">{t("profile.minChars")}</p>}
        {newPw && confirmPw && newPw !== confirmPw && <p className="font-mono text-[11px] text-destructive mb-3">{t("profile.passwordMismatch")}</p>}
        <button onClick={handleUpdatePassword} disabled={updatingPw || !newPw || newPw !== confirmPw || newPw.length < 6}
          className="flex items-center gap-2 font-display font-bold text-sm text-white bg-gradient-primary px-5 sm:px-6 py-2.5 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-50 w-full sm:w-auto justify-center">
          {updatingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          {t("profile.updatePassword")}
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-8">
        <h3 className="font-display font-bold text-base sm:text-lg text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> {t("profile.dataExport")}
        </h3>
        <p className="font-body text-xs sm:text-sm text-muted-foreground mb-4">{t("profile.dataExportDesc")}</p>
        <div className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8">
          <button onClick={() => handleExport("json")} disabled={!!exporting}
            className="flex items-center justify-center gap-2 font-body text-sm text-muted-foreground border border-border px-4 py-2.5 rounded-lg hover:text-foreground hover:border-muted-foreground/30 transition-all disabled:opacity-50">
            {exporting === "json" ? <Loader2 className="h-4 w-4 animate-spin" /> : "📥"} {t("profile.exportJSON")}
          </button>
          <button onClick={() => handleExport("csv")} disabled={!!exporting}
            className="flex items-center justify-center gap-2 font-body text-sm text-muted-foreground border border-border px-4 py-2.5 rounded-lg hover:text-foreground hover:border-muted-foreground/30 transition-all disabled:opacity-50">
            {exporting === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : "📥"} {t("profile.exportCSV")}
          </button>
        </div>
        <div className="border-t border-border pt-4 sm:pt-6">
          <h4 className="font-display font-bold text-sm text-destructive mb-1 flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> {t("profile.deleteAccount")}
          </h4>
          <p className="font-body text-xs text-muted-foreground mb-3">{t("profile.deleteAccountDesc")}</p>
          <button onClick={() => setShowDelete(true)} className="font-body text-sm text-destructive border border-destructive/30 px-4 py-2 rounded-lg hover:bg-destructive/10 transition-colors">
            {t("profile.deleteAccountBtn")}
          </button>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDelete(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg text-foreground mb-3">{t("profile.confirmDelete")}</h3>
            <p className="font-body text-sm text-muted-foreground mb-4" dangerouslySetInnerHTML={{ __html: t("profile.typeDelete") }} />
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={t("profile.deletePlaceholder")}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 font-mono text-sm text-foreground mb-4 focus:border-destructive outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 font-body text-sm border border-border py-2.5 rounded-lg hover:bg-secondary transition-colors">{t("profile.cancel")}</button>
              <button disabled={deleteConfirm !== t("profile.deletePlaceholder")} className="flex-1 font-body text-sm bg-destructive text-white py-2.5 rounded-lg disabled:opacity-30">{t("profile.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profil;
