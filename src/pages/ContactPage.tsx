import { useTranslation } from "react-i18next";
import { StaticPage } from "./StaticPage";

export function ContactPage() {
  const { t } = useTranslation();
  return <StaticPage title={t("pages.contactTitle")} body={t("static.contact")} />;
}
