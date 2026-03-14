/**
 * Product Embeddings - Matching mejorado con embeddings
 * Última actualización: 2026-01-28
 *
 * Usa embeddings de OpenAI para matching semántico de productos
 * cuando no hay SKU exacto disponible.
 */

'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { normalizeUnit } from '@/lib/units'
import { normalizeAlias } from '@/lib/invoice-line-utils'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export type MatchType = 'supplier_code_exact' | 'vendor_catalog' | 'sku_exact' | 'memory' | 'alias' | 'embedding' | 'keyword' | 'needs_review'

export interface EmbeddingMatch {
  productId: number
  productName: string
  sku?: string
  similarity: number
  matchType: MatchType
}

/** Similitud de strings barata (Jaccard sobre palabras). */
function stringSimilarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/).filter(Boolean))
  const wb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean))
  let inter = 0
  for (const w of wa) if (wb.has(w)) inter++
  const union = wa.size + wb.size - inter
  return union === 0 ? 0 : inter / union
}

function normalizeExternalCode(value: string | null | undefined): string {
  return String(value || '')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, '')
}

function normalizeNumericCodeLoose(value: string): string {
  if (!/^\d+$/.test(value)) return value
  return value.replace(/^0+/, '') || '0'
}

function codesEquivalent(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeExternalCode(a)
  const nb = normalizeExternalCode(b)
  if (!na || !nb) return false
  if (na === nb) return true
  return normalizeNumericCodeLoose(na) === normalizeNumericCodeLoose(nb)
}

type VendorCatalogRow = {
  id: number
  name: string
  sku?: string | null
  barcode?: string | null
  description?: string | null
  unit?: string | null
  supplierCode?: string | null
  suppliercode?: string | null
  supplierid?: number | null
}

const vendorCatalogCache = new Map<number, { expiresAt: number; rows: VendorCatalogRow[] }>()

async function getVendorCatalogProducts(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, vendorId: number): Promise<VendorCatalogRow[]> {
  const cached = vendorCatalogCache.get(vendorId)
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.rows

  let rows: VendorCatalogRow[] = []
  let res = await supabase
    .from('Product')
    .select('id, name, sku, barcode, description, unit, supplierid, supplierCode')
    .eq('isActive', true)
    .eq('supplierid', vendorId)
    .limit(5000)

  if (res.error && (res.error.code === '42703' || String(res.error.message || '').includes('supplierCode'))) {
    const fallback = await supabase
      .from('Product')
      .select('id, name, sku, barcode, description, unit, supplierid, suppliercode')
      .eq('isActive', true)
      .eq('supplierid', vendorId)
      .limit(5000)
    rows = (fallback.data || []) as VendorCatalogRow[]
  } else {
    rows = (res.data || []) as VendorCatalogRow[]
  }

  vendorCatalogCache.set(vendorId, { expiresAt: now + 60_000, rows })
  return rows
}

/**
 * Obtiene embedding de un texto usando OpenAI
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Modelo más barato y rápido
      input: text.trim()
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error obteniendo embedding:', error)
    throw new Error(`Error obteniendo embedding: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Calcula cosine similarity entre dos embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings deben tener la misma dimensión')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

/**
 * Normaliza descripción para matching
 */
export async function normalizeDescription(description: string): Promise<string> {
  return description
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '') // Remover caracteres especiales
}

/**
 * Busca productos usando matching mejorado (reglas + embeddings + memoria)
 */
