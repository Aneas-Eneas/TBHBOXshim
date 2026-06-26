import type { Chest, ChestCategory, Difficulty, DlcVariant, Item, Stage } from "./types";

export const chests: Chest[] = [];
export const items: Item[] = [];
export const stages: Stage[] = [];

export const itemById = new Map<string, Item>();

let itemDataLoadPromise: Promise<Item[]> | null = null;
let worldDataLoadPromise: Promise<[Chest[], Stage[]]> | null = null;

export async function loadGameData() {
  const [loadedItems] = await Promise.all([loadItemsData(), loadWorldData()]);
  return {
    chests,
    items: loadedItems,
    stages,
  };
}

export async function loadItemsData() {
  if (items.length > 0) {
    return items;
  }

  itemDataLoadPromise ??= fetch("/data/items.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load item data: ${response.status}`);
      }
      return response.json() as Promise<{ items: unknown[] }>;
    })
    .then((payload) => {
      const normalizedItems = payload.items.map(normalizeItem);
      items.splice(0, items.length, ...normalizedItems);
      itemById.clear();
      for (const item of normalizedItems) {
        itemById.set(item.id, item);
      }
      return items;
    });

  return itemDataLoadPromise;
}

export async function loadWorldData() {
  if (chests.length > 0 && stages.length > 0) {
    return [chests, stages] as [Chest[], Stage[]];
  }

  worldDataLoadPromise ??= Promise.all([
    fetch("/data/chests.json").then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load chest data: ${response.status}`);
      }
      return response.json() as Promise<{ chests: Chest[] }>;
    }),
    fetch("/data/stages.json").then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load stage data: ${response.status}`);
      }
      return response.json() as Promise<{ stages: Stage[] }>;
    }),
  ]).then(([chestPayload, stagePayload]) => {
    chests.splice(0, chests.length, ...chestPayload.chests);
    stages.splice(0, stages.length, ...stagePayload.stages);
    return [chests, stages] as [Chest[], Stage[]];
  });

  return worldDataLoadPromise;
}

export function normalizeItem(raw: unknown): Item {
  const item = raw as {
    id: string | number;
    name?: string;
    names?: Record<string, string>;
    rarity?: string | null;
    imagePath?: string | null;
  };
  const id = String(item.id);
  const name = item.names?.en ?? item.name ?? id;

  return {
    id,
    names: {
      en: name,
      ja: item.names?.ja ?? name,
    },
    rarity: normalizeRarity(item.rarity),
    imagePath: item.imagePath === undefined ? `/assets/items/${id}.png` : item.imagePath || null,
  };
}

function normalizeRarity(rarity: string | null | undefined): Item["rarity"] {
  const normalized = rarity?.toLowerCase();
  switch (normalized) {
    case "uncommon":
      return "Uncommon";
    case "rare":
      return "Rare";
    case "epic":
      return "Epic";
    case "legendary":
      return "Legendary";
    case "immortal":
      return "Immortal";
    case "arcana":
      return "Arcana";
    case "beyond":
      return "Beyond";
    case "celestial":
      return "Celestial";
    case "divine":
      return "Divine";
    case "cosmic":
      return "Cosmic";
    default:
      return "Common";
  }
}

export function getLocalizedName(entity: { names: Record<string, string> }, language: string) {
  return entity.names[language] ?? entity.names.en;
}

export function getChestsByCategory(category: ChestCategory) {
  return chests.filter((chest) => chest.category === category);
}

export function chestMatchesDlc(chest: Chest, dlc: DlcVariant) {
  return chest.dlcVariants.includes(dlc);
}

export function getChestDropGroups(chest: Chest, dlc: DlcVariant) {
  return chest.dropGroupsByDlc?.[dlc] ?? chest.dropGroups;
}

export function chestMatchesStageSelection(chest: Chest, difficulty: Difficulty, act: number, stageNumber: number) {
  const stageCode = `${act}-${stageNumber}`;
  const stage = stages.find(
    (entry) => entry.difficulty === difficulty && entry.act === act && entry.stage === stageCode,
  );

  if (stage) {
    return stage.boxes.includes(chest.id);
  }

  return chest.foundInStages.some(
    (entry) => entry.difficulty === difficulty && entry.act === act && entry.stage === stageCode,
  );
}

export function getChestStages(chest: Chest) {
  return stages.filter((stage) => stage.boxes.includes(chest.id));
}
