import { useTranslation } from "react-i18next";
import { getChestDropGroups, getLocalizedName, itemById } from "../utils/data";
import { formatRate, getGroupProbability } from "../utils/dropSimulator";
import type { Chest, DlcVariant } from "../utils/types";

interface ProbabilityTableProps {
  chest: Chest;
  dlc: DlcVariant;
}

export function ProbabilityTable({ chest, dlc }: ProbabilityTableProps) {
  const { i18n, t } = useTranslation();
  const groups = getChestDropGroups(chest, dlc);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950/70">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700 text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">{t("table.group")}</th>
              <th className="px-4 py-3">{t("table.rarity")}</th>
              <th className="px-4 py-3">{t("table.items")}</th>
              <th className="px-4 py-3">{t("table.weight")}</th>
              <th className="px-4 py-3">{t("table.probability")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-slate-900/80">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{group.id}</td>
                <td className="px-4 py-3">
                  <span className={`rarity-${group.rarity.toLowerCase()} rounded px-2 py-1 text-xs font-bold`} style={{ color: "var(--rarity)" }}>
                    {group.rarity}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {group.items
                    .map((id) => {
                      const item = itemById.get(id);
                      return item ? getLocalizedName(item, i18n.language) : id;
                    })
                    .join(", ")}
                </td>
                <td className="px-4 py-3 text-slate-300">{group.weight?.toLocaleString() ?? "-"}</td>
                <td className="px-4 py-3 font-semibold text-amber-200">{formatRate(getGroupProbability(chest, group, dlc))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
