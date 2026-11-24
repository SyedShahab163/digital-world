import { Fragment } from "react";

/**
 * Renders the admin's plain-text page body safely (React escapes everything; no HTML is ever injected).
 * Supported: "## Heading", "### Subheading", "- bullet" lines, blank-line separated paragraphs, and bare https:// links.
 */
function inline(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-brand underline underline-offset-2">{part}</a> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`space-y-5 text-[17px] leading-relaxed text-ink ${className}`}>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l))) return <ul key={i} className="list-disc space-y-1.5 pl-6">{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        if (/^### /.test(b)) return <h3 key={i} className="pt-2 text-xl font-semibold">{b.slice(4)}</h3>;
        if (/^## /.test(b)) return <h2 key={i} className="pt-4 text-2xl font-bold sm:text-3xl">{b.slice(3)}</h2>;
        return <p key={i} className="whitespace-pre-line">{inline(b)}</p>;
      })}
    </div>
  );
}
