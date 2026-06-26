import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-300">
      <span className="sr-only">Language</span>
      <select
        className="rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        value={i18n.language}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
      >
        <option value="en">English</option>
        <option value="ja">日本語</option>
      </select>
    </label>
  );
}
