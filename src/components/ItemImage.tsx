import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedName } from "../utils/data";
import type { Item } from "../utils/types";

interface ItemImageProps {
  item: Item;
}

export function ItemImage({ item }: ItemImageProps) {
  const { i18n, t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const name = getLocalizedName(item, i18n.language);
  const shouldShowImage = Boolean(item.imagePath) && !failed;

  if (!shouldShowImage) {
    return (
      <div className="flex aspect-square w-14 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-900 text-[0.65rem] font-semibold uppercase text-slate-400">
        {t("image.missing")}
      </div>
    );
  }

  return (
    <img
      className="aspect-square w-14 shrink-0 rounded-md border border-slate-600 bg-slate-900 object-contain p-1"
      src={item.imagePath ?? undefined}
      alt={t("image.alt", { item: name })}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
