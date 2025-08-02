'use server';

import { sendEmail, testEmailConfiguration, emailTemplates, EmailOptions } from '@/lib/email-service';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { 
  getTemplateById, 
  replaceTemplateVariables, 
  validateTemplateData,
  type TemplateData 
} from '@/lib/template-engine';
import { 
  generateBudgetPDF, 
  generatePurchaseOrderPDF, 
  generatePDFFilename,
  type BudgetData,
  type PurchaseOrderData 
} from '@/lib/pdf-generator';

// Tipos para acciones de email
export interface SendTestEmailResult {
  success: boolean;
  message: string;
  messageId?: string;
}

export interface SendReservationEmailResult {
  success: boolean;
  message: string;
  messageId?: string;
}

export interface EmailConfigurationResult {
  success: boolean;
  message: string;
  configured: boolean;
}

// Acción para probar la configuración de email
export async function checkEmailConfiguration(): Promise<EmailConfigurationResult> {
  try {
    console.log('🔍 Verificando configuración de email...');
    
    const result = await testEmailConfiguration();
    
    return {
      success: result.success,
      message: result.message,
      configured: result.success,
    };

  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    return {
      success: false,
      message: 'Error al verificar la configuración de email',
      configured: false,
    };
  }
}

// Acción para enviar email de prueba
export async function sendTestEmail(recipientEmail: string): Promise<SendTestEmailResult> {
  try {
    console.log('🧪 Enviando email de prueba a:', recipientEmail);

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return {
        success: false,
        message: 'El formato del email no es válido',
      };
    }

    // Obtener plantilla de prueba
    const template = emailTemplates.testEmail();

    // Enviar email
    const result = await sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      console.log('✅ Email de prueba enviado exitosamente');
      return {
        success: true,
        message: `Email de prueba enviado exitosamente a ${recipientEmail}`,
        messageId: result.messageId,
      };
    } else {
      console.error('❌ Error enviando email de prueba:', result.error);
      return {
        success: false,
        message: result.error || 'Error desconocido al enviar email de prueba',
      };
    }

  } catch (error) {
    console.error('❌ Error en sendTestEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción para enviar confirmación de reserva
export async function sendReservationConfirmationEmail(
  reservationId: number,
  recipientEmail?: string
): Promise<SendReservationEmailResult> {
  try {
    console.log('📧 Enviando confirmación de reserva para ID:', reservationId);

    const supabase = await getSupabaseServerClient();

    // Obtener datos de la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('ModularReservation')
      .select(`
        id,
        client_id,
        room_code,
        package_name,
        check_in,
        check_out,
        total_amount,
        status,
        Client!inner (
          id,
          nombrePrincipal,
          apellido,
          razonSocial,
          email,
          tipoCliente
        )
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      console.error('❌ Error obteniendo reserva:', reservationError);
      return {
        success: false,
        message: 'No se encontró la reserva especificada',
      };
    }

    // Determinar email destinatario
    const clientEmail = recipientEmail || reservation.Client.email;
    if (!clientEmail) {
      return {
        success: false,
        message: 'El cliente no tiene email registrado y no se proporcionó email alternativo',
      };
    }

    // Preparar datos para la plantilla
    const clientName = reservation.Client.tipoCliente === 'EMPRESA' 
      ? reservation.Client.razonSocial || reservation.Client.nombrePrincipal
      : `${reservation.Client.nombrePrincipal} ${reservation.Client.apellido || ''}`.trim();

    const templateData = {
      clientName,
      reservationId: `R${reservation.id}`,
      checkIn: new Date(reservation.check_in).toLocaleDateString('es-CL'),
      checkOut: new Date(reservation.check_out).toLocaleDateString('es-CL'),
      roomCode: reservation.room_code,
      packageName: reservation.package_name,
      totalAmount: reservation.total_amount,
    };

    // Obtener plantilla de confirmación
    const template = emailTemplates.reservationConfirmation(templateData);

    // Enviar email
    const result = await sendEmail({
      to: clientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      console.log('✅ Confirmación de reserva enviada exitosamente');
      
      // Opcional: Registrar el envío en la base de datos
      try {
        await supabase
          .from('ModularReservation')
          .update({ 
            // Podrías agregar un campo para tracking de emails enviados
            updated_at: new Date().toISOString() 
          })
          .eq('id', reservationId);
      } catch (updateError) {
        console.warn('⚠️ No se pudo actualizar la reserva tras envío:', updateError);
      }

      return {
        success: true,
        message: `Confirmación de reserva enviada exitosamente a ${clientEmail}`,
        messageId: result.messageId,
      };
    } else {
      console.error('❌ Error enviando confirmación:', result.error);
      return {
        success: false,
        message: result.error || 'Error desconocido al enviar confirmación',
      };
    }

  } catch (error) {
    console.error('❌ Error en sendReservationConfirmationEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción para enviar email personalizado
export async function sendCustomEmail(
  to: string | string[],
  subject: string,
  content: string,
  isHtml: boolean = true
): Promise<SendTestEmailResult> {
  try {
    console.log('📤 Enviando email personalizado:', {
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      isHtml,
    });

    // Validar destinatarios
    const recipients = Array.isArray(to) ? to : [to];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: `Email inválido: ${email}`,
        };
      }
    }

    // Preparar opciones de email
    const emailOptions: EmailOptions = {
      to,
      subject,
    };

    if (isHtml) {
      emailOptions.html = content;
      // Generar versión texto básica desde HTML
      emailOptions.text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    } else {
      emailOptions.text = content;
    }

    // Enviar email
    const result = await sendEmail(emailOptions);

    if (result.success) {
      console.log('✅ Email personalizado enviado exitosamente');
      return {
        success: true,
        message: `Email enviado exitosamente a ${recipients.length} destinatario(s)`,
        messageId: result.messageId,
      };
    } else {
      console.error('❌ Error enviando email personalizado:', result.error);
      return {
        success: false,
        message: result.error || 'Error desconocido al enviar email',
      };
    }

  } catch (error) {
    console.error('❌ Error en sendCustomEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción para enviar presupuesto
export async function sendBudgetQuoteEmail(budgetData: {
  clientEmail: string;
  clientName: string;
  budgetId: string;
  budgetNumber: string;
  items: Array<{name: string; quantity: number; price: number; total: number}>;
  subtotal: number;
  taxes: number;
  total: number;
  validUntil: string;
  contactPerson?: string;
  contactPhone?: string;
}): Promise<SendTestEmailResult> {
  try {
    console.log('💼 Enviando presupuesto por email:', budgetData.budgetNumber);

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(budgetData.clientEmail)) {
      return {
        success: false,
        message: 'El formato del email no es válido',
      };
    }

    // Preparar datos para la plantilla
    const templateData = {
      ...budgetData,
      contactPerson: budgetData.contactPerson || 'Equipo Comercial',
      contactPhone: budgetData.contactPhone || '+56 63 2318 000',
    };

    // Obtener plantilla de presupuesto
    const template = emailTemplates.budgetQuote(templateData);

    // Enviar email
    const result = await sendEmail({
      to: budgetData.clientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      console.log('✅ Presupuesto enviado exitosamente');
      return {
        success: true,
        message: `Presupuesto ${budgetData.budgetNumber} enviado exitosamente a ${budgetData.clientEmail}`,
        messageId: result.messageId,
      };
    } else {
      console.error('❌ Error enviando presupuesto:', result.error);
      return {
        success: false,
        message: result.error || 'Error desconocido al enviar presupuesto',
      };
    }

  } catch (error) {
    console.error('❌ Error en sendBudgetQuoteEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción para enviar confirmación de pago de reserva
export async function sendPaymentConfirmationEmail(paymentData: {
  clientEmail: string;
  clientName: string;
  reservationId: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentDate: string;
  remainingBalance: number;
  reservationDetails: {
    checkIn: string;
    checkOut: string;
    roomCode: string;
    packageName: string;
    totalAmount: number;
  };
}): Promise<SendTestEmailResult> {
  try {
    console.log('💳 Enviando confirmación de pago por email:', paymentData.reservationId);

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paymentData.clientEmail)) {
      return {
        success: false,
        message: 'El formato del email no es válido',
      };
    }

    // Obtener plantilla de confirmación de pago
    const template = emailTemplates.paymentConfirmation(paymentData);

    // Enviar email
    const result = await sendEmail({
      to: paymentData.clientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      console.log('✅ Confirmación de pago enviada exitosamente');
      return {
        success: true,
        message: `Confirmación de pago enviada exitosamente a ${paymentData.clientEmail}`,
        messageId: result.messageId,
      };
    } else {
      console.error('❌ Error enviando confirmación de pago:', result.error);
      return {
        success: false,
        message: result.error || 'Error desconocido al enviar confirmación de pago',
      };
    }

  } catch (error) {
    console.error('❌ Error en sendPaymentConfirmationEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción para enviar confirmación de abono a proveedor
export async function sendSupplierPaymentConfirmationEmail(paymentData: {
  supplierEmail: string;
  supplierName: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentDate: string;
  invoiceNumber?: string;
  orderNumber?: string;
  reference: string;
  remainingBalance: number;
}): Promise<SendTestEmailResult> {
  try {
    console.log('🏢 Enviando confirmación de abono a proveedor:', paymentData.supplierName);

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paymentData.supplierEmail)) {
      return {
        success: false,
        message: 'El formato del email no es válido',
      };
    }

    // Obtener plantilla de confirmación de abono
    const template = emailTemplates.supplierPaymentConfirmation(paymentData);

    // Enviar email
    const result = await sendEmail({
      to: paymentData.supplierEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      console.log('✅ Confirmación de abono a proveedor enviada exitosamente');
      return {
        success: true,
        message: `Confirmación de abono enviada exitosamente a ${paymentData.supplierEmail}`,
        messageId: result.messageId,
      };
    } else {
      console.error('❌ Error enviando confirmación de abono:', result.error);
      return {
        success: false,
        message: result.error || 'Error desconocido al enviar confirmación de abono',
      };
    }

  } catch (error) {
    console.error('❌ Error en sendSupplierPaymentConfirmationEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción para enviar orden de compra a proveedor
export async function sendSupplierPurchaseOrderEmail(orderData: {
  supplierEmail: string;
  supplierName: string;
  orderNumber: string;
  orderDate: string;
  deliveryDate: string;
  items: Array<{name: string; quantity: number; unit: string; price: number; total: number}>;
  subtotal: number;
  taxes: number;
  total: number;
  deliveryAddress: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
}): Promise<SendTestEmailResult> {
  try {
    console.log('📋 Enviando orden de compra a proveedor:', orderData.orderNumber);

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.supplierEmail)) {
      return {
        success: false,
        message: 'El formato del email no es válido',
      };
    }

    // Preparar datos para la plantilla
    const templateData = {
      ...orderData,
      contactPerson: orderData.contactPerson || 'Departamento de Compras',
      contactPhone: orderData.contactPhone || '+56 63 2318 000',
    };

    // Obtener plantilla de orden de compra
    const template = emailTemplates.supplierPurchaseOrder(templateData);

    // Enviar email
    const result = await sendEmail({
      to: orderData.supplierEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      console.log('✅ Orden de compra enviada exitosamente');
      return {
        success: true,
        message: `Orden de compra ${orderData.orderNumber} enviada exitosamente a ${orderData.supplierEmail}`,
        messageId: result.messageId,
      };
    } else {
      console.error('❌ Error enviando orden de compra:', result.error);
      return {
        success: false,
        message: result.error || 'Error desconocido al enviar orden de compra',
      };
    }

  } catch (error) {
    console.error('❌ Error en sendSupplierPurchaseOrderEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción general para enviar emails con plantillas y variables
export async function sendTemplatedEmail(
  templateId: string,
  recipientEmail: string,
  templateData: TemplateData,
  attachmentData?: { type: 'budget' | 'purchase_order'; data: any }
): Promise<SendTestEmailResult> {
  try {
    console.log(`📧 Enviando email con plantilla ${templateId} a ${recipientEmail}`);

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return {
        success: false,
        message: 'El formato del email no es válido',
      };
    }

    // Obtener plantilla
    const template = getTemplateById(templateId);
    if (!template) {
      return {
        success: false,
        message: `Plantilla '${templateId}' no encontrada`,
      };
    }

    // Validar datos requeridos
    const validation = validateTemplateData(template, templateData);
    if (!validation.valid) {
      return {
        success: false,
        message: `Faltan datos requeridos: ${validation.missing.join(', ')}`,
      };
    }

    // Reemplazar variables en subject y body
    const subject = replaceTemplateVariables(template.subject, templateData);
    const htmlBody = replaceTemplateVariables(template.htmlBody, templateData);
    const textBody = replaceTemplateVariables(template.textBody, templateData);

    // Preparar opciones de email
    const emailOptions: EmailOptions = {
      to: recipientEmail,
      subject,
      html: htmlBody,
      text: textBody,
    };

    // Generar y adjuntar PDF si es necesario
    if (template.attachmentType === 'pdf' && attachmentData) {
      let pdfBuffer: Buffer;
      let filename: string;

      if (attachmentData.type === 'budget') {
        pdfBuffer = await generateBudgetPDF(attachmentData.data as BudgetData);
        filename = generatePDFFilename('budget', attachmentData.data.budgetNumber);
      } else if (attachmentData.type === 'purchase_order') {
        pdfBuffer = await generatePurchaseOrderPDF(attachmentData.data as PurchaseOrderData);
        filename = generatePDFFilename('purchase_order', attachmentData.data.orderNumber);
      } else {
        throw new Error('Tipo de adjunto no soportado');
      }

      emailOptions.attachments = [{
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }];
    }

    // Enviar email
    const result = await sendEmail(emailOptions);

    if (result.success) {
      console.log('✅ Email con plantilla enviado exitosamente');
      return {
        success: true,
        message: `Email enviado exitosamente a ${recipientEmail}`,
        messageId: result.messageId,
      };
    } else {
      console.error('❌ Error enviando email con plantilla:', result.error);
      return {
        success: false,
        message: result.error || 'Error desconocido al enviar email',
      };
    }

  } catch (error) {
    console.error('❌ Error en sendTemplatedEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción específica para enviar presupuesto con plantilla
export async function sendBudgetEmailWithTemplate(budgetFormData: {
  clientEmail: string;
  clientName: string;
  budgetNumber: string;
  items: Array<{name: string; quantity: number; price: number; total: number}>;
  subtotal: number;
  taxes: number;
  total: number;
  validUntil: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
}): Promise<SendTestEmailResult> {
  try {
    console.log('💼 Enviando presupuesto con plantilla:', budgetFormData.budgetNumber);

    // Preparar datos para la plantilla
    const templateData: TemplateData = {
      nombre_cliente: budgetFormData.clientName,
      email_cliente: budgetFormData.clientEmail,
      numero_presupuesto: budgetFormData.budgetNumber,
      fecha_presupuesto: new Date().toLocaleDateString('es-CL'),
      valido_hasta: new Date(budgetFormData.validUntil).toLocaleDateString('es-CL'),
      subtotal: budgetFormData.subtotal,
      impuestos: budgetFormData.taxes,
      total: budgetFormData.total,
      contacto_persona: budgetFormData.contactPerson,
      contacto_telefono: budgetFormData.contactPhone,
    };

    // Preparar datos para PDF
    const pdfData: BudgetData = {
      budgetNumber: budgetFormData.budgetNumber,
      clientName: budgetFormData.clientName,
      date: new Date().toLocaleDateString('es-CL'),
      validUntil: new Date(budgetFormData.validUntil).toLocaleDateString('es-CL'),
      items: budgetFormData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      subtotal: budgetFormData.subtotal,
      taxes: budgetFormData.taxes,
      total: budgetFormData.total,
      contactPerson: budgetFormData.contactPerson || 'Equipo Comercial',
      contactPhone: budgetFormData.contactPhone || '+56 63 2318 000',
      notes: budgetFormData.notes
    };

    // Enviar email con plantilla
    return await sendTemplatedEmail(
      'budget_quote',
      budgetFormData.clientEmail,
      templateData,
      { type: 'budget', data: pdfData }
    );

  } catch (error) {
    console.error('❌ Error en sendBudgetEmailWithTemplate:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción específica para confirmación de reserva con plantilla
export async function sendReservationConfirmationWithTemplate(reservationData: {
  clientEmail: string;
  clientName: string;
  reservationId: string;
  checkIn: string;
  checkOut: string;
  roomCode: string;
  packageName: string;
  totalAmount: number;
}): Promise<SendTestEmailResult> {
  try {
    console.log('🏨 Enviando confirmación de reserva con plantilla:', reservationData.reservationId);

    // Preparar datos para la plantilla
    const templateData: TemplateData = {
      nombre_cliente: reservationData.clientName,
      email_cliente: reservationData.clientEmail,
      numero_reserva: reservationData.reservationId,
      fecha_checkin: new Date(reservationData.checkIn).toLocaleDateString('es-CL'),
      fecha_checkout: new Date(reservationData.checkOut).toLocaleDateString('es-CL'),
      habitacion: reservationData.roomCode,
      paquete: reservationData.packageName,
      total_reserva: reservationData.totalAmount,
    };

    // Enviar email con plantilla (sin adjunto)
    return await sendTemplatedEmail(
      'reservation_confirmation',
      reservationData.clientEmail,
      templateData
    );

  } catch (error) {
    console.error('❌ Error en sendReservationConfirmationWithTemplate:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Acción para obtener estadísticas de emails (futura implementación)
export async function getEmailStats(): Promise<{
  success: boolean;
  stats?: {
    totalSent: number;
    lastSent: string | null;
    failureRate: number;
  };
  message?: string;
}> {
  try {
    // TODO: Implementar tracking de emails enviados en base de datos
    return {
      success: true,
      stats: {
        totalSent: 0,
        lastSent: null,
        failureRate: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error obteniendo estadísticas de email',
    };
  }
} 