// Cargar jsPDF dinámicamente donde se use para evitar bundling en server

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

// Función helper para formatear moneda sin decimales
const formatCurrency = (amount: number): string => {
  return `$${Math.round(amount).toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

interface BudgetLine {
  tempId: string;
  productId: number | null;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
}

interface BudgetFormData {
  quoteNumber: string;
  clientId: number | null;
  expirationDate: string;
  paymentTerms: string;
  currency: string;
  notes: string;
  total: number;
  lines: BudgetLine[];
}

interface ClientData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  rut: string;
}

export const exportBudgetToPDF = async (
  budgetData: BudgetFormData,
  clientData?: ClientData
) => {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF();
  
  // Verificar que autoTable esté disponible
  if (typeof doc.autoTable !== 'function') {
    throw new Error('El plugin autoTable no está disponible. Por favor, recargue la página e intente nuevamente.');
  }
  
  // Configuración de página
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colores del tema
  const colors = {
    primary: [44, 62, 80],      // #2c3e50
    secondary: [52, 73, 94],    // #34495e
    accent: [52, 152, 219],     // #3498db
    danger: [231, 76, 60],      // #e74c3c
    success: [39, 174, 96],     // #27ae60
    light: [236, 240, 241],     // #ecf0f1
    white: [255, 255, 255],
    gray: [149, 165, 166]       // #95a5a6
  };
  
  let yPosition = 8; // REDUCIDO: empezar más arriba
  
  // Función helper para agregar texto
  const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    doc.text(text, x, y);
  };

  // Función helper para agregar texto centrado
  const addCenteredText = (text: string, y: number, fontSize: number = 12, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };
  
  // Función helper para agregar rectángulo con color
  const addRect = (x: number, y: number, width: number, height: number, fillColor: number[], strokeColor?: number[]) => {
    if (fillColor) {
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.rect(x, y, width, height, 'F');
    }
    if (strokeColor) {
      doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
      doc.rect(x, y, width, height, 'S');
    }
  };

  // Función helper para crear gradiente simulado (usando rectángulos múltiples)
  const addGradientRect = (x: number, y: number, width: number, height: number, startColor: number[], endColor: number[]) => {
    const steps = 20;
    const stepHeight = height / steps;
    
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio);
      const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio);
      const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio);
      
      doc.setFillColor(r, g, b);
      doc.rect(x, y + (i * stepHeight), width, stepHeight, 'F');
    }
  };

  // Función helper para agregar footer en cualquier página
  const addFooter = () => {
    const footerY = pageHeight - 20;
    // Footer con gradiente
    addGradientRect(0, footerY - 4, pageWidth, 20, colors.primary, colors.secondary);
    addCenteredText('Gracias por su preferencia!', footerY + 4, 11, true, colors.white);
    addCenteredText('TC Constructor - Ferreteria & Construccion - LLifen, Futrono, Chile', footerY + 10, 8, false, colors.white);
  };
  
  // === HEADER PRINCIPAL CON GRADIENTE (COMPACTO) ===
  addGradientRect(0, 0, pageWidth, 32, colors.primary, colors.secondary); // REDUCIDO: 45px -> 32px
  
  // Logo centrado (Letra "A" con gradiente - similar a la web)
  // Por ahora omitimos el logo de imagen y usamos solo texto
  // TODO: Crear logo de TC Constructor para usar aquí
  
  // Títulos del header (COMPACTOS)
  yPosition = 12;
  addCenteredText('TC CONSTRUCTOR', yPosition, 20, true, colors.white); // REDUCIDO: 24px -> 20px
  yPosition += 6; // REDUCIDO: 8px -> 6px
  addCenteredText('FERRETERIA & CONSTRUCCION', yPosition, 12, true, colors.white); // REDUCIDO: 14px -> 12px
  yPosition += 5; // REDUCIDO: 6px -> 5px
  addCenteredText('TODO LO QUE NECESITAS PARA TUS PROYECTOS', yPosition, 9, false, colors.white); // REDUCIDO: 11px -> 9px
  yPosition += 4; // REDUCIDO: 5px -> 4px
  addCenteredText('Bodegas Termas LLifen - LLifen, Futrono | Tel: +56 9 6909 5111', yPosition, 8, false, colors.white); // REDUCIDO: 10px -> 8px
  
  yPosition = 38; // REDUCIDO: 55px -> 38px
  
  // === SECCIÓN INFORMACIÓN DE LA EMPRESA (COMPACTA) ===
  addRect(margin, yPosition, contentWidth, 18, colors.light); // REDUCIDO: 25px -> 18px
  addText('Informacion de Contacto', margin + 5, yPosition + 6, 10, true, colors.primary); // REDUCIDO: 12px -> 10px
  addText('Tel: +56 9 6909 5111 | Email: info@admintermas.cl', margin + 5, yPosition + 12, 8, false, colors.primary); // REDUCIDO: 9px -> 8px
  addText('WhatsApp: Disponible 24/7', pageWidth - 80, yPosition + 12, 8, false, colors.primary); // REDUCIDO: 9px -> 8px
  yPosition += 23; // REDUCIDO: 35px -> 23px
  
  // === HEADER PRESUPUESTO CON CARDS (SÚPER COMPACTO) ===
  addRect(margin, yPosition, contentWidth, 14, colors.light); // REDUCIDO DRÁSTICAMENTE: 22px -> 14px
  addText(`Presupuesto # ${budgetData.quoteNumber || 'P' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4)}`, margin + 5, yPosition + 6, 12, true, colors.primary); // REDUCIDO: 8px -> 6px, 14px -> 12px
  yPosition += 18; // REDUCIDO DRÁSTICAMENTE: 28px -> 18px
  
  // Cards de información del presupuesto (MÁS COMPACTAS)
  const cardWidth = (contentWidth - 15) / 4; // 4 cards con espacios
  const cardHeight = 16; // REDUCIDO: 20px -> 16px
  
  // Card Cliente
  addRect(margin, yPosition, cardWidth, cardHeight, colors.white, colors.danger);
  addText('Cliente', margin + 2, yPosition + 5, 7, false, colors.primary); // REDUCIDO: 8px -> 7px
  const clientName = clientData ? `${clientData.firstName} ${clientData.lastName}` : 'Cliente General';
  addText(clientName.length > 12 ? clientName.substring(0, 12) + '...' : clientName, margin + 2, yPosition + 11, 8, true, colors.danger); // REDUCIDO: 10px -> 8px
  
  // Card Fecha
  addRect(margin + cardWidth + 5, yPosition, cardWidth, cardHeight, colors.white, colors.danger);
  addText('Fecha', margin + cardWidth + 7, yPosition + 5, 7, false, colors.primary);
  addText(new Date().toLocaleDateString('es-CL'), margin + cardWidth + 7, yPosition + 11, 8, true, colors.danger);
  
  // Card Vencimiento
  addRect(margin + (cardWidth + 5) * 2, yPosition, cardWidth, cardHeight, colors.white, colors.danger);
  addText('Vencimiento', margin + (cardWidth + 5) * 2 + 2, yPosition + 5, 7, false, colors.primary);
  const expDate = budgetData.expirationDate ? new Date(budgetData.expirationDate).toLocaleDateString('es-CL') : '30-12-2025';
  addText(expDate, margin + (cardWidth + 5) * 2 + 2, yPosition + 11, 8, true, colors.danger);
  
  // Card Vendedor  
  addRect(margin + (cardWidth + 5) * 3, yPosition, cardWidth, cardHeight, colors.white, colors.danger);
  addText('Vendedor', margin + (cardWidth + 5) * 3 + 2, yPosition + 5, 7, false, colors.primary);
  addText('Reservas', margin + (cardWidth + 5) * 3 + 2, yPosition + 11, 8, true, colors.danger);
  
  yPosition += 18; // REDUCIDO MÁS: 22px -> 18px PARA MÁS PRODUCTOS
  
  // === SERVICIOS INCLUIDOS CON FONDO PROPIO (2 LÍNEAS) ===
  addRect(margin, yPosition, contentWidth, 12, colors.light); // FONDO MÁS COMPACTO: 16px -> 12px
  addCenteredText('SERVICIOS INCLUIDOS', yPosition + 8, 12, true, colors.primary); // CENTRADO y más pequeño
  yPosition += 16; // ESPACIO COMPACTO DESPUÉS DEL TÍTULO: 20px -> 16px
  
  // Función para obtener prefijo basado en el nombre del producto
  const getProductPrefix = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes('almuerzo') || name.includes('comida')) return '[COMIDA]';
    if (name.includes('desayuno')) return '[DESAYUNO]';
    if (name.includes('once') || name.includes('té') || name.includes('café')) return '[ONCE]';
    if (name.includes('piscina') || name.includes('termal')) return '[PISCINAS]';
    if (name.includes('masaje') || name.includes('spa') || name.includes('sonoterapia')) return '[SPA]';
    if (name.includes('habitación') || name.includes('hotel')) return '[HOTEL]';
    if (name.includes('programa')) return '[PROGRAMA]';
    return '[SERVICIO]';
  };
  
  // Crear cards para cada servicio/producto (SÚPER COMPACTO)
  budgetData.lines.forEach((line, index) => {
    const prefix = getProductPrefix(line.productName);
    
    console.log(`Renderizando producto ${index + 1}: ${line.productName}`);
    
    // Verificar si necesitamos nueva página (más conservador - reservar espacio para términos)
    if (yPosition > pageHeight - 80) { // MENOS CONSERVADOR: 110px -> 80px PARA MÁS PRODUCTOS
      // Agregar footer en página actual antes del salto
      addFooter();
      
      doc.addPage();
      yPosition = 15; // REDUCIDO: 20px -> 15px
      
      // Re-agregar header en nueva página (más compacto)
      addGradientRect(0, 0, pageWidth, 25, colors.primary, colors.secondary); // REDUCIDO: 30px -> 25px
      addCenteredText('TC CONSTRUCTOR - PRESUPUESTO (Continuacion)', 16, 12, true, colors.white); // REDUCIDO: 20px -> 16px, 14px -> 12px
      yPosition = 30; // REDUCIDO: 40px -> 30px
    }
    
    // Card principal del servicio (MÁS COMPACTO)
    addGradientRect(margin, yPosition, contentWidth, 5, colors.accent, [58, 175, 240]); // REDUCIDO: 6px -> 5px
    
    // Título del servicio con prefijo y precio (más compacto)
    const cleanProductName = (line.productName || 'Sin producto').replace(/[^\w\s\-\.]/g, '');
    const shortName = cleanProductName.length > 45 ? cleanProductName.substring(0, 45) + '...' : cleanProductName;
    addText(`${prefix} ${shortName}`, margin + 2, yPosition + 3, 9, true, colors.white); // REDUCIDO: 3px -> 2px, 10px -> 9px
    addText(`$${Math.round(line.subtotal).toLocaleString('es-CL')}`, pageWidth - margin - 35, yPosition + 3, 9, true, colors.white);
    
    yPosition += 6; // REDUCIDO: 8px -> 6px
    
    // Cuerpo del card (MÁS COMPACTO)
    addRect(margin, yPosition, contentWidth, 15, colors.white, colors.gray); // REDUCIDO: 18px -> 15px
    
    // Descripción del servicio (una sola línea compacta)
    if (line.description && line.description.trim()) {
      const maxWidth = contentWidth - 15;
      const cleanDescription = line.description.replace(/[^\w\s\-\.\,\(\)]/g, ' ').replace(/\s+/g, ' ').trim();
      const shortDesc = cleanDescription.length > 65 ? cleanDescription.substring(0, 65) + '...' : cleanDescription; // REDUCIDO: 80 -> 65
      addText(shortDesc, margin + 2, yPosition + 5, 7, false, [85, 85, 85]); // REDUCIDO: 3px -> 2px, 8px -> 7px
    }
    
    // Especificaciones en grid (parte inferior del card - más compacto)
    const specY = yPosition + 9; // REDUCIDO: 12px -> 9px
    const specWidth = contentWidth / 3;
    
    // Cantidad
    addRect(margin, specY, specWidth - 2, 4, colors.light); // REDUCIDO: 5px -> 4px
    addText('Cant:', margin + 1, specY + 1, 5, false, [100, 100, 100]); // REDUCIDO: 2px -> 1px, 6px -> 5px
    addText(line.quantity.toString(), margin + 1, specY + 3, 6, true, colors.primary); // REDUCIDO: 4px -> 3px, 7px -> 6px
    
    // Precio Unitario
    addRect(margin + specWidth + 2, specY, specWidth - 2, 4, colors.light);
    addText('Precio:', margin + specWidth + 3, specY + 1, 5, false, [100, 100, 100]);
    addText(`$${Math.round(line.unitPrice).toLocaleString('es-CL')}`, margin + specWidth + 3, specY + 3, 6, true, colors.primary);
    
    // IVA incluido
    addRect(margin + (specWidth + 2) * 2, specY, specWidth - 2, 4, colors.light);
    addText('IVA:', margin + (specWidth + 2) * 2 + 1, specY + 1, 5, false, [100, 100, 100]);
    addText('19%', margin + (specWidth + 2) * 2 + 1, specY + 3, 6, true, colors.success);
    
    yPosition += 20; // REDUCIDO SIGNIFICATIVAMENTE: 28px -> 20px
  });
  
  const finalY = yPosition;
  
  // Verificar si necesitamos agregar footer en la primera página
  const remainingSpace = pageHeight - finalY;
  const needsNewPageForSummary = remainingSpace < 120; // MENOS CONSERVADOR: 150px -> 120px
  
  if (needsNewPageForSummary) {
    // Agregar footer en primera página antes del salto
    addFooter();
    doc.addPage();
    yPosition = 15;
    
    // Re-agregar header en nueva página
    addGradientRect(0, 0, pageWidth, 25, colors.primary, colors.secondary);
    addCenteredText('TERMAS LLIFEN - PRESUPUESTO (Continuacion)', 16, 12, true, colors.white);
    yPosition = 30;
  }
  
  // === RESUMEN DE COSTOS CON DISEÑO MODERNO (COMPACTO) ===
  yPosition = needsNewPageForSummary ? yPosition + 8 : finalY + 8; // REDUCIDO: 10px -> 8px
  
  // Header del resumen con gradiente (más compacto)
  addGradientRect(margin, yPosition, contentWidth, 28, colors.primary, colors.secondary); // REDUCIDO: 35px -> 28px
  
  // Título del resumen
  addText('RESUMEN DE COSTOS', margin + 8, yPosition + 10, 14, true, colors.white); // REDUCIDO: 10px -> 8px, 16px -> 14px
  
  // Forma de pago (lado derecho del header - más compacto)
  addRect(pageWidth - margin - 55, yPosition + 6, 50, 16, [240, 245, 250]); // REDUCIDO: 60px -> 55px, 55px -> 50px, 20px -> 16px
  addText('Forma de Pago', pageWidth - margin - 48, yPosition + 10, 7, false, colors.primary); // REDUCIDO: 8px -> 7px
  const paymentText = budgetData.paymentTerms === '0' ? 'CONTADO' : `${budgetData.paymentTerms} DÍAS`;
  addText(paymentText, pageWidth - margin - 48, yPosition + 17, 8, true, colors.primary); // REDUCIDO: 20px -> 17px, 10px -> 8px
  
  yPosition += 32; // REDUCIDO: 40px -> 32px
  
  // Cálculos financieros
  const subtotalNeto = budgetData.lines.reduce((sum, line) => sum + line.subtotal, 0);
  const iva = subtotalNeto * 0.19;
  const total = subtotalNeto + iva;
  
  // Cuerpo del resumen financiero (más compacto)
  addRect(margin, yPosition, contentWidth, 28, colors.white, colors.gray); // REDUCIDO: 35px -> 28px
  
  // Items del resumen
  addText('Monto Neto:', margin + 8, yPosition + 8, 11, false, colors.primary); // REDUCIDO: 10px -> 8px, 12px -> 11px
  addText(`$${Math.round(subtotalNeto).toLocaleString('es-CL')}`, pageWidth - margin - 45, yPosition + 8, 11, false, colors.primary); // REDUCIDO: 50px -> 45px
  
  addText('IVA (19%):', margin + 8, yPosition + 15, 11, false, colors.primary); // REDUCIDO: 18px -> 15px
  addText(`$${Math.round(iva).toLocaleString('es-CL')}`, pageWidth - margin - 45, yPosition + 15, 11, false, colors.primary);
  
  // Línea separadora
  doc.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
  doc.line(margin + 8, yPosition + 19, pageWidth - margin - 8, yPosition + 19); // REDUCIDO: 23px -> 19px
  
  // Total final destacado (más compacto)
  addRect(margin + 4, yPosition + 21, contentWidth - 8, 6, colors.success, colors.success); // REDUCIDO: 25px -> 21px, 8px -> 6px
  addText('TOTAL FINAL:', margin + 8, yPosition + 25, 12, true, colors.white); // REDUCIDO: 30px -> 25px, 14px -> 12px
  addText(`$${Math.round(total).toLocaleString('es-CL')}`, pageWidth - margin - 45, yPosition + 25, 12, true, colors.white);
  
  yPosition += 35; // REDUCIDO: 45px -> 35px
  
  // Variable para controlar el espaciado vertical
  let currentY = yPosition;
  
  // Verificar si hay espacio para términos y condiciones en la página actual
  const termsHeight = 60; // Espacio estimado para términos y condiciones
  if (currentY + termsHeight > pageHeight - 25) {
    doc.addPage();
    currentY = 20;
    
    // Header compacto en nueva página
    addGradientRect(0, 0, pageWidth, 25, colors.primary, colors.secondary);
    addCenteredText('TC CONSTRUCTOR - TERMINOS Y CONDICIONES', 16, 12, true, colors.white);
    currentY = 35;
  }
  
  // === TÉRMINOS Y CONDICIONES (OPTIMIZADO) ===
  currentY += 5; // REDUCIDO: 10px -> 5px
  addRect(margin, currentY, contentWidth, 20, colors.light); // REDUCIDO: 25px -> 20px
  addText('TERMINOS Y CONDICIONES', margin + 5, currentY + 6, 11, true, colors.primary); // CORREGIDO: yPosition -> currentY
  currentY += 25; // REDUCIDO: 30px -> 25px
  
  // Lista de términos con checkmarks (más compacta)
  const terms = [
    'Los presupuestos son válidos por 30 días desde su emisión',
    'Precios sujetos a disponibilidad de stock',
    'Despacho a domicilio disponible (costo según zona)',
    'Garantía en todos nuestros productos según fabricante',
    'Horario de atención: Lunes a Sábado 8:00 - 19:00 hrs'
  ];
  
  addRect(margin, currentY, contentWidth, terms.length * 5 + 8, colors.white, colors.gray); // REDUCIDO: 6px -> 5px, 10px -> 8px
  
  terms.forEach((term, index) => {
    addText('*', margin + 4, currentY + 6 + (index * 5), 9, true, colors.success); // REDUCIDO: 5px -> 4px, 6px -> 5px, 10px -> 9px
    addText(term, margin + 12, currentY + 6 + (index * 5), 8, false, [85, 85, 85]); // REDUCIDO: 15px -> 12px, 9px -> 8px
  });
  
  currentY += (terms.length * 5) + 15; // REDUCIDO: 6px -> 5px, 20px -> 15px
  
  // Notas adicionales (si existen y hay espacio)
  if (budgetData.notes && budgetData.notes.trim() && currentY < pageHeight - 50) {
    addRect(margin, currentY, contentWidth, 16, colors.light); // REDUCIDO: 20px -> 16px
    addText('NOTAS ADICIONALES', margin + 5, currentY + 6, 10, true, colors.primary); // REDUCIDO: 8px -> 6px, 12px -> 10px
    currentY += 20; // REDUCIDO: 25px -> 20px
    
    addRect(margin, currentY, contentWidth, 12, colors.white, colors.gray); // REDUCIDO: 15px -> 12px
    
    // Dividir las notas en líneas (solo 1 línea para ahorrar espacio)
    const maxLineWidth = contentWidth - 15;
    const noteLines = doc.splitTextToSize(budgetData.notes, maxLineWidth);
    const shortNote = noteLines[0].length > 80 ? noteLines[0].substring(0, 80) + '...' : noteLines[0];
    
    addText(shortNote, margin + 4, currentY + 6, 8, false, [85, 85, 85]); // REDUCIDO: 5px -> 4px, 8px -> 6px, 9px -> 8px
    
    currentY += 18; // REDUCIDO: 25px -> 18px
  }
  
  // === FOOTER CORPORATIVO ===
  currentY += 8; // REDUCIDO: 15px -> 8px
  
  // Usar función helper para footer
  addFooter();
  
  // Resetear configuración del documento
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 0, 0);
  
  // Guardar PDF
  const fileName = budgetData.quoteNumber 
    ? `presupuesto-${budgetData.quoteNumber}.pdf`
    : `presupuesto-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export default exportBudgetToPDF;

/**
 * Genera un PDF del presupuesto en memoria y retorna un Buffer
 * para usar como adjunto en emails
 */
export const generateBudgetPDFBuffer = async (
  budgetData: BudgetFormData,
  clientData?: ClientData
): Promise<Buffer> => {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF();
  
  // Verificar que autoTable esté disponible
  if (typeof doc.autoTable !== 'function') {
    throw new Error('El plugin autoTable no está disponible.');
  }
  
  // Configuración de página
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colores del tema
  const colors = {
    primary: [44, 62, 80],      // #2c3e50
    secondary: [52, 73, 94],    // #34495e
    accent: [52, 152, 219],     // #3498db
    danger: [231, 76, 60],      // #e74c3c
    success: [39, 174, 96],     // #27ae60
    light: [236, 240, 241],     // #ecf0f1
    white: [255, 255, 255],
    gray: [149, 165, 166]       // #95a5a6
  };
  
  let yPosition = 8;
  
  // Función helper para agregar texto
  const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    doc.text(text, x, y);
  };

  // Función helper para agregar texto centrado
  const addCenteredText = (text: string, y: number, fontSize: number = 12, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };

  // CABECERA
  yPosition += 10;
  
  // Logo y título principal
  addText('TC CONSTRUCTOR', margin, yPosition, 24, true, colors.primary);
  addText('Ferreteria & Construccion', margin, yPosition + 8, 12, false, colors.secondary);
  
  // Información de contacto en la esquina superior derecha
  const contactX = pageWidth - margin - 60;
  addText('Tel: +56 9 6909 5111', contactX, yPosition, 10, false, colors.gray);
  addText('Email: info@admintermas.cl', contactX, yPosition + 6, 10, false, colors.gray);
  addText('LLifen, Futrono', contactX, yPosition + 12, 10, false, colors.gray);
  
  yPosition += 25;
  
  // Línea separadora
  doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.setLineWidth(1);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 15;
  
  // TÍTULO DEL PRESUPUESTO
  addCenteredText(`PRESUPUESTO ${budgetData.quoteNumber || 'Sin número'}`, yPosition, 20, true, colors.primary);
  yPosition += 15;
  
  // INFORMACIÓN DEL CLIENTE
  if (clientData) {
    // Fondo para la sección del cliente
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.rect(margin, yPosition - 5, contentWidth, 25, 'F');
    
    addText('INFORMACIÓN DEL CLIENTE', margin + 5, yPosition + 3, 14, true, colors.primary);
    
    const clientName = `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || 'Cliente sin nombre';
    addText(`Nombre: ${clientName}`, margin + 5, yPosition + 10, 11);
    
    if (clientData.email) {
      addText(`Email: ${clientData.email}`, margin + 5, yPosition + 16, 11);
    }
    
    if (clientData.phone) {
      addText(`Teléfono: ${clientData.phone}`, pageWidth - margin - 60, yPosition + 10, 11);
    }
    
    if (clientData.rut) {
      addText(`RUT: ${clientData.rut}`, pageWidth - margin - 60, yPosition + 16, 11);
    }
    
    yPosition += 35;
  }
  
  // INFORMACIÓN DEL PRESUPUESTO
  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.rect(margin, yPosition - 5, contentWidth, 20, 'F');
  
  addText('INFORMACIÓN DEL PRESUPUESTO', margin + 5, yPosition + 3, 12, true, colors.white);
  addText(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, margin + 5, yPosition + 12, 10, false, colors.white);
  
  if (budgetData.expirationDate) {
    const expirationDate = new Date(budgetData.expirationDate).toLocaleDateString('es-CL');
    addText(`Válido hasta: ${expirationDate}`, pageWidth - margin - 80, yPosition + 12, 10, false, colors.white);
  }
  
  yPosition += 30;
  
  // TABLA DE PRODUCTOS
  const tableData = budgetData.lines.map((line: any) => [
    line.description || line.productName || 'Producto sin nombre',
    line.quantity?.toString() || '1',
    `$${(line.unitPrice || 0).toLocaleString('es-CL')}`,
    `${(line.discountPercent || 0)}%`,
    `$${(line.subtotal || 0).toLocaleString('es-CL')}`
  ]);
  
  doc.autoTable({
    startY: yPosition,
    head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Desc.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.white,
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: colors.secondary
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.4 },  // Descripción
      1: { cellWidth: contentWidth * 0.15, halign: 'center' },  // Cantidad
      2: { cellWidth: contentWidth * 0.15, halign: 'right' },   // Precio
      3: { cellWidth: contentWidth * 0.1, halign: 'center' },   // Descuento
      4: { cellWidth: contentWidth * 0.2, halign: 'right' }     // Subtotal
    }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // RESUMEN FINANCIERO
  const subtotal = Math.round((budgetData.total || 0) / 1.19);
  const iva = (budgetData.total || 0) - subtotal;
  
  // Fondo para resumen
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.rect(pageWidth - margin - 80, yPosition - 5, 75, 30, 'F');
  
  addText('RESUMEN FINANCIERO', pageWidth - margin - 75, yPosition + 3, 12, true, colors.primary);
  addText(`Subtotal: $${subtotal.toLocaleString('es-CL')}`, pageWidth - margin - 75, yPosition + 12, 10);
  addText(`IVA (19%): $${Math.round(iva).toLocaleString('es-CL')}`, pageWidth - margin - 75, yPosition + 18, 10);
  
  // Total destacado
  doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.rect(pageWidth - margin - 80, yPosition + 22, 75, 8, 'F');
  addText(`TOTAL: $${(budgetData.total || 0).toLocaleString('es-CL')}`, pageWidth - margin - 75, yPosition + 28, 11, true, colors.white);
  
  yPosition += 45;
  
  // NOTAS ADICIONALES
  if (budgetData.notes) {
    yPosition += 5;
    addText('NOTAS ADICIONALES:', margin, yPosition, 12, true, colors.primary);
    yPosition += 8;
    
    // Dividir texto largo en líneas
    const lines = doc.splitTextToSize(budgetData.notes, contentWidth);
    lines.forEach((line: string, index: number) => {
      if (yPosition + (index * 6) > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      addText(line, margin, yPosition + (index * 6), 10);
    });
    
    yPosition += lines.length * 6 + 10;
  }
  
  // TÉRMINOS DE PAGO
  if (budgetData.paymentTerms) {
    // Verificar si hay espacio para términos de pago
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    
    addText('TÉRMINOS DE PAGO:', margin, yPosition, 12, true, colors.primary);
    yPosition += 8;
    addText(budgetData.paymentTerms, margin, yPosition, 10);
    yPosition += 15;
  }
  
  // FOOTER
  const footerY = pageHeight - 25;
  
  // Línea separadora del footer
  doc.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  // Texto del footer
  addCenteredText('TC Constructor - Bodegas Termas LLifen', footerY, 10, false, colors.gray);
  addCenteredText('LLifen, Futrono, Chile | Tel: +56 9 6909 5111', footerY + 6, 9, false, colors.gray);
  
  // Generar el PDF como Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  return pdfBuffer;
}; 

