export function extractHashtags(text: string): string[] {
  const re = /#([\p{L}0-9_]{2,40})/gu;
  const out = new Set<string>();
  for (const m of text.matchAll(re)) out.add(m[1]!.toLowerCase());
  return [...out];
}

export function extractMentions(text: string): string[] {
  const re = /@([a-zA-Z0-9_]{3,24})/g;
  const out = new Set<string>();
  for (const m of text.matchAll(re)) out.add(m[1]!);
  return [...out];
}
