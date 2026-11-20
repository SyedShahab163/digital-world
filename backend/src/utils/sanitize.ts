import sanitizeHtml from "sanitize-html";

// Strip every HTML tag from user-supplied text. We store plain text only.
export function cleanText(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

export function cleanOptional(value?: string | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const cleaned = cleanText(value);
  return cleaned.length ? cleaned : undefined;
}
