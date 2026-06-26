import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AdPlaceholder } from "../components/AdPlaceholder";
import { SimulatorPanel } from "../components/SimulatorPanel";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-8">
      <section className="grid w-full max-w-full min-w-0 gap-6 overflow-hidden rounded-lg border border-slate-700 bg-slate-900/70 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300">TBH Chest Simulator</p>
          <h1 className="mt-3 max-w-full break-words text-3xl font-black text-slate-50 sm:max-w-3xl sm:text-5xl">{t("home.title")}</h1>
          <p className="mt-4 max-w-full text-base leading-7 text-slate-300 sm:max-w-3xl">{t("home.intro")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="rounded-md bg-amber-300 px-4 py-2 font-black text-slate-950 hover:bg-amber-200" to="/chests">
              {t("home.start")}
            </Link>
            <Link className="rounded-md border border-slate-600 px-4 py-2 font-bold text-slate-100 hover:bg-slate-800" to="/probability">
              {t("home.viewRates")}
            </Link>
          </div>
        </div>
        <div className="grid min-w-0 gap-2 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
          <span>{t("meta.dataSource")}</span>
          <span>{t("meta.gameVersion")}</span>
          <span>{t("meta.checked")}</span>
          <span>{t("meta.unofficial")}</span>
        </div>
      </section>
      <AdPlaceholder />
      <SimulatorPanel />
    </div>
  );
}
