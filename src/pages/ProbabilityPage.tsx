import { useTranslation } from "react-i18next";
import { AdPlaceholder } from "../components/AdPlaceholder";
import { ProbabilityTable } from "../components/ProbabilityTable";
import { chests, getLocalizedName } from "../utils/data";
import { PageHeader } from "./ChestsPage";

export function ProbabilityPage() {
  const { i18n, t } = useTranslation();

  return (
    <div className="grid gap-6">
      <PageHeader title={t("pages.probabilityTitle")} intro={t("pages.probabilityIntro")} />
      <AdPlaceholder compact />
      <div className="grid gap-6">
        {chests.map((chest) => (
          <section key={chest.id} className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-amber-300">{t(`categories.${chest.category}`)}</p>
                <h2 className="text-2xl font-black text-slate-50">{getLocalizedName(chest, i18n.language)}</h2>
              </div>
              <p className="text-sm text-slate-400">
                {chest.gearLevel.label[i18n.language as "en" | "ja"] ?? chest.gearLevel.label.en}
              </p>
            </div>
            <ProbabilityTable chest={chest} dlc="base" />
          </section>
        ))}
      </div>
    </div>
  );
}
