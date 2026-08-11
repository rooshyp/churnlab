import { CANONICAL_FIELDS } from "./schema";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Suggests a mapping from canonical field -> uploaded column header, using
 * exact-normalized matches against the field key/label and its known
 * aliases. Falls back to null (unmapped) when no confident match exists —
 * the user resolves those manually rather than the system guessing wrong.
 */
export function suggestMapping(headers: string[]): Record<string, string | null> {
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalize(h) }));
  const mapping: Record<string, string | null> = {};

  for (const field of CANONICAL_FIELDS) {
    const candidates = [field.key, field.label, ...field.aliases].map(normalize);
    const exact = normalizedHeaders.find((h) => candidates.includes(h.norm));
    if (exact) {
      mapping[field.key] = exact.raw;
      continue;
    }
    const partial = normalizedHeaders.find((h) => candidates.some((c) => h.norm.includes(c) || c.includes(h.norm)));
    mapping[field.key] = partial ? partial.raw : null;
  }

  return mapping;
}
