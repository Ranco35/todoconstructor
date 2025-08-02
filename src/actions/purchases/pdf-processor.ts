'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/actions/configuration/auth-actions'
import OpenAI from 'openai'
import { findProductByDescription, findProductsForInvoiceLines } from './common'
import { validateExtractedText, filterInvoiceText, cleanCorruptText } from '@/lib/text-validator'
import { generateInvoiceNumber } from './invoices/create'

// Interfaces para tipado
interface ExtractedInvoiceData {
  invoiceNumber: string
  supplierInvoiceNumber?: string // Número de la factura del proveedor
  supplierName: string
  supplierRut: string
  issueDate: string
  dueDate: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  lines: InvoiceLine[]
  confidence: number
  notes?: string
  isDevelopmentData?: boolean // Indica si son datos simulados para desarrollo
}

interface InvoiceLine {
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
  productCode?: string
  // Información de producto encontrado automáticamente
  productId?: number
  productMatch?: {
    id: number
    name: string
    sku: string
    saleprice: number
    confidence: number
  }
  productSuggestions?: Array<{
    id: number
    name: string
    sku: string
    matchScore: number
  }>
}

interface ProcessPDFResult {
  success: boolean
  data?: ExtractedInvoiceData
  error?: string
  logId?: number
}

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Procesa texto extraído usando OCR simple (placeholder)
 */
async function processWithOCR(pdfText: string, fileName: string): Promise<ExtractedInvoiceData> {
  console.log('🔍 OCR: Procesando texto de:', fileName)
  
  // Simular procesamiento OCR con regexes y análisis de texto
  const lines = pdfText.split('\n').filter(line => line.trim().length > 0)
  
  // Extraer datos usando patrones simples
  const invoiceNumber = extractInvoiceNumber(lines)
  const supplier = extractSupplierInfo(lines)
  const dates = extractDates(lines)
  const amounts = extractAmounts(lines)
  const items = extractLineItems(lines)
  
  return {
    invoiceNumber: invoiceNumber || `OCR-${Date.now()}`,
    supplierInvoiceNumber: invoiceNumber || `${Date.now()}`, // Simular número oficial del proveedor
    supplierName: supplier.name || 'Proveedor extraído por OCR',
    supplierRut: supplier.rut || '11.111.111-1',
    issueDate: dates.issue || new Date().toISOString().split('T')[0],
    dueDate: dates.due || new Date().toISOString().split('T')[0],
    subtotal: amounts.subtotal || 0,
    taxAmount: amounts.tax || 0,
    totalAmount: amounts.total || 0,
    confidence: 0.8, // OCR típicamente tiene menor confianza que IA
    lines: items,
    isDevelopmentData: true
  }
}

/**
 * Extrae número de factura usando patrones OCR
 */
function extractInvoiceNumber(lines: string[]): string | null {
  const patterns = [
    /(?:factura|invoice|número|n[oº]?\.?)\s*:?\s*([a-z]?[\d\-]+)/i,
    /^([a-z]?\d{3,}[-\d]*)$/i,
    /(?:f|n)[^\w]*(\d{3,})/i
  ]
  
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match) {
        return match[1]
      }
    }
  }
  return null
}

/**
 * Extrae información del proveedor usando patrones OCR
 */
function extractSupplierInfo(lines: string[]): { name: string | null, rut: string | null } {
  let supplierName: string | null = null
  let supplierRut: string | null = null
  
  // Buscar RUT
  const rutPattern = /(\d{1,2}\.?\d{3}\.?\d{3}[-\.]?[\dk])/i
  for (const line of lines) {
    const rutMatch = line.match(rutPattern)
    if (rutMatch) {
      supplierRut = rutMatch[1]
      // El nombre del proveedor suele estar cerca del RUT
      if (!supplierName && line.length > rutMatch[1].length + 5) {
        supplierName = line.replace(rutMatch[1], '').trim().slice(0, 50)
      }
      break
    }
  }
  
  // Si no encontramos nombre cerca del RUT, buscar líneas que parezcan nombres de empresa
  if (!supplierName) {
    for (const line of lines.slice(0, 10)) { // Buscar en las primeras líneas
      if (line.length > 10 && line.length < 100 && 
          /[a-zA-Z]/.test(line) && 
          !/factura|invoice|número|fecha|total/i.test(line)) {
        supplierName = line.trim()
        break
      }
    }
  }
  
  return { name: supplierName, rut: supplierRut }
}

/**
 * Extrae fechas usando patrones OCR
 */
function extractDates(lines: string[]): { issue: string | null, due: string | null } {
  const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/
  const dates: string[] = []
  
  for (const line of lines) {
    const match = line.match(datePattern)
    if (match) {
      dates.push(match[1])
    }
  }
  
  return {
    issue: dates[0] ? formatDate(dates[0]) : null,
    due: dates[1] ? formatDate(dates[1]) : null
  }
}

/**
 * Extrae montos usando patrones OCR
 */
