import { AdPlaceholder } from "../components/AdPlaceholder";

interface StaticPageProps {
  title: string;
  body: string;
}

export function StaticPage({ title, body }: StaticPageProps) {
  const paragraphs = body.split("\n\n").filter(Boolean);

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-700 bg-slate-900/80 p-6">
        <h1 className="text-3xl font-black text-slate-50">{title}</h1>
        <div className="mt-4 grid max-w-3xl gap-4 leading-7 text-slate-300">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{renderLinkedText(paragraph)}</p>
          ))}
        </div>
      </section>
      <AdPlaceholder />
    </div>
  );
}

function renderLinkedText(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return parts.map((part) => {
    if (!part.startsWith("http")) {
      return part;
    }

    return (
      <a
        className="font-semibold text-amber-300 underline decoration-amber-300/40 underline-offset-4 hover:text-amber-200"
        href={part}
        key={part}
        rel="noreferrer"
        target="_blank"
      >
        {part}
      </a>
    );
  });
}
