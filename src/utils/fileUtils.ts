/**
 * Formatea el tamaño de archivo en una representación legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Valida si un archivo es una imagen válida
 */
export function isValidImageType(filename: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return validExtensions.includes(extension)
}

/**
 * Genera un nombre de archivo único para evitar conflictos
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))
  return `${nameWithoutExt}_${timestamp}${extension}`
} 