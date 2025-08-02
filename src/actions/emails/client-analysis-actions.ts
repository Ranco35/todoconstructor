'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { extractPaymentInfo } from '@/utils/email-client-utils';

// Función para crear cliente Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

// Interfaz para información de cliente
export interface ClientInfo {
  found: boolean;
  email: string;
  client?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    rut?: string;
    created_at: string;
  };
  reservations_summary?: {
    total: number;
    confirmed: number;
    pending: number;
    last_reservation_date?: string;
  };
}

// Interfaz para reservas recientes
export interface RecentReservation {
  id: number;
  check_in: string;
  check_out: string;
  status: string;
  total_amount?: number;
  guest_count: number;
  special_requests?: string;
  created_at: string;
}

// Función para buscar cliente por email
export async function findClientByEmail(email: string): Promise<ClientInfo> {
  console.log(`🔍 Buscando cliente por email: ${email}`);
  
  try {
    const supabase = await getSupabaseClient();
    
    // Usar la función SQL creada en la migración
    const { data, error } = await supabase
      .rpc('find_client_by_email', { p_email: email });

    if (error) {
      console.error('❌ Error buscando cliente:', error);
      return { found: false, email };
    }

    console.log(`✅ Resultado búsqueda cliente:`, data);
    return data as ClientInfo;

  } catch (error) {
    console.error('❌ Error en findClientByEmail:', error);
    return { found: false, email };
  }
}

// Función para obtener reservas recientes de un cliente
export async function getClientRecentReservations(clientId: number, limit: number = 5): Promise<RecentReservation[]> {
  console.log(`📋 Obteniendo reservas recientes del cliente: ${clientId}`);
  
  try {
    const supabase = await getSupabaseClient();
    
    // Usar la función SQL creada en la migración
    const { data, error } = await supabase
      .rpc('get_client_recent_reservations', { 
        p_client_id: clientId, 
        p_limit: limit 
      });

    if (error) {
      console.error('❌ Error obteniendo reservas:', error);
      return [];
    }

    console.log(`✅ Reservas obtenidas: ${data?.length || 0}`);
    return data || [];

  } catch (error) {
    console.error('❌ Error en getClientRecentReservations:', error);
    return [];
  }
}

// Función para asociar correo con cliente
export async function associateEmailWithClient(params: {
  emailAnalysisId: number;
  senderEmail: string;
  subject?: string;
  isPaymentRelated?: boolean;
  paymentAmount?: number;
  notes?: string;
}) {
  console.log(`🔗 Asociando correo con cliente:`, {
    emailAnalysisId: params.emailAnalysisId,
    senderEmail: params.senderEmail,
    isPaymentRelated: params.isPaymentRelated
  });
  
  try {
    const supabase = await getSupabaseClient();
    
    // Usar la función SQL creada en la migración
    const { data, error } = await supabase
      .rpc('associate_email_with_client', {
        p_email_analysis_id: params.emailAnalysisId,
        p_sender_email: params.senderEmail,
        p_subject: params.subject || null,
        p_is_payment_related: params.isPaymentRelated || false,
        p_payment_amount: params.paymentAmount || null,
        p_notes: params.notes || null
      });

    if (error) {
      console.error('❌ Error asociando correo con cliente:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Asociación creada exitosamente:`, data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error en associateEmailWithClient:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// Las funciones utilitarias se movieron a src/utils/email-client-utils.ts
// para evitar conflictos con Server Actions

// Función para analizar correos y buscar clientes automáticamente
export async function analyzeEmailsForClients(emails: any[], analysisId: number) {
  console.log(`🔍 Analizando ${emails.length} correos para identificar clientes...`);
  
  const results = [];
  
  for (const email of emails) {
    try {
      // Buscar cliente por email
      const clientInfo = await findClientByEmail(email.from.address);
      
      // Extraer información de pagos del contenido
      const paymentInfo = extractPaymentInfo(email.text || email.subject || '');
      
      if (clientInfo.found) {
        // Si es cliente registrado, crear asociación
        const associationResult = await associateEmailWithClient({
          emailAnalysisId: analysisId,
          senderEmail: email.from.address,
          subject: email.subject,
          isPaymentRelated: paymentInfo.mentionsPavement,
          paymentAmount: paymentInfo.amount,
          notes: paymentInfo.method ? `Método: ${paymentInfo.method}` : undefined
        });
        
        results.push({
          email: email.from.address,
          subject: email.subject,
          clientFound: true,
          clientInfo: clientInfo.client,
          paymentInfo,
          associationCreated: associationResult.success
        });
      } else {
        results.push({
          email: email.from.address,
          subject: email.subject,
          clientFound: false,
          paymentInfo
        });
      }
      
    } catch (error) {
      console.error(`❌ Error analizando correo ${email.from.address}:`, error);
      results.push({
        email: email.from.address,
        subject: email.subject,
        error: 'Error en análisis'
      });
    }
  }
  
  console.log(`✅ Análisis de clientes completado. Resultados: ${results.length}`);
  return results;
} 