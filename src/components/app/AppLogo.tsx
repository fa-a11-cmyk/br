import { useState, useCallback } from "react";

const LOGO_COLORS: Record<string, string> = {
  G: "#4285F4", A: "#FF5A5F", R: "#E91E8C", N: "#00C774",
  S: "#6772E5", M: "#7C3AED", D: "#5865F2", T: "#26A5E4",
  W: "#25D366", L: "#0A66C2", O: "#FF6900", C: "#10B981",
  H: "#FF7A59", P: "#003087", F: "#FF4500", Z: "#FF4A00",
  B: "#0052CC", I: "#635BFF", E: "#000000", Q: "#2A2A2A",
};

export const AppLogo = ({
  domain,
  name,
  size = 32,
  className = "",
}: {
  domain: string;
  name: string;
  size?: number;
  className?: string;
}) => {
  const [currentSrc, setCurrentSrc] = useState(
    `https://logo.clearbit.com/${domain}?size=${size * 2}`
  );
  const [failCount, setFailCount] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    const fallbacks = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ];
    if (failCount < fallbacks.length) {
      setCurrentSrc(fallbacks[failCount]);
      setFailCount((c) => c + 1);
    } else {
      setFailed(true);
    }
  }, [domain, size, failCount]);

  if (failed) {
    const initial = name.charAt(0).toUpperCase();
    const bg = LOGO_COLORS[initial] || "#E91E8C";
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${bg}CC, ${bg}88)`,
          borderRadius: Math.round(size * 0.25),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Urbanist, sans-serif",
          fontWeight: 800,
          fontSize: Math.round(size * 0.42),
          color: "white",
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={`${name} logo`}
      width={size}
      height={size}
      onError={handleError}
      className={className}
      style={{
        borderRadius: Math.round(size * 0.22),
        objectFit: "contain",
        background: "rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}
    />
  );
};

export default AppLogo;
