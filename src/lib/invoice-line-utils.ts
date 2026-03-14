/**
 * Invoice Line Utils - Utilidades para normalización y matching de líneas
 * Última actualización: 2026-01-28
 *
 * Funciones para normalizar descripciones y crear hashes estables de líneas.
 */

/**
 * Normaliza descripción para matching
 * - trim
 * - lowercase
 * - colapsar espacios
 * - quitar puntuación suave (.,;:)
 */
export function normalizeDescription(desc: string): string {
  if (!desc || typeof desc !== 'string') {
    return ''
  }

  return desc
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Colapsar espacios múltiples
    .replace(/[.,;:]/g, '') // Quitar puntuación suave
    .trim()
}

/**
 * Tipo para líneas de factura usadas en hash/mapeo
 * Acepta tanto `total` como `lineTotal` para compatibilidad
 *
 * NOTA: sku y unit NO se incluyen en el hash (solo se usan para matching, no para mapeo)
 */
export interface HashableLine {
  description: string
  quantity: number
  unitPrice: number
  total?: number
  lineTotal?: number
  sku?: string | null // Aceptado pero NO usado en hash
  unit?: string | null // Aceptado pero NO usado en hash
}

/**
 * Crea hash estable para una línea de factura
 * Usado para mapear líneas entre extractedData y correctedData
 *
 * Maneja NaN/undefined convirtiéndolos a 0
 * Acepta tanto `total` como `lineTotal` para compatibilidad
 *
 * IMPORTANTE: sku y unit NO se incluyen en el hash (hash es solo por desc+qty+precio+total)
 */
export function createLineHash(line: HashableLine): string {
  const normalizedDesc = normalizeDescription(line.description || '')

  // Manejar NaN/undefined convirtiendo a 0
  const qty = isNaN(line.quantity) || line.quantity === undefined || line.quantity === null
    ? 0
    : Math.round(line.quantity * 100) / 100

  const unitPrice = isNaN(line.unitPrice) || line.unitPrice === undefined || line.unitPrice === null
    ? 0
    : Math.round(line.unitPrice)

  // Aceptar tanto total como lineTotal
  const rawTotal = line.total ?? line.lineTotal ?? 0
  const lineTotal = isNaN(rawTotal) || rawTotal === undefined || rawTotal === null
    ? 0
    : Math.round(rawTotal)

  // Hash solo por desc+qty+precio+total (NO incluye sku/unit)
  return `${normalizedDesc}|${qty}|${unitPrice}|${lineTotal}`
}

/**
 * Mapea líneas de correctedData a extractedData usando hash
 * Retorna Map<hash, { extractedIndex, correctedIndex }>
 *
 * Estrategia:
 * 1. Primero mapea por hash exacto
 * 2. Para líneas no mapeadas, usa índice como fallback
 */
export function mapLinesByHash(
  extractedLines: HashableLine[],
  correctedLines: HashableLine[]
): Map<string, { extractedIndex: number; correctedIndex: number }> {
  const map = new Map<string, { extractedIndex: number; correctedIndex: number }>()
  const usedCorrected = new Set<number>()

  // Primero: mapear por hash exacto
  for (let i = 0; i < extractedLines.length; i++) {
    const extractedLine = extractedLines[i]
    const hash = createLineHash(extractedLine)

    for (let j = 0; j < correctedLines.length; j++) {
      if (usedCorrected.has(j)) continue

      const correctedLine = correctedLines[j]
      const correctedHash = createLineHash(correctedLine)

      if (hash === correctedHash) {
        map.set(hash, { extractedIndex: i, correctedIndex: j })
        usedCorrected.add(j)
        break
      }
    }
  }

  // Segundo: para líneas no mapeadas, usar índice como fallback
  for (let i = 0; i < extractedLines.length; i++) {
    const extractedLine = extractedLines[i]
    const hash = createLineHash(extractedLine)

    if (!map.has(hash)) {
      // Buscar índice no usado
      for (let j = 0; j < correctedLines.length; j++) {
        if (!usedCorrected.has(j)) {
          map.set(hash, { extractedIndex: i, correctedIndex: j })
          usedCorrected.add(j)
          break
        }
      }
    }
  }

  return map
}

/**
 * Valida si una descripción es válida para aprendizaje
 * - Debe tener al menos 6 caracteres después de normalizar
 */
export function isValidDescriptionForLearning(desc: string): boolean {
  const normalized = normalizeDescription(desc)
  return normalized.length >= 6
}

/**
 * Normaliza alias para matching exacto
 * - lower, trim, colapsar espacios
 * - remover puntuación suave (.,;:/\-_)
 * - mantener números y letras
 * - NO borrar marcas (coca, pepsi) ni medidas (350, 1l) porque son parte del alias
 *
 * Diferencia con normalizeDescription:
 * - normalizeAlias mantiene más información (números, marcas)
 * - normalizeDescription es más agresivo (remueve más caracteres)
 */
export function normalizeAlias(alias: string): string {
  if (!alias || typeof alias !== 'string') {
    return ''
  }

  return alias
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Colapsar espacios múltiples
    .replace(/[.,;:/\-_]/g, '') // Remover puntuación suave
    .trim()
}

/**
 * Valida si un alias es válido para aprendizaje
 * - Debe tener al menos 6 caracteres después de normalizar
 * - No debe ser solo números
 * - No debe ser solo 1 palabra genérica sin sku/unit
 */
export function isValidAliasForLearning(alias: string, hasSkuOrUnit: boolean = false): boolean {
  const normalized = normalizeAlias(alias)

  // Mínimo 6 caracteres
  if (normalized.length < 6) {
    return false
  }

  // No solo números
  if (/^\d+$/.test(normalized)) {
    return false
  }

  // Si no tiene SKU ni unit, no debe ser solo 1 palabra genérica
  if (!hasSkuOrUnit) {
    const words = normalized.split(/\s+/).filter(Boolean)
    if (words.length === 1) {
      // Palabras genéricas comunes que no deberían ser alias sin contexto
      const genericWords = ['agua', 'pan', 'leche', 'azucar', 'sal', 'aceite', 'harina']
      if (genericWords.includes(words[0])) {
        return false
      }
    }
  }

  return true
}
