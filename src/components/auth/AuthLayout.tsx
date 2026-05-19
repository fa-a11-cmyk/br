import { Link } from "react-router-dom";

const AuthSVG = () => (
  <svg width="320" height="240" viewBox="0 0 320 240" className="mx-auto my-8">
    <g transform="translate(20, 120)">
      <rect x="0" y="-30" width="8" height="60" rx="4" fill="hsl(var(--fuchsia))" opacity="0.8">
        <animate attributeName="height" values="60;20;50;80;60" dur="1.2s" repeatCount="indefinite"/>
        <animate attributeName="y" values="-30;-10;-25;-40;-30" dur="1.2s" repeatCount="indefinite"/>
      </rect>
      <rect x="14" y="-50" width="8" height="100" rx="4" fill="hsl(var(--fuchsia))" opacity="0.6">
        <animate attributeName="height" values="100;40;80;60;100" dur="0.9s" repeatCount="indefinite"/>
        <animate attributeName="y" values="-50;-20;-40;-30;-50" dur="0.9s" repeatCount="indefinite"/>
      </rect>
      <rect x="28" y="-20" width="8" height="40" rx="4" fill="hsl(var(--fuchsia-l))" opacity="0.7">
        <animate attributeName="height" values="40;80;30;60;40" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="y" values="-20;-40;-15;-30;-20" dur="1.5s" repeatCount="indefinite"/>
      </rect>
      <rect x="42" y="-40" width="8" height="80" rx="4" fill="hsl(var(--violet))" opacity="0.6">
        <animate attributeName="height" values="80;30;70;50;80" dur="1.1s" repeatCount="indefinite"/>
      </rect>
      <rect x="56" y="-25" width="8" height="50" rx="4" fill="hsl(var(--violet-l))" opacity="0.5">
        <animate attributeName="height" values="50;90;40;70;50" dur="1.3s" repeatCount="indefinite"/>
      </rect>
    </g>
    <line x1="90" y1="120" x2="145" y2="120" stroke="url(#authLineGrad)" strokeWidth="2" strokeDasharray="4 3">
      <animate attributeName="strokeDashoffset" values="14;0" dur="0.8s" repeatCount="indefinite"/>
    </line>
    <circle cx="160" cy="120" r="28" fill="url(#authNodeGrad)" opacity="0.9">
      <animate attributeName="r" values="28;32;28" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="160" cy="120" r="18" fill="hsl(var(--background))"/>
    <circle cx="160" cy="120" r="8" fill="hsl(var(--foreground))" opacity="0.9"/>
    <line x1="178" y1="108" x2="220" y2="75" stroke="hsl(var(--success))" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7">
      <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.5s" repeatCount="indefinite"/>
    </line>
    <circle cx="228" cy="68" r="12" fill="rgba(16,185,129,0.2)" stroke="hsl(var(--success))" strokeWidth="1.5"/>
    <text x="228" y="73" textAnchor="middle" fontSize="12">📊</text>
    <line x1="188" y1="120" x2="240" y2="120" stroke="hsl(var(--fuchsia))" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7">
      <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.8s" repeatCount="indefinite"/>
    </line>
    <circle cx="252" cy="120" r="12" fill="rgba(233,30,140,0.2)" stroke="hsl(var(--fuchsia))" strokeWidth="1.5"/>
    <text x="252" y="125" textAnchor="middle" fontSize="12">📧</text>
    <line x1="178" y1="132" x2="220" y2="165" stroke="hsl(var(--violet))" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7">
      <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.1s" repeatCount="indefinite"/>
    </line>
    <circle cx="228" cy="172" r="12" fill="rgba(124,58,237,0.2)" stroke="hsl(var(--violet))" strokeWidth="1.5"/>
    <text x="228" y="177" textAnchor="middle" fontSize="12">💬</text>
    <line x1="160" y1="92" x2="160" y2="55" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7">
      <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.3s" repeatCount="indefinite"/>
    </line>
    <circle cx="160" cy="44" r="12" fill="rgba(245,158,11,0.2)" stroke="#F59E0B" strokeWidth="1.5"/>
    <text x="160" y="49" textAnchor="middle" fontSize="12">📅</text>
    <line x1="160" y1="148" x2="160" y2="185" stroke="hsl(var(--violet-l))" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7">
      <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.6s" repeatCount="indefinite"/>
    </line>
    <circle cx="160" cy="196" r="12" fill="rgba(155,92,246,0.2)" stroke="hsl(var(--violet-l))" strokeWidth="1.5"/>
    <text x="160" y="201" textAnchor="middle" fontSize="12">⚡</text>
    <defs>
      <linearGradient id="authLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(var(--fuchsia))"/>
        <stop offset="100%" stopColor="hsl(var(--violet))"/>
      </linearGradient>
      <radialGradient id="authNodeGrad">
        <stop offset="0%" stopColor="hsl(var(--fuchsia-l))"/>
        <stop offset="100%" stopColor="hsl(var(--violet))"/>
      </radialGradient>
    </defs>
  </svg>
);

export const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background flex">
    {/* Left branding column — always dark */}
    <div className="hidden lg:flex w-1/2 force-dark flex-col sticky top-0 h-screen border-r border-border/20">
      <div className="p-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v20M8 6v12M4 9v6M16 6v12M20 9v6" /></svg>
          </div>
          <span className="font-display font-extrabold text-lg">
            <span style={{ background: "linear-gradient(135deg, #E91E8C, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Rapido</span>
            <span className="text-[#F5F5FA]">Meet</span>
          </span>
        </Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-12">
        <div className="max-w-md">
          <h2 className="font-display font-extrabold text-[clamp(28px,3vw,44px)] leading-[1.05] tracking-tight text-[#F5F5FA]">
            La réunion finit.<br />Les actions<br />
            <span style={{ background: "linear-gradient(135deg, #E91E8C, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>commencent.</span>
          </h2>
          <p className="font-body text-base text-[#9898B0] mt-4 max-w-[380px]">
            Transcription · Extraction · Automatisation<br />
            en moins de 3 minutes après chaque réunion.
          </p>
          <AuthSVG />
        </div>
      </div>
      <div className="p-10">
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5">
          <p className="font-body text-sm text-[#9898B0] italic mb-3">
            "RapidoMeet nous a fait gagner 3h par semaine et notre taux de closing a augmenté de 23%."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-display font-bold text-xs text-white">KM</div>
            <div>
              <p className="font-display font-bold text-[13px] text-[#F5F5FA]">Karim M.</p>
              <p className="font-body text-xs text-[#9898B0]">CEO · Startup Tech Lyon</p>
            </div>
            <span className="ml-auto text-xs text-[#E91E8C]">★★★★★</span>
          </div>
        </div>
      </div>
    </div>
    {/* Right form column */}
    <div className="flex-1 flex items-center justify-center p-6 min-h-screen">
      {children}
    </div>
  </div>
);
