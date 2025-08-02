'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Función para crear cliente Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

// Tipos para correos enviados
export interface SentEmailData {
  clientId: number;
  recipientEmail: string;
  recipientName?: string;
  senderEmail?: string;
  senderName?: string;
  subject: string;
  body?: string;
  emailType: 'confirmation' | 'reminder' | 'payment_request' | 'follow_up' | 'marketing' | 'custom';
  reservationId?: number;
  budgetId?: number;
  templateUsed?: string;
  isAutomated?: boolean;
  attachments?: any[];
  metadata?: Record<string, any>;
}

export interface CommunicationSummary {
  clientId: number;
  summary: {
    totalEmailsSent: number;
    totalEmailsReceived: number;
    lastEmailSent?: string;
    lastEmailReceived?: string;
    totalReservationEmails: number;
    totalBudgetEmails: number;
    totalPaymentEmails: number;
    communicationScore: number;
    responseRate: number;
  };
  recentSentEmails: any[];
  recentReceivedEmails: any[];
}

// Función para registrar un correo enviado
export async function trackSentEmail(emailData: SentEmailData) {
  console.log(`📧 Registrando correo enviado a: ${emailData.recipientEmail}`);
  
  try {
    const supabase = await getSupabaseClient();
    
    // Usar la función SQL para registrar el correo
    const { data, error } = await supabase
      .rpc('track_sent_email', {
        p_client_id: emailData.clientId,
        p_recipient_email: emailData.recipientEmail,
        p_recipient_name: emailData.recipientName || null,
        p_sender_email: emailData.senderEmail || 'info@admintermas.com',
        p_sender_name: emailData.senderName || 'Hotel Termas Llifén',
        p_subject: emailData.subject,
        p_body: emailData.body || '',
        p_email_type: emailData.emailType,
        p_reservation_id: emailData.reservationId || null,
        p_budget_id: emailData.budgetId || null,
        p_template_used: emailData.templateUsed || null,
        p_is_automated: emailData.isAutomated || false,
        p_attachments: emailData.attachments ? JSON.stringify(emailData.attachments) : null,
        p_metadata: emailData.metadata ? JSON.stringify(emailData.metadata) : null
      });

    if (error) {
      console.error('❌ Error registrando correo enviado:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Correo enviado registrado exitosamente:`, data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error en trackSentEmail:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// Función para obtener resumen de comunicaciones de un cliente
export async function getClientCommunicationSummary(clientId: number): Promise<CommunicationSummary | null> {
  console.log(`📊 Obteniendo resumen de comunicaciones del cliente: ${clientId}`);
  
  try {
    const supabase = await getSupabaseClient();
    
    // Usar la función SQL para obtener el resumen
    const { data, error } = await supabase
      .rpc('get_client_communication_summary', { p_client_id: clientId });

    if (error) {
      console.error('❌ Error obteniendo resumen de comunicaciones:', error);
      return null;
    }

    console.log(`✅ Resumen de comunicaciones obtenido:`, data);
    return data as CommunicationSummary;

  } catch (error) {
    console.error('❌ Error en getClientCommunicationSummary:', error);
    return null;
  }
}

// Función para obtener estadísticas globales de correos enviados
export async function getSentEmailsStats(days: number = 30) {
  console.log(`📈 Obteniendo estadísticas de correos enviados de los últimos ${days} días`);
  
  try {
    const supabase = await getSupabaseClient();
    
    // Usar la función SQL para obtener estadísticas
    const { data, error } = await supabase
      .rpc('get_sent_emails_stats', { p_days: days });

    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }

    console.log(`✅ Estadísticas obtenidas:`, data);
    return data;

  } catch (error) {
    console.error('❌ Error en getSentEmailsStats:', error);
    return null;
  }
}

// Función para obtener correos enviados recientes
export async function getRecentSentEmails(limit: number = 20) {
  console.log(`📋 Obteniendo ${limit} correos enviados recientes`);
  
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('SentEmailTracking')
      .select(`
        id,
        recipientEmail,
        recipientName,
        subject,
        emailType,
        status,
        sentAt,
        Client!inner (
          id,
          nombrePrincipal
        )
      `)
      .order('sentAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error obteniendo correos enviados recientes:', error);
      return [];
    }

    console.log(`✅ ${data.length} correos enviados recientes obtenidos`);
    return data.map(email => ({
      id: email.id,
      recipientEmail: email.recipientEmail,
      recipientName: email.recipientName,
      subject: email.subject,
      emailType: email.emailType,
      status: email.status,
      sentAt: email.sentAt,
      clientName: email.Client?.nombrePrincipal || 'Cliente desconocido'
    }));

  } catch (error) {
    console.error('❌ Error en getRecentSentEmails:', error);
    return [];
  }
}

// Función para marcar correo como entregado/leído
export async function updateSentEmailStatus(emailId: number, status: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed') {
  console.log(`📧 Actualizando estado del correo ${emailId} a: ${status}`);
  
  try {
    const supabase = await getSupabaseClient();
    
    const updateData: any = { status };
    
    // Agregar timestamp según el estado
    switch (status) {
      case 'delivered':
        updateData.deliveredAt = new Date().toISOString();
        break;
      case 'opened':
        updateData.openedAt = new Date().toISOString();
        break;
      case 'clicked':
        updateData.clickedAt = new Date().toISOString();
        break;
    }
    
    const { data, error } = await supabase
      .from('SentEmailTracking')
      .update(updateData)
      .eq('id', emailId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando estado del correo:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Estado del correo actualizado exitosamente:`, data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error en updateSentEmailStatus:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// Función para obtener correos por cliente específico
export async function getClientSentEmails(clientId: number, limit: number = 10) {
  console.log(`📧 Obteniendo correos enviados del cliente: ${clientId}`);
  
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('SentEmailTracking')
      .select('*')
      .eq('clientId', clientId)
      .order('sentAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error obteniendo correos del cliente:', error);
      return [];
    }

    console.log(`✅ ${data.length} correos del cliente obtenidos`);
    return data;

  } catch (error) {
    console.error('❌ Error en getClientSentEmails:', error);
    return [];
  }
}

// Función para registrar múltiples correos (para envíos masivos)
export async function trackBulkSentEmails(emailsData: SentEmailData[]) {
  console.log(`📧 Registrando ${emailsData.length} correos enviados en lote`);
  
  const results = [];
  
  for (const emailData of emailsData) {
    try {
      const result = await trackSentEmail(emailData);
      results.push({ email: emailData.recipientEmail, result });
    } catch (error) {
      console.error(`❌ Error registrando correo a ${emailData.recipientEmail}:`, error);
      results.push({ 
        email: emailData.recipientEmail, 
        result: { success: false, error: 'Error en registro' } 
      });
    }
  }
  
  const successful = results.filter(r => r.result.success).length;
  const failed = results.filter(r => !r.result.success).length;
  
  console.log(`✅ Registro masivo completado: ${successful} éxito, ${failed} fallos`);
  
  return {
    total: emailsData.length,
    successful,
    failed,
    results
  };
} 