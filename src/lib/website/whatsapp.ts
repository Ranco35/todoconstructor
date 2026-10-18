// Número de WhatsApp de la ferretería (formato internacional, sin "+").
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '56969095111'

// Arma el link wa.me codificando el mensaje; usar "\n" para saltos de línea.
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