function extractAmounts(lines: string[]): { subtotal: number, tax: number, total: number } {
  const amounts: number[] = []
  const amountPattern = /\$?[\d\.,]+/g
  
  for (const line of lines) {
    const matches = line.match(amountPattern)
    if (matches) {
      for (const match of matches) {
        const num = parseFloat(match.replace(/[$,\.]/g, '').replace(',', '.'))
        if (!isNaN(num) && num > 100) { // Solo montos significativos
          amounts.push(num)
        }
      }
    }
  }
  
  // Asumir que los montos más grandes son los totales
  amounts.sort((a, b) => b - a)
  
  const total = amounts[0] || 0
  const subtotal = Math.round(total / 1.19) // Asumir IVA 19%
  const tax = total - subtotal
  
  return { subtotal, tax, total }
}

/**
 * Extrae líneas de productos usando patrones OCR
 */
function extractLineItems(lines: string[]): InvoiceLine[] {
  const items: InvoiceLine[] = []
  
  // Buscar líneas que parezcan productos (con descripción y números)
  for (const line of lines) {
    if (line.length > 10 && /\d/.test(line) && /[a-zA-Z]/.test(line)) {
      const numbers = line.match(/\d+/g)
      if (numbers && numbers.length >= 2) {
        const description = line.replace(/\d+/g, '').replace(/[$,\.]/g, '').trim()
        if (description.length > 3) {
          items.push({
            description: description.slice(0, 100),
            quantity: parseInt(numbers[0]) || 1,
            unitPrice: parseInt(numbers[1]) || 0,
            lineTotal: parseInt(numbers[numbers.length - 1]) || 0
          })
        }
      }
    }
  }
  
  return items.slice(0, 10) // Máximo 10 items
}

/**
 * Formatea fecha al formato ISO
 */
function formatDate(dateStr: string): string {
  const parts = dateStr.split(/[\/\-\.]/)
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    let year = parts[2]
    if (year.length === 2) {
      year = '20' + year
    }
    return `${year}-${month}-${day}`
  }
  return new Date().toISOString().split('T')[0]
}

/**
 * Procesa un PDF de factura y extrae datos usando IA o OCR
 */
