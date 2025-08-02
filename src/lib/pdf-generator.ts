// Generador de PDFs para adjuntos de email
import jsPDF from 'jspdf';

export interface BudgetItem {
  name: string;
  quantity: number;
  unit?: string;
  price: number;
  total: number;
}

export interface BudgetData {
  budgetNumber: string;
  clientName: string;
  date: string;
  validUntil: string;
  items: BudgetItem[];
  subtotal: number;
  taxes: number;
  total: number;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
}

export interface PurchaseOrderData {
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  deliveryDate: string;
  items: BudgetItem[];
  subtotal: number;
  taxes: number;
  total: number;
  deliveryAddress: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
}

// Generar PDF de presupuesto
export function generateBudgetPDF(data: BudgetData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      
      // Configuración de colores
      const primaryColor = '#2c5530';
      const lightGray = '#f8f9fa';
      
      // Header con logo (simulado)
      doc.setFillColor(44, 85, 48); // #2c5530
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMAS LLIFEN', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Hotel & Spa', 20, 26);
      
      // Resetear color de texto
      doc.setTextColor(0, 0, 0);
      
      // Título del documento
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PRESUPUESTO DE SERVICIOS', 20, 45);
      
      // Información del presupuesto
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const infoY = 55;
      doc.text(`Presupuesto N°: ${data.budgetNumber}`, 20, infoY);
      doc.text(`Cliente: ${data.clientName}`, 20, infoY + 5);
      doc.text(`Fecha: ${data.date}`, 20, infoY + 10);
      doc.text(`Válido hasta: ${data.validUntil}`, 20, infoY + 15);
      
      // Línea separadora
      doc.setDrawColor(44, 85, 48);
      doc.setLineWidth(0.5);
      doc.line(20, infoY + 22, 190, infoY + 22);
      
      // Tabla de items
      const tableStartY = infoY + 30;
      let currentY = tableStartY;
      
      // Headers de tabla
      doc.setFillColor(248, 249, 250); // #f8f9fa
      doc.rect(20, currentY, 170, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Descripción', 22, currentY + 5);
      doc.text('Cant.', 110, currentY + 5);
      doc.text('Precio Unit.', 130, currentY + 5);
      doc.text('Total', 165, currentY + 5);
      
      currentY += 8;
      
      // Items
      doc.setFont('helvetica', 'normal');
      data.items.forEach((item, index) => {
        if (currentY > 250) { // Nueva página si es necesario
          doc.addPage();
          currentY = 20;
        }
        
        // Alternar color de fondo
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(20, currentY, 170, 6, 'F');
        }
        
        doc.text(item.name.substring(0, 40), 22, currentY + 4);
        doc.text(item.quantity.toString(), 110, currentY + 4);
        doc.text(`$${item.price.toLocaleString('es-CL')}`, 130, currentY + 4);
        doc.text(`$${item.total.toLocaleString('es-CL')}`, 165, currentY + 4);
        
        currentY += 6;
      });
      
      // Totales
      currentY += 5;
      
      // Línea separadora
      doc.setDrawColor(44, 85, 48);
      doc.line(130, currentY, 190, currentY);
      currentY += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 130, currentY);
      doc.text(`$${data.subtotal.toLocaleString('es-CL')}`, 165, currentY);
      currentY += 5;
      
      doc.text('IVA (19%):', 130, currentY);
      doc.text(`$${data.taxes.toLocaleString('es-CL')}`, 165, currentY);
      currentY += 5;
      
      // Total destacado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL:', 130, currentY);
      doc.text(`$${data.total.toLocaleString('es-CL')}`, 165, currentY);
      
      currentY += 15;
      
      // Información de contacto
      if (data.contactPerson || data.contactPhone) {
        doc.setFillColor(232, 245, 232); // #e8f5e8
        doc.rect(20, currentY, 170, 20, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Información de Contacto:', 22, currentY + 6);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (data.contactPerson) {
          doc.text(`Contacto: ${data.contactPerson}`, 22, currentY + 11);
        }
        if (data.contactPhone) {
          doc.text(`Teléfono: ${data.contactPhone}`, 22, currentY + 16);
        }
        
        currentY += 25;
      }
      
      // Notas adicionales
      if (data.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Observaciones:', 20, currentY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const notesLines = doc.splitTextToSize(data.notes, 170);
        doc.text(notesLines, 20, currentY + 5);
        currentY += 5 + (notesLines.length * 4);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Este presupuesto es válido hasta la fecha indicada.', 20, pageHeight - 20);
      doc.text('Para consultas: reservas@termasllifen.cl | +56 63 2318 000', 20, pageHeight - 15);
      
      // Generar buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      resolve(pdfBuffer);
      
    } catch (error) {
      reject(error);
    }
  });
}

