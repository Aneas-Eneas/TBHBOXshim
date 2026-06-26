from __future__ import annotations

import argparse
import csv
import io
import json
import re
import shutil
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GAME_DIR = Path(r"C:\Program Files (x86)\Steam\steamapps\common\TaskbarHero")

TEXT_ASSETS = {
    "DropInfoData",
    "GearInfoData",
    "ItemGroupInfoData",
    "ItemInfoData",
    "MaterialInfoData",
    "StageInfoData",
}

RARITY_MAP = {
    "COMMON": "Common",
    "UNCOMMON": "Uncommon",
    "RARE": "Rare",
    "EPIC": "Epic",
    "LEGENDARY": "Legendary",
    "IMMORTAL": "Immortal",
    "ARCANA": "Arcana",
    "BEYOND": "Beyond",
    "CELESTIAL": "Celestial",
    "DIVINE": "Divine",
    "COSMIC": "Cosmic",
}

DIFFICULTY_MAP = {
    "NORMAL": "Normal",
    "NIGHTMARE": "Nightmare",
    "HELL": "Hell",
    "TORMENT": "Torment",
}

CATEGORY_BY_PREFIX = {
    "91": "normal",
    "92": "stage_boss",
    "93": "act_boss",
}

DLC_CONDITIONS = {
    "base": set(),
    "hunter": {"501"},
    "slayer": {"601"},
    "hunter_slayer": {"501", "601"},
}

