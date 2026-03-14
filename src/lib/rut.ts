export interface RutSearchTokens {
  raw: string;
  digits: string;
  withDv?: string;
}

export function normalizeRutDigits(input: string): string {
  return (input || '').replace(/\D/g, '');
}

export function normalizeRutForCompare(input: string): string {
  return (input || '').replace(/[.\-\s]/g, '').trim().toUpperCase();
}

export function rutSearchTokens(input: string): RutSearchTokens {
  const raw = (input || '').trim();
  const digits = normalizeRutDigits(raw);
  const withDv = digits.length >= 8 ? digits : undefined;

  return {
    raw,
    digits,
    withDv
  };
}

/**
 * Genera variantes de RUT para búsqueda flexible.
 * Acepta: 11922435-7, 119224357, 11.922.435-7
 */
function formatRutBodyWithDots(body: string): string {
  const cleanBody = body.replace(/\D/g, '');
  if (!cleanBody) return '';
  return cleanBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function buildRutSearchCandidates(input: string): string[] {
  const candidates = new Set<string>();
  const trimmed = (input || '').trim();
  if (trimmed) candidates.add(trimmed);

  const digits = normalizeRutDigits(trimmed);
  if (digits.length >= 8) {
    candidates.add(digits);
    const body = digits.slice(0, -1);
    const dv = digits.slice(-1).toUpperCase();
    if (body) {
      candidates.add(`${body}-${dv}`);
      const bodyDots = formatRutBodyWithDots(body);
      if (bodyDots) {
        candidates.add(`${bodyDots}-${dv}`);
      }
    }
  }

  return Array.from(candidates).filter((v) => v.length > 0);
}
