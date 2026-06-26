import { useTranslation } from "react-i18next";
import { StaticPage } from "./StaticPage";

export function PrivacyPolicyPage() {
  const { t } = useTranslation();
  return <StaticPage title={t("pages.privacyTitle")} body={t("static.privacy")} />;
}
