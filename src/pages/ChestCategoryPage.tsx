import { useTranslation } from "react-i18next";
import { SimulatorPanel } from "../components/SimulatorPanel";
import type { ChestCategory } from "../utils/types";
import { PageHeader } from "./ChestsPage";

interface ChestCategoryPageProps {
  category: ChestCategory;
}

export function ChestCategoryPage({ category }: ChestCategoryPageProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6">
      <PageHeader title={t(`categories.${category}`)} intro={t("pages.chestsIntro")} />
      <SimulatorPanel initialCategory={category} />
    </div>
  );
}
