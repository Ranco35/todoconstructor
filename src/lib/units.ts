/**
 * Unidades de medida - Una sola fuente de verdad
 * Última actualización: 2026-01-28
 *
 * Usar en: aprendizaje (server), matching (server), UI al pasar unit (client).
 * Evita tener múltiples normalizadores distintos.
 */

const UNIT_MAP: Record<string, string> = {
  'UN': 'UN',
  'UND': 'UN',
  'UNIDA': 'UN',
  'UNIDAD': 'UN',
  'UNIDADES': 'UN',
  'U': 'UN',
  'PZA': 'UN',
  'PIEZA': 'UN',
  'PIEZAS': 'UN',
  'KG': 'KG',
  'KILO': 'KG',
  'KILOS': 'KG',
  'KILOGRAMO': 'KG',
  'KILOGRAMOS': 'KG',
  'LT': 'LT',
  'LITRO': 'LT',
  'LITROS': 'LT',
  'L': 'LT',
  'CJ': 'CJ',
  'CAJA': 'CJ',
  'CAJAS': 'CJ',
  'BX': 'CJ',
  'BOX': 'CJ',
  'GR': 'GR',
  'GRAMO': 'GR',
  'GRAMOS': 'GR',
  'G': 'GR',
  'ML': 'ML',
  'MILILITRO': 'ML',
  'MILILITROS': 'ML',
}

/**
 * Normaliza unidad de medida.
 * Una sola fuente: usar en aprendizaje, matching y UI.
 */
export function normalizeUnit(unit: string | undefined | null): string | null {
  if (!unit || typeof unit !== 'string') return null
  const n = unit.toUpperCase().trim()
  return UNIT_MAP[n] ?? n
}
