import { useState } from "react";

const ReportFeedback = ({ reportId }: { reportId?: string }) => {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleVote = (value: "up" | "down") => {
    setVoted(value);
    if (value === "down") setShowComment(true);
  };

  return (
    <div className="border-t border-border pt-5 mt-6 flex flex-wrap items-center gap-4">
      <span className="font-body text-[13px] text-muted-foreground">Ce rapport est-il utile ?</span>

      <div className="flex gap-2">
        {[
          { icon: "👍", value: "up" as const, label: "Oui" },
          { icon: "👎", value: "down" as const, label: "Non" },
        ].map(({ icon, value, label }) => (
          <button
            key={value}
            onClick={() => handleVote(value)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-body border transition-all ${
              voted === value
                ? "bg-fuchsia-d border-[hsl(var(--fuchsia))]/30 text-[hsl(var(--fuchsia-l))]"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {showComment && !submitted && (
        <div className="w-full flex gap-2 mt-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Qu'est-ce qui pourrait être amélioré ?"
            className="flex-1 bg-secondary border border-border rounded-lg px-3.5 py-2 font-body text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-[hsl(var(--fuchsia))]"
          />
          <button
            onClick={() => setSubmitted(true)}
            className="bg-gradient-primary text-white font-body text-[13px] px-4 py-2 rounded-lg"
          >
            Envoyer
          </button>
        </div>
      )}

      {voted && !showComment && (
        <span className="font-body text-[13px] text-[hsl(var(--success))]">Merci pour votre retour ! 🙏</span>
      )}
      {submitted && (
        <span className="font-body text-[13px] text-[hsl(var(--success))]">Merci, votre feedback a été envoyé ! 🙏</span>
      )}
    </div>
  );
};

export default ReportFeedback;
