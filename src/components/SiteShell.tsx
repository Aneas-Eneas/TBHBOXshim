import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { loadGameData } from "../utils/data";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface SiteShellProps {
  children: ReactNode;
}

const links = [
  { to: "/", label: "nav.home" },
  { to: "/chests", label: "nav.chests" },
  { to: "/map", label: "nav.map" },
  { to: "/probability", label: "nav.probability" },
  { to: "/about", label: "nav.about" },
];

export function SiteShell({ children }: SiteShellProps) {
  const { t } = useTranslation();
  const [itemDataState, setItemDataState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    loadGameData()
      .then(() => {
        if (active) {
          setItemDataState("ready");
        }
      })
      .catch(() => {
        if (active) {
          setItemDataState("error");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-700/70 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <NavLink to="/" className="text-xl font-black tracking-wide text-amber-300">
              {t("siteName")}
            </NavLink>
            <p className="mt-1 text-sm text-slate-400">{t("siteTagline")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="flex flex-wrap gap-2" aria-label="Main navigation">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-semibold transition ${
                      isActive ? "bg-amber-400 text-slate-950" : "text-slate-200 hover:bg-slate-800"
                    }`
                  }
                >
                  {t(link.label)}
                </NavLink>
              ))}
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      {itemDataState !== "ready" && (
        <div
          className={`border-b px-4 py-2 text-center text-sm font-semibold ${
            itemDataState === "loading"
              ? "border-slate-700 bg-slate-900 text-slate-300"
              : "border-red-800 bg-red-950 text-red-100"
          }`}
          role={itemDataState === "error" ? "alert" : "status"}
        >
          {itemDataState === "loading" ? t("data.loadingItems") : t("data.itemLoadError")}
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{itemDataState === "ready" ? children : null}</main>
      <footer className="mt-8 border-t border-slate-700/70 bg-slate-950/80">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 text-sm text-slate-400 sm:px-6 md:grid-cols-2 lg:px-8">
          <p>{t("meta.dataSource")}</p>
          <p>{t("meta.gameVersion")}</p>
          <p>{t("meta.checked")}</p>
          <p>{t("meta.unofficial")}</p>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <NavLink className="hover:text-amber-300" to="/privacy-policy">
              {t("nav.privacy")}
            </NavLink>
            <NavLink className="hover:text-amber-300" to="/disclaimer">
              {t("nav.disclaimer")}
            </NavLink>
            <NavLink className="hover:text-amber-300" to="/contact">
              {t("nav.contact")}
            </NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
