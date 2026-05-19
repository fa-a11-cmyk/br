import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Maintenance = () => {
  const [time, setTime] = useState({ h: 0, m: 24, s: 38 });

  useEffect(() => {
    const iv = setInterval(() => {
      setTime(t => {
        let { h, m, s } = t;
        if (s > 0) s--;
        else if (m > 0) { m--; s = 59; }
        else if (h > 0) { h--; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <Link to="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v20M8 6v12M4 9v6M16 6v12M20 9v6" /></svg>
        </div>
        <span className="font-display font-extrabold text-lg"><span className="text-gradient">Rapido</span><span className="text-foreground">Meet</span></span>
      </Link>

      <span className="text-5xl mb-6">🔧</span>
      <h1 className="font-display font-extrabold text-3xl text-foreground mb-3">Maintenance en cours</h1>
      <p className="font-body text-base text-muted-foreground mb-8">Nous améliorons RapidoMeet. Retour prévu dans :</p>

      <div className="flex gap-4 mb-10">
        {[{ v: time.h, l: "h" }, { v: time.m, l: "min" }, { v: time.s, l: "sec" }].map(u => (
          <div key={u.l} className="flex flex-col items-center">
            <span className="font-display font-extrabold text-[48px] text-foreground tabular-nums">{pad(u.v)}</span>
            <span className="font-mono text-[11px] text-muted-foreground uppercase">{u.l}</span>
          </div>
        ))}
      </div>

      <p className="font-body text-sm text-muted-foreground mb-4">
        Rejoignez-nous sur Telegram : <a href="#" className="text-[hsl(var(--fuchsia-l))] hover:underline">@rapidomeet_updates</a>
      </p>

      <div className="flex gap-2 max-w-sm w-full">
        <input type="email" placeholder="votre@email.com" className="flex-1 bg-secondary border border-border rounded-[10px] px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[hsl(var(--fuchsia))] outline-none" />
        <button className="font-display font-bold text-sm text-white bg-gradient-primary px-5 py-3 rounded-[10px] shadow-fuchsia shrink-0">Me notifier</button>
      </div>
    </div>
  );
};

export default Maintenance;