// Generar PDF de orden de compra
export function generatePurchaseOrderPDF(data: PurchaseOrderData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(44, 85, 48);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMAS LLIFEN', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Hotel & Spa', 20, 26);
      
      doc.setTextColor(0, 0, 0);
      
      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDEN DE COMPRA', 20, 45);
      
      // Información
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const infoY = 55;
      doc.text(`Orden N°: ${data.orderNumber}`, 20, infoY);
      doc.text(`Proveedor: ${data.supplierName}`, 20, infoY + 5);
      doc.text(`Fecha de Orden: ${data.orderDate}`, 20, infoY + 10);
      doc.text(`Fecha de Entrega: ${data.deliveryDate}`, 20, infoY + 15);
      doc.text(`Dirección de Entrega: ${data.deliveryAddress}`, 20, infoY + 20);
      
      // Línea separadora
      doc.setDrawColor(44, 85, 48);
      doc.setLineWidth(0.5);
      doc.line(20, infoY + 27, 190, infoY + 27);
      
      // Tabla de items (similar al presupuesto)
      const tableStartY = infoY + 35;
      let currentY = tableStartY;
      
      // Headers
      doc.setFillColor(248, 249, 250);
      doc.rect(20, currentY, 170, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Producto/Servicio', 22, currentY + 5);
      doc.text('Cant.', 100, currentY + 5);
      doc.text('Unidad', 115, currentY + 5);
      doc.text('Precio', 140, currentY + 5);
      doc.text('Total', 165, currentY + 5);
      
      currentY += 8;
      
      // Items
      doc.setFont('helvetica', 'normal');
      data.items.forEach((item, index) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(20, currentY, 170, 6, 'F');
        }
        
        doc.text(item.name.substring(0, 30), 22, currentY + 4);
        doc.text(item.quantity.toString(), 100, currentY + 4);
        doc.text(item.unit || 'ud', 115, currentY + 4);
        doc.text(`$${item.price.toLocaleString('es-CL')}`, 140, currentY + 4);
        doc.text(`$${item.total.toLocaleString('es-CL')}`, 165, currentY + 4);
        
        currentY += 6;
      });
      
      // Totales
      currentY += 5;
      doc.setDrawColor(44, 85, 48);
      doc.line(130, currentY, 190, currentY);
      currentY += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 130, currentY);
      doc.text(`$${data.subtotal.toLocaleString('es-CL')}`, 165, currentY);
      currentY += 5;
      
      doc.text('IVA (19%):', 130, currentY);
      doc.text(`$${data.taxes.toLocaleString('es-CL')}`, 165, currentY);
      currentY += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL ORDEN:', 130, currentY);
      doc.text(`$${data.total.toLocaleString('es-CL')}`, 165, currentY);
      
      currentY += 15;
      
      // Información de contacto
      if (data.contactPerson || data.contactPhone) {
        doc.setFillColor(255, 243, 205);
        doc.rect(20, currentY, 170, 20, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Contacto para entrega:', 22, currentY + 6);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (data.contactPerson) {
          doc.text(`Contacto: ${data.contactPerson}`, 22, currentY + 11);
        }
        if (data.contactPhone) {
          doc.text(`Teléfono: ${data.contactPhone}`, 22, currentY + 16);
        }
        
        currentY += 25;
      }
      
      // Notas
      if (data.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Observaciones:', 20, currentY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const notesLines = doc.splitTextToSize(data.notes, 170);
        doc.text(notesLines, 20, currentY + 5);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Favor confirmar recepción de esta orden y fecha estimada de entrega.', 20, pageHeight - 20);
      doc.text('Contacto: compras@termasllifen.cl | +56 63 2318 000', 20, pageHeight - 15);
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      resolve(pdfBuffer);
      
    } catch (error) {
      reject(error);
    }
  });
}

// Función auxiliar para generar nombre de archivo
export function generatePDFFilename(type: 'budget' | 'purchase_order', identifier: string): string {
  const date = new Date().toISOString().split('T')[0];
  
  switch (type) {
    case 'budget':
      return `Presupuesto_${identifier}_${date}.pdf`;
    case 'purchase_order':
      return `Orden_Compra_${identifier}_${date}.pdf`;
    default:
      return `Documento_${identifier}_${date}.pdf`;
  }
} 