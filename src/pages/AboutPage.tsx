import { useTranslation } from "react-i18next";
import { StaticPage } from "./StaticPage";

export function AboutPage() {
  const { t } = useTranslation();
  return <StaticPage title={t("pages.aboutTitle")} body={t("static.about")} />;
}
