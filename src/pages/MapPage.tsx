import { useTranslation } from "react-i18next";
import { AdPlaceholder } from "../components/AdPlaceholder";
import { getLocalizedName } from "../utils/data";
import { chests, stages } from "../utils/data";
import { PageHeader } from "./ChestsPage";

export function MapPage() {
  const { i18n, t } = useTranslation();

  return (
    <div className="grid gap-6">
      <PageHeader title={t("pages.mapTitle")} intro={t("pages.mapIntro")} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage) => (
          <article key={stage.id} className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-amber-300">{stage.difficulty}</p>
                <h2 className="mt-1 text-xl font-black text-slate-50">
                  Act {stage.act} / {stage.stage}
                </h2>
              </div>
              <span className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-300">Lv {stage.level}</span>
            </div>
            <p className="mt-3 text-slate-300">{getLocalizedName(stage, i18n.language)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stage.boxes.map((boxId) => {
                const chest = chests.find((entry) => entry.id === boxId);
                return (
                  <span key={boxId} className="rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-300">
                    {chest ? getLocalizedName(chest, i18n.language) : boxId}
                  </span>
                );
              })}
            </div>
          </article>
        ))}
      </div>
      <AdPlaceholder />
    </div>
  );
}