BASE_CONDITIONS = {"", "0"}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract TBH simulator JSON data from a local TaskbarHero Unity install."
    )
    parser.add_argument("--game-dir", type=Path, default=DEFAULT_GAME_DIR)
    parser.add_argument("--out-dir", type=Path, default=ROOT / "src" / "data")
    parser.add_argument("--public-dir", type=Path, default=ROOT / "public" / "data")
    parser.add_argument("--assets-dir", type=Path, default=ROOT / "public" / "assets" / "items")
    parser.add_argument(
        "--use-existing-images",
        action="store_true",
        help="Set imagePath when public/assets/items/{id}.png already exists.",
    )
    parser.add_argument(
        "--extract-images",
        action="store_true",
        help="Extract item icon sprites from the local game files into public/assets/items.",
    )
    parser.add_argument(
        "--overwrite-images",
        action="store_true",
        help="Overwrite existing files when --extract-images is used.",
    )
    parser.add_argument(
        "--prune-images",
        action="store_true",
        help="Remove old generated PNG files from public/assets/items before image extraction.",
    )
    parser.add_argument("--write-raw", action="store_true", help="Also write extracted CSV TextAssets.")
    args = parser.parse_args()

    add_unitypy_vendor()

    try:
        import UnityPy  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "UnityPy is required. Install it with: "
            "python -m pip install UnityPy -t .unitypy_vendor"
        ) from exc

    game_dir = args.game_dir
    data_dir = game_dir / "TaskBarHero_Data"
    assets_file = data_dir / "sharedassets0.assets"
    if not assets_file.exists():
        raise SystemExit(f"Missing Unity assets file: {assets_file}")

    text_assets = extract_text_assets(UnityPy, assets_file, TEXT_ASSETS)
    missing_assets = sorted(TEXT_ASSETS - set(text_assets))
    if missing_assets:
        raise SystemExit(f"Missing required TextAsset(s): {', '.join(missing_assets)}")

    rows = {name: parse_csv(text) for name, text in text_assets.items()}
    item_info = {row["ItemKey"]: row for row in rows["ItemInfoData"] if row.get("ItemKey")}
    gear_info = {row["GearKey"]: row for row in rows["GearInfoData"] if row.get("GearKey")}
    material_info = {row["ItemKey"]: row for row in rows["MaterialInfoData"] if row.get("ItemKey")}
    item_groups = build_item_groups(rows["ItemGroupInfoData"])
    drop_rows_by_key = group_by(rows["DropInfoData"], "DropKey")
    localizations = extract_localizations(UnityPy, data_dir)

    output_items = build_items(
        item_info,
        gear_info,
        material_info,
        args.assets_dir,
        localizations,
        args.use_existing_images,
    )
    image_manifest = {
        "mode": "disabled",
        "exported": 0,
        "skippedExisting": 0,
        "missingSprites": 0,
        "missingSpriteNames": [],
    }
    if args.extract_images:
        image_manifest = extract_item_images(
            UnityPy,
            assets_file,
            output_items,
            args.assets_dir,
            args.overwrite_images,
            args.prune_images,
        )
    item_records_by_id = {str(item["id"]): item for item in output_items}

    chest_items = [
        row for row in item_info.values() if row.get("ITEMTYPE", "").upper() == "STAGEBOX"
    ]
    chest_id_by_item_key: dict[str, str] = {}
    for row in chest_items:
        chest_id_by_item_key[row["ItemKey"]] = make_chest_id(row)

    stages = build_stages(rows["StageInfoData"], chest_id_by_item_key, localizations)
    found_stages_by_chest = build_found_stages(rows["StageInfoData"], chest_id_by_item_key)
    chests, chest_manifest = build_chests(
        chest_items=chest_items,
        item_info=item_info,
        item_records_by_id=item_records_by_id,
        item_groups=item_groups,
        drop_rows_by_key=drop_rows_by_key,
        found_stages_by_chest=found_stages_by_chest,
        chest_id_by_item_key=chest_id_by_item_key,
        localizations=localizations,
    )

    version = read_game_version(game_dir)
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    manifest = {
        "generatedAt": now,
        "source": "local_game_files",
        "gameDir": str(game_dir),
        "gameVersion": f"v{version}" if version else None,
        "unityAssetsFile": str(assets_file),
        "textAssets": {
            name: {"bytes": len(text.encode("utf-8")), "rows": len(rows[name])}
            for name, text in sorted(text_assets.items())
        },
        "savedItems": len(output_items),
        "savedChests": len(chests),
        "savedStages": len(stages),
        "dropRows": len(rows["DropInfoData"]),
        "dropRowsUsed": chest_manifest["dropRowsUsed"],
        "dropRowsSkipped": chest_manifest["dropRowsSkipped"],
        "missingRewardItems": chest_manifest["missingRewardItems"],
        "imageMapping": {
            **image_manifest,
            "note": "Game item icon references are preserved as sourceIconPath. Use --extract-images to export unique matching game sprites to public/assets/items/icons/{sourceIconPath}.png.",
        },
        "localization": {
            "englishKeys": len(localizations["en"]),
            "japaneseKeys": len(localizations["ja"]),
        },
    }

    write_outputs(args.out_dir, args.public_dir, output_items, chests, stages, manifest, version)
    if args.write_raw:
        write_raw_csv(args.out_dir / "game_raw", text_assets)

    print(f"Saved {len(output_items)} items")
    print(f"Saved {len(chests)} chests")
    print(f"Saved {len(stages)} stages")
    print(f"Game version: {version or 'unknown'}")
    return 0


def add_unitypy_vendor() -> None:
    vendor = ROOT / ".unitypy_vendor"
    if vendor.exists():
        sys.path.insert(0, str(vendor))


def extract_text_assets(UnityPy: Any, assets_file: Path, names: set[str]) -> dict[str, str]:
    env = UnityPy.load(str(assets_file))
    found: dict[str, str] = {}
    for obj in env.objects:
        if obj.type.name != "TextAsset":
            continue
        data = obj.read()
        name = getattr(data, "name", None) or getattr(data, "m_Name", "")
        if name not in names:
            continue
        script = getattr(data, "script", None)
        if script is None:
            script = getattr(data, "m_Script", b"")
        if isinstance(script, bytes):
            text = script.decode("utf-8-sig")
        else:
            text = str(script).lstrip("\ufeff")
        found[name] = text
    return found


