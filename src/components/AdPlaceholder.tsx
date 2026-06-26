import { useTranslation } from "react-i18next";

interface AdPlaceholderProps {
  compact?: boolean;
}

export function AdPlaceholder({ compact = false }: AdPlaceholderProps) {
  const { t } = useTranslation();

  return (
    <aside
      aria-label={t("ads.label")}
      className={`rounded-lg border border-dashed border-slate-600/80 bg-slate-950/60 text-center text-slate-400 ${
        compact ? "px-4 py-5" : "px-6 py-8"
      }`}
    >
      {/* Replace this placeholder with the approved AdSense ad unit after the publisher id is issued. */}
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("ads.label")}</p>
      <p className="mt-2 text-sm">{t("ads.placeholder")}</p>
    </aside>
  );
}
