import confetti from "canvas-confetti";

export function useConfetti() {
  const fireConfetti = (options?: {
    type?: "celebration" | "success" | "stars";
  }) => {
    const type = options?.type || "celebration";

    switch (type) {
      case "celebration":
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#e91e8c", "#6366f1", "#8b5cf6", "#f59e0b", "#10b981"],
        });
        break;

      case "success":
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#10b981", "#22c55e", "#4ade80"],
          gravity: 1.2,
        });
        break;

      case "stars":
        confetti({
          particleCount: 30,
          spread: 100,
          shapes: ["star"],
          colors: ["#f59e0b", "#fbbf24", "#fcd34d"],
          origin: { y: 0.5 },
        });
        break;
    }
  };

  const fireSideConfetti = () => {
    const end = Date.now() + 300;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#e91e8c", "#6366f1"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#8b5cf6", "#f59e0b"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  return { fireConfetti, fireSideConfetti };
}
