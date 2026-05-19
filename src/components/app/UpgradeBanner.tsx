import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";

interface UpgradeBannerProps {
  feature: "meetings" | "scenarios" | "channels";
  currentCount: number;
  limit: number;
}

const UpgradeBanner = ({ feature, currentCount, limit }: UpgradeBannerProps) => {
  const { t } = useTranslation("app");
  const atLimit = currentCount >= limit;
  const nearLimit = currentCount >= limit - 1 && currentCount < limit;

  if (!atLimit && !nearLimit) return null;

  const featureLabels: Record<string, string> = {
    meetings: t("upgrade.meetings"),
    scenarios: t("upgrade.scenarios"),
    channels: t("upgrade.channels"),
  };

  return (
    <div className={`rounded-xl border p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
      atLimit
        ? "bg-[rgba(233,30,140,0.08)] border-[hsl(var(--fuchsia))]/30"
        : "bg-[rgba(245,158,11,0.08)] border-[#F59E0B]/30"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          atLimit ? "bg-fuchsia-d" : "bg-[rgba(245,158,11,0.15)]"
        }`}>
          <Zap className={`h-5 w-5 ${atLimit ? "text-[hsl(var(--fuchsia-l))]" : "text-[#F59E0B]"}`} />
        </div>
        <div>
          <p className="font-display font-bold text-sm text-foreground">
            {atLimit ? t("upgrade.limitReached") : t("upgrade.limitNear")}
          </p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            {atLimit
              ? t("upgrade.limitReachedDesc", { feature: featureLabels[feature], count: limit })
              : t("upgrade.limitNearDesc", { feature: featureLabels[feature], current: currentCount, max: limit })
            }
          </p>
        </div>
      </div>
      <Link
        to="/app/billing"
        className="font-display font-bold text-xs text-white bg-gradient-primary px-4 py-2 rounded-lg shadow-fuchsia hover:-translate-y-0.5 transition-transform shrink-0"
      >
        {t("upgrade.upgradeBtn")}
      </Link>
    </div>
  );
};

export default UpgradeBanner;