def extract_localizations(UnityPy: Any, data_dir: Path) -> dict[str, dict[str, str]]:
    bundle_dir = data_dir / "StreamingAssets" / "aa" / "StandaloneWindows64"
    shared = bundle_dir / "localization-assets-shared_assets_all.bundle"
    configs = {
        "en": "localization-string-tables-english*.bundle",
        "ja": "localization-string-tables-japanese*.bundle",
    }
    localizations = {"en": {}, "ja": {}}
    if not shared.exists():
        return localizations

    for language, pattern in configs.items():
        bundle = next(bundle_dir.glob(pattern), None)
        if not bundle:
            continue
        try:
            env = UnityPy.load(str(bundle), str(shared))
        except Exception:
            continue
        for obj in env.objects:
            if obj.type.name != "MonoBehaviour":
                continue
            try:
                table = obj.read()
            except Exception:
                continue
            table_name = getattr(table, "m_Name", "")
            if not (table_name.startswith("ItemTable_") or table_name.startswith("StringTable_")):
                continue
            try:
                shared_data = table.m_SharedData.read()
            except Exception:
                continue
            key_by_id = {
                getattr(entry, "m_Id", None): getattr(entry, "m_Key", "")
                for entry in getattr(shared_data, "m_Entries", [])
            }
            for entry in getattr(table, "m_TableData", []):
                key = key_by_id.get(getattr(entry, "m_Id", None))
                value = getattr(entry, "m_Localized", "")
                if key and value:
                    localizations[language][key] = str(value)
    return localizations


def extract_item_images(
    UnityPy: Any,
    assets_file: Path,
    items: list[dict[str, Any]],
    assets_dir: Path,
    overwrite: bool,
    prune_images: bool,
) -> dict[str, Any]:
    wanted: dict[str, list[str]] = defaultdict(list)
    item_by_id = {str(item["id"]): item for item in items}
    for item in items:
        source_icon_path = item.get("sourceIconPath")
        if source_icon_path:
            wanted[str(source_icon_path)].append(str(item["id"]))
    icons_dir = assets_dir / "icons"
    assets_dir.mkdir(parents=True, exist_ok=True)
    icons_dir.mkdir(parents=True, exist_ok=True)
    if prune_images:
        for png in assets_dir.glob("*.png"):
            png.unlink()
        for png in icons_dir.glob("*.png"):
            png.unlink()

    env = UnityPy.load(str(assets_file))
    exported = 0
    linked_items = 0
    skipped_existing = 0
    found_sprite_names: set[str] = set()

    for obj in env.objects:
        if obj.type.name != "Sprite":
            continue
        try:
            sprite = obj.read()
        except Exception:
            continue
        sprite_name = getattr(sprite, "m_Name", None) or getattr(sprite, "name", None) or ""
        item_ids = wanted.get(sprite_name)
        if not item_ids:
            continue
        found_sprite_names.add(sprite_name)
        filename = f"{safe_filename(sprite_name)}.png"
        out_path = icons_dir / filename
        if out_path.exists() and not overwrite:
            skipped_existing += 1
        else:
            try:
                sprite.image.save(out_path)
                exported += 1
            except Exception:
                continue
        image_path = f"/assets/items/icons/{filename}"
        for item_id in item_ids:
            item = item_by_id.get(item_id)
            if item:
                item["imagePath"] = image_path
                linked_items += 1

    missing = sorted(set(wanted) - found_sprite_names)
    return {
        "mode": "game_sprite_export",
        "exported": exported,
        "linkedItems": linked_items,
        "uniqueSprites": len(found_sprite_names),
        "skippedExisting": skipped_existing,
        "missingSprites": len(missing),
        "missingSpriteNames": missing[:50],
    }


def parse_csv(text: str) -> list[dict[str, str]]:
    normalized = text.lstrip("\ufeff")
    reader = csv.DictReader(io.StringIO(normalized))
    return [{(key or "").lstrip("\ufeff"): value for key, value in row.items()} for row in reader]


def group_by(rows: list[dict[str, str]], key: str) -> dict[str, list[dict[str, str]]]:
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        grouped[row.get(key, "")].append(row)
    return grouped


def build_item_groups(rows: list[dict[str, str]]) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for row in rows:
        group_key = row.get("ItemGroupKey", "")
        item_key = row.get("ItemKey", "")
        if group_key and item_key:
            groups[group_key].append(item_key)
    return groups


