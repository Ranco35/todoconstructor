/**
 * Invoice Consolidation - Consolidación y dedupe de items extraídos
 * Última actualización: 2026-01-28
 *
 * Une items extraídos de múltiples chunks y elimina duplicados.
 */

export interface ExtractedLineItem {
  description: string;
  sku?: string;
  quantity: number;
  unit?: string; // Unidad de medida: UN, KG, LT, etc.
  unitPrice: number;
  discount?: number;
  lineTotal: number;
  taxAffectation?: 'AFFECTO' | 'EXENTO' | 'NO_INFO';
  pageNumber?: number; // Página donde se encontró
  chunkIndex?: number; // Chunk donde se encontró
  confidence?: number; // 0-1
}

export interface ConsolidatedInvoice {
  lineItems: ExtractedLineItem[];
  totalItems: number;
  duplicatesRemoved: number;
  warnings: string[];
}

/**
 * Normaliza unidades de medida para comparación (KG = kg = Kg)
 */
function normalizeUnitForHash(unit?: string): string {
  if (!unit) return '';
  return unit.trim().toLowerCase()
    .replace(/\bkilogramo[s]?\b/g, 'kg')
    .replace(/\blitro[s]?\b/g, 'lt')
    .replace(/\bunidad(es)?\b/g, 'un')
    .replace(/\bmetro[s]?\b/g, 'm');
}

/**
 * Crea un hash estable para identificar items duplicados
 */
function createItemHash(item: ExtractedLineItem): string {
  // Normalizar descripción (lowercase, sin espacios extra)
  const normalizedDesc = item.description
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  // Normalizar SKU si existe
  const normalizedSku = item.sku?.toLowerCase().trim() || '';

  // Normalizar unidad para evitar que "KG" y "kg" sean considerados distintos
  const normalizedUnit = normalizeUnitForHash(item.unit);

  // Crear hash con: descripción + SKU + unidad + cantidad + precio unitario + total
  // Usar valores redondeados para evitar diferencias por decimales
  const qty = Math.round(item.quantity * 100) / 100;
  const unitPrice = Math.round(item.unitPrice);
  const lineTotal = Math.round(item.lineTotal);

  return `${normalizedDesc}|${normalizedSku}|${normalizedUnit}|${qty}|${unitPrice}|${lineTotal}`;
}

/**
 * Consolida items de múltiples chunks eliminando duplicados
 */
export function consolidateLineItems(
  itemsArrays: ExtractedLineItem[][],
  options: {
    mergeDuplicates?: boolean; // Si true, suma cantidades de duplicados
    tolerance?: number; // Tolerancia para considerar iguales (default: 0.01)
  } = {}
): ConsolidatedInvoice {
  const { mergeDuplicates = false, tolerance = 0.01 } = options;

  console.log('🔄 Consolidando items de múltiples chunks:', {
    arraysCount: itemsArrays.length,
    totalItemsBefore: itemsArrays.reduce((sum, arr) => sum + arr.length, 0)
  });

  const itemMap = new Map<string, ExtractedLineItem>();
  const warnings: string[] = [];
  let duplicatesRemoved = 0;

  for (const items of itemsArrays) {
    for (const item of items) {
      const hash = createItemHash(item);

      if (itemMap.has(hash)) {
        // Item duplicado encontrado
        const existing = itemMap.get(hash)!;

        if (mergeDuplicates) {
          // Sumar cantidades y recalcular total
          existing.quantity += item.quantity;
          existing.lineTotal = Math.round(
            existing.quantity * existing.unitPrice * (1 - (existing.discount || 0))
          );

          // Actualizar confianza (promedio)
          if (item.confidence !== undefined && existing.confidence !== undefined) {
            existing.confidence = (existing.confidence + item.confidence) / 2;
          }

          warnings.push(
            `Item duplicado fusionado: "${item.description}" (cantidad: ${existing.quantity})`
          );
        } else {
          // Solo contar como duplicado removido
          duplicatesRemoved++;
          warnings.push(
            `Item duplicado removido: "${item.description}" en página ${item.pageNumber}`
          );
        }
      } else {
        // Nuevo item, agregarlo
        itemMap.set(hash, { ...item });
      }
    }
  }

  const lineItems = Array.from(itemMap.values());

  // Ordenar por página y posición (si está disponible)
  lineItems.sort((a, b) => {
    if (a.pageNumber !== undefined && b.pageNumber !== undefined) {
      return a.pageNumber - b.pageNumber;
    }
    if (a.chunkIndex !== undefined && b.chunkIndex !== undefined) {
      return a.chunkIndex - b.chunkIndex;
    }
    return 0;
  });

  console.log('✅ Consolidación completada:', {
    totalItems: lineItems.length,
    duplicatesRemoved,
    warnings: warnings.length
  });

  return {
    lineItems,
    totalItems: lineItems.length,
    duplicatesRemoved,
    warnings
  };
}

/**
 * Valida coherencia de totales
 */
export function validateTotals(
  lineItems: ExtractedLineItem[],
  extractedSubtotal?: number,
  extractedTax?: number,
  extractedTotal?: number
): {
  isValid: boolean;
  calculatedSubtotal: number;
  calculatedTax: number;
  calculatedTotal: number;
  differences: {
    subtotal?: number;
    tax?: number;
    total?: number;
  };
  warnings: string[];
} {
  const warnings: string[] = [];

  // Calcular totales desde items
  const calculatedSubtotal = lineItems.reduce((sum, item) => {
    return sum + item.lineTotal;
  }, 0);

  // Asumir IVA 19% si no está especificado por item
  const calculatedTax = Math.round(calculatedSubtotal * 0.19);
  const calculatedTotal = calculatedSubtotal + calculatedTax;

  const differences: {
    subtotal?: number;
    tax?: number;
    total?: number;
  } = {};

  // Comparar con totales extraídos
  if (extractedSubtotal !== undefined) {
    const diff = Math.abs(calculatedSubtotal - extractedSubtotal);
    if (diff > 1) { // Tolerancia de $1 CLP
      differences.subtotal = diff;
      warnings.push(
        `Diferencia en subtotal: calculado ${calculatedSubtotal} vs extraído ${extractedSubtotal} (diff: ${diff})`
      );
    }
  }

  if (extractedTax !== undefined) {
    const diff = Math.abs(calculatedTax - extractedTax);
    if (diff > 1) {
      differences.tax = diff;
      warnings.push(
        `Diferencia en IVA: calculado ${calculatedTax} vs extraído ${extractedTax} (diff: ${diff})`
      );
    }
  }

  if (extractedTotal !== undefined) {
    const diff = Math.abs(calculatedTotal - extractedTotal);
    if (diff > 1) {
      differences.total = diff;
      warnings.push(
        `Diferencia en total: calculado ${calculatedTotal} vs extraído ${extractedTotal} (diff: ${diff})`
      );
    }
  }

  const isValid = Object.keys(differences).length === 0;

  return {
    isValid,
    calculatedSubtotal,
    calculatedTax,
    calculatedTotal,
    differences,
    warnings
  };
}
