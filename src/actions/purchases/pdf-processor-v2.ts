/**
 * PDF Processor V2 - Con chunking por páginas y Structured Outputs
 * Última actualización: 2026-01-28
 * 
 * Nueva implementación que:
 * 1. Extrae texto por páginas
 * 2. Crea chunks inteligentes
 * 3. Usa Structured Outputs de OpenAI
 * 4. Consolida items de múltiples chunks
 */

'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/actions/configuration/auth-actions'
import OpenAI from 'openai'
import { PdfPagesResult } from '@/lib/pdf-pages-extractor'
import { createPageChunks, getHeaderPages, getLineItemChunks, PageChunk } from '@/lib/invoice-chunking'
import { consolidateLineItems, validateTotals, ExtractedLineItem } from '@/lib/invoice-consolidation'
import { 
  getOpenAIJsonSchema, 
  getExtractionPrompt, 
  validateExtractionResult,
  Supplier,
  InvoiceHeader,
  LineItem,
  ExtractionResult
} from '@/lib/invoice-extraction.schema'
import { findProductByDescription, findProductsForInvoiceLines } from './common'
import { validateExtractedText, filterInvoiceText, cleanCorruptText } from '@/lib/text-validator'

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface ProcessPDFV2Result {
  success: boolean
  data?: {
    supplier: Supplier
    header: InvoiceHeader
    lineItems: ExtractedLineItem[]
    totalPages: number
    pagesWithText: number
    pagesEmpty: number
    chunksProcessed: number
    itemsExtracted: number
    duplicatesRemoved: number
    warnings: string[]
    confidence: number
  }
  error?: string
  logId?: number
}

/**
 * Procesa PDF con chunking por páginas y Structured Outputs
 */
/**
 * Procesa PDF con chunking por páginas y Structured Outputs.
 * Recibe PdfPagesResult (extraído en el cliente con extractPdfPagesText)
 * para evitar usar pdfjs-dist en el servidor (solo funciona en navegador).
 */
