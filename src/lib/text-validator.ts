/**
 * Utilidades de validación y limpieza de texto independientes de PDF.js
 * Para uso tanto en servidor como cliente
 */

/**
 * Valida si el texto extraído es legible (versión independiente de PDF.js)
 */
export function validateExtractedText(text: string): { isValid: boolean; reason?: string; stats: any } {
  console.log('🔍 Validando texto extraído...')
  
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

/**
 * Limpia texto corrupto (alias para compatibilidad)
 */
export function cleanCorruptText(text: string): string {
  return filterInvoiceText(text)
} 