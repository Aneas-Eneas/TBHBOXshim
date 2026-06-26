import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  chestMatchesDlc,
  chestMatchesStageSelection,
  chests,
  getChestStages,
  getLocalizedName,
  stages,
} from "../utils/data";
import { formatRate, openChest, summarizeItems, summarizeRarities } from "../utils/dropSimulator";
import type { Chest, ChestCategory, Difficulty, DlcVariant, OpenResult } from "../utils/types";
import { ItemImage } from "./ItemImage";
import { ProbabilityTable } from "./ProbabilityTable";

interface SimulatorPanelProps {
  initialCategory?: ChestCategory;
}

const openCounts = [1, 5, 10, 15, 20] as const;
const dlcOptions: DlcVariant[] = ["base", "hunter", "slayer", "hunter_slayer"];
const difficulties: Difficulty[] = ["Normal", "Nightmare", "Hell", "Torment"];
const acts = [1, 2, 3] as const;
const stageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const categoryOptions: ChestCategory[] = ["normal", "stage_boss", "act_boss"];

function rarityClass(rarity: string) {
  return `rarity-${rarity.toLowerCase()} border-[color:var(--rarity)]`;
}

export function SimulatorPanel({ initialCategory = "normal" }: SimulatorPanelProps) {
  const { i18n, t } = useTranslation();
  const [category, setCategory] = useState<ChestCategory>(initialCategory);
  const [difficulty, setDifficulty] = useState<Difficulty>("Normal");
  const [act, setAct] = useState(1);
  const [stageNumber, setStageNumber] = useState(1);
  const [dlc, setDlc] = useState<DlcVariant>("base");
  const [selectedChestId, setSelectedChestId] = useState("");
  const [results, setResults] = useState<OpenResult[]>([]);

  const filteredChests = useMemo(() => {
    return chests.filter((chest) => {
      return (
        chest.category === category &&
        chestMatchesDlc(chest, dlc) &&
        chestMatchesStageSelection(chest, difficulty, act, stageNumber)
      );
    });
  }, [act, category, difficulty, dlc, stageNumber, chests.length, stages.length]);

  const selectedChest: Chest | undefined = useMemo(() => {
    return filteredChests.find((chest) => chest.id === selectedChestId) ?? filteredChests[0];
  }, [filteredChests, selectedChestId]);

  const itemSummary = selectedChest ? summarizeItems(selectedChest, results, i18n.language, dlc) : [];
  const raritySummary = selectedChest ? summarizeRarities(selectedChest, results, dlc) : [];
  const resultItemCount = new Set(results.map((result) => String(result.item.id))).size;
  const resultRarityCount = new Set(results.map((result) => result.item.rarity)).size;
  const selectedRoute = `${t(`difficulty.${difficulty}`)} / ACT ${act} / ${act}-${stageNumber}`;

  function handleCategory(nextCategory: ChestCategory) {
    setCategory(nextCategory);
    setSelectedChestId("");
    setResults([]);
  }

  function resetFilteredSelection() {
    setSelectedChestId("");
    setResults([]);
  }

  function handleOpen(count: number) {
    if (!selectedChest) {
      return;
    }

    setResults(openChest(selectedChest, count, dlc));
  }

  return (
    <section className="grid w-full max-w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(21rem,0.84fr)_minmax(0,1.16fr)]">
      <div className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/90 shadow-2xl shadow-slate-950/40">
        <div className="border-b border-slate-700 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-50">{t("simulator.title")}</h2>
              <p className="mt-1 text-sm text-slate-400">{t("simulator.rewardCountNote")}</p>
            </div>
            <div className="rounded-md border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-200">
              {selectedRoute}
            </div>
          </div>
        </div>

        <div className="grid gap-5 px-4 py-5 sm:px-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black uppercase tracking-wide text-slate-400">{t("simulator.category")}</span>
              <span className="text-xs font-semibold text-slate-500">{filteredChests.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {categoryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`min-h-14 rounded-md border px-3 py-2 text-left text-sm font-black transition ${
                    category === option
                      ? "border-amber-300 bg-amber-300 text-slate-950"
                      : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                  }`}
                  onClick={() => handleCategory(option)}
                >
                  {t(`categories.${option}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-black uppercase tracking-wide text-slate-400">{t("simulator.difficulty")}</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label={t("simulator.difficulty")}>
              {difficulties.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={difficulty === option}
                  className={`min-h-11 rounded-md border px-3 py-2 text-sm font-black transition ${
                    difficulty === option
                      ? "border-amber-300 bg-amber-300 text-slate-950"
                      : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                  }`}
                  onClick={() => {
                    setDifficulty(option);
                    resetFilteredSelection();
                  }}
                >
                  {t(`difficulty.${option}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[0.72fr_1.28fr]">
            <div className="grid gap-2">
              <span className="text-sm font-black uppercase tracking-wide text-slate-400">{t("simulator.act")}</span>
              <div className="grid grid-cols-3 gap-2">
              {acts.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`min-h-11 rounded-md border px-3 py-2 text-sm font-black transition ${
                      act === option
                        ? "border-sky-300 bg-sky-300 text-slate-950"
                        : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                    }`}
                    onClick={() => {
                      setAct(option);
                      resetFilteredSelection();
                    }}
                  >
                    ACT {option}
                  </button>
              ))}
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-black uppercase tracking-wide text-slate-400">{t("simulator.stage")}</span>
              <div className="grid grid-cols-5 gap-2">
              {stageNumbers.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`min-h-11 rounded-md border px-2 py-2 text-sm font-black transition ${
                      stageNumber === option
                        ? "border-sky-300 bg-sky-300 text-slate-950"
                        : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                    }`}
                    onClick={() => {
                      setStageNumber(option);
                      resetFilteredSelection();
                    }}
                  >
                    {act}-{option}
                  </button>
              ))}
              </div>
            </div>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            {t("simulator.dlc")}
            <select
              className="min-h-11 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={dlc}
              onChange={(event) => {
                setDlc(event.target.value as DlcVariant);
                resetFilteredSelection();
              }}
            >
              {dlcOptions.map((option) => (
                <option key={option} value={option}>
                  {t(`dlc.${option}`)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 border-t border-slate-800 pt-5">
            <label className="grid gap-2 text-sm font-semibold text-slate-200">
              {t("simulator.chest")}
              <select
                className="min-h-12 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                value={selectedChest?.id ?? ""}
                onChange={(event) => {
                  setSelectedChestId(event.target.value);
                  setResults([]);
                }}
              >
                {filteredChests.map((chest) => (
                  <option key={chest.id} value={chest.id}>
                    {getLocalizedName(chest, i18n.language)}
                  </option>
                ))}
              </select>
            </label>

            {!selectedChest ? (
              <p className="rounded-md border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">{t("simulator.empty")}</p>
            ) : (
              <div className="grid gap-3 rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-slate-700 px-2 py-1 text-xs font-black uppercase tracking-wide text-slate-400">
                    {t("simulator.chest")}
                  </span>
                  <span className="font-black text-slate-50">{getLocalizedName(selectedChest, i18n.language)}</span>
                </div>
                <p className="text-sm text-slate-400">
                  {getChestStages(selectedChest)
                    .map((stage) => `${stage.difficulty} ${stage.stage}`)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-3 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black uppercase tracking-wide text-slate-400">{t("simulator.latestRun")}</span>
              <span className="text-xs font-semibold text-slate-500">{t("simulator.rewardCountNote")}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {openCounts.map((count) => (
                <button
                  key={count}
                  className="min-h-12 rounded-md border border-amber-300 bg-amber-300 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={() => handleOpen(count)}
                  disabled={!selectedChest}
                >
                  {t(`buttons.open${count}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-50">{t("simulator.latestRun")}</h3>
              <p className="mt-1 text-sm text-slate-400">{selectedChest ? getLocalizedName(selectedChest, i18n.language) : t("simulator.empty")}</p>
            </div>
            {results.length > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-400">
                <div className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2">
                  <span className="block text-lg font-black text-slate-50">{results.length}</span>
                  {t("simulator.total")}
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2">
                  <span className="block text-lg font-black text-slate-50">{resultItemCount}</span>
                  {t("simulator.itemSummary")}
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2">
                  <span className="block text-lg font-black text-slate-50">{resultRarityCount}</span>
                  {t("simulator.raritySummary")}
                </div>
              </div>
            )}
          </div>
          {results.length === 0 ? (
            <p className="mt-4 rounded-md border border-slate-700 bg-slate-950 p-5 text-sm text-slate-400">
              {t("simulator.results")}
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((result) => (
                <article
                  key={`${result.index}-${result.item.id}`}
                  className={`${rarityClass(result.item.rarity)} rounded-lg border bg-slate-950/80 p-3 shadow-lg shadow-slate-950/30`}
                >
                  <div className="flex min-h-20 gap-3">
                    <ItemImage item={result.item} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">#{result.index}</p>
                      <p className="truncate font-black text-slate-50">{getLocalizedName(result.item, i18n.language)}</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--rarity)" }}>
                        {result.item.rarity}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t("simulator.originalRate")}: {formatRate(result.groupProbability)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {selectedChest && results.length > 0 && (
          <div className="grid gap-6 xl:grid-cols-2">
            <SummaryTable title={t("simulator.itemSummary")} rows={itemSummary} />
            <SummaryTable title={t("simulator.raritySummary")} rows={raritySummary} />
          </div>
        )}

        {selectedChest && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
            <h3 className="mb-4 text-xl font-black text-slate-50">{t("pages.probabilityTitle")}</h3>
            <ProbabilityTable chest={selectedChest} dlc={dlc} />
          </div>
        )}
      </div>
    </section>
  );
}

interface SummaryTableProps {
  title: string;
  rows: Array<{
    id: string;
    label: string;
    count: number;
    observedRate: number;
    originalRate: number;
    rarity?: string;
  }>;
}

function SummaryTable({ title, rows }: SummaryTableProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/80 p-5">
      <h3 className="text-lg font-black text-slate-50">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-3">{t("simulator.results")}</th>
              <th className="py-2 pr-3">{t("simulator.total")}</th>
              <th className="py-2 pr-3">{t("simulator.observedRate")}</th>
              <th className="py-2 pr-3">{t("simulator.originalRate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-3 pr-3 font-semibold text-slate-100">
                  <span className={row.rarity ? `rarity-${row.rarity.toLowerCase()}` : ""} style={{ color: row.rarity ? "var(--rarity)" : undefined }}>
                    {row.label}
                  </span>
                </td>
                <td className="py-3 pr-3 text-slate-300">{row.count}</td>
                <td className="py-3 pr-3 text-slate-300">{formatRate(row.observedRate)}</td>
                <td className="py-3 pr-3 text-amber-200">{formatRate(row.originalRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
