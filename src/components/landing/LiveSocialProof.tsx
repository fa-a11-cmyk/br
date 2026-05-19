import { useState, useEffect } from "react";

const LiveSocialProof = () => {
  const [stats, setStats] = useState({
    teams: 127,
    meetings: 3842,
    tasks: 18634,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        teams: prev.teams + (Math.random() < 0.1 ? 1 : 0),
        meetings: prev.meetings + Math.floor(Math.random() * 3),
        tasks: prev.tasks + Math.floor(Math.random() * 12),
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { value: stats.teams, label: "équipes actives", icon: "🏢" },
    { value: stats.meetings.toLocaleString("fr"), label: "réunions analysées", icon: "🎙" },
    { value: stats.tasks.toLocaleString("fr"), label: "tâches créées auto", icon: "✅" },
  ];

  return (
    <div className="bg-card border-y border-border py-4 px-5 md:px-[60px]">
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {items.map((stat, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="text-lg">{stat.icon}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-extrabold text-xl text-foreground">{stat.value}</span>
              <span className="font-body text-[13px] text-muted-foreground">{stat.label}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          En direct
        </div>
      </div>
    </div>
  );
};

export default LiveSocialProof;
