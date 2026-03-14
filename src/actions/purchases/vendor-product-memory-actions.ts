/**
 * Vendor Product Memory Actions - Aprender matches de productos
 * Última actualización: 2026-01-28
 * 
 * Guarda relaciones aprendidas entre descripciones de facturas y productos.
 */

'use server'

import { saveVendorProductMemory, normalizeDescription } from '@/lib/product-embeddings'
import { normalizeUnit } from '@/lib/units'
import { normalizeAlias, isValidAliasForLearning } from '@/lib/invoice-line-utils'
import { getCurrentUser } from '@/actions/configuration/auth-actions'
import { getSupabaseServerClient } from '@/lib/supabase-server'

interface LearnMatchParams {
  vendorId: number
  productId: number
  observedDescription: string
  unit?: string | null
  sku?: string | null // SKU observado en la factura
}

interface LearnMatchResult {
  success: boolean
  skipped?: boolean
  reason?: string
  error?: string
}

/**
 * Aprende un match de producto para un proveedor
 * Fire-and-forget: no rompe si falla
 * 
 * Validaciones:
 * - vendorId y productId deben existir
 * - Descripción normalizada debe tener al menos 6 caracteres
 * - Normaliza descripción server-side también
 */
export async function learnVendorProductMatch(
  params: LearnMatchParams
): Promise<LearnMatchResult> {
  try {
    // Validación 1: vendorId y productId requeridos
    if (!params.vendorId || !params.productId) {
      return {
        success: false,
        skipped: true,
        reason: 'vendorId o productId faltantes'
      }
    }

    // Validación 2: Descripción no vacía
    if (!params.observedDescription || typeof params.observedDescription !== 'string') {
      return {
        success: false,
        skipped: true,
        reason: 'descripción vacía o inválida'
      }
    }

    // Validación 3: Normalizar descripción server-side
    const normalizedDesc = await normalizeDescription(params.observedDescription)
    
    // Validación 4: Descripción normalizada debe tener al menos 6 caracteres
    if (normalizedDesc.length < 6) {
      return {
        success: false,
        skipped: true,
        reason: 'descripción demasiado corta (mínimo 6 caracteres)'
      }
    }

    // Obtener usuario actual (opcional)
    let userId: number | null = null
    try {
      const currentUser = await getCurrentUser()
      // currentUser.id puede ser string, convertir a number
      userId = currentUser?.id ? Number(currentUser.id) : null
    } catch (error) {
      // No crítico si no hay usuario
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ No se pudo obtener usuario para memoria:', error)
      }
    }

    // Normalizar unidad si existe
    const normalizedUnit = params.unit ? normalizeUnit(params.unit) : null
    
    // Normalizar SKU si existe: trim + uppercase
    const normalizedSku = params.sku ? params.sku.trim().toUpperCase() : null

    // Guardar memoria (saveVendorProductMemory ya normaliza internamente, pero pasamos normalizado también)
    const result = await saveVendorProductMemory(
      params.vendorId,
      normalizedDesc, // Usar descripción normalizada
      params.productId,
      normalizedUnit,
      userId,
      normalizedSku // SKU normalizado
    )

    // Guardar alias si es válido (además de memoria)
    const aliasNorm = normalizeAlias(params.observedDescription)
    const hasSkuOrUnit = !!(normalizedSku || normalizedUnit)
    
    if (isValidAliasForLearning(params.observedDescription, hasSkuOrUnit)) {
      try {
        const supabase = await getSupabaseServerClient()
        
        // Buscar si ya existe alias con mismo vendor + alias_norm + unit + sku
        // El constraint UNIQUE usa COALESCE(unit, '') y COALESCE(sku, ''), así que buscamos igual
        let aliasQuery = supabase
          .from('purchase_vendor_product_aliases')
          .select('id, product_id, times_used')
          .eq('vendor_id', params.vendorId)
          .eq('alias_norm', aliasNorm)
        
        if (normalizedUnit) {
          aliasQuery = aliasQuery.eq('unit', normalizedUnit)
        } else {
          aliasQuery = aliasQuery.is('unit', null)
        }
        
        if (normalizedSku) {
          aliasQuery = aliasQuery.eq('sku', normalizedSku)
        } else {
          aliasQuery = aliasQuery.is('sku', null)
        }
        
        const { data: existingAlias } = await aliasQuery.maybeSingle()

        if (existingAlias) {
          // Si existe y es el mismo producto: incrementar times_used
          if (existingAlias.product_id === params.productId) {
            await supabase
              .from('purchase_vendor_product_aliases')
              .update({
                times_used: existingAlias.times_used + 1,
                last_used_at: new Date().toISOString()
              })
              .eq('id', existingAlias.id)
            
            if (process.env.NODE_ENV !== 'production') {
              console.log('[ALIAS_LEARN] vendor=', params.vendorId, 'product=', params.productId, 'alias="' + aliasNorm.substring(0, 50) + '" times_used++')
            }
          } else {
            // Conflicto: alias existe con otro producto
            // NO sobreescribir automáticamente, solo log warning
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[ALIAS_CONFLICT] vendor=', params.vendorId, 'alias="' + aliasNorm.substring(0, 50) + '" existing_product=' + existingAlias.product_id + ' new_product=' + params.productId)
            }
          }
        } else {
          // Crear nuevo alias
          const { error: aliasError } = await supabase
            .from('purchase_vendor_product_aliases')
            .insert({
              vendor_id: params.vendorId,
              product_id: params.productId,
              alias_norm: aliasNorm,
              alias_raw: params.observedDescription,
              unit: normalizedUnit,
              sku: normalizedSku,
              times_used: 1,
              last_used_at: new Date().toISOString(),
              created_by: userId,
              is_active: true
            })

          if (aliasError) {
            // No crítico si falla (puede ser constraint único)
            if (process.env.NODE_ENV !== 'production') {
              console.warn('⚠️ Error guardando alias (no crítico):', aliasError.message)
            }
          } else {
            if (process.env.NODE_ENV !== 'production') {
              console.log('[ALIAS_LEARN] vendor=', params.vendorId, 'product=', params.productId, 'alias="' + aliasNorm.substring(0, 50) + '" created')
            }
          }
        }
      } catch (aliasErr) {
        // No crítico si falla guardar alias
        if (process.env.NODE_ENV !== 'production') {
          console.warn('⚠️ Error guardando alias (no crítico):', aliasErr instanceof Error ? aliasErr.message : 'Error desconocido')
        }
      }
    }

    if (result.success) {
      // Log solo en dev (muestreado)
      if (process.env.NODE_ENV !== 'production' && Math.random() < 0.1) {
        console.log('✅ Match aprendido:', {
          vendorId: params.vendorId,
          productId: params.productId,
          description: normalizedDesc.substring(0, 50)
        })
      }
    }

    return result
  } catch (error) {
    // No romper si falla - solo log
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    // Detectar error de tabla inexistente (42P01)
    if (errorMessage.includes('42P01') || errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
      if (process.env.NODE_ENV !== 'production') {
        if (errorMessage.includes('purchase_vendor_product_memory')) {
          console.warn('⚠️ Tabla purchase_vendor_product_memory no existe. Aplicar migración: 20260128000001_create_vendor_product_memory.sql')
        } else if (errorMessage.includes('purchase_vendor_product_aliases')) {
          console.warn('⚠️ Tabla purchase_vendor_product_aliases no existe. Aplicar migración: 20260128000003_create_vendor_product_aliases.sql')
        } else {
          console.warn('⚠️ Tabla relacionada no existe. Verificar migraciones.')
        }
      }
      return {
        success: false,
        skipped: true,
        reason: 'tabla_no_existe',
        error: 'Tabla relacionada no existe (migración pendiente)'
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Error aprendiendo match (no crítico):', errorMessage)
    }
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Aprende múltiples matches en batch
 */
export async function learnVendorProductMatches(
  matches: LearnMatchParams[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const match of matches) {
    const result = await learnVendorProductMatch(match)
    if (result.success) {
      success++
    } else {
      failed++
      if (result.error) {
        errors.push(result.error)
      }
    }
  }

  return { success, failed, errors }
}
