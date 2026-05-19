import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Connexion = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation("auth");

  // Show suspended account message if redirected
  useEffect(() => {
    const suspendedMsg = sessionStorage.getItem("auth_error");
    if (suspendedMsg) {
      sessionStorage.removeItem("auth_error");
      toast({ title: "Accès refusé", description: suspendedMsg, variant: "destructive" });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: t("login.errorTitle"), description: error.message === "Invalid login credentials" ? t("login.errorInvalid") : error.message, variant: "destructive" });
    } else {
      navigate("/app/dashboard");
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleLogin} className="bg-card border border-border rounded-[24px] p-10 md:p-12 w-full max-w-[440px]">
        <Link to="/" className="inline-flex items-center gap-1.5 font-body text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6">
          {t("login.backToSite")}
        </Link>
        <h1 className="font-display font-extrabold text-[28px] tracking-tight text-foreground mb-1">{t("login.title")}</h1>
        <p className="font-body text-sm text-muted-foreground mb-8">{t("login.subtitle")}</p>

        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("login.emailLabel")}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t("login.emailPlaceholder")} className="w-full bg-secondary border border-border rounded-[10px] px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12)] outline-none transition-all" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("login.passwordLabel")}</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder={t("login.passwordPlaceholder")} className="w-full bg-secondary border border-border rounded-[10px] px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12)] outline-none transition-all pr-20" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? t("login.hide") : t("login.show")}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <Link to="/mot-de-passe-oublie" className="font-body text-[13px] text-[hsl(var(--fuchsia-l))] hover:underline">{t("login.forgot")}</Link>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full mt-6 font-display font-bold text-[15px] text-white bg-gradient-primary py-3.5 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-60">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              {t("login.loading")}
            </span>
          ) : t("login.submit")}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="font-mono text-[10px] text-muted-foreground uppercase">{t("actions.or", { ns: "common" })}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button type="button" onClick={async () => {
          const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
          if (error) toast({ title: t("login.errorGoogle"), description: String(error), variant: "destructive" });
        }} className="w-full flex items-center justify-center gap-3 bg-secondary border border-border rounded-[10px] py-3 font-body text-sm text-foreground hover:border-muted-foreground/40 transition-colors">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
          {t("login.google")}
        </button>

        <p className="text-center mt-6 font-body text-[13px] text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link to="/inscription" className="text-[hsl(var(--fuchsia-l))] hover:underline font-medium">{t("login.tryFree")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Connexion;
