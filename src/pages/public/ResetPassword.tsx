import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const { t } = useTranslation("auth");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) { /* Session is automatically set */ }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: t("login.errorTitle"), description: t("reset.errorMismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: t("login.errorTitle"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("reset.success") });
      navigate("/app/dashboard");
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-[24px] p-10 md:p-12 w-full max-w-[440px]">
        <h2 className="font-display font-extrabold text-[24px] text-foreground mb-6">{t("reset.title")}</h2>
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("reset.newLabel")}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-secondary border border-border rounded-[10px] px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("reset.confirmLabel")}</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" className="w-full bg-secondary border border-border rounded-[10px] px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full mt-6 font-display font-bold text-[15px] text-white bg-gradient-primary py-3.5 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-60">
          {loading ? t("reset.loading") : t("reset.submit")}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
