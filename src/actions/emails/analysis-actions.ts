'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getReceivedEmails } from '@/actions/emails/email-reader-actions';
import { chatWithOpenAI } from '@/actions/ai/openai-actions';
import { getAnalysisSettings } from './analysis-config';
import { 
  processPromptTemplate, 
  formatEmailsForAnalysis, 
  debugAnalysisSettings,
  type AnalysisSettings
} from '@/utils/email-analysis-utils';
import { analyzeEmailsForClients } from './client-analysis-actions';

// Tipos para el análisis de correos
export interface EmailAnalysisResult {
  id: number;
  analysisDate: string;
  executionTime: string;
  timeSlot: string;
  emailsAnalyzed: number;
  summary: string;
  detailedAnalysis?: string;
  keyTopics?: string[];
  sentimentAnalysis?: {
    positive: number;
    neutral: number;
    negative: number;
    score: number;
  };
  urgentEmails?: Array<{
    subject: string;
    from: string;
    reason: string;
  }>;
  actionRequired?: string[];
  metadata?: {
    domains?: string[];
    types?: string[];
    response_time_avg?: string;
  };
  analysisStatus: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}



// Determinar el slot de tiempo actual
function getCurrentTimeSlot(): string {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 15) return 'midday';
  if (hour >= 15 && hour < 20) return 'afternoon';
  return 'evening';
}