export async function processPDFInvoiceV2(
  pagesResult: PdfPagesResult,
  fileName: string,
  fileSize: number,
  method: 'ai' | 'ocr' = 'ai'
): Promise<ProcessPDFV2Result> {
  const startTime = Date.now()

  try {
    console.log('🚀 [V2] Iniciando procesamiento mejorado de PDF:', fileName)

    // Obtener usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }

    if (method !== 'ai') {
      throw new Error('OCR aún no implementado en V2')
    }

    console.log('✅ [V2] Páginas recibidas del cliente:', {
      totalPages: pagesResult.totalPages,
      pagesWithText: pagesResult.pagesWithText,
      pagesEmpty: pagesResult.pagesEmpty
    })

    // Validar que hay páginas con texto
    if (pagesResult.pagesWithText === 0) {
      throw new Error('El PDF no contiene texto legible. Todas las páginas están vacías.')
    }

    // ============================================
    // PASO 2: Chunking inteligente
    // ============================================
    console.log('🔪 [V2] Paso 2: Creando chunks de páginas...')
    const chunkingResult = createPageChunks(pagesResult.pages, {
      maxCharsPerChunk: 10000,
      minCharsPerChunk: 2000,
      preferPageBoundaries: true
    })

    const headerPages = getHeaderPages(pagesResult.pages, 2)
    const lineItemChunks = getLineItemChunks(chunkingResult.chunks, headerPages)

    console.log('✅ [V2] Chunking completado:', {
      totalChunks: chunkingResult.totalChunks,
      headerPages: headerPages.length,
      lineItemChunks: lineItemChunks.length
    })

    // ============================================
    // PASO 3: Header Pass (páginas 1-2)
    // ============================================
    console.log('📋 [V2] Paso 3: Extrayendo información del encabezado...')
    
    const headerChunk = chunkingResult.chunks.find(c => 
      c.pagesIncluded.some(p => headerPages.includes(p + 1))
    ) || chunkingResult.chunks[0]

    const headerText = filterInvoiceText(headerChunk.text)
    
    if (!headerText || headerText.trim().length < 50) {
      throw new Error('No se pudo extraer texto suficiente del encabezado de la factura')
    }

    const headerPrompt = getExtractionPrompt(headerText, true)
    const jsonSchema = getOpenAIJsonSchema()

    let headerResult: ExtractionResult
    try {
      const headerResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en procesamiento de facturas chilenas. Extraes SOLO datos reales del texto proporcionado. Respondes únicamente con JSON válido según el schema.'
          },
          {
            role: 'user',
            content: headerPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000, // Suficiente para header
        response_format: { type: 'json_object' } // Structured Outputs
      })

      const headerContent = headerResponse.choices[0]?.message?.content
      if (!headerContent) {
        throw new Error('No se recibió respuesta de OpenAI para header')
      }

      const parsedHeader = JSON.parse(headerContent)
      const validation = validateExtractionResult(parsedHeader)
      
      if (!validation.success) {
        console.error('❌ [V2] Header no válido según schema:', validation.error)
        throw new Error(`Header no válido: ${validation.error}`)
      }

      headerResult = validation.data!
      console.log('✅ [V2] Header extraído:', {
        supplier: headerResult.supplier.name,
        folio: headerResult.header.folio,
        total: headerResult.header.total
      })
    } catch (error) {
      console.error('❌ [V2] Error en header pass:', error)
      throw new Error(`Error extrayendo encabezado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }

    // ============================================
    // PASO 4: Lines Pass (chunks de items)
    // ============================================
    console.log('📦 [V2] Paso 4: Extrayendo items de chunks...')
    
    const allLineItems: ExtractedLineItem[] = []
    const warnings: string[] = []

    for (let i = 0; i < lineItemChunks.length; i++) {
      const chunk = lineItemChunks[i]
      console.log(`  🔄 Procesando chunk ${i + 1}/${lineItemChunks.length} (páginas ${chunk.startPage}-${chunk.endPage})...`)

      const chunkText = filterInvoiceText(chunk.text)
      
      if (!chunkText || chunkText.trim().length < 20) {
        warnings.push(`Chunk ${i + 1} (páginas ${chunk.startPage}-${chunk.endPage}) está vacío o tiene muy poco texto`)
        continue
      }

      try {
        const linesPrompt = getExtractionPrompt(chunkText, false)
        
        const linesResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en procesamiento de facturas chilenas. Extraes SOLO items/productos reales del texto proporcionado. Respondes únicamente con JSON válido según el schema.'
            },
            {
              role: 'user',
              content: linesPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 12000, // Aumentado para muchos items
          response_format: { type: 'json_object' } // Structured Outputs
        })

        const linesContent = linesResponse.choices[0]?.message?.content
        if (!linesContent) {
          warnings.push(`Chunk ${i + 1}: No se recibió respuesta de OpenAI`)
          continue
        }

        const parsedLines = JSON.parse(linesContent)
        
        // Validar que tiene lineItems
        if (parsedLines.lineItems && Array.isArray(parsedLines.lineItems)) {
          const chunkItems: ExtractedLineItem[] = parsedLines.lineItems.map((item: LineItem) => ({
            description: item.description,
            sku: item.sku || undefined,
            quantity: item.quantity,
            unit: item.unit || undefined,
            unitPrice: item.unitPrice,
            discount: item.discount,
            lineTotal: item.lineTotal,
            taxAffectation: item.taxAffectation,
            pageNumber: chunk.startPage, // Página donde se encontró
            chunkIndex: chunk.chunkIndex,
            confidence: item.confidence
          }))

          allLineItems.push(...chunkItems)
          console.log(`  ✅ Chunk ${i + 1}: ${chunkItems.length} items extraídos`)
        } else {
          warnings.push(`Chunk ${i + 1}: No se encontraron items en la respuesta`)
        }
      } catch (error) {
        console.error(`❌ [V2] Error procesando chunk ${i + 1}:`, error)
        warnings.push(`Chunk ${i + 1} (páginas ${chunk.startPage}-${chunk.endPage}): Error - ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    console.log(`✅ [V2] Lines pass completado: ${allLineItems.length} items extraídos de ${lineItemChunks.length} chunks`)

    // ============================================
    // PASO 5: Consolidación y dedupe
    // ============================================
    console.log('🔄 [V2] Paso 5: Consolidando items...')
    
    const consolidated = consolidateLineItems([allLineItems], {
      mergeDuplicates: false, // No fusionar, solo remover duplicados exactos
      tolerance: 0.01
    })

    // Validar totales
    const totalsValidation = validateTotals(
      consolidated.lineItems,
      headerResult.header.net,
      headerResult.header.tax,
      headerResult.header.total
    )

    if (!totalsValidation.isValid) {
      warnings.push(...totalsValidation.warnings)
      console.warn('⚠️ [V2] Advertencias en validación de totales:', totalsValidation.warnings)
    }

    // Calcular confianza promedio
    const itemsWithConfidence = consolidated.lineItems.filter(item => item.confidence !== undefined)
    const avgConfidence = itemsWithConfidence.length > 0
      ? itemsWithConfidence.reduce((sum, item) => sum + (item.confidence || 0), 0) / itemsWithConfidence.length
      : (headerResult.header.confidence || 0.8)

    // ============================================
    // PASO 6: Guardar log
    // ============================================
    const supabase = await getSupabaseServerClient()
    const { data: logData, error: logError } = await supabase
      .from('pdf_extraction_log')
      .insert({
        extraction_method: 'ai_v2',
        raw_text: pagesResult.fullText.substring(0, 5000),
        chatgpt_response: {
          version: 'v2',
          total_pages: pagesResult.totalPages,
          chunks_processed: chunkingResult.totalChunks,
          items_extracted: consolidated.totalItems,
          processing_time_ms: Date.now() - startTime
        },
        tokens_used: 0, // TODO: Sumar tokens de todas las llamadas
        confidence_score: avgConfidence,
        success: true,
        created_by: currentUser.id
      })
      .select('id')
      .single()

    if (logError) {
      console.error('⚠️ [V2] Error guardando log:', logError)
    }

    console.log('✅ [V2] Procesamiento completado exitosamente')

    return {
      success: true,
      data: {
        supplier: headerResult.supplier,
        header: headerResult.header,
        lineItems: consolidated.lineItems,
        totalPages: pagesResult.totalPages,
        pagesWithText: pagesResult.pagesWithText,
        pagesEmpty: pagesResult.pagesEmpty,
        chunksProcessed: chunkingResult.totalChunks,
        itemsExtracted: consolidated.totalItems,
        duplicatesRemoved: consolidated.duplicatesRemoved,
        warnings: [...consolidated.warnings, ...warnings, ...totalsValidation.warnings],
        confidence: avgConfidence
      },
      logId: logData?.id
    }

  } catch (error) {
    console.error('❌ [V2] Error procesando PDF:', error)
    
    // Guardar log de error
    try {
      const currentUser = await getCurrentUser()
      const supabase = await getSupabaseServerClient()
      
      await supabase.from('pdf_extraction_log').insert({
        extraction_method: 'ai_v2',
        error_message: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
        created_by: currentUser?.id || null
      })
    } catch (logError) {
      console.error('Error guardando log de error:', logError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido procesando PDF'
    }
  }
}