def build_items(
    item_info: dict[str, dict[str, str]],
    gear_info: dict[str, dict[str, str]],
    material_info: dict[str, dict[str, str]],
    assets_dir: Path,
    localizations: dict[str, dict[str, str]],
    use_existing_images: bool,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for item_key, row in sorted(item_info.items(), key=lambda pair: int_or_zero(pair[0])):
        item_kind = normalize_item_kind(row.get("ITEMTYPE", ""))
        level = parse_optional_int(row.get("Level"))
        if item_kind == "Gear" and (level is None or level > 80):
            continue
        if item_kind not in {"Gear", "Material"}:
            continue

        name_key = row.get("NameKey") or item_key
        name_en = localized(localizations, "en", name_key, name_key)
        name_ja = localized(localizations, "ja", name_key, name_en)
        source_icon_path = row.get("IconPath") or None
        image_path = (
            existing_image_path(assets_dir, item_key, source_icon_path)
            if use_existing_images
            else None
        )
        record: dict[str, Any] = {
            "id": item_key,
            "name": name_en,
            "names": {"en": name_en, "ja": name_ja},
            "rarity": normalize_rarity(row.get("GRADE")),
            "item_kind": item_kind,
            "level": level,
            "gear_type": clean_optional(row.get("GEARTYPE")),
            "gear_slot": clean_optional(row.get("PARTS")),
            "hero_class": clean_optional(row.get("GearGroup")),
            "market_tradable": parse_bool(row.get("IsCanExchangeMarketable")),
            "stats": build_stats(row, gear_info.get(row.get("GearKey", ""))),
            "material_effect_type": None,
            "material_effects": [],
            "imagePath": image_path,
            "sourceIconPath": source_icon_path,
            "source_url": f"game://item/{item_key}",
        }

        material_row = material_info.get(item_key)
        if item_kind == "Material" and material_row:
            record["material_effect_type"] = clean_optional(material_row.get("MATERIALTYPE"))
            stat_mod_group = clean_optional(material_row.get("StatModGroupKey"))
            if stat_mod_group:
                record["material_effects"] = [{"stat_mod_group_key": stat_mod_group}]
            record["stats"] = {}
        items.append(record)
    return items


def build_stats(item_row: dict[str, str], gear_row: dict[str, str] | None) -> dict[str, list[str]]:
    if item_row.get("ITEMTYPE", "").upper() != "GEAR" or not gear_row:
        return {}
    base: list[str] = []
    base_1 = parse_optional_float(gear_row.get("BaseStat1_Value"))
    base_2 = parse_optional_float(gear_row.get("BaseStat2_Value"))
    if base_1 and base_1 != 0:
        base.append(f"Base Stat 1 +{format_number(base_1)}")
    if base_2 and base_2 != 0:
        base.append(f"Base Stat 2 +{format_number(base_2)}")

    inherent: list[str] = []
    for idx in range(1, 4):
        stat_type = gear_row.get(f"InherentStat{idx}_STATTYPE", "")
        mod_type = gear_row.get(f"InherentStat{idx}_MODTYPE", "")
        value = parse_optional_float(gear_row.get(f"InherentStat{idx}_Value"))
        if stat_type and stat_type != "NONE" and value and value != 0:
            inherent.append(f"{stat_type} {mod_type} +{format_number(value)}")
    return {"base": base, "inherent": inherent}


def build_stages(
    stage_rows: list[dict[str, str]],
    chest_id_by_item_key: dict[str, str],
    localizations: dict[str, dict[str, str]],
) -> list[dict[str, Any]]:
    stages: list[dict[str, Any]] = []
    for row in sorted(stage_rows, key=lambda item: int_or_zero(item.get("StageKey", ""))):
        difficulty = DIFFICULTY_MAP.get(row.get("STAGEDIFFICULITY", "").upper(), "Normal")
        act = int_or_zero(row.get("Act", "0"))
        stage_no = int_or_zero(row.get("StageNo", "0"))
        stage_code = f"{act}-{stage_no}"
        boxes = []
        drop_rates: dict[str, float] = {}
        for source_key, rate_key in (
            ("MonsterDropItemKey", "MonsterDropItemRate"),
            ("BossDropItemKey", "BossDropItemRate"),
        ):
            item_key = row.get(source_key, "")
            chest_id = chest_id_by_item_key.get(item_key)
            if chest_id and chest_id not in boxes:
                boxes.append(chest_id)
                parsed_rate = parse_optional_float(row.get(rate_key))
                if parsed_rate is not None:
                    drop_rates[chest_id] = parsed_rate

        stage_key = row.get("StageNameKey", "")
        stage_name_en = localized(localizations, "en", stage_key, f"Stage {stage_code}")
        stage_name_ja = localized(localizations, "ja", stage_key, stage_name_en)
        stages.append(
            {
                "id": f"{difficulty.lower()}-{act}-{stage_no}",
                "sourceKey": int_or_zero(row.get("StageKey", "")),
                "difficulty": difficulty,
                "act": act,
                "stage": stage_code,
                "stageNo": stage_no,
                "stageType": row.get("STAGETYPE", ""),
                "names": {"en": stage_name_en, "ja": stage_name_ja},
                "level": int_or_zero(row.get("StageLevel", "0")),
                "boxes": boxes,
                "dropRates": drop_rates,
            }
        )
    return stages


def build_found_stages(
    stage_rows: list[dict[str, str]],
    chest_id_by_item_key: dict[str, str],
) -> dict[str, list[dict[str, Any]]]:
    found: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in stage_rows:
        difficulty = DIFFICULTY_MAP.get(row.get("STAGEDIFFICULITY", "").upper(), "Normal")
        act = int_or_zero(row.get("Act", "0"))
        stage_no = int_or_zero(row.get("StageNo", "0"))
        stage_code = f"{act}-{stage_no}"
        for source_key, drop_type in (
            ("MonsterDropItemKey", "normal"),
            ("BossDropItemKey", "boss"),
        ):
            chest_id = chest_id_by_item_key.get(row.get(source_key, ""))
            if not chest_id:
                continue
            found[chest_id].append(
                {
                    "difficulty": difficulty,
                    "act": act,
                    "stage": stage_code,
                    "dropType": drop_type,
                }
            )
    return found


def build_chests(
    chest_items: list[dict[str, str]],
    item_info: dict[str, dict[str, str]],
    item_records_by_id: dict[str, dict[str, Any]],
    item_groups: dict[str, list[str]],
    drop_rows_by_key: dict[str, list[dict[str, str]]],
    found_stages_by_chest: dict[str, list[dict[str, Any]]],
    chest_id_by_item_key: dict[str, str],
    localizations: dict[str, dict[str, str]],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    chests: list[dict[str, Any]] = []
    missing_reward_items: Counter[str] = Counter()
    drop_rows_used = 0
    drop_rows_skipped = 0

    for row in sorted(chest_items, key=lambda item: int_or_zero(item["ItemKey"])):
        item_key = row["ItemKey"]
        drop_key = row.get("DropKey", "")
        raw_drop_rows = drop_rows_by_key.get(drop_key, [])
        if not raw_drop_rows:
            drop_rows_skipped += 1
            continue

        chest_id = chest_id_by_item_key[item_key]
        category = category_for_box(item_key)
        name_key = row.get("NameKey") or item_key
        name_en = localized(localizations, "en", name_key, name_key)
        name_ja = localized(localizations, "ja", name_key, name_en)
        name = name_en
        gear_level = infer_level_from_name(name)
        drop_groups_by_dlc: dict[str, list[dict[str, Any]]] = {}
        for variant in ("base", "hunter", "slayer", "hunter_slayer"):
            selected_rows = rows_for_dlc_variant(raw_drop_rows, variant)
            groups = build_drop_groups_for_variant(
                selected_rows,
                item_info,
                item_records_by_id,
                item_groups,
                missing_reward_items,
                drop_key,
                variant,
            )
            drop_groups_by_dlc[variant] = groups
            drop_rows_used += len(selected_rows)

        dlc_variants = [
            variant for variant, groups in drop_groups_by_dlc.items() if len(groups) > 0
        ]
        if not dlc_variants:
            drop_rows_skipped += len(raw_drop_rows)
            continue

        chests.append(
            {
                "id": chest_id,
                "sourceKey": int_or_zero(item_key),
                "dropKey": int_or_zero(drop_key),
                "category": category,
                "names": {"en": name_en, "ja": name_ja},
                "gearLevel": {
                    "min": gear_level,
                    "max": gear_level,
                    "label": {"en": f"Gear Lv {gear_level}", "ja": f"Gear Lv {gear_level}"},
                },
                "dropMode": "one_reward",
                "dlcVariants": dlc_variants,
                "foundInStages": found_stages_by_chest.get(chest_id, []),
                "dropGroups": drop_groups_by_dlc.get("base", []),
                "dropGroupsByDlc": drop_groups_by_dlc,
            }
        )

    return chests, {
        "dropRowsUsed": drop_rows_used,
        "dropRowsSkipped": drop_rows_skipped,
        "missingRewardItems": dict(missing_reward_items),
    }


def rows_for_dlc_variant(rows: list[dict[str, str]], variant: str) -> list[dict[str, str]]:
    allowed_conditions = BASE_CONDITIONS | DLC_CONDITIONS[variant]
    selected = []
    for row in rows:
        condition = (row.get("HeroKeyCondition") or "").strip()
        if condition in allowed_conditions:
            selected.append(row)
    return selected


def build_drop_groups_for_variant(
    rows: list[dict[str, str]],
    item_info: dict[str, dict[str, str]],
    item_records_by_id: dict[str, dict[str, Any]],
    item_groups: dict[str, list[str]],
    missing_reward_items: Counter[str],
    drop_key: str,
    variant: str,
) -> list[dict[str, Any]]:
    resolved: list[tuple[dict[str, str], list[str]]] = []
    for row in rows:
        reward_type = row.get("REWARDTYPE", "").upper()
        reward_key = row.get("RewardKey", "")
        if reward_type == "ITEMGROUP":
            item_ids = item_groups.get(reward_key, [])
        elif reward_type == "ITEM":
            item_ids = [reward_key]
        else:
            item_ids = []

        item_ids = [item_id for item_id in item_ids if item_id in item_info]
        for item_id in item_ids:
            if item_id not in item_records_by_id:
                missing_reward_items[item_id] += 1
        item_ids = [item_id for item_id in item_ids if item_id in item_records_by_id]
        if item_ids:
            resolved.append((row, item_ids))

    total_weight = sum(max(int_or_zero(row.get("Weight", "0")), 0) for row, _ in resolved)
    groups: list[dict[str, Any]] = []
    for index, (row, item_ids) in enumerate(resolved, start=1):
        weight = max(int_or_zero(row.get("Weight", "0")), 0)
        probability = (weight / total_weight * 100) if total_weight else None
        groups.append(
            {
                "id": f"{variant}_{drop_key}_{row.get('REWARDTYPE', '').lower()}_{row.get('RewardKey', '')}_{index}",
                "probability": round(probability, 6) if probability is not None else None,
                "weight": weight,
                "rarity": rarity_for_items(item_ids, item_records_by_id),
                "pick": "one_of",
                "items": item_ids,
                "rewardType": row.get("REWARDTYPE", ""),
                "rewardKey": int_or_string(row.get("RewardKey", "")),
                "heroKeyCondition": row.get("HeroKeyCondition") or None,
            }
        )
    return groups


def rarity_for_items(item_ids: list[str], item_records_by_id: dict[str, dict[str, Any]]) -> str:
    rarities = [item_records_by_id[item_id]["rarity"] for item_id in item_ids if item_id in item_records_by_id]
    if not rarities:
        return "Common"
    counts = Counter(rarities)
    return counts.most_common(1)[0][0]


def write_outputs(
    out_dir: Path,
    public_dir: Path,
    items: list[dict[str, Any]],
    chests: list[dict[str, Any]],
    stages: list[dict[str, Any]],
    manifest: dict[str, Any],
    version: str | None,
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    public_dir.mkdir(parents=True, exist_ok=True)

    payloads = {
        "items.json": {"items": items},
        "items.gear.lv80.json": {"items": [item for item in items if item["item_kind"] == "Gear"]},
        "items.materials.json": {"items": [item for item in items if item["item_kind"] == "Material"]},
        "chests.json": {"chests": chests},
        "stages.json": {"stages": stages},
        "game_extract_manifest.json": manifest,
        "meta.json": {
            "dataSource": "Task Bar Hero game files",
            "gameDataVersion": f"v{version}" if version else "unknown",
            "dataChecked": datetime.now(timezone.utc).date().isoformat(),
            "unofficial": True,
        },
    }

    for filename, payload in payloads.items():
        write_json(out_dir / filename, payload)
        if filename != "meta.json":
            write_json(public_dir / filename, payload)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def write_raw_csv(raw_dir: Path, text_assets: dict[str, str]) -> None:
    if raw_dir.exists():
        shutil.rmtree(raw_dir)
    raw_dir.mkdir(parents=True, exist_ok=True)
    for name, text in text_assets.items():
        (raw_dir / f"{name}.csv").write_text(text, encoding="utf-8")


def read_game_version(game_dir: Path) -> str | None:
    version_file = game_dir / "Version.txt"
    if not version_file.exists():
        return None
    version = version_file.read_text(encoding="utf-8", errors="ignore").strip()
    return version or None


def make_chest_id(row: dict[str, str]) -> str:
    name = clean_name(row.get("NameKey") or row.get("ItemKey", "box"))
    return f"{slugify(name)}_{row.get('ItemKey', '')}"


def category_for_box(item_key: str) -> str:
    return CATEGORY_BY_PREFIX.get(item_key[:2], "normal")


def normalize_item_kind(value: str) -> str:
    normalized = (value or "").upper()
    if normalized == "GEAR":
        return "Gear"
    if normalized == "MATERIAL":
        return "Material"
    if normalized == "STAGEBOX":
        return "StageBox"
    return value.title() if value else "Unknown"


def normalize_rarity(value: str | None) -> str:
    return RARITY_MAP.get((value or "").upper(), "Common")


def clean_name(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def clean_optional(value: str | None) -> str | None:
    cleaned = clean_name(value or "")
    if not cleaned or cleaned.upper() in {"NONE", "NULL"}:
        return None
    return cleaned


def existing_image_path(assets_dir: Path, item_key: str, source_icon_path: str | None) -> str | None:
    if source_icon_path:
        icon_path = assets_dir / "icons" / f"{safe_filename(source_icon_path)}.png"
        if icon_path.exists():
            return f"/assets/items/icons/{icon_path.name}"
    item_path = assets_dir / f"{item_key}.png"
    if item_path.exists():
        return f"/assets/items/{item_key}.png"
    return None


def safe_filename(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", value).strip("._") or "icon"


def localized(
    localizations: dict[str, dict[str, str]],
    language: str,
    key: str,
    fallback: str,
) -> str:
    value = localizations.get(language, {}).get(key)
    if value:
        return clean_name(value)
    return clean_name(fallback)


def infer_level_from_name(name: str) -> int:
    match = re.search(r"(?:Lv\s*)?(\d+)", name)
    if match:
        return max(int(match.group(1)), 1)
    return 1


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", value.lower()).strip("_")
    return slug or "box"


def parse_bool(value: str | None) -> bool:
    return (value or "").strip().lower() == "true"


def parse_optional_int(value: str | None) -> int | None:
    text = (value or "").strip()
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def parse_optional_float(value: str | None) -> float | None:
    text = (value or "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def int_or_zero(value: str | None) -> int:
    parsed = parse_optional_int(value)
    return parsed if parsed is not None else 0


def int_or_string(value: str) -> int | str:
    parsed = parse_optional_int(value)
    return parsed if parsed is not None else value


def format_number(value: float) -> str:
    if value.is_integer():
        return str(int(value))
    return f"{value:g}"


if __name__ == "__main__":
    raise SystemExit(main())