// Función principal para analizar correos del día actual
export async function analyzeEmailsToday(): Promise<{ success: boolean; data?: EmailAnalysisResult; error?: string }> {
  console.log('🔍 Iniciando análisis de correos del día...');

  try {
    // Cargar configuración personalizada
    const settings = await getAnalysisSettings();
    debugAnalysisSettings(settings);

    const supabase = await getSupabaseServerClient();
    const timeSlot = getCurrentTimeSlot();
    const today = new Date().toISOString().split('T')[0];

    // Verificar si ya existe un análisis para este slot de tiempo de hoy
    const { data: existingAnalysis } = await supabase
      .from('EmailAnalysis')
      .select('*')
      .eq('analysisDate', today)
      .eq('timeSlot', timeSlot)
      .single();

    if (existingAnalysis) {
      console.log(`ℹ️ Ya existe análisis para ${timeSlot} de hoy`);
      return { success: true, data: existingAnalysis };
    }

    // Crear registro inicial en estado 'processing'
    const { data: processingRecord, error: insertError } = await supabase
      .from('EmailAnalysis')
      .insert({
        analysisDate: today,
        timeSlot,
        emailsAnalyzed: 0,
        summary: 'Análisis en proceso...',
        analysisStatus: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creando registro de análisis:', insertError);
      return { success: false, error: 'Error al inicializar análisis' };
    }

    // Leer correos NO LEÍDOS del día actual con configuración personalizada
    console.log('📧 Leyendo correos NO LEÍDOS del día actual...');
    console.log(`⚙️ Usando configuración: máx ${settings.maxEmails} correos, límite texto ${settings.textLimit} chars`);
    
    const emailsResult = await getReceivedEmails({
      dateFrom: new Date(today),
      dateTo: new Date(new Date().setHours(23, 59, 59, 999)),
      isRead: false, // 🔥 SOLO CORREOS NO LEÍDOS
      limit: settings.maxEmails,
      timeout: settings.timeouts.emailFetch
    });

    if (!emailsResult.success || !emailsResult.emails) {
      console.error('❌ Error leyendo correos:', emailsResult.error);
      
      await supabase
        .from('EmailAnalysis')
        .update({
          analysisStatus: 'failed',
          errorMessage: emailsResult.error || 'Error leyendo correos'
        })
        .eq('id', processingRecord.id);

      return { success: false, error: emailsResult.error || 'Error leyendo correos' };
    }

    const emails = emailsResult.emails;
    console.log(`📊 Encontrados ${emails.length} correos NO LEÍDOS del día`);

    if (emails.length === 0) {
      // Actualizar con análisis vacío
      const { data: updatedRecord } = await supabase
        .from('EmailAnalysis')
        .update({
          emailsAnalyzed: 0,
          summary: '✅ Excelente! No hay correos nuevos sin leer en este período. Todos los correos del día están al día.',
          detailedAnalysis: 'Sin correos no leídos detectados. Esto indica que el equipo está al día con la correspondencia electrónica.',
          keyTopics: ['Sin correos pendientes'],
          sentimentAnalysis: { positive: 1, neutral: 0, negative: 0, score: 1 },
          urgentEmails: [],
          actionRequired: ['Mantener el buen trabajo revisando correos regularmente'],
          metadata: { domains: [], types: [], response_time_avg: 'N/A' },
          analysisStatus: 'completed'
        })
        .eq('id', processingRecord.id)
        .select()
        .single();

      return { success: true, data: updatedRecord.data };
    }

    // Preparar datos para ChatGPT usando configuración personalizada
    const emailsForAnalysis = emails.map(email => ({
      subject: email.subject,
      from: email.from.address,
      date: email.date,
      text: email.text?.substring(0, settings.textLimit) || 'Sin contenido de texto',
      isSpam: email.isSpam,
      priority: email.priority,
      labels: email.labels
    }));

    // Formatear emails según configuración
    const emailData = formatEmailsForAnalysis(emailsForAnalysis, settings);

    // Procesar prompt personalizado con variables
    const prompt = processPromptTemplate(settings.customPrompt, {
      timeSlot,
      emailCount: emailsForAnalysis.length,
      emailData,
      today
    });

    console.log(`📝 Usando prompt personalizado (${settings.analysisDepth}) de ${settings.customPrompt.length} caracteres`);

    console.log('🤖 Enviando correos a ChatGPT para análisis...');
    
    // Enviar a ChatGPT con timeout personalizable
    const aiResponse = await chatWithOpenAI({
      messages: [
        {
          role: 'system',
          content: 'Eres un experto analista de correos electrónicos para hoteles y spas. Proporciona análisis precisos y útiles en formato JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      taskType: 'analysis',
      timeout: settings.timeouts.aiAnalysis
    });

    if (!aiResponse.success || !aiResponse.data?.message) {
      console.error('❌ Error en análisis de ChatGPT:', aiResponse.error || 'Respuesta vacía');
      
      await supabase
        .from('EmailAnalysis')
        .update({
          analysisStatus: 'failed',
          errorMessage: aiResponse.error || 'Error en análisis de IA - respuesta vacía'
        })
        .eq('id', processingRecord.id);

      return { success: false, error: aiResponse.error || 'Error en análisis de IA - respuesta vacía' };
    }

    // Parsear respuesta de ChatGPT
    let analysisData;
    try {
      // Validar que la respuesta no esté vacía
      if (!aiResponse.data.message || typeof aiResponse.data.message !== 'string') {
        throw new Error('Respuesta de ChatGPT vacía o no válida');
      }

      // Limpiar la respuesta en caso de que venga con texto adicional
      const cleanResponse = aiResponse.data.message.trim();
      
      if (!cleanResponse) {
        throw new Error('Respuesta de ChatGPT vacía después de limpiar');
      }

      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const jsonStr = cleanResponse.substring(jsonStart, jsonEnd);
      
      if (!jsonStr) {
        throw new Error('JSON extraído está vacío');
      }
      
      analysisData = JSON.parse(jsonStr);
      console.log('✅ Análisis de ChatGPT parseado exitosamente');
    } catch (parseError) {
      console.error('❌ Error parseando respuesta de ChatGPT:', parseError);
      console.log('🔍 Respuesta recibida:', aiResponse.data.message);
      console.log('🔍 Tipo de respuesta:', typeof aiResponse.data.message);
      
      // Crear análisis básico en caso de error de parsing
      analysisData = {
        summary: `Análisis ${timeSlot}: ${emails.length} correos procesados. Error en análisis detallado de IA.`,
        detailedAnalysis: 'Error al procesar análisis detallado con IA. Análisis manual requerido.',
        keyTopics: ['correos_entrantes'],
        sentimentAnalysis: { positive: 0, neutral: emails.length, negative: 0, score: 0 },
        urgentEmails: [],
        actionRequired: ['Revisar correos manualmente'],
        metadata: {
          domains: [...new Set(emails.map(e => e.from.address.split('@')[1]))],
          types: ['correos_generales'],
          trends: 'Error en análisis de IA'
        }
      };
    }

    // NUEVA FUNCIONALIDAD: Analizar clientes automáticamente
    console.log('👥 Iniciando análisis de identificación de clientes...');
    let clientAnalysisResults = [];
    try {
      clientAnalysisResults = await analyzeEmailsForClients(emails, processingRecord.id);
      console.log(`✅ Análisis de clientes completado: ${clientAnalysisResults.length} correos procesados`);
      
      // Agregar información de clientes al resumen si se encontraron
      const clientsFound = clientAnalysisResults.filter(r => r.clientFound).length;
      const paymentsFound = clientAnalysisResults.filter(r => r.paymentInfo?.mentionsPavement).length;
      
      if (clientsFound > 0 || paymentsFound > 0) {
        analysisData.summary += ` | 👥 Clientes identificados: ${clientsFound}, Pagos detectados: ${paymentsFound}`;
        
        // Agregar información de clientes a los metadatos
        if (!analysisData.metadata) analysisData.metadata = {};
        analysisData.metadata.clientsIdentified = clientsFound;
        analysisData.metadata.paymentsDetected = paymentsFound;
        analysisData.metadata.clientAnalysisResults = clientAnalysisResults.map(r => ({
          email: r.email,
          clientFound: r.clientFound,
          paymentDetected: r.paymentInfo?.mentionsPavement || false,
          amount: r.paymentInfo?.amount,
          clientName: r.clientInfo?.name
        }));
      }
    } catch (clientAnalysisError) {
      console.error('❌ Error en análisis de clientes:', clientAnalysisError);
      // No fallar el análisis general si falla el análisis de clientes
    }

    // Actualizar registro con análisis completo
    const { data: finalRecord, error: updateError } = await supabase
      .from('EmailAnalysis')
      .update({
        emailsAnalyzed: emails.length,
        summary: analysisData.summary,
        detailedAnalysis: analysisData.detailedAnalysis,
        keyTopics: analysisData.keyTopics,
        sentimentAnalysis: analysisData.sentimentAnalysis,
        urgentEmails: analysisData.urgentEmails,
        actionRequired: analysisData.actionRequired,
        metadata: analysisData.metadata,
        analysisStatus: 'completed'
      })
      .eq('id', processingRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando análisis:', updateError);
      return { success: false, error: 'Error guardando análisis' };
    }

    console.log('✅ Análisis de correos completado exitosamente');
    
    // Revalidar las páginas relacionadas
    revalidatePath('/dashboard/emails');
    
    return { success: true, data: finalRecord.data };

  } catch (error) {
    console.error('❌ Error en analyzeEmailsToday:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// Obtener análisis recientes
export async function getRecentAnalysis(limit: number = 10): Promise<{ success: boolean; data?: EmailAnalysisResult[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('EmailAnalysis')
      .select('*')
      .order('executionTime', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      console.error('Error obteniendo análisis:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error en getRecentAnalysis:', error);
    return { success: true, data: [] };
  }
}

// Obtener análisis del día actual
export async function getTodayAnalysis(): Promise<{ success: boolean; data?: EmailAnalysisResult[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('EmailAnalysis')
      .select('*')
      .eq('analysisDate', today)
      .order('executionTime', { ascending: false });

    if (error) {
      // Si la tabla no existe, retornar vacío silenciosamente
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      console.error('Error obteniendo análisis de hoy:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error en getTodayAnalysis:', error);
    return { success: true, data: [] };
  }
}

/**
 * Obtener información de la última sincronización de correos
 */
export async function getLastSyncInfo() {
  try {
    console.log('🔍 getLastSyncInfo - obteniendo última sincronización...');
    
    const supabase = await getSupabaseServerClient();

    // Obtener el último análisis realizado
    const { data: lastAnalysis, error } = await supabase
      .from('EmailAnalysis')
      .select('*')
      .order('executionTime', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Si la tabla no existe (código 42P01), retornar valores por defecto
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: true,
          data: {
            lastSync: null,
            lastSyncText: 'Tabla EmailAnalysis no configurada',
            nextSync: 'Sistema requiere configuración de análisis',
            status: 'not_configured',
            emailsAnalyzed: 0,
            lastExecutionTime: null
          }
        };
      }
      
      // Si no hay registros (código PGRST116), es normal
      if (error.code === 'PGRST116') {
        console.log('ℹ️ No hay análisis previos registrados');
        return { 
          success: true, 
          data: {
            lastSync: null,
            lastSyncText: 'Nunca se ha ejecutado',
            nextSync: 'Próximo análisis automático pendiente',
            status: 'never_run',
            emailsAnalyzed: 0,
            lastExecutionTime: null
          }
        };
      }
      
      // Otros errores
      console.error('❌ Error en getLastSyncInfo:', error);
      return { success: false, error: error.message };
    }

    if (!lastAnalysis) {
      console.log('ℹ️ No hay análisis previos registrados');
      return { 
        success: true, 
        data: {
          lastSync: null,
          lastSyncText: 'Nunca se ha ejecutado',
          nextSync: 'Próximo análisis automático pendiente',
          status: 'never_run',
          emailsAnalyzed: 0,
          lastExecutionTime: null
        }
      };
    }

    // Calcular tiempo transcurrido desde la última sincronización
    const lastSyncDate = new Date(lastAnalysis.executionTime);
    const now = new Date();
    const diffMs = now.getTime() - lastSyncDate.getTime();
    
    let lastSyncText = '';
    if (diffMs < 60000) { // Menos de 1 minuto
      lastSyncText = 'Hace menos de 1 minuto';
    } else if (diffMs < 3600000) { // Menos de 1 hora
      const minutes = Math.floor(diffMs / 60000);
      lastSyncText = `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffMs < 86400000) { // Menos de 1 día
      const hours = Math.floor(diffMs / 3600000);
      lastSyncText = `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffMs / 86400000);
      lastSyncText = `Hace ${days} día${days > 1 ? 's' : ''}`;
    }

    // Obtener total de análisis de hoy
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAnalysis } = await supabase
      .from('EmailAnalysis')
      .select('id')
      .gte('executionTime', today);

    const totalAnalysisToday = todayAnalysis?.length || 0;

    // Calcular próximo análisis (aproximado)
    const nextSyncHours = ['06:00', '12:00', '15:00', '20:00'];
    const currentHour = now.getHours();
    let nextSync = 'Mañana a las 06:00';
    
    for (const hour of nextSyncHours) {
      const [h] = hour.split(':').map(Number);
      if (h > currentHour) {
        nextSync = `Hoy a las ${hour}`;
        break;
      }
    }

    console.log('✅ getLastSyncInfo - información obtenida correctamente');
    
    return {
      success: true,
      data: {
        lastSync: lastSyncDate,
        lastSyncText,
        nextSync,
        totalAnalysisToday,
        lastAnalysisData: lastAnalysis
      }
    };

  } catch (error) {
    console.error('❌ Error en getLastSyncInfo:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// Eliminar análisis específico
export async function deleteAnalysis(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('EmailAnalysis')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando análisis:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/emails');
    return { success: true };
  } catch (error) {
    console.error('❌ Error en deleteAnalysis:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// Forzar nuevo análisis (ignora si ya existe para este slot)
export async function forceNewAnalysis(): Promise<{ success: boolean; data?: EmailAnalysisResult; error?: string }> {
  console.log('🔄 Forzando nuevo análisis...');
  
  try {
    const supabase = await getSupabaseServerClient();
    const timeSlot = getCurrentTimeSlot();
    const today = new Date().toISOString().split('T')[0];

    // Eliminar análisis existente de este slot de tiempo si existe
    await supabase
      .from('EmailAnalysis')
      .delete()
      .eq('analysisDate', today)
      .eq('timeSlot', timeSlot);

    // Ejecutar nuevo análisis
    return await analyzeEmailsToday();
  } catch (error) {
    console.error('❌ Error en forceNewAnalysis:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 