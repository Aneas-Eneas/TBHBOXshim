import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AdPlaceholder } from "../components/AdPlaceholder";

const categoryLinks = [
  { to: "/chests/normal", label: "categories.normal", tone: "border-slate-500" },
  { to: "/chests/stage-boss", label: "categories.stage_boss", tone: "border-blue-400" },
  { to: "/chests/act-boss", label: "categories.act_boss", tone: "border-red-400" },
];

export function ChestsPage() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6">
      <PageHeader title={t("pages.chestsTitle")} intro={t("pages.chestsIntro")} />
      <div className="grid gap-4 md:grid-cols-3">
        {categoryLinks.map((link) => (
          <Link
            key={link.to}
            className={`rounded-lg border ${link.tone} bg-slate-900/80 p-5 transition hover:-translate-y-0.5 hover:bg-slate-800`}
            to={link.to}
          >
            <h2 className="text-xl font-black text-slate-50">{t(link.label)}</h2>
            <p className="mt-3 text-sm text-slate-400">{t("pages.categoryCard")}</p>
          </Link>
        ))}
      </div>
      <AdPlaceholder />
    </div>
  );
}

export function PageHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/80 p-6">
      <h1 className="text-3xl font-black text-slate-50">{title}</h1>
      <p className="mt-3 max-w-3xl text-slate-300">{intro}</p>
    </section>
  );
}