/**
 * Genera un PDF del presupuesto usando HTML personalizado en memoria y retorna un Buffer
 * para usar como adjunto en emails
 */
export const generateBudgetPDFWithCustomHTML = async (
  customHTML: string,
  budgetNumber: string
): Promise<Buffer> => {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF();
  
  // Verificar que autoTable esté disponible
  if (typeof doc.autoTable !== 'function') {
    throw new Error('El plugin autoTable no está disponible.');
  }
  
  // Crear un elemento temporal para renderizar el HTML
  if (typeof window !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = customHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '595px'; // Ancho A4 en píxeles (210mm)
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.4';
    document.body.appendChild(tempDiv);

    // Configuración de página A4
    doc.setPage(1);
    
    try {
      // Usar html2canvas si está disponible, o renderizado básico
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Extraer texto del HTML y renderizarlo
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      const lines = doc.splitTextToSize(textContent, contentWidth);
      
      // Configurar fuente
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Agregar contenido línea por línea
      lines.forEach((line: string, index: number) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

    } catch (error) {
      console.warn('Error renderizando HTML, usando fallback:', error);
      
      // Fallback: renderizado básico
      doc.setFontSize(16);
      doc.text(`Presupuesto ${budgetNumber}`, 20, 30);
      doc.setFontSize(12);
      doc.text('Documento generado con plantilla personalizada', 20, 50);
      doc.text('TC Constructor - Ferreteria & Construccion', 20, 70);
    }

    // Limpiar elemento temporal
    document.body.removeChild(tempDiv);
  } else {
    // Si estamos en servidor, crear un PDF básico
    doc.setFontSize(16);
    doc.text(`Presupuesto ${budgetNumber}`, 20, 30);
    doc.setFontSize(12);
    doc.text('Documento generado con plantilla personalizada', 20, 50);
    doc.text('TC Constructor - Ferreteria & Construccion', 20, 70);
  }

  // Generar el PDF como Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  return pdfBuffer;
}; 