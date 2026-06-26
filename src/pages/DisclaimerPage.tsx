import { useTranslation } from "react-i18next";
import { StaticPage } from "./StaticPage";

export function DisclaimerPage() {
  const { t } = useTranslation();
  return <StaticPage title={t("pages.disclaimerTitle")} body={t("static.disclaimer")} />;
}
