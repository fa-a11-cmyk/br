import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ThemeToggle({ size = "md", showLabel = false }: ThemeToggleProps) {
  const { toggleTheme, isDark } = useTheme();

  const sizes = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Passer en mode ${isDark ? "clair" : "sombre"}`}
      title={`Mode ${isDark ? "clair" : "sombre"}`}
      className={`
        ${showLabel ? "px-3 gap-2" : sizes[size]}
        flex items-center justify-center rounded-lg
        bg-secondary border border-border
        text-muted-foreground hover:text-primary hover:border-primary
        transition-all duration-200 shrink-0 cursor-pointer
      `}
    >
      <span className={`${iconSizes[size]} transition-transform duration-300 ${isDark ? "rotate-0" : "rotate-180"}`}>
        {isDark ? <Sun className="w-full h-full" /> : <Moon className="w-full h-full" />}
      </span>
      {showLabel && (
        <span className="font-body text-[13px] font-medium text-muted-foreground whitespace-nowrap">
          {isDark ? "Mode clair" : "Mode sombre"}
        </span>
      )}
    </button>
  );
}
