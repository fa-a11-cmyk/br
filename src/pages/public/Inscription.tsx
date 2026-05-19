import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Inscription = () => {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cgu, setCgu] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation("auth");

  const passwordChecks = (pw: string) => [
    { label: t("signup.pwMin"), ok: pw.length >= 8 },
    { label: t("signup.pwUpper"), ok: /[A-Z]/.test(pw) },
    { label: t("signup.pwDigit"), ok: /[0-9]/.test(pw) },
    { label: t("signup.pwSpecial"), ok: /[^a-zA-Z0-9]/.test(pw) },
  ];

  const checks = passwordChecks(password);
  const strength = checks.filter(c => c.ok).length;
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-[#F59E0B]", "bg-[hsl(var(--success))]", "bg-[hsl(var(--success))]"];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t("signup.errorTitle"), description: t("signup.errorMismatch"), variant: "destructive" });
      return;
    }
    if (strength < 3) {
      toast({ title: t("signup.errorWeakTitle"), description: t("signup.errorWeak"), variant: "destructive" });
      return;
    }
    if (!cgu) {
      toast({ title: t("signup.errorCguTitle"), description: t("signup.errorCgu"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { first_name: firstName, last_name: lastName, company },
        emailRedirectTo: window.location.origin + "/app/dashboard",
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: t("signup.errorTitle"), description: error.message, variant: "destructive" });
    } else {
      // Track affiliate signup if ref code exists
      const refCode = sessionStorage.getItem("affiliate_code");
      const clickId = sessionStorage.getItem("affiliate_click_id");
      if (refCode && data.user) {
        supabase.functions.invoke("affiliate-tracker", {
          body: {
            action: "track_signup",
            payload: {
              code: refCode,
              click_id: clickId || null,
              user_id: data.user.id,
              email,
            },
          },
        }).catch(() => {});
        sessionStorage.removeItem("affiliate_code");
        sessionStorage.removeItem("affiliate_click_id");
      }
      // Fire-and-forget welcome email
      supabase.functions.invoke("send-welcome-email", {
        body: { userId: data.user?.id, email, firstName },
      }).catch(() => {});
      setStep(2);
    }
  };

  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) { clearInterval(interval); navigate("/app/dashboard"); }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, navigate]);

  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    if (resendCountdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, resendCountdown]);

  const handleResend = async () => {
    if (!canResend) return;
    await supabase.auth.resend({ type: "signup", email });
    setCanResend(false);
    setResendCountdown(60);
    toast({ title: t("signup.resendTitle"), description: t("signup.resendDesc") });
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-[24px] p-10 md:p-12 w-full max-w-[480px] text-center">
          <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto mb-6">
            <circle cx="40" cy="40" r="40" fill="rgba(233,30,140,0.15)"/>
            <rect x="12" y="24" width="56" height="36" rx="6" stroke="hsl(var(--fuchsia))" strokeWidth="2.5" fill="rgba(233,30,140,0.08)"/>
            <path d="M12 30 L40 48 L68 30" stroke="hsl(var(--fuchsia))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <animate attributeName="d" values="M12 30 L40 48 L68 30;M12 24 L40 10 L68 24;M12 30 L40 48 L68 30" dur="3s" repeatCount="indefinite"/>
            </path>
            <circle cx="58" cy="22" r="14" fill="rgba(16,185,129,0.2)" stroke="hsl(var(--success))" strokeWidth="2"/>
            <path d="M52 22 L56 26 L64 18" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="font-display font-extrabold text-[26px] text-foreground mb-3">{t("signup.verifyTitle")}</h2>
          <p className="font-body text-[15px] text-muted-foreground mb-1">{t("signup.verifySent")}</p>
          <p className="font-body text-[15px] text-foreground font-medium mb-4">{email}</p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--fuchsia))] animate-pulse" />
            <span className="font-mono text-[12px] text-muted-foreground">{t("signup.verifyChecking")}</span>
          </div>
          <p className="font-body text-sm text-muted-foreground mb-6">{t("signup.verifyClick")}</p>
          <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="block w-full font-display font-bold text-sm text-white bg-gradient-primary py-3.5 rounded-[10px] shadow-fuchsia mb-3">{t("signup.openGmail")}</a>
          <button onClick={handleResend} disabled={!canResend} className="font-body text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed mt-2">
            {canResend ? t("signup.resend") : t("signup.resendWait", { seconds: resendCountdown })}
          </button>
          <div className="mt-3">
            <Link to="/connexion" className="font-body text-[13px] text-[hsl(var(--fuchsia-l))] hover:underline">{t("signup.backLogin")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSignup} className="bg-card border border-border rounded-[24px] p-10 md:p-12 w-full max-w-[480px]">
        <p className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-[1.5px] mb-2">{t("signup.step")}</p>
        <div className="flex gap-2 mb-6">
          {[1,2].map(s => <div key={s} className={`h-[3px] flex-1 rounded-full ${s <= 1 ? "bg-gradient-primary" : "bg-[hsl(var(--dark-4))]"}`} />)}
        </div>
        <h1 className="font-display font-extrabold text-[26px] tracking-tight text-foreground mb-1">{t("signup.title")}</h1>
        <p className="font-body text-sm text-muted-foreground mb-6">{t("signup.subtitle")}</p>

        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("signup.firstNameLabel")}</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Michael" className="w-full bg-secondary border border-border rounded-[10px] px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
            </div>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("signup.lastNameLabel")}</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Kebail-Ali" className="w-full bg-secondary border border-border rounded-[10px] px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("signup.emailLabel")}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="michael@braindcode.com" className="w-full bg-secondary border border-border rounded-[10px] px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("signup.companyLabel")}</label>
            <input value={company} onChange={e => setCompany(e.target.value)} required placeholder="BraindCode" className="w-full bg-secondary border border-border rounded-[10px] px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("signup.passwordLabel")}</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-secondary border border-border rounded-[10px] px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1.5">{[0,1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? strengthColors[strength] : "bg-[hsl(var(--dark-4))]"}`} />)}</div>
                <div className="space-y-0.5">{checks.map(c => <p key={c.label} className={`font-mono text-[11px] ${c.ok ? "text-[hsl(var(--success))]" : "text-muted-foreground/40"}`}>{c.ok ? "✓" : "✗"} {c.label}</p>)}</div>
              </div>
            )}
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[1.5px] block mb-1.5">{t("signup.confirmLabel")}</label>
            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full bg-secondary border border-border rounded-[10px] px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={cgu} onChange={e => setCgu(e.target.checked)} className="accent-[hsl(var(--fuchsia))] mt-0.5" />
            <span className="font-body text-[13px] text-muted-foreground">{t("signup.cgu")} <a href="#" className="text-[hsl(var(--fuchsia-l))] hover:underline">{t("signup.cguLink")}</a> {t("signup.and")} <a href="#" className="text-[hsl(var(--fuchsia-l))] hover:underline">{t("signup.privacyLink")}</a></span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full mt-6 font-display font-bold text-[15px] text-white bg-gradient-primary py-3.5 rounded-[10px] shadow-fuchsia hover:-translate-y-0.5 transition-transform disabled:opacity-60">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              {t("signup.loading")}
            </span>
          ) : t("signup.submit")}
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
          {t("signup.google")}
        </button>

        <p className="text-center mt-5 font-body text-[13px] text-muted-foreground">
          {t("signup.hasAccount")} <Link to="/connexion" className="text-[hsl(var(--fuchsia-l))] hover:underline">{t("signup.loginLink")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Inscription;
