import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const MotDePasseOublie = () => {
  const { t } = useTranslation("auth");
  const [state, setState] = useState<"form" | "sent">("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: t("login.errorTitle"), description: error.message, variant: "destructive" });
    } else {
      setState("sent");
    }
  };

  if (state === "sent") {
    return (
      <AuthLayout>
        <div className="bg-card border border-border rounded-[24px] p-10 md:p-12 w-full max-w-[440px] text-center">
          <span className="text-5xl block mb-4">✅</span>
          <h2 className="font-display font-extrabold text-[24px] text-foreground mb-3">{t("forgot.sentTitle")}</h2>
          <p className="font-body text-[15px] text-muted-foreground mb-1">{t("forgot.sentDesc")}</p>
          <p className="font-body text-[15px] text-foreground font-medium mb-4">{email}</p>
          <p className="font-body text-sm text-muted-foreground mb-6">{t("forgot.sentExpiry")}</p>
          <Link to="/connexion" className="font-body text-[13px] text-muted-foreground hover:text-foreground">{t("forgot.backLogin")}</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleReset} className="bg-card border border-border rounded-[24px] p-10 md:p-12 w-full max-w-[440px]">
        <h1 className="font-display font-extrabold text-[24px] text-foreground mb-6">{t("forgot.title")}</h1>
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("forgot.emailLabel")}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" className="w-full bg-secondary border border-border rounded-[10px] px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full font-display font-bold text-[15px] text-white bg-gradient-primary py-3.5 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-60">
            {loading ? t("forgot.loading") : t("forgot.submit")}
          </button>
        </div>
        <p className="text-center mt-6 font-body text-[13px] text-muted-foreground">
          <Link to="/connexion" className="text-muted-foreground hover:text-foreground">{t("forgot.back")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default MotDePasseOublie;
