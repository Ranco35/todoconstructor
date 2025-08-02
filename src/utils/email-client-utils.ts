// Funciones utilitarias para análisis de clientes en correos

// Función para extraer emails de un texto de análisis
export function extractEmailsFromAnalysis(analysisText: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = analysisText.match(emailRegex) || [];
  
  // Filtrar emails únicos y válidos
  const uniqueEmails = [...new Set(emails)]
    .filter(email => email.includes('@') && email.includes('.'))
    .map(email => email.toLowerCase());
  
  console.log(`📧 Emails extraídos del análisis: ${uniqueEmails.length}`, uniqueEmails);
  return uniqueEmails;
}

// Función para detectar información de pagos en texto
export function extractPaymentInfo(text: string): {
  mentionsPavement: boolean;
  amount?: number;
  method?: string;
  reservationDates?: string[];
} {
  const paymentKeywords = [
    'pago', 'transferencia', 'depósito', 'comprobante', 'abono', 
    'confirmo', 'envío', 'adjunto', 'transacción', 'débito'
  ];
  
  const mentionsPavement = paymentKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );
  
  // Extraer montos (buscar patrones como $123.456, 123456, etc.)
  const amountRegex = /\$?\s*(?:clp\s*)?[\d.,]+(?:\.\d{2})?/gi;
  const amounts = text.match(amountRegex);
  let amount: number | undefined;
  
  if (amounts && amounts.length > 0) {
    // Tomar el primer monto encontrado y limpiarlo
    const cleanAmount = amounts[0].replace(/[^\d.,]/g, '').replace(/,/g, '');
    amount = parseFloat(cleanAmount);
  }
  
  // Extraer fechas (DD-MM-YYYY, DD/MM/YYYY, etc.)
  const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
  const reservationDates = text.match(dateRegex) || [];
  
  // Detectar método de pago
  let method: string | undefined;
  if (text.toLowerCase().includes('transferencia')) method = 'transferencia';
  else if (text.toLowerCase().includes('depósito')) method = 'depósito';
  else if (text.toLowerCase().includes('tarjeta')) method = 'tarjeta';
  else if (text.toLowerCase().includes('efectivo')) method = 'efectivo';
  
  return {
    mentionsPavement,
    amount,
    method,
    reservationDates
  };
} 