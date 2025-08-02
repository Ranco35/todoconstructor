/**
 * PDF Text Extractor - Solo para uso en navegador (client-side)
 */

/**
 * Extrae texto de un archivo PDF usando PDF.js (solo navegador)
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // Verificar que estamos en el navegador
  if (typeof window === 'undefined') {
    throw new Error('PDF.js solo puede ejecutarse en el navegador')
  }

  try {
    console.log('📄 Iniciando extracción de texto de PDF:', file.name)
    
    // Import dinámico de PDF.js solo en el navegador
    const pdfjsLib = await import('pdfjs-dist')
    
    // Configurar worker solo si no está ya configurado
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
    }
    
    // Usar PDF.js para extracción robusta
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer
          
          if (!arrayBuffer) {
            throw new Error('No se pudo leer el archivo PDF')
          }
          
          // Usar PDF.js para extraer texto correctamente
          const text = await extractTextWithPDFJS(arrayBuffer, pdfjsLib)
          
          if (!text || text.trim().length === 0) {
            throw new Error('No se pudo extraer texto del PDF - el archivo puede ser una imagen escaneada')
          }
          
          console.log(`✅ Texto extraído: ${text.length} caracteres`)
          resolve(text)
          
        } catch (error) {
          console.error('❌ Error extrayendo texto:', error)
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Error leyendo el archivo PDF'))
      }
      
      reader.readAsArrayBuffer(file)
    })
    
  } catch (error) {
    console.error('❌ Error en extractTextFromPDF:', error)
    throw error
  }
}

/**
 * Extrae texto usando PDF.js de manera robusta
 */
