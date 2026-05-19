import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const languages = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "tn", flag: "🇹🇳", label: "تونسي" },
];

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher = ({ compact = false }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const current = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/50">
          <Globe className="h-4 w-4" />
          {!compact && <span className="font-body text-sm">{current.flag}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={`flex items-center gap-2 cursor-pointer ${
              i18n.language === lang.code ? "bg-muted font-medium" : ""
            }`}
          >
            <span>{lang.flag}</span>
            <span className="font-body text-sm">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
