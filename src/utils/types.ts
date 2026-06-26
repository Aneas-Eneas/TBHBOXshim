export type LanguageCode = "en" | "ja";

export type LocalizedText = Record<LanguageCode, string>;

export type ChestCategory = "normal" | "stage_boss" | "act_boss";

export type DlcVariant = "base" | "hunter" | "slayer" | "hunter_slayer";

export type Difficulty = "Normal" | "Nightmare" | "Hell" | "Torment";

export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Immortal"
  | "Arcana"
  | "Beyond"
  | "Celestial"
  | "Divine"
  | "Cosmic";

export interface Item {
  id: string;
  names: LocalizedText;
  rarity: Rarity;
  imagePath: string | null;
}

export interface Stage {
  id: string;
  difficulty: string;
  act: number;
  stage: string;
  names: LocalizedText;
  level: number;
  boxes: string[];
}

export interface DropGroup {
  id: string;
  probability?: number;
  weight?: number;
  rarity: Rarity;
  pick: "one_of";
  items: string[];
}

export type DropGroupsByDlc = Partial<Record<DlcVariant, DropGroup[]>>;

export interface Chest {
  id: string;
  sourceKey?: number;
  dropKey?: number;
  category: ChestCategory;
  names: LocalizedText;
  gearLevel: {
    min: number;
    max: number;
    label: LocalizedText;
  };
  dropMode: "one_reward";
  dlcVariants: DlcVariant[];
  foundInStages: Array<{
    difficulty: string;
    act: number;
    stage: string;
    dropType: string;
  }>;
  dropGroups: DropGroup[];
  dropGroupsByDlc?: DropGroupsByDlc;
}

export interface OpenResult {
  index: number;
  item: Item;
  group: DropGroup;
  groupProbability: number;
}

export interface CountSummary {
  id: string;
  label: string;
  count: number;
  observedRate: number;
  originalRate: number;
  rarity?: Rarity;
  item?: Item;
}
