'use server';

import { sendEmail, emailTemplates } from '@/lib/email-service';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getBudgetById } from './get';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { generateBudgetPDFBuffer, generateBudgetPDFWithCustomHTML, type BudgetFormData, type ClientData } from '@/utils/pdfExport';

// Tipos para el sistema de emails de presupuestos
export interface SendBudgetEmailInput {
  budgetId: number;
  recipientEmail: string;
  customMessage?: string;
  subject?: string;
  includePDF?: boolean; // Nueva opción para incluir PDF
  customHTML?: string; // Nueva opción para HTML personalizado
  useCustomHTML?: boolean; // Bandera para usar HTML personalizado
}

export interface SendBudgetEmailResult {
  success: boolean;
  message: string;
  emailId?: number;
  messageId?: string;
}

export interface BudgetEmailHistoryItem {
  id: number;
  email_type: 'sent' | 'received';
  recipient_email: string;
  sender_email?: string;
  subject: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at?: string;
  created_at: string;
  sent_by_name?: string;
  error_message?: string;
}

// Función para enviar presupuesto por email
export async function sendBudgetEmail(input: SendBudgetEmailInput): Promise<SendBudgetEmailResult> {
  try {
    console.log('📧 Enviando presupuesto por email:', input);

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.recipientEmail)) {
      return {
        success: false,
        message: 'El formato del email no es válido',
      };
    }

    // Obtener datos del presupuesto
    const budgetResult = await getBudgetById(input.budgetId);
    if (!budgetResult.success || !budgetResult.data) {
      return {
        success: false,
        message: 'No se encontró el presupuesto especificado',
      };
    }

    const budget = budgetResult.data;

    // Verificar que el presupuesto tenga cliente
    if (!budget.client) {
      return {
        success: false,
        message: 'El presupuesto debe tener un cliente asociado',
      };
    }

    // Obtener usuario actual
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Usuario no autenticado',
      };
    }

    // Preparar datos para la plantilla
    const clientName = budget.client.firstName && budget.client.lastName 
      ? `${budget.client.firstName} ${budget.client.lastName}`.trim()
      : budget.client.firstName || 'Cliente';

    const templateData = {
      clientName,
      budgetId: budget.id.toString(),
      budgetNumber: budget.number,
      items: budget.lines.map(line => ({
        name: line.product_name || line.description || 'Producto sin nombre',
        quantity: Number(line.quantity) || 0,
        price: Number(line.unit_price) || 0,
        total: Number(line.subtotal) || 0,
      })),
      subtotal: Math.round((budget.total || 0) / 1.19), // Calcular subtotal sin IVA
      taxes: Math.round((budget.total || 0) - ((budget.total || 0) / 1.19)), // IVA 19%
      total: Number(budget.total) || 0,
      validUntil: budget.expiration_date ? new Date(budget.expiration_date).toLocaleDateString('es-CL') : '30 días',
      contactPerson: user.name || 'Equipo Comercial',
      contactPhone: '+56 9 1234 5678', // Configurar teléfono de contacto
    };

    // Generar email usando la plantilla existente
    const emailTemplate = emailTemplates.budgetQuote(templateData);

    // Usar subject personalizado si se proporciona
    const subject = input.subject || emailTemplate.subject;

    // Agregar mensaje personalizado si se proporciona
    let htmlContent = emailTemplate.html;
    if (input.customMessage) {
      const customMessageHtml = `
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h4 style="color: #1565c0; margin: 0 0 10px 0;">💬 Mensaje Personalizado:</h4>
          <p style="margin: 0; color: #1565c0;">${input.customMessage}</p>
        </div>
      `;
      htmlContent = htmlContent.replace('<p>Nos complace presentar', customMessageHtml + '<p>Nos complace presentar');
    }

    // Generar PDF adjunto si se solicita
    let attachments: any[] = [];
    
    // Definir nombre de archivo PDF por defecto
    let pdfFilename = `Presupuesto_${budget.number}_Termas_Llifen.pdf`;
    
    if (input.includePDF) {
      try {
        console.log('📄 Generando PDF del presupuesto para adjuntar...');
        
        // Preparar datos para el PDF
        const budgetFormData: BudgetFormData = {
          quoteNumber: budget.number,
          clientId: budget.clientId,
          expirationDate: budget.expirationDate,
          paymentTerms: budget.paymentTerms || '',
          currency: budget.currency || 'CLP',
          notes: budget.notes || '',
          total: budget.total,
          lines: budget.lines.map(line => ({
            tempId: `line-${line.id}`,
            productId: line.productId,
            productName: line.product_name || line.description || 'Producto',
            description: line.description || line.product_name || 'Producto sin descripción',
            quantity: line.quantity,
            unitPrice: line.unit_price,
            discountPercent: line.discount_percent || 0,
            subtotal: line.subtotal
          }))
        };

        const clientFormData: ClientData | undefined = budget.client ? {
          id: budget.client.id,
          firstName: budget.client.firstName || budget.client.nombrePrincipal || '',
          lastName: budget.client.lastName || budget.client.apellido || '',
          email: budget.client.email || '',
          phone: budget.client.phone || budget.client.telefono || budget.client.telefonoMovil || '',
          address: budget.client.address || '',
          city: budget.client.city || '',
          rut: budget.client.rut || ''
        } : undefined;

        // Generar PDF en memoria
        let pdfBuffer: Buffer;
        
        if (input.useCustomHTML && input.customHTML) {
          // Usar HTML personalizado para generar PDF
          console.log('📄 Generando PDF con HTML personalizado...');
          pdfBuffer = await generateBudgetPDFWithCustomHTML(input.customHTML, budget.number);
        } else {
          // Usar plantilla estándar
          console.log('📄 Generando PDF con plantilla estándar...');
          pdfBuffer = await generateBudgetPDFBuffer(budgetFormData, clientFormData);
        }
        
        // Actualizar nombre del archivo PDF según el tipo
        pdfFilename = input.useCustomHTML 
          ? `Presupuesto_${budget.number}_Personalizado_Termas_Llifen.pdf`
          : `Presupuesto_${budget.number}_Termas_Llifen.pdf`;
          
        attachments.push({
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
        
        console.log('✅ PDF generado exitosamente para email');
        
        // Actualizar mensaje HTML para incluir información sobre el adjunto
        const pdfNoticeHtml = `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h4 style="color: #155724; margin: 0 0 10px 0;">📎 Documento Adjunto</h4>
            <p style="margin: 0; color: #155724;">
              Hemos incluido el presupuesto detallado en formato PDF ${input.useCustomHTML ? 'con diseño personalizado' : 'profesional'} para su descarga y archivo.
              ${input.useCustomHTML ? '<br><small>📋 Formato: Plantilla personalizada en formato carta A4</small>' : ''}
            </p>
          </div>
        `;
        htmlContent = htmlContent.replace('</body>', pdfNoticeHtml + '</body>');
        
      } catch (pdfError) {
        console.error('❌ Error generando PDF para email:', pdfError);
        // No fallar el envío por el PDF, solo registrar el error
        const pdfErrorHtml = `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Nota sobre el PDF</h4>
            <p style="margin: 0; color: #856404;">El documento PDF no pudo ser generado en este momento. Puede descargarlo desde nuestro sistema en línea.</p>
          </div>
        `;
        htmlContent = htmlContent.replace('</body>', pdfErrorHtml + '</body>');
      }
    }

    // Registrar email en historial (estado pending)
    const supabase = await getSupabaseServerClient();
    const { data: emailRecord, error: emailError } = await supabase
      .from('budget_emails')
      .insert({
        budget_id: input.budgetId,
        email_type: 'sent',
        recipient_email: input.recipientEmail,
        sender_email: process.env.GMAIL_USER,
        subject,
        body_html: htmlContent,
        body_text: emailTemplate.text,
        status: 'pending',
        sent_by: user.id,
        metadata: {
          template_used: 'budgetQuote',
          custom_message: input.customMessage,
          pdf_included: input.includePDF || false,
          pdf_filename: input.includePDF ? pdfFilename : null,
          custom_html_used: input.useCustomHTML || false,
          custom_html_length: input.useCustomHTML && input.customHTML ? input.customHTML.length : 0,
        },
      })
      .select()
      .single();

    if (emailError) {
      console.error('❌ Error registrando email en historial:', emailError);
      return {
        success: false,
        message: 'Error registrando email en historial',
      };
    }

    // Enviar email
    const sendResult = await sendEmail({
      to: input.recipientEmail,
      subject,
      html: htmlContent,
      text: emailTemplate.text,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    // Actualizar estado del email en historial
    if (sendResult.success) {
      await supabase
        .from('budget_emails')
        .update({
          status: 'sent',
          message_id: sendResult.messageId,
          sent_at: new Date().toISOString(),
        })
        .eq('id', emailRecord.id);

      console.log('✅ Presupuesto enviado exitosamente por email');
      return {
        success: true,
        message: `Presupuesto ${budget.number} enviado exitosamente a ${input.recipientEmail}`,
        emailId: emailRecord.id,
        messageId: sendResult.messageId,
      };
    } else {
      await supabase
        .from('budget_emails')
        .update({
          status: 'failed',
          error_message: sendResult.error,
        })
        .eq('id', emailRecord.id);

      return {
        success: false,
        message: sendResult.error || 'Error desconocido al enviar email',
      };
    }

  } catch (error) {
    console.error('❌ Error en sendBudgetEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Función para obtener historial de emails de un presupuesto
export async function getBudgetEmailHistory(budgetId: number): Promise<{
  success: boolean;
  data?: BudgetEmailHistoryItem[];
  error?: string;
}> {
  try {
    console.log('📋 Obteniendo historial de emails para presupuesto:', budgetId);

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('budget_emails_with_details')
      .select(`
        id,
        email_type,
        recipient_email,
        sender_email,
        subject,
        status,
        sent_at,
        created_at,
        sent_by_name,
        error_message
      `)
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo historial de emails:', error);
      return {
        success: false,
        error: 'Error al obtener historial de emails',
      };
    }

    return {
      success: true,
      data: data || [],
    };

  } catch (error) {
    console.error('❌ Error en getBudgetEmailHistory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Función para obtener estadísticas de emails de un presupuesto
export async function getBudgetEmailStats(budgetId: number): Promise<{
  success: boolean;
  data?: {
    total_emails: number;
    sent_emails: number;
    successful_emails: number;
    failed_emails: number;
    last_email_sent?: string;
  };
  error?: string;
}> {
  try {
    console.log('📊 Obteniendo estadísticas de emails para presupuesto:', budgetId);

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.rpc('get_budget_email_stats', {
      p_budget_id: budgetId,
    });

    if (error) {
      console.error('❌ Error obteniendo estadísticas de emails:', error);
      return {
        success: false,
        error: 'Error al obtener estadísticas de emails',
      };
    }

    const stats = data && data.length > 0 ? data[0] : {
      total_emails: 0,
      sent_emails: 0,
      successful_emails: 0,
      failed_emails: 0,
      last_email_sent: null,
    };

    return {
      success: true,
      data: {
        total_emails: Number(stats.total_emails) || 0,
        sent_emails: Number(stats.sent_emails) || 0,
        successful_emails: Number(stats.successful_emails) || 0,
        failed_emails: Number(stats.failed_emails) || 0,
        last_email_sent: stats.last_email_sent || undefined,
      },
    };

  } catch (error) {
    console.error('❌ Error en getBudgetEmailStats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Función para reenviar email fallido
export async function resendBudgetEmail(emailId: number): Promise<SendBudgetEmailResult> {
  try {
    console.log('🔄 Reenviando email ID:', emailId);

    const supabase = await getSupabaseServerClient();

    // Obtener datos del email original
    const { data: emailRecord, error: emailError } = await supabase
      .from('budget_emails')
      .select('*')
      .eq('id', emailId)
      .single();

    if (emailError || !emailRecord) {
      return {
        success: false,
        message: 'No se encontró el email especificado',
      };
    }

    // Reenviar usando los datos originales
    const sendResult = await sendEmail({
      to: emailRecord.recipient_email,
      subject: emailRecord.subject,
      html: emailRecord.body_html || '',
      text: emailRecord.body_text || '',
    });

    // Actualizar estado
    if (sendResult.success) {
      await supabase
        .from('budget_emails')
        .update({
          status: 'sent',
          message_id: sendResult.messageId,
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', emailId);

      return {
        success: true,
        message: 'Email reenviado exitosamente',
        emailId,
        messageId: sendResult.messageId,
      };
    } else {
      await supabase
        .from('budget_emails')
        .update({
          status: 'failed',
          error_message: sendResult.error,
        })
        .eq('id', emailId);

      return {
        success: false,
        message: sendResult.error || 'Error al reenviar email',
      };
    }

  } catch (error) {
    console.error('❌ Error en resendBudgetEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
} 