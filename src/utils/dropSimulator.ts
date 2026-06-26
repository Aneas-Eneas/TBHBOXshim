import { getChestDropGroups, itemById } from "./data";
import type { Chest, CountSummary, DropGroup, Item, OpenResult, Rarity } from "./types";
import type { DlcVariant } from "./types";

function groupValue(group: DropGroup) {
  return group.weight ?? group.probability ?? 0;
}

function pickWeightedGroup(groups: DropGroup[]) {
  const total = groups.reduce((sum, group) => sum + groupValue(group), 0);
  const roll = Math.random() * total;
  let cursor = 0;

  for (const group of groups) {
    cursor += groupValue(group);
    if (roll <= cursor) {
      return group;
    }
  }

  return groups[groups.length - 1];
}

function pickItem(group: DropGroup): Item {
  const itemId = group.items[Math.floor(Math.random() * group.items.length)];
  const item = itemById.get(itemId);

  if (!item) {
    return {
      id: itemId,
      names: {
        en: itemId,
        ja: itemId,
      },
      rarity: group.rarity,
      imagePath: null,
    };
  }

  return item;
}

export function getGroupProbability(chest: Chest, group: DropGroup, dlc: DlcVariant = "base") {
  const groups = getChestDropGroups(chest, dlc);
  const weightTotal = groups.reduce((sum, entry) => sum + (entry.weight ?? 0), 0);
  if (weightTotal > 0 && group.weight !== undefined) {
    return (group.weight / weightTotal) * 100;
  }

  const probabilityTotal = groups.reduce((sum, entry) => sum + (entry.probability ?? 0), 0);
  if (probabilityTotal > 0 && group.probability !== undefined) {
    return (group.probability / probabilityTotal) * 100;
  }

  return 0;
}

export function getItemOriginalRate(chest: Chest, itemId: string, dlc: DlcVariant = "base") {
  return getChestDropGroups(chest, dlc).reduce((sum, group) => {
    if (!group.items.includes(itemId)) {
      return sum;
    }

    return sum + getGroupProbability(chest, group, dlc) / group.items.length;
  }, 0);
}

export function openChest(chest: Chest, count: number, dlc: DlcVariant = "base"): OpenResult[] {
  const groups = getChestDropGroups(chest, dlc);

  return Array.from({ length: count }, (_, index) => {
    const group = pickWeightedGroup(groups);
    const item = pickItem(group);

    return {
      index: index + 1,
      item,
      group,
      groupProbability: getGroupProbability(chest, group, dlc),
    };
  });
}

export function summarizeItems(chest: Chest, results: OpenResult[], language: string, dlc: DlcVariant = "base"): CountSummary[] {
  const counts = new Map<string, CountSummary>();

  for (const result of results) {
    const label = result.item.names[language as "en" | "ja"] ?? result.item.names.en;
    const current = counts.get(result.item.id);

    if (current) {
      current.count += 1;
      current.observedRate = (current.count / results.length) * 100;
      continue;
    }

    counts.set(result.item.id, {
      id: result.item.id,
      label,
      count: 1,
      observedRate: (1 / results.length) * 100,
      originalRate: getItemOriginalRate(chest, result.item.id, dlc),
      rarity: result.item.rarity,
      item: result.item,
    });
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function summarizeRarities(chest: Chest, results: OpenResult[], dlc: DlcVariant = "base"): CountSummary[] {
  const counts = new Map<Rarity, CountSummary>();

  for (const result of results) {
    const current = counts.get(result.item.rarity);

    if (current) {
      current.count += 1;
      current.observedRate = (current.count / results.length) * 100;
      continue;
    }

    counts.set(result.item.rarity, {
      id: result.item.rarity,
      label: result.item.rarity,
      count: 1,
      observedRate: (1 / results.length) * 100,
      originalRate: getRarityOriginalRate(chest, result.item.rarity, dlc),
      rarity: result.item.rarity,
    });
  }

  return Array.from(counts.values()).sort((a, b) => b.originalRate - a.originalRate);
}

function getRarityOriginalRate(chest: Chest, rarity: Rarity, dlc: DlcVariant) {
  return getChestDropGroups(chest, dlc).reduce((sum, group) => {
    if (group.rarity !== rarity) {
      return sum;
    }

    return sum + getGroupProbability(chest, group, dlc);
  }, 0);
}

export function formatRate(rate: number) {
  return `${rate.toFixed(rate >= 10 ? 1 : 2)}%`;
}