export async function findProductWithImprovedMatching(
  description: string,
  sku?: string | null,
  unit?: string | null,
  vendorId?: number | null
): Promise<{
  product: any | null
  confidence: number
  suggestions: any[]
  matchType: MatchType
  warnings?: string[]
}> {
  const supabase = await getSupabaseServerClient()
  const normalizedDesc = await normalizeDescription(description)
  const normalizedUnit = normalizeUnit(unit)

  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [Improved Matching] Buscando producto:', {
      description,
      sku,
      unit: normalizedUnit,
      vendorId
    })
  }

  const normalizedSku = sku ? sku.trim().toUpperCase() : null
  const warnings: string[] = []

  // ============================================
  // REGLA 1: Código de proveedor exacto (supplierCode) por vendorId
  // Para XML de proveedores donde el SKU interno es distinto.
  // ============================================
  if (vendorId && normalizedSku) {
    const vendorCatalog = await getVendorCatalogProducts(supabase, vendorId)
    let supplierCodeCandidates = vendorCatalog.filter((p) =>
      codesEquivalent((p as any).supplierCode ?? (p as any).suppliercode, normalizedSku)
    )

    if (supplierCodeCandidates && supplierCodeCandidates.length > 0) {
      let resolved = supplierCodeCandidates as Array<{ id: number; name: string; unit?: string | null; [k: string]: unknown }>
      if (normalizedUnit) {
        const byUnit = resolved.filter((p) => normalizeUnit(p.unit) === normalizedUnit)
        if (byUnit.length > 0) resolved = byUnit
      }

      if (resolved.length === 1) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MATCH] line=item origin=SUPPLIER_CODE_EXACT confidence=0.995')
        }
        return {
          product: resolved[0],
          confidence: 0.995,
          suggestions: [],
          matchType: 'supplier_code_exact',
          warnings: warnings.length > 0 ? warnings : undefined
        }
      }

      if (resolved.length > 1) {
        resolved = [...resolved].sort(
          (a, b) => stringSimilarity(description, (b.name as string) ?? '') - stringSimilarity(description, (a.name as string) ?? '')
        )
        const best = resolved[0]
        return {
          product: best,
          confidence: 0.99,
          suggestions: resolved.slice(1, 6).map((p) => p),
          matchType: 'supplier_code_exact',
          warnings: warnings.length > 0 ? warnings : undefined
        }
      }
    }
  }

  // ============================================
  // REGLA 1.5: Fallback por catálogo del proveedor (descripción)
  // Evita perder match cuando no está cargado supplierCode pero sí existe el producto para ese proveedor.
  // ============================================
  if (vendorId) {
    const vendorCatalog = await getVendorCatalogProducts(supabase, vendorId)
    if (vendorCatalog.length > 0) {
      const scored = vendorCatalog.map((p) => {
        const pName = String(p.name || '')
        const pDesc = String(p.description || '')
        const simName = stringSimilarity(normalizedDesc, pName)
        const simDesc = pDesc ? stringSimilarity(normalizedDesc, pDesc) : 0
        const score = Math.max(simName * 1.15, simDesc)
        return { ...p, _score: score }
      }).sort((a, b) => b._score - a._score)

      const best = scored[0]
      const second = scored[1]
      const bestScore = Number(best?._score || 0)
      const secondScore = Number(second?._score || 0)

      // Umbral alto para autoasignar sin código proveedor; reducir falsos positivos
      if (best && bestScore >= 0.62 && (bestScore - secondScore >= 0.08 || bestScore >= 0.75)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MATCH] line=item origin=VENDOR_CATALOG confidence=0.93', { best: best.name, bestScore, secondScore })
        }
        return {
          product: best,
          confidence: Math.min(0.93, 0.72 + bestScore * 0.25),
          suggestions: scored.slice(1, 6),
          matchType: 'vendor_catalog',
          warnings: warnings.length > 0 ? warnings : undefined
        }
      }
    }
  }

  // ============================================
  // REGLA 2: SKU exacto en Product (máxima prioridad si no hubo supplierCode)
  // Confidence: 0.99. Resolver colisiones (mismo SKU varios productos).
  // ============================================
  if (normalizedSku) {
    const { data: skuCandidates } = await supabase
      .from('Product')
      .select('id, name, sku, saleprice, description, barcode, unit')
      .eq('isActive', true)
      .or(`sku.eq.${normalizedSku},barcode.eq.${normalizedSku}`)
      .limit(20)

    if (skuCandidates && skuCandidates.length > 0) {
      let resolved = skuCandidates as Array<{ id: number; name: string; sku?: string; unit?: string | null; [k: string]: unknown }>

      // Filtrar por unit si existe en línea (hard)
      if (normalizedUnit) {
        const byUnit = resolved.filter((p) => normalizeUnit(p.unit) === normalizedUnit)
        if (byUnit.length > 0) resolved = byUnit
        else {
          // Unit en línea pero ningún producto la cumple: no asignar, seguir con memoria/embeddings
          resolved = []
        }
      }

      if (resolved.length === 0) {
        // Sin candidatos válidos (p. ej. unit no coincide); continuar con reglas siguientes
      } else if (resolved.length === 1) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MATCH] line=item origin=SKU_EXACT confidence=0.99')
        }
        return {
          product: resolved[0],
          confidence: 0.99,
          suggestions: [],
          matchType: 'sku_exact',
          warnings: warnings.length > 0 ? warnings : undefined
        }
      } else {
        // >1: priorizar mayor similitud nombre vs descripción
        resolved = [...resolved].sort(
          (a, b) => stringSimilarity(description, (b.name as string) ?? '') - stringSimilarity(description, (a.name as string) ?? '')
        )
        const best = resolved[0]
        const simBest = stringSimilarity(description, (best.name as string) ?? '')
        const simSecond = stringSimilarity(description, (resolved[1].name as string) ?? '')
        if (simBest > simSecond) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[MATCH] line=item origin=SKU_EXACT confidence=0.99')
          }
          return {
            product: best,
            confidence: 0.99,
            suggestions: resolved.slice(1, 6).map((p) => p),
            matchType: 'sku_exact',
            warnings: warnings.length > 0 ? warnings : undefined
          }
        }
        const msg = `Ambiguous SKU match: ${normalizedSku}, candidates=${resolved.length}`
        warnings.push(msg)
        if (process.env.NODE_ENV !== 'production') console.warn(`[MATCH] ${msg}`)
        return {
          product: null,
          confidence: 0,
          suggestions: [],
          matchType: 'needs_review',
          warnings
        }
      }
    }
  }

  // ============================================
  // REGLA 3: SKU + UM en memoria (HARD FILTER) — Confidence: 0.98
  // ============================================
  if (vendorId && normalizedSku && normalizedUnit) {
    const { data: skuUnitMatches } = await supabase
      .from('purchase_vendor_product_memory')
      .select(`
        product_id,
        times_seen,
        Product:product_id (
          id,
          name,
          sku,
          saleprice,
          description,
          unit
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('sku', normalizedSku)
      .eq('unit', normalizedUnit)
      .order('times_seen', { ascending: false })
      .limit(5)

    if (skuUnitMatches && skuUnitMatches.length > 0) {
      const bestMatch = skuUnitMatches[0]
      if (bestMatch.Product) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MATCH] line=item origin=SKU+UM confidence=0.98')
        }
        return {
          product: bestMatch.Product,
          confidence: 0.98,
          suggestions: skuUnitMatches.slice(1).map(m => m.Product).filter(Boolean),
          matchType: 'memory',
          warnings: warnings.length > 0 ? warnings : undefined
        }
      }
    }
  }

  // ============================================
  // REGLA 4: SKU en memoria (HARD FILTER) — Confidence: 0.97
  // Colisiones: filtrar por unit, luego times_seen, luego string similarity.
  // ============================================
  if (vendorId && normalizedSku) {
    const { data: skuMatches } = await supabase
      .from('purchase_vendor_product_memory')
      .select(`
        product_id,
        times_seen,
        unit,
        Product:product_id (
          id,
          name,
          sku,
          saleprice,
          description,
          unit
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('sku', normalizedSku)
      .order('times_seen', { ascending: false })
      .limit(10)

    if (skuMatches && skuMatches.length > 0) {
      // Supabase devuelve Product como array, manejamos la conversión
      let resolved = (skuMatches as unknown as Array<{
        product_id: number
        times_seen: number
        unit?: string | null
        Product: Array<{ id: number; name: string; sku?: string; unit?: string | null; [k: string]: unknown }> | null
      }>).map(m => ({
        ...m,
        Product: Array.isArray(m.Product) ? m.Product[0] || null : m.Product
      })) as Array<{
        product_id: number
        times_seen: number
        unit?: string | null
        Product: { id: number; name: string; sku?: string; unit?: string | null; [k: string]: unknown } | null
      }>

      if (normalizedUnit && resolved.length > 1) {
        const byUnit = resolved.filter((m) => normalizeUnit(m.unit) === normalizedUnit)
        if (byUnit.length > 0) resolved = byUnit
      }

      if (resolved.length > 1) {
        resolved = [...resolved].sort((a, b) => {
          if (b.times_seen !== a.times_seen) return b.times_seen - a.times_seen
          const simB = stringSimilarity(description, (b.Product as { name: string })?.name ?? '')
          const simA = stringSimilarity(description, (a.Product as { name: string })?.name ?? '')
          return simB - simA
        })
      }

      const best = resolved[0]
      if (best?.Product && resolved.length === 1) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MATCH] line=item origin=SKU confidence=0.97')
        }
        return {
          product: best.Product,
          confidence: 0.97,
          suggestions: [],
          matchType: 'memory',
          warnings: warnings.length > 0 ? warnings : undefined
        }
      }
      if (resolved.length > 1) {
        const msg = `Ambiguous SKU match: ${normalizedSku}, candidates=${resolved.length}`
        warnings.push(msg)
        if (process.env.NODE_ENV !== 'production') console.warn(`[MATCH] ${msg}`)
        return {
          product: null,
          confidence: 0,
          suggestions: [],
          matchType: 'needs_review',
          warnings
        }
      }
    }
  }

  // ============================================
  // REGLA 3.5: ALIAS EXACTO (hard) antes de embeddings — Confidence: 0.95
  // ============================================
  if (vendorId) {
    const aliasNorm = normalizeAlias(description)

    if (aliasNorm.length >= 6) { // Solo buscar si alias es válido
      const aliasQuery = supabase
        .from('purchase_vendor_product_aliases')
        .select(`
          product_id,
          times_used,
          unit,
          sku,
          Product:product_id (
            id,
            name,
            sku,
            saleprice,
            description,
            unit
          )
        `)
        .eq('vendor_id', vendorId)
        .eq('alias_norm', aliasNorm)
        .eq('is_active', true)
        .order('times_used', { ascending: false })
        .order('last_used_at', { ascending: false })
        .limit(10)

      const { data: aliasMatches } = await aliasQuery

      if (aliasMatches && aliasMatches.length > 0) {
        // Supabase devuelve Product como array, manejamos la conversión
        let resolved = (aliasMatches as unknown as Array<{
          product_id: number
          times_used: number
          unit?: string | null
          sku?: string | null
          Product: Array<{ id: number; name: string; sku?: string; unit?: string | null; [k: string]: unknown }> | null
        }>).map(m => ({
          ...m,
          Product: Array.isArray(m.Product) ? m.Product[0] || null : m.Product
        })) as Array<{
          product_id: number
          times_used: number
          unit?: string | null
          sku?: string | null
          Product: { id: number; name: string; sku?: string; unit?: string | null; [k: string]: unknown } | null
        }>

        // Filtrar por unit si existe en línea (hard)
        if (normalizedUnit && resolved.length > 1) {
          const byUnit = resolved.filter((a) => normalizeUnit(a.unit) === normalizedUnit)
          if (byUnit.length > 0) resolved = byUnit
        }

        // Filtrar por SKU si existe en línea (hard)
        if (normalizedSku && resolved.length > 1) {
          const bySku = resolved.filter((a) => a.sku && a.sku.trim().toUpperCase() === normalizedSku)
          if (bySku.length > 0) resolved = bySku
        }

        // Si hay múltiples candidatos, ordenar por times_used y last_used_at
        if (resolved.length > 1) {
          resolved = [...resolved].sort((a, b) => {
            if (b.times_used !== a.times_used) return b.times_used - a.times_used
            // Si empatan en times_used, usar string similarity como desempate
            const simB = stringSimilarity(description, (b.Product as { name: string })?.name ?? '')
            const simA = stringSimilarity(description, (a.Product as { name: string })?.name ?? '')
            return simB - simA
          })
        }

        if (resolved.length === 1) {
          const best = resolved[0]
          if (best.Product) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('[MATCH] line=item origin=ALIAS confidence=0.95')
            }
            return {
              product: best.Product,
              confidence: 0.95,
              suggestions: [],
              matchType: 'alias',
              warnings: warnings.length > 0 ? warnings : undefined
            }
          }
        } else if (resolved.length > 1) {
          // Si sigue ambiguo después de filtros y ordenamiento
          const best = resolved[0]
          const second = resolved[1]
          const simBest = stringSimilarity(description, (best.Product as { name: string })?.name ?? '')
          const simSecond = stringSimilarity(description, (second.Product as { name: string })?.name ?? '')

          if (simBest > simSecond) {
            // Hay diferencia clara, usar el mejor
            if (process.env.NODE_ENV !== 'production') {
              console.log('[MATCH] line=item origin=ALIAS confidence=0.95')
            }
            return {
              product: best.Product,
              confidence: 0.95,
              suggestions: resolved.slice(1, 6).map(a => a.Product).filter(Boolean),
              matchType: 'alias',
              warnings: warnings.length > 0 ? warnings : undefined
            }
          } else {
            // Sigue ambiguo
            const msg = `Ambiguous alias match: ${aliasNorm}, candidates=${resolved.length}`
            warnings.push(msg)
            if (process.env.NODE_ENV !== 'production') console.warn(`[MATCH] ${msg}`)
            return {
              product: null,
              confidence: 0,
              suggestions: [],
              matchType: 'needs_review',
              warnings
            }
          }
        }
      }
    }
  }

  // ============================================
  // REGLA 4: Memoria por descripción + UM — Confidence: 0.93
  // ============================================
  if (vendorId && normalizedUnit) {
    const { data: memoryMatches } = await supabase
      .from('purchase_vendor_product_memory')
      .select(`
        product_id,
        times_seen,
        Product:product_id (
          id,
          name,
          sku,
          saleprice,
          description,
          unit
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('unit', normalizedUnit)
      .ilike('normalized_description', `%${normalizedDesc}%`)
      .order('times_seen', { ascending: false })
      .limit(5)

    if (memoryMatches && memoryMatches.length > 0) {
      const bestMemory = memoryMatches[0]
      if (bestMemory.Product) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MATCH] line=item origin=MEMORY+UM confidence=0.93')
        }
        return {
          product: bestMemory.Product,
          confidence: 0.93,
          suggestions: memoryMatches.slice(1).map(m => m.Product).filter(Boolean),
          matchType: 'memory',
          warnings: warnings.length > 0 ? warnings : undefined
        }
      }
    }
  }

  // ============================================
  // REGLA 5: Memoria por descripción (sin UM) — Confidence: 0.90
  // ============================================
  if (vendorId) {
    const { data: memoryMatches } = await supabase
      .from('purchase_vendor_product_memory')
      .select(`
        product_id,
        times_seen,
        Product:product_id (
          id,
          name,
          sku,
          saleprice,
          description,
          unit
        )
      `)
      .eq('vendor_id', vendorId)
      .ilike('normalized_description', `%${normalizedDesc}%`)
      .order('times_seen', { ascending: false })
      .limit(5)

    if (memoryMatches && memoryMatches.length > 0) {
      const bestMemory = memoryMatches[0]
      if (bestMemory.Product) {
        const productUnit = normalizeUnit((bestMemory.Product as { unit?: string | null }).unit)
        if (!normalizedUnit || !productUnit || normalizedUnit === productUnit) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[MATCH] line=item origin=MEMORY confidence=0.90')
          }
          return {
            product: bestMemory.Product,
            confidence: 0.90,
            suggestions: memoryMatches.slice(1).map(m => m.Product).filter(Boolean),
            matchType: 'memory',
            warnings: warnings.length > 0 ? warnings : undefined
          }
        }
      }
    }
  }

  // ============================================
  // REGLA 6: Embeddings (SOLO SI NO HAY SKU)
  // ============================================
  // Si hay SKU pero no hubo match exacto, SKU es más confiable que embeddings → saltamos
  // Si no hay SKU (con o sin vendorId), intentamos embeddings semánticos
  if (normalizedSku) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MATCH] line=item origin=SKU_NO_MATCH skipping_embeddings')
    }
  } else {
    // Sin SKU: intentar embeddings semánticos independientemente de vendorId
    try {
      const descriptionEmbedding = await getEmbedding(description)

      // Búsqueda por keywords para obtener candidatos (más barato que embedding full-scan)
      const words = normalizedDesc.split(' ').filter(w => w.length > 2).slice(0, 5)
      if (words.length > 0) {
        const searchTerms = words.map(term => `name.ilike.%${term}%,description.ilike.%${term}%`).join(',')

        const { data: candidateProducts } = await supabase
          .from('Product')
          .select('id, name, sku, saleprice, description, unit')
          .eq('isActive', true)
          .or(searchTerms)
          .limit(20)

        if (candidateProducts && candidateProducts.length > 0) {
          // Pre-calcular todos los embeddings de candidatos en paralelo (evitar N+1 secuencial)
          const embeddingResults = await Promise.allSettled(
            candidateProducts.map(p => getEmbedding(`${p.name} ${p.description || ''} ${p.sku || ''}`))
          )

          const matches: Array<{ product: any; similarity: number }> = []

          for (let i = 0; i < candidateProducts.length; i++) {
            const result = embeddingResults[i]
            if (result.status === 'fulfilled') {
              const similarity = cosineSimilarity(descriptionEmbedding, result.value)
              if (similarity > 0.75) {
                matches.push({ product: candidateProducts[i], similarity })
              }
            }
          }

          matches.sort((a, b) => b.similarity - a.similarity)

          if (matches.length > 0) {
            const bestMatch = matches[0]
            const conf = Math.min(0.85, Math.max(0.75, bestMatch.similarity))
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[MATCH] line=item origin=EMBEDDING confidence=${conf.toFixed(2)}`)
            }
            return {
              product: bestMatch.product,
              confidence: conf,
              suggestions: matches.slice(1, 6).map(m => m.product),
              matchType: 'embedding',
              warnings: warnings.length > 0 ? warnings : undefined
            }
          }
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MATCH] Error en embeddings, usando fallback:', error)
      }
    }
  }

  // ============================================
  // REGLA 7: FALLBACK - Búsqueda por keywords (método original)
  // ============================================
  const words = normalizedDesc.split(' ').filter(w => w.length > 2).slice(0, 5)
  const searchTerms = words.map(term => `name.ilike.%${term}%,description.ilike.%${term}%`).join(',')

  const { data: keywordProducts } = await supabase
    .from('Product')
    .select('id, name, sku, saleprice, description, unit')
    .eq('isActive', true)
    .or(searchTerms)
    .limit(10)

  if (keywordProducts && keywordProducts.length > 0) {
    // Calcular score básico
    const scored = keywordProducts.map(product => {
      const productText = `${product.name} ${product.description || ''}`.toLowerCase()
      let score = 0

      for (const word of words) {
        if (productText.includes(word)) {
          score += word.length
        }
      }

      return { product, score: score / (words.length * 10) } // Normalizar
    })

    scored.sort((a, b) => b.score - a.score)

    if (scored[0].score > 0.1) {
      const conf = Math.min(0.6, scored[0].score)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[MATCH] line=item origin=FALLBACK confidence=${conf.toFixed(2)}`)
      }
      return {
        product: scored[0].product,
        confidence: conf,
        suggestions: scored.slice(1, 6).map(s => s.product),
        matchType: 'keyword',
        warnings: warnings.length > 0 ? warnings : undefined
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[MATCH] line=item origin=NONE confidence=0.00')
  }
  return {
    product: null,
    confidence: 0,
    suggestions: [],
    matchType: 'keyword',
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Guarda o actualiza memoria de proveedor-producto
 *
 * @param sku - SKU observado en la factura (normalizado: trim + uppercase)
 * @param unit - Unidad de medida (normalizada: UN, KG, LT, etc.)
 */
export async function saveVendorProductMemory(
  vendorId: number,
  observedDescription: string,
  productId: number,
  unit?: string | null,
  userId?: number | null,
  sku?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const normalizedDesc = await normalizeDescription(observedDescription)

    // Normalizar SKU: trim + uppercase (si existe)
    const normalizedSku = sku ? sku.trim().toUpperCase() : null

    // Unidad: una sola fuente (@/lib/units)
    const normalizedUnit = normalizeUnit(unit)

    // Buscar si ya existe (por vendor + normalized_desc + product_id)
    const { data: existing } = await supabase
      .from('purchase_vendor_product_memory')
      .select('id, times_seen')
      .eq('vendor_id', vendorId)
      .eq('normalized_description', normalizedDesc)
      .eq('product_id', productId)
      .single()

    if (existing) {
      // Actualizar: incrementar times_seen y actualizar sku/unit si existen
      const updateData: {
        times_seen: number
        last_seen_at: string
        unit?: string | null
        sku?: string | null
      } = {
        times_seen: existing.times_seen + 1,
        last_seen_at: new Date().toISOString()
      }

      if (unit !== undefined) {
        updateData.unit = normalizedUnit
      }

      // Actualizar sku solo si se proporciona y no está vacío
      if (normalizedSku) {
        updateData.sku = normalizedSku
      }

      const { error } = await supabase
        .from('purchase_vendor_product_memory')
        .update(updateData)
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Insertar nuevo
      const { error } = await supabase
        .from('purchase_vendor_product_memory')
        .insert({
          vendor_id: vendorId,
          observed_description: observedDescription,
          normalized_description: normalizedDesc,
          product_id: productId,
          unit: normalizedUnit,
          sku: normalizedSku || null,
          created_by: userId || null
        })

      if (error) throw error
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Memoria guardada:', { vendorId, productId, normalizedDesc, sku: normalizedSku, unit: normalizedUnit })
    }
    return { success: true }
  } catch (error) {
    console.error('Error guardando memoria:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