async function extractTextWithPDFJS(arrayBuffer: ArrayBuffer, pdfjsLib: any): Promise<string> {
  try {
    console.log('🔧 Iniciando extracción con PDF.js...')
    
    // Cargar el documento PDF
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      // Opciones para mejor extracción de texto
      useSystemFonts: true,
      disableFontFace: false,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
      // Configuraciones adicionales para robustez
      verbosity: 0, // Minimizar logs de PDF.js
      maxImageSize: 1024 * 1024, // Límite de imagen para performance
      isEvalSupported: false, // Seguridad adicional
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
    })
    
    const pdf = await loadingTask.promise
    console.log(`📄 PDF cargado exitosamente: ${pdf.numPages} páginas`)
    
    let fullText = ''
    
    // Extraer texto de cada página
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent({
          // Opciones de extracción de texto
          normalizeWhitespace: true,
          disableCombineTextItems: false
        })
        
        // Extraer elementos de texto y reconstruir con espaciado apropiado
        let pageText = ''
        let lastY = -1
        
        for (const item of textContent.items) {
          const textItem = item as any
          
          if (textItem.str && textItem.str.trim()) {
            // Detectar salto de línea basado en coordenadas Y
            if (lastY !== -1 && Math.abs(textItem.transform[5] - lastY) > 5) {
              pageText += '\n'
            }
            
            pageText += textItem.str + ' '
            lastY = textItem.transform[5]
          }
        }
        
        // Limpiar y normalizar el texto de la página
        pageText = pageText
          .replace(/\s+/g, ' ')
          .replace(/\n\s+/g, '\n')
          .trim()
        
        if (pageText) {
          fullText += pageText + '\n\n'
          console.log(`📄 Página ${pageNum}: ${pageText.length} caracteres extraídos`)
        }
        
      } catch (pageError) {
        console.warn(`⚠️ Error extrayendo página ${pageNum}:`, pageError)
        // Continuar con las siguientes páginas
      }
    }
    
    // Limpiar el texto completo
    const cleanedText = fullText
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalizar líneas vacías múltiples
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/\n /g, '\n') // Remover espacios al inicio de líneas
      .trim()
    
    console.log(`✅ Extracción PDF.js completada: ${cleanedText.length} caracteres totales`)
    
    // Validar que el texto extraído es legible
    const validation = validateExtractedText(cleanedText)
    if (!validation.isValid) {
      throw new Error(`Texto extraído no es válido: ${validation.reason}`)
    }
    
    return cleanedText
    
  } catch (error) {
    console.error('❌ Error con PDF.js:', error)
    throw new Error(`Error extrayendo texto del PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Intenta extraer texto usando múltiples métodos (con PDF.js como prioridad)
 */
export async function extractTextWithFallback(file: File): Promise<string> {
  // Verificar que estamos en el navegador
  if (typeof window === 'undefined') {
    throw new Error('La extracción de PDF solo está disponible en el navegador')
  }

  console.log('🔄 Iniciando extracción de texto con fallback...')
  
  try {
    // Método principal: PDF.js
    console.log('📄 Método 1: PDF.js (método principal)')
    const pdfText = await extractTextFromPDF(file)
    
    // Validar texto extraído
    const validation = validateExtractedText(pdfText)
    if (validation.isValid) {
      console.log('✅ Extracción PDF.js exitosa')
      return pdfText
    }
    
    console.log('⚠️ PDF.js extrajo texto pero no es válido:', validation.reason)
    throw new Error(`Texto extraído por PDF.js no es válido: ${validation.reason}`)
    
  } catch (error) {
    console.error('❌ PDF.js falló:', error)
    
    // No usar fallback básico que causa el problema original
    // En su lugar, dar un error claro
    throw new Error('No se pudo extraer texto legible del PDF. Posibles causas:\n' +
                   '• El PDF está escaneado como imagen (requiere OCR)\n' +
                   '• El PDF está corrupto o protegido\n' +
                   '• El archivo no es un PDF válido\n\n' +
                   'Intenta con un PDF que contenga texto seleccionable.')
  }
}

/**
 * Valida si el texto extraído del PDF es legible
 */
export function validateExtractedText(text: string): { isValid: boolean; reason?: string; stats: any } {
  console.log('🔍 Validando texto extraído del PDF...')
  
  if (!text || text.trim().length < 50) {
    return {
      isValid: false,
      reason: 'Texto muy corto o vacío (menos de 50 caracteres)',
      stats: { length: text?.length || 0 }
    }
  }
  
  // Verificar que no sea metadata de PDF
  const pdfMetadataPatterns = [
    /%PDF-\d\.\d/,
    /obj<</,
    /endobj/,
    /\/Producer\(/,
    /\/CreationDate\(/,
    /\/Title</
  ]
  
  let metadataCount = 0
  for (const pattern of pdfMetadataPatterns) {
    if (pattern.test(text)) {
      metadataCount++
    }
  }
  
  // Si contiene múltiples patrones de metadata, es probable que sea estructura PDF
  if (metadataCount >= 2) {
    return {
      isValid: false,
      reason: 'El texto contiene metadata de PDF en lugar del contenido real',
      stats: { metadataPatterns: metadataCount, length: text.length }
    }
  }
  
  // Dividir en palabras y filtrar
  const words = text.split(/\s+/).filter(word => word.length > 2)
  const readableWords = words.filter(word => /[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]/.test(word))
  const percentageReadable = words.length > 0 ? (readableWords.length / words.length) * 100 : 0
  
  console.log('📊 Estadísticas del texto:')
  console.log('- Total de palabras:', words.length)
  console.log('- Palabras legibles:', readableWords.length)
  console.log('- Porcentaje legible:', percentageReadable.toFixed(1) + '%')
  
  const stats = {
    totalWords: words.length,
    readableWords: readableWords.length,
    percentageReadable,
    length: text.length
  }
  
  // Criterios de validación más estrictos
  if (readableWords.length < 10) {
    return {
      isValid: false,
      reason: 'Muy pocas palabras legibles (menos de 10). El PDF puede ser una imagen escaneada.',
      stats
    }
  }
  
  if (percentageReadable < 60) {
    return {
      isValid: false,
      reason: `Bajo porcentaje de palabras legibles (${percentageReadable.toFixed(1)}%). El PDF puede estar corrupto.`,
      stats
    }
  }
  
  // Verificar presencia de información típica de facturas
  const invoiceKeywords = [
    /factura|invoice/i,
    /total|subtotal/i,
    /fecha|date/i,
    /\d{1,3}([.,]\d{3})*([.,]\d{2})?/, // Números con formato de dinero
    /\d+\/\d+\/\d+/, // Fechas
  ]
  
  let invoiceIndicators = 0
  for (const pattern of invoiceKeywords) {
    if (pattern.test(text)) {
      invoiceIndicators++
    }
  }
  
  if (invoiceIndicators < 2) {
    return {
      isValid: false,
      reason: 'El texto no parece contener información típica de una factura.',
      stats: { ...stats, invoiceIndicators }
    }
  }
  
  return {
    isValid: true,
    stats: { ...stats, invoiceIndicators }
  }
}

/**
 * Extrae solo las partes relevantes de una factura PDF
 */
export function extractRelevantInvoiceText(fullText: string): string {
  console.log('🔍 Extrayendo partes relevantes de la factura...')
  
  // Palabras clave que indican secciones relevantes de una factura
  const relevantKeywords = [
    'factura', 'invoice', 'proveedor', 'supplier', 'cliente', 'customer',
    'fecha', 'date', 'total', 'subtotal', 'iva', 'tax', 'neto',
    'cantidad', 'quantity', 'precio', 'price', 'descripción', 'description',
    'producto', 'product', 'servicio', 'service', 'item', 'artículo',
    'rut', 'número', 'number', 'emisión', 'vencimiento'
  ]
  
  // Dividir el texto en líneas
  const lines = fullText.split('\n')
  const relevantLines: string[] = []
  
  // Límite máximo de líneas para evitar texto muy largo
  const maxLines = 150
  
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    const line = lines[i].trim()
    const lowerLine = line.toLowerCase()
    
    // Verificar si la línea contiene palabras clave relevantes
    const hasRelevantKeyword = relevantKeywords.some(keyword => 
      lowerLine.includes(keyword)
    )
    
    // También incluir líneas con números (precios, cantidades, fechas)
    const hasNumbers = /\d/.test(line)
    
    // Incluir líneas con texto sustancial (más de 10 caracteres)
    const hasSubstantialText = line.length > 10
    
    // Incluir líneas que parecen ser encabezados o títulos
    const isHeader = line.length > 5 && line.length < 80 && !/^\s*$/.test(line)
    
    if ((hasRelevantKeyword || hasNumbers || isHeader) && hasSubstantialText) {
      relevantLines.push(line)
    }
    
    // Si ya tenemos suficientes líneas relevantes, parar
    if (relevantLines.length >= 80) {
      break
    }
  }
  
  // Unir líneas relevantes
  const relevantText = relevantLines.join('\n')
  
  console.log(`✅ Extraídas ${relevantLines.length} líneas relevantes de ${Math.min(lines.length, maxLines)} revisadas`)
  console.log(`📝 Texto relevante: ${relevantText.length} caracteres (original: ${fullText.length})`)
  
  return relevantText
}

/**
 * Extrae solo las primeras líneas críticas de una factura
 */
export function extractCriticalInvoiceText(fullText: string): string {
  console.log('🔍 Extrayendo líneas críticas de la factura...')
  
  // Dividir el texto en líneas
  const lines = fullText.split('\n')
  const criticalLines: string[] = []
  
  // Buscar información crítica en las primeras 50 líneas
  const maxLinesToCheck = 50
  const maxCriticalLines = 20
  
  for (let i = 0; i < Math.min(lines.length, maxLinesToCheck); i++) {
    const line = lines[i].trim()
    
    // Solo incluir líneas con contenido sustancial
    if (line.length > 5 && !line.startsWith('%') && !/^[\/\\<>]+$/.test(line)) {
      criticalLines.push(line)
      
      // Parar cuando tengamos suficientes líneas críticas
      if (criticalLines.length >= maxCriticalLines) {
        break
      }
    }
  }
  
  const criticalText = criticalLines.join('\n')
  
  console.log(`✅ Extraídas ${criticalLines.length} líneas críticas`)
  console.log(`📝 Texto crítico: ${criticalText.length} caracteres`)
  
  return criticalText
}

/**
 * Filtra elementos no importantes de facturas electrónicas (conservador)
 */
export function filterInvoiceText(text: string): string {
  console.log('🔍 Filtrando elementos no importantes de factura...')
  console.log(`📄 Texto original: ${text.length} caracteres`)
  
  // Patrones a excluir (muy conservador para no remover información importante)
  const excludePatterns = [
    /Timbre Electrónico SII[^\n]*/gi,
    /Verifique documento: www\.sii\.cl[^\n]*/gi,
    /www\.sii\.cl[^\n]*/gi,
    /Código de Autorización[^\n]*/gi,
    /[█▄▀■□▪▫]{10,}/g, // Solo caracteres de código de barras muy largos
  ]
  
  let filteredText = text
  for (const pattern of excludePatterns) {
    filteredText = filteredText.replace(pattern, ' ')
  }
  
  // Normalizar espacios pero mantener estructura
  filteredText = filteredText
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim()
  
  console.log(`✅ Texto filtrado: ${filteredText.length} caracteres`)
  
  // Validar que el filtrado no removió demasiado texto
  const originalWords = text.split(/\s+/).length
  const filteredWords = filteredText.split(/\s+/).length
  const wordRetention = (filteredWords / originalWords) * 100
  
  console.log(`📊 Retención de palabras: ${wordRetention.toFixed(1)}%`)
  
  // Si se removió más del 30% del texto, usar el original
  if (wordRetention < 70) {
    console.log('⚠️ Se removió demasiado texto, usando texto original')
    return text
  }
  
  return filteredText
}

// Función auxiliar para limpiar texto corrupto (mantenida por compatibilidad)
export function cleanCorruptText(text: string): string {
  return filterInvoiceText(text)
} 