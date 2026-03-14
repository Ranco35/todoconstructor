'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email-service';
import { buildBrandedEmailHtml, buildBrandedEmailText, textToHtml } from '@/lib/email/branded-template';
import { updateCRMLead } from './leads';

export interface SendLeadEmailInput {
  leadId: number;
  recipientEmail: string;
  subject: string;
  message: string;
  clientName: string;
}

export interface SendLeadEmailResult {
  success: boolean;
  message: string;
  messageId?: string;
}

/**
 * Envía un email al cliente directamente desde el lead CRM.
 * - Envía email HTML con branding completo (logo, firma, footer)
 * - Registra la comunicación como actividad CRM (type='email', status='completed')
 * - Auto-avanza el lead de stage 1→2 si está en nuevo_contacto
 */
export interface LeadEmailHistoryItem {
  id: number;
  lead_id: number;
  subject: string;
  description: string;
  status: string;
  outcome?: string;
  completed_at?: string;
  created_at: string;
  // Parsed fields from description
  recipientEmail: string;
  emailSubject: string;
  emailBody: string;
}

/**
 * Obtiene el historial de emails enviados desde un lead.
 * Lee las actividades de tipo 'email' de crm_activities.
 */
export async function getLeadEmailHistory(leadId: number): Promise<{ success: boolean; data?: LeadEmailHistoryItem[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('lead_id', leadId)
      .eq('type', 'email')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead email history:', error);
      return { success: false, error: error.message };
    }

    // Parse description to extract email details
    const emails: LeadEmailHistoryItem[] = (data || []).map((activity: any) => {
      const desc = activity.description || '';
      // Format: "Para: email\nAsunto: subject\n\nmessage"
      const lines = desc.split('\n');
      let recipientEmail = '';
      let emailSubject = '';
      let emailBody = '';

      const paraLine = lines.find((l: string) => l.startsWith('Para: '));
      if (paraLine) recipientEmail = paraLine.replace('Para: ', '').trim();

      const asuntoLine = lines.find((l: string) => l.startsWith('Asunto: '));
      if (asuntoLine) emailSubject = asuntoLine.replace('Asunto: ', '').trim();

      // Body is everything after the first blank line
      const blankIdx = lines.findIndex((l: string, i: number) => i > 0 && l.trim() === '');
      if (blankIdx !== -1) {
        emailBody = lines.slice(blankIdx + 1).join('\n').trim();
      }

      return {
        id: activity.id,
        lead_id: activity.lead_id,
        subject: activity.subject,
        description: activity.description,
        status: activity.status,
        outcome: activity.outcome,
        completed_at: activity.completed_at,
        created_at: activity.created_at,
        recipientEmail,
        emailSubject,
        emailBody,
      };
    });

    return { success: true, data: emails };
  } catch (error) {
    console.error('Error in getLeadEmailHistory:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function sendLeadEmail(input: SendLeadEmailInput): Promise<SendLeadEmailResult> {
  try {
    const { leadId, recipientEmail, subject, message, clientName } = input;

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return { success: false, message: 'El formato del email no es válido' };
    }

    // Construir HTML con branding completo de TodoConstructor
    const bodyHtml = textToHtml(message);
    const html = buildBrandedEmailHtml({
      clientName,
      bodyHtml,
    });

    const textVersion = buildBrandedEmailText(clientName, message);

    // Enviar email
    const sendResult = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: textVersion,
    });

    if (!sendResult.success) {
      return {
        success: false,
        message: sendResult.error || 'Error al enviar el email',
      };
    }

    // Registrar como actividad CRM completada
    const supabase = await getSupabaseServerClient();
    await supabase.from('crm_activities').insert({
      lead_id: leadId,
      type: 'email',
      subject: `Email enviado: ${subject}`,
      description: `Para: ${recipientEmail}\nAsunto: ${subject}\n\n${message}`,
      status: 'completed',
      completed_at: new Date().toISOString(),
      outcome: 'positive',
    });

    // Auto-avanzar stage: si está en 1 (nuevo_contacto) → mover a 2 (cliente_interesado)
    const { data: lead } = await supabase
      .from('crm_leads')
      .select('stage_id')
      .eq('id', leadId)
      .single();

    if (lead && lead.stage_id === 1) {
      await updateCRMLead({ id: leadId, stage_id: 2 });
    }

    return {
      success: true,
      message: `Email enviado exitosamente a ${recipientEmail}`,
      messageId: sendResult.messageId,
    };
  } catch (error) {
    console.error('Error en sendLeadEmail:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