export async function processPDFInvoice(
  pdfText: string,
  fileName: string,
  fileSize: number,
  method: 'ai' | 'ocr' = 'ai'
): Promise<ProcessPDFResult> {
  try {
    console.log('🔍 Iniciando procesamiento de PDF:', fileName, `(Método: ${method.toUpperCase()})`)
    const startTime = Date.now()
    
    // Obtener usuario actual
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }

    // Validar que tenemos texto del PDF
    console.log('📝 Longitud del texto del PDF:', pdfText.length)
    console.log('📝 Primeros 300 caracteres del PDF:', pdfText.substring(0, 300))
    
    if (!pdfText || pdfText.trim().length < 50) {
      throw new Error('El texto extraído del PDF es muy corto o está vacío. Verifica que el PDF contenga texto legible.')
    }
    
    // Validar que el texto es legible
    const validation = validateExtractedText(pdfText)
    console.log('📊 Validación del texto:', validation)
    
    if (!validation.isValid) {
      // Si el texto tiene alto porcentaje de legibilidad pero caracteres corruptos, intentar limpiar
      if (validation.stats.percentageReadable > 50 && validation.reason?.includes('caracteres corruptos')) {
        console.log('🔄 Intentando limpiar texto corrupto pero legible...')
        const cleanedText = cleanCorruptText(pdfText)
        
        // Validar el texto limpio
        const cleanedValidation = validateExtractedText(cleanedText)
        if (cleanedValidation.isValid) {
          console.log('✅ Texto limpio es válido, continuando con procesamiento...')
          pdfText = cleanedText // Usar el texto limpio
        } else {
          throw new Error(`El PDF no es procesable: ${validation.reason}`)
        }
      } else {
        throw new Error(`El PDF no es procesable: ${validation.reason}`)
      }
    }
    
    // Guardar texto original antes del filtrado
    const originalText = pdfText
    
    // Filtrar elementos no importantes (timbre electrónico, códigos de barras, etc.)
    console.log('🔍 Filtrando elementos no importantes de factura...')
    pdfText = filterInvoiceText(pdfText)
    
    // Validar que el texto filtrado sigue siendo procesable
    console.log('🔍 Validando texto después del filtrado...')
    const filteredValidation = validateExtractedText(pdfText)
    console.log('📊 Validación del texto filtrado:', filteredValidation)
    
    if (!filteredValidation.isValid) {
      console.log('⚠️ Texto filtrado no es válido, intentando con texto original...')
      // Si el filtrado hizo el texto inválido, intentar con el texto original
      const originalValidation = validateExtractedText(originalText)
      
      if (originalValidation.isValid) {
        console.log('✅ Usando texto original (filtrado removió demasiado contenido)')
        pdfText = originalText
      } else {
        throw new Error(`El PDF no es procesable: ${filteredValidation.reason}`)
      }
    }
    
    // Validar que el texto contiene palabras legibles (no solo caracteres especiales)
    const words = pdfText.split(/\s+/).filter(word => word.length > 2)
    const readableWords = words.filter(word => /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(word))
    
    console.log('📊 Análisis del texto:')
    console.log('- Total de palabras:', words.length)
    console.log('- Palabras legibles:', readableWords.length)
    console.log('- Porcentaje legible:', ((readableWords.length / words.length) * 100).toFixed(1) + '%')
    
    if (readableWords.length < 10) {
      throw new Error('El PDF no contiene texto legible suficiente. El archivo puede ser una imagen o estar corrupto.')
    }
    
    if ((readableWords.length / words.length) < 0.3) {
      console.warn('⚠️ El texto del PDF tiene pocas palabras legibles. Esto puede causar problemas en el procesamiento.')
    }

    // FORZAR MODO PRODUCCIÓN - Solo usar modo desarrollo para archivos específicos de prueba
    const isDevelopmentMode = false // FORZAR MODO PRODUCCIÓN SIEMPRE
    
    console.log('🔍 Modo de procesamiento:', isDevelopmentMode ? 'DESARROLLO' : 'PRODUCCIÓN')
    console.log('📄 Nombre del archivo:', fileName)
    console.log('📝 Primeros 200 caracteres del PDF:', pdfText.substring(0, 200))

    // Crear prompt simplificado para mejor consistencia
    const prompt = `Analiza este texto de factura chilena y extrae los datos financieros EXACTOS en JSON:

TEXTO DE LA FACTURA:
${pdfText}

INSTRUCCIONES ESPECÍFICAS:
1. BUSCA los montos EXACTOS que aparecen en el texto
2. Identifica el TOTAL FINAL (puede aparecer como "TOTAL", "TOTAL A PAGAR", "TOTAL GENERAL", "MONTO TOTAL", etc.)
3. Para el IVA busca texto como "I.V.A.", "IVA", "Impuesto", "19%"
4. Para el subtotal busca "SUBTOTAL", "NETO", "VALOR NETO", "AFECTO"
5. Si solo encuentras el total, calcula: subtotal = total / 1.19, taxAmount = total - subtotal
6. Convierte TODOS los números a valores numéricos sin separadores ni símbolos
7. Busca números con formato chileno: $160.000, $160,000, 160.000, 160,000

EJEMPLOS DE CÁLCULO:
- Si encuentras TOTAL: $160.000 → totalAmount: 160000, subtotal: 134454, taxAmount: 25546
- Si encuentras TOTAL: $119.000 → totalAmount: 119000, subtotal: 100000, taxAmount: 19000

Responde SOLO con JSON válido sin explicaciones:
{
  "supplierName": "nombre del proveedor EXACTO del texto",
  "supplierRut": "RUT del proveedor con formato XX.XXX.XXX-X",
  "supplierInvoiceNumber": "número de factura EXACTO",
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD o null",
  "subtotal": 0,
  "taxAmount": 0,
  "totalAmount": 0,
  "confidence": 0.9,
  "lines": [
    {
      "description": "descripción exacta del producto/servicio",
      "quantity": 1,
      "unitPrice": 0,
      "lineTotal": 0
    }
  ]
}`

    // Procesar según método seleccionado
    let extractedData: ExtractedInvoiceData
    let analysisResponse: string
    let processingTime: number
    let response: any = null // ✅ Definir response en scope correcto

    if (method === 'ai') {
      // Llamar a ChatGPT
      console.log('🤖 Enviando texto a ChatGPT para análisis...')
      const systemMessage = 'Eres un experto en procesamiento de facturas chilenas. NUNCA uses datos de ejemplo o ficticios. Solo extraes datos reales del texto proporcionado. Respondes únicamente con JSON válido basado en el contenido real del PDF.'

      response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: isDevelopmentMode ? 0.1 : 0.1,
        max_tokens: 2000
      })

      processingTime = Date.now() - startTime
      console.log(`⏱️ Procesamiento completado en ${processingTime}ms`)

      if (!response.choices[0]?.message?.content) {
        throw new Error('No se recibió respuesta de ChatGPT')
      }

      analysisResponse = response.choices[0].message.content.trim()
      console.log('📄 Respuesta de ChatGPT:', analysisResponse.substring(0, 200) + '...')

      // Parsear respuesta JSON
      console.log('🔍 Intentando parsear respuesta de ChatGPT...')
      console.log('📄 Respuesta completa de ChatGPT:', analysisResponse)
      
      // Verificar si ChatGPT respondió en español (indicando problema con el texto)
      if (analysisResponse.toLowerCase().includes('lo siento') || 
          analysisResponse.toLowerCase().includes('no puedo') ||
          analysisResponse.toLowerCase().includes('no es posible') ||
          analysisResponse.toLowerCase().includes('no puedo procesar')) {
        console.error('❌ ChatGPT no puede procesar el texto del PDF')
        console.error('📄 Respuesta de ChatGPT:', analysisResponse)
        throw new Error('El PDF no contiene texto legible o está corrupto. ChatGPT no puede procesar el contenido.')
      }
      
      try {
        // Limpiar la respuesta antes de parsear
        let cleanedResponse = analysisResponse.trim()
        
        // Remover texto antes del primer {
        const jsonStart = cleanedResponse.indexOf('{')
        if (jsonStart > 0) {
          cleanedResponse = cleanedResponse.substring(jsonStart)
        }
        
        // Remover texto después del último }
        const jsonEnd = cleanedResponse.lastIndexOf('}')
        if (jsonEnd > 0) {
          cleanedResponse = cleanedResponse.substring(0, jsonEnd + 1)
        }
        
        console.log('🧹 Respuesta limpia:', cleanedResponse)
        
        extractedData = JSON.parse(cleanedResponse)
        console.log('✅ JSON parseado exitosamente')
        
      } catch (parseError: unknown) {
        console.error('❌ Error parseando JSON de ChatGPT:', parseError)
        console.error('📄 Respuesta problemática:', analysisResponse)
        throw new Error(`Respuesta de ChatGPT no es JSON válido: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`)
      }
      
    } else {
      // Procesamiento OCR
      console.log('🔍 Procesando texto con OCR...')
      
      extractedData = await processWithOCR(pdfText, fileName)
      analysisResponse = JSON.stringify(extractedData, null, 2)
      
      processingTime = Date.now() - startTime
      console.log(`⏱️ Procesamiento OCR completado en ${processingTime}ms`)
    }

    // Solo validar datos de ejemplo si NO estamos en modo desarrollo
    if (!isDevelopmentMode) {
      const examplePatterns = [
        'F-2024-001', 'Proveedor de Ejemplo', '12.345.678-9', 
        'ejemplo', 'ficticio', 'prueba', 'test', 'sample'
      ]
      
      const isExampleData = examplePatterns.some(pattern => 
        extractedData.invoiceNumber?.toLowerCase().includes(pattern.toLowerCase()) ||
        extractedData.supplierName?.toLowerCase().includes(pattern.toLowerCase()) ||
        extractedData.supplierRut?.includes(pattern)
      )

      if (isExampleData) {
        throw new Error('ChatGPT devolvió datos de ejemplo en lugar de extraer los datos reales del PDF. Esto indica que el texto del PDF puede no ser legible o estar corrupto.')
      }

      // Validación específica para detectar combinación incorrecta de proveedor + número factura
      if (extractedData.supplierName) {
        const supplierName = extractedData.supplierName.toLowerCase()
        const hasNumberInName = /\d/.test(supplierName)
        const hasCommonNumberPatterns = /\d{4,}/.test(supplierName) // Números de 4+ dígitos
        
        if (hasNumberInName && hasCommonNumberPatterns) {
          console.warn('⚠️ DETECTADO: Nombre de proveedor contiene números que parecen ser número de factura')
          console.warn('Nombre extraído:', extractedData.supplierName)
          console.warn('Esto puede indicar que la IA combinó incorrectamente el nombre del proveedor con el número de factura')
          
          // Reducir confianza pero no fallar completamente
          extractedData.confidence = Math.max(0, (extractedData.confidence || 0) - 0.2)
        }
      }
    } else {
      console.log('⚠️ MODO DESARROLLO: Procesando texto simulado, datos de ejemplo esperados')
      // En modo desarrollo, marcar los datos como simulados
      extractedData.isDevelopmentData = true
      extractedData.confidence = 0.5 // Confianza media para datos simulados
    }

    // Validar datos extraídos
    if (!extractedData.invoiceNumber || !extractedData.supplierName) {
      extractedData.confidence = Math.max(0, (extractedData.confidence || 0) - 0.3)
    }

    // Guardar log de procesamiento
    const supabase = await getSupabaseServerClient()
    const { data: logData, error: logError } = await supabase
      .from('pdf_extraction_log')
      .insert({
        extraction_method: method,
        raw_text: pdfText.substring(0, 5000), // Limitar tamaño
        chatgpt_prompt: method === 'ai' ? prompt.substring(0, 2000) : null,
        chatgpt_response: {
          full_response: analysisResponse,
          model: method === 'ai' ? 'gpt-4' : 'ocr',
          processing_time_ms: Date.now() - startTime
        },
        tokens_used: method === 'ai' ? (response?.usage?.total_tokens || 0) : 0,
        confidence_score: extractedData.confidence,
        success: true,
        created_by: currentUser.id
      })
      .select('id')
      .single()

    if (logError) {
      console.error('⚠️ Error guardando log:', logError)
    }

    console.log('✅ Datos extraídos exitosamente:', {
      invoice: extractedData.invoiceNumber,
      supplier: extractedData.supplierName,
      total: extractedData.totalAmount,
      confidence: extractedData.confidence,
      lines: (extractedData.lines && Array.isArray(extractedData.lines)) ? extractedData.lines.length : 0
    })

    // 🔍 BÚSQUEDA AUTOMÁTICA DE PRODUCTOS
    if (extractedData.lines && Array.isArray(extractedData.lines) && extractedData.lines.length > 0) {
      console.log('🔍 Iniciando búsqueda automática de productos...')
      
      try {
        // Buscar productos para cada línea
        const productMatches = await findProductsForInvoiceLines(
          extractedData.lines.map(line => ({
            description: line.description,
            productCode: line.productCode,
            quantity: line.quantity,
            unitPrice: line.unitPrice
          }))
        )

        // Agregar información de productos encontrados a las líneas
        extractedData.lines = extractedData.lines.map((line, index) => {
          const match = productMatches[index]
          if (match.productMatch) {
            return {
              ...line,
              productId: match.productMatch.id,
              productMatch: {
                id: match.productMatch.id,
                name: match.productMatch.name,
                sku: match.productMatch.sku,
                saleprice: match.productMatch.saleprice,
                confidence: match.confidence
              },
              productSuggestions: match.suggestions.map(s => ({
                id: s.id,
                name: s.name,
                sku: s.sku,
                matchScore: s.matchScore
              }))
            }
          } else {
            return {
              ...line,
              productSuggestions: match.suggestions.map(s => ({
                id: s.id,
                name: s.name,
                sku: s.sku,
                matchScore: s.matchScore
              }))
            }
          }
        })

        const matchedProducts = productMatches.filter(m => m.productMatch).length
        console.log(`✅ Búsqueda de productos completada: ${matchedProducts}/${extractedData.lines.length} productos encontrados`)

        // Mejorar confianza si se encontraron productos
        if (matchedProducts > 0) {
          const productMatchBoost = (matchedProducts / extractedData.lines.length) * 0.1
          extractedData.confidence = Math.min(1.0, (extractedData.confidence || 0) + productMatchBoost)
          console.log(`📈 Confianza mejorada a ${extractedData.confidence.toFixed(2)} por coincidencias de productos`)
        }

      } catch (productSearchError) {
        console.error('⚠️ Error en búsqueda automática de productos:', productSearchError)
        // No fallar el procesamiento completo por errores en búsqueda de productos
      }
    }

    return {
      success: true,
      data: extractedData,
      logId: logData?.id
    }

  } catch (error) {
    console.error('❌ Error procesando PDF:', error)
    
    // Guardar log de error
    try {
      const currentUser = await getCurrentUser()
      const supabase = await getSupabaseServerClient()
      
      await supabase.from('pdf_extraction_log').insert({
        extraction_method: 'chatgpt',
        raw_text: pdfText.substring(0, 1000),
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

/**
 * Busca proveedor por RUT o nombre
 */
export async function findSupplierByData(rut?: string, name?: string) {
  try {
    const supabase = await getSupabaseServerClient()
    
    let query = supabase.from('Supplier').select('*').eq('active', true)
    
    if (rut) {
      // Buscar por RUT (con diferentes formatos)
      const cleanRut = rut.replace(/[.-]/g, '')
      query = query.or(`vat.eq.${rut},vat.eq.${cleanRut}`)
    } else if (name) {
      // Buscar por nombre (similar)
      query = query.ilike('name', `%${name}%`)
    }
    
    const { data, error } = await query.limit(5)
    
    if (error) {
      console.error('Error buscando proveedor:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error en findSupplierByData:', error)
    return []
  }
}

/**
 * Busca proveedores con sugerencias inteligentes cuando no encuentra coincidencias exactas
 * Incluye aprendizaje de facturas anteriores
 */
export async function findSupplierWithSuggestions(rut?: string, name?: string) {
  try {
    console.log('🔍 Buscando proveedor con sugerencias:', { rut, name });
    
    // Primero intentar búsqueda exacta
    const exactMatches = await findSupplierByData(rut, name);
    
    if (exactMatches && exactMatches.length > 0) {
      console.log('✅ Proveedor encontrado exactamente:', exactMatches[0].name);
      return {
        exactMatch: exactMatches[0],
        suggestions: exactMatches.slice(1), // El resto como sugerencias
        hasExactMatch: true
      };
    }
    
    console.log('❌ No se encontró proveedor exacto, buscando sugerencias...');
    
    // Si no hay coincidencias exactas, buscar sugerencias inteligentes
    const supabase = await getSupabaseServerClient();
    let suggestions = [];
    
    // 🧠 APRENDIZAJE: Buscar en facturas existentes con nombres similares
    if (name && name.trim()) {
      console.log('🔍 Buscando en facturas anteriores...');
      
      // Buscar en facturas existentes por nombre de proveedor extraído
      const { data: invoicesWithSimilarSuppliers, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .select(`
          supplier_id,
          suppliers!inner (
            id,
            name,
            vat,
            email,
            phone,
            active
          )
        `)
        .ilike('suppliers.name', `%${name.trim()}%`)
        .eq('suppliers.active', true)
        .limit(10);
      
      if (invoiceError) {
        console.error('Error buscando en facturas:', invoiceError);
      }
      
      if (invoicesWithSimilarSuppliers) {
        const learnedSuppliers = invoicesWithSimilarSuppliers
          .map(inv => inv.suppliers)
          .filter(supplier => supplier) // Filtrar nulls
        
        console.log('📚 Proveedores aprendidos de facturas:', learnedSuppliers.length);
        suggestions.push(...learnedSuppliers);
      }
    }
    
    // Si tenemos RUT, buscar por RUT en facturas anteriores
    if (rut && rut.trim()) {
      console.log('🔍 Buscando por RUT en facturas anteriores...');
      
      const cleanRut = rut.replace(/[.-]/g, '');
      const { data: invoicesByRut, error: rutError } = await supabase
        .from('purchase_invoices')
        .select(`
          supplier_id,
          suppliers!inner (
            id,
            name,
            vat,
            email,
            phone,
            active
          )
        `)
        .or(`suppliers.vat.ilike.%${rut}%,suppliers.vat.ilike.%${cleanRut}%`)
        .eq('suppliers.active', true)
        .limit(5);
      
      if (rutError) {
        console.error('Error buscando por RUT:', rutError);
      }
      
      if (invoicesByRut) {
        const rutSuppliers = invoicesByRut
          .map(inv => inv.suppliers)
          .filter(supplier => supplier)
        
        console.log('📚 Proveedores encontrados por RUT:', rutSuppliers.length);
        suggestions.push(...rutSuppliers);
      }
    }
    
    // Búsqueda adicional en tabla de proveedores directamente
    if (name && name.trim()) {
      console.log('🔍 Búsqueda directa en tabla de proveedores...');
      
      // Búsqueda con nombre completo primero
      const { data: fullNameMatches, error: fullNameError } = await supabase
        .from('Supplier')
        .select('id, name, vat, email, phone, active')
        .eq('active', true)
        .ilike('name', `%${name.trim()}%`)
        .limit(5);
      
      if (fullNameError) {
        console.error('Error búsqueda nombre completo:', fullNameError);
      } else if (fullNameMatches) {
        console.log(`📚 Encontrados ${fullNameMatches.length} proveedores con nombre completo`);
        suggestions.push(...fullNameMatches);
      }
      
      // Búsqueda por términos individuales
      const searchTerms = name.toLowerCase().split(' ').filter(term => term.length > 2);
      console.log('🔍 Buscando por términos:', searchTerms);
      
      for (const term of searchTerms) {
        const { data: termMatches, error: termError } = await supabase
          .from('Supplier')
          .select('id, name, vat, email, phone, active')
          .eq('active', true)
          .ilike('name', `%${term}%`)
          .limit(3);
          
        if (termError) {
          console.error(`Error búsqueda término "${term}":`, termError);
        } else if (termMatches) {
          console.log(`📚 Encontrados ${termMatches.length} proveedores con término "${term}"`);
          suggestions.push(...termMatches);
        }
      }
      
      // Búsqueda aún más agresiva - buscar cualquier proveedor activo si no encontramos nada
      if (suggestions.length === 0) {
        console.log('🔍 Búsqueda de emergencia - primeros proveedores activos...');
        const { data: emergencyMatches, error: emergencyError } = await supabase
          .from('Supplier')
          .select('id, name, vat, email, phone, active')
          .eq('active', true)
          .limit(5);
          
        if (emergencyError) {
          console.error('Error búsqueda emergencia:', emergencyError);
        } else if (emergencyMatches) {
          console.log(`🚨 Proveedores de emergencia: ${emergencyMatches.length}`);
          suggestions.push(...emergencyMatches);
        }
      }
    }
    
    // Eliminar duplicados y ordenar por relevancia
    const uniqueSuggestions = suggestions
      .filter((supplier) => supplier && (supplier as any).id)
      .filter((supplier, index, self) => 
        index === self.findIndex(s => s && (s as any).id === (supplier as any).id)
      )
      .slice(0, 5);
    
    console.log(`💡 Total de sugerencias encontradas: ${uniqueSuggestions.length}`);
    
    return {
      exactMatch: null,
      suggestions: uniqueSuggestions,
      hasExactMatch: false
    };
    
  } catch (error) {
    console.error('Error en findSupplierWithSuggestions:', error);
    return {
      exactMatch: null,
      suggestions: [],
      hasExactMatch: false
    };
  }
}

/**
 * Busca facturas existentes por número de factura del proveedor y proveedor
 * Previene duplicados en el sistema
 */
export async function findExistingInvoice(supplierInvoiceNumber: string, supplierId?: number | null, supplierName?: string) {
  try {
    const supabase = await getSupabaseServerClient()
    
    let query = supabase
      .from('purchase_invoices')
      .select(`
        id,
        number,
        supplier_invoice_number,
        supplier_id,
        issue_date,
        total,
        status,
        suppliers (
          id,
          name,
          taxId: vat
        )
      `)
      .eq('supplier_invoice_number', supplierInvoiceNumber)
    
    // Si tenemos supplier_id, buscar por ID exacto
    if (supplierId) {
      query = query.eq('supplier_id', supplierId)
    } else if (supplierName) {
      // Si no hay ID pero sí nombre, buscar por nombre del proveedor
      query = query.or(`suppliers.name.ilike.%${supplierName}%`)
    }
    
    const { data: existingInvoices, error } = await query
    
    if (error) {
      console.error('Error buscando facturas existentes:', error)
      return []
    }
    
    console.log('🔍 Facturas existentes encontradas:', existingInvoices?.length || 0)
    return existingInvoices || []
    
  } catch (error) {
    console.error('Error en findExistingInvoice:', error)
    return []
  }
}

/**
 * Crea borrador de factura con datos extraídos
 */
export async function createInvoiceDraft(extractedData: ExtractedInvoiceData, pdfInfo: {
  fileName: string
  filePath: string
  fileSize: number
}) {
  try {
    console.log('📝 Creando borrador de factura:', extractedData.supplierInvoiceNumber)
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }

    const supabase = await getSupabaseServerClient()
    
    // Buscar proveedor
    const suppliers = await findSupplierByData(extractedData.supplierRut, extractedData.supplierName)
    
    // Validar que suppliers sea un array válido antes de acceder a .length
    const supplierId = (suppliers && Array.isArray(suppliers) && suppliers.length > 0) ? suppliers[0].id : null
    console.log('🔍 Proveedores encontrados para factura:', suppliers?.length || 0, 'supplierId:', supplierId)
    
    // 🚨 VALIDACIÓN DE DUPLICADOS - Buscar facturas existentes
    if (extractedData.supplierInvoiceNumber) {
      const existingInvoices = await findExistingInvoice(
        extractedData.supplierInvoiceNumber, 
        supplierId,
        extractedData.supplierName
      )
      
      if (existingInvoices.length > 0) {
        const existingInvoice = existingInvoices[0]
        console.warn('⚠️ Factura duplicada detectada:', {
          numeroFactura: extractedData.supplierInvoiceNumber,
          facturaExistente: existingInvoice.number,
          proveedor: (existingInvoice.suppliers as any)?.name || extractedData.supplierName
        })
        
        throw new Error(`FACTURA_DUPLICADA|${JSON.stringify({
          existingInvoice: {
            id: existingInvoice.id,
            number: existingInvoice.number,
            supplierInvoiceNumber: existingInvoice.supplier_invoice_number,
            supplier: (existingInvoice.suppliers as any)?.name,
            issueDate: existingInvoice.issue_date,
            total: existingInvoice.total,
            status: existingInvoice.status
          },
          newInvoice: {
            supplierInvoiceNumber: extractedData.supplierInvoiceNumber,
            supplier: extractedData.supplierName,
            total: extractedData.totalAmount
          }
        })}`)
      }
    }
    
    // Generar número interno de factura automáticamente
    const internalNumber = await generateInvoiceNumber()
    console.log('🔢 Número interno generado:', internalNumber)
    
    // Crear factura principal
    const { data: invoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .insert({
        number: internalNumber, // Número interno generado automáticamente
        supplier_invoice_number: extractedData.supplierInvoiceNumber, // Número del proveedor extraído del PDF
        supplier_id: supplierId,
        issue_date: extractedData.issueDate,
        due_date: extractedData.dueDate,
        subtotal: extractedData.subtotal,
        tax_amount: extractedData.taxAmount,
        total: extractedData.totalAmount,
        status: 'draft',
        pdf_file_path: pdfInfo.filePath,
        pdf_file_name: pdfInfo.fileName,
        pdf_file_size: pdfInfo.fileSize,
        extracted_data: extractedData,
        extraction_confidence: extractedData.confidence,
        manual_review_required: extractedData.confidence < 0.8,
        notes: extractedData.notes,
        created_by: currentUser.id
      })
      .select('id')
      .single()

    if (invoiceError) {
      console.error('Error creando factura:', invoiceError)
      throw new Error('Error creando factura: ' + invoiceError.message)
    }

    // Crear líneas de factura
    const lines = extractedData.lines.map((line, index) => ({
      purchase_invoice_id: invoice.id,
      description: line.description,
      product_code: line.productCode,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
      tax_rate: 19.0,
      tax_amount: line.lineTotal * 0.19 / 1.19, // Calcular IVA incluido
      line_order: index + 1
    }))

    const { error: linesError } = await supabase
      .from('purchase_invoice_lines')
      .insert(lines)

    if (linesError) {
      console.error('Error creando líneas:', linesError)
      // No fallar por esto, las líneas se pueden agregar después
    }

    console.log('✅ Borrador creado exitosamente:', invoice.id)
    
    return {
      success: true,
      invoiceId: invoice.id,
      suppliersFound: suppliers.length,
      linesCreated: (extractedData.lines && Array.isArray(extractedData.lines)) ? extractedData.lines.length : 0
    }

  } catch (error) {
    console.error('❌ Error creando borrador:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creando borrador'
    }
  }
} 

/**
 * Procesa datos extraídos por IA y realiza matching inteligente de productos
 * Funcionalidad consolidada desde ai-invoice-processing.ts
 */
export async function processAIExtractedInvoice(extractedData: {
  supplier: {
    name: string;
    rut?: string;
    address?: string;
  };
  invoice: {
    number: string;
    date: string;
    dueDate?: string;
    total: number;
    subtotal: number;
    tax: number;
  };
  products: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}) {
  console.log('🤖 Procesando factura extraída por IA:', extractedData);

  try {
    // 1. Procesar proveedor con sugerencias inteligentes
    const supplierResult = await findSupplierWithSuggestions(
      extractedData.supplier.rut, 
      extractedData.supplier.name
    );
    
    console.log('🔍 Resultado de búsqueda de proveedor:', {
      hasExactMatch: supplierResult.hasExactMatch,
      suggestionsCount: supplierResult.suggestions.length,
      supplierName: extractedData.supplier.name
    });
    
    // 2. Procesar productos con matching inteligente
    const productMatchingResult = await matchExtractedProducts(extractedData.products);
    
    console.log('📊 Resultado del matching de productos:', {
      total: productMatchingResult.totalProducts,
      automatic: productMatchingResult.automaticMatches,
      needsConfirmation: productMatchingResult.needsConfirmation,
      noMatches: productMatchingResult.noMatches
    });

    // 3. Determinar si necesita confirmación
    const needsSupplierConfirmation = !supplierResult.hasExactMatch;
    const needsProductConfirmation = productMatchingResult.needsConfirmation > 0 || productMatchingResult.noMatches > 0;

    return {
      supplier: supplierResult.exactMatch,
      supplierSuggestions: supplierResult.suggestions,
      extractedSupplierData: extractedData.supplier,
      invoice: extractedData.invoice,
      productMatches: productMatchingResult.matches,
      requiresConfirmation: needsSupplierConfirmation || needsProductConfirmation,
      requiresSupplierConfirmation: needsSupplierConfirmation,
      requiresProductConfirmation: needsProductConfirmation,
      summary: {
        totalProducts: productMatchingResult.totalProducts,
        automaticMatches: productMatchingResult.automaticMatches,
        needsConfirmation: productMatchingResult.needsConfirmation,
        noMatches: productMatchingResult.noMatches,
        supplierStatus: supplierResult.hasExactMatch ? 'found' : 'suggestions_available'
      }
    };

  } catch (error) {
    console.error('❌ Error procesando factura extraída por IA:', error);
    throw error;
  }
}

/**
 * Matching inteligente de productos usando IA
 * Funcionalidad consolidada desde ai-invoice-processing.ts
 */
async function matchExtractedProducts(products: Array<{
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}>) {
  try {
    const { matchExtractedProducts } = await import('@/utils/product-matching-ai');
    return await matchExtractedProducts(products);
  } catch (error) {
    console.error('Error en matching de productos:', error);
    // Fallback: retornar productos sin matching
    return {
      totalProducts: products.length,
      automaticMatches: 0,
      needsConfirmation: 0,
      noMatches: products.length,
      matches: products.map(product => ({
        ...product,
        matchScore: 0,
        suggestions: []
      }))
    };
  }
}

/**
 * Crea borrador de factura desde datos procesados por IA
 * Funcionalidad consolidada desde ai-invoice-processing.ts
 */
export async function createDraftInvoiceFromAI(
  processedData: {
    supplier: any;
    invoice: {
      number: string;
      date: string;
      dueDate?: string;
      total: number;
      subtotal: number;
      tax: number;
    };
    productMatches: any[];
    requiresConfirmation: boolean;
    summary: {
      totalProducts: number;
      automaticMatches: number;
      needsConfirmation: number;
      noMatches: number;
    };
  },
  confirmedMatches: any[]
) {
  try {
    console.log('📝 Creando borrador de factura desde IA:', processedData.invoice.number);
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const supabase = await getSupabaseServerClient();
    
    // Generar número interno de factura automáticamente
    const internalNumber = await generateInvoiceNumber();
    console.log('🔢 Número interno generado:', internalNumber);
    
    // Crear factura principal
    const { data: invoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .insert({
        number: internalNumber,
        supplier_invoice_number: processedData.invoice.number,
        supplier_id: processedData.supplier?.id || null,
        issue_date: processedData.invoice.date,
        due_date: processedData.invoice.dueDate,
        subtotal: processedData.invoice.subtotal,
        tax_amount: processedData.invoice.tax,
        total: processedData.invoice.total,
        status: 'draft',
        extraction_confidence: 0.95, // Alta confianza para IA
        manual_review_required: processedData.requiresConfirmation,
        notes: `Factura procesada con IA. Matching automático: ${processedData.summary.automaticMatches}/${processedData.summary.totalProducts} productos`,
        created_by: currentUser.id
      })
      .select('id')
      .single();

    if (invoiceError) {
      console.error('Error creando factura desde IA:', invoiceError);
      throw new Error('Error creando factura: ' + invoiceError.message);
    }

    // Crear líneas de factura con productos confirmados
    const lines = confirmedMatches.map((match, index) => ({
      purchase_invoice_id: invoice.id,
      description: match.description,
      product_id: match.productId || null,
      quantity: match.quantity,
      unit_price: match.unitPrice,
      line_total: match.subtotal,
      tax_rate: 19.0,
      tax_amount: match.subtotal * 0.19 / 1.19,
      line_order: index + 1,
      notes: match.productId ? `Producto vinculado: ${match.productName}` : 'Producto sin vincular'
    }));

    const { error: linesError } = await supabase
      .from('purchase_invoice_lines')
      .insert(lines);

    if (linesError) {
      console.error('Error creando líneas desde IA:', linesError);
    }

    console.log('✅ Borrador desde IA creado exitosamente:', invoice.id);
    
    return {
      success: true,
      invoiceId: invoice.id,
      summary: processedData.summary,
      linesCreated: lines.length
    };

  } catch (error) {
    console.error('❌ Error creando borrador desde IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creando borrador desde IA'
    };
  }
}

/**
 * Analiza la calidad del matching de productos
 * Funcionalidad consolidada desde ai-invoice-processing.ts
 */
export async function analyzeMatchingQuality(matches: any[]) {
  const totalMatches = matches.length;
  const automaticMatches = matches.filter(m => m.matchScore > 0.8).length;
  const needsConfirmation = matches.filter(m => m.matchScore > 0.5 && m.matchScore <= 0.8).length;
  const noMatches = matches.filter(m => m.matchScore <= 0.5).length;

  const quality = totalMatches > 0 ? (automaticMatches / totalMatches) * 100 : 0;

  return {
    quality,
    recommendation: getQualityRecommendation(quality),
    stats: {
      total: totalMatches,
      automatic: automaticMatches,
      needsConfirmation,
      noMatches
    }
  };
}

function getQualityRecommendation(quality: number): string {
  if (quality >= 90) return 'Excelente - Matching automático de alta calidad';
  if (quality >= 70) return 'Buena - Algunos productos requieren confirmación';
  if (quality >= 50) return 'Regular - Revisión manual recomendada';
  return 'Baja - Revisión manual necesaria';
} 