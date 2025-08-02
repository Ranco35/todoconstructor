'use server';

import { 
  DEFAULT_ANALYSIS_SETTINGS, 
  type AnalysisSettings 
} from '@/utils/email-analysis-utils';

// Función para obtener configuración personalizada desde variables de entorno
export async function getAnalysisSettings(): Promise<AnalysisSettings> {
  try {
    // Configuración específica para Hotel/Spa Termas Llifén con prompt personalizado
    const customHotelSettings = {
      ...DEFAULT_ANALYSIS_SETTINGS,
      textLimit: 500, // Límite más bajo para el hotel
      customPrompt: `Como asistente de análisis de correos electrónicos para el Hotel/Spa Termas Llifén, analiza los siguientes correos recibidos hoy ({today}) en el horario {timeSlot}:

CORREOS A ANALIZAR ({emailCount} total):
{emailData}

⚠️ IMPORTANTE - CORREOS A EXCLUIR:
- NO analizar correos con asunto que contenga "Planilla de reserva" (son notificaciones internas de Google Drive)
- NO contar correos de Google Drive automáticos (Hojas de cálculo de Google)
- NO incluir notificaciones de sistemas internos

IMPORTANTE: Para cada correo válido (excluyendo los anteriores), identifica si el remitente podría ser un CLIENTE REGISTRADO del hotel y si menciona PAGOS o TRANSFERENCIAS.

Por favor proporciona un análisis estructurado en el siguiente formato JSON:

{
  "summary": "Resumen ejecutivo de 2-3 líneas de los correos analizados",
  "detailedAnalysis": "Análisis detallado de patrones, tendencias y observaciones importantes. INCLUIR información sobre clientes identificados y pagos detectados",
  "keyTopics": ["tema1", "tema2", "tema3"],
  "clientsIdentified": [
    {
      "email": "email_del_cliente",
      "name": "nombre_si_se_detecta",
      "paymentMentioned": true/false,
      "paymentAmount": "monto_si_se_menciona",
      "reservationDates": "fechas_mencionadas_si_aplica"
    }
  ],
  "paymentsDetected": [
    {
      "senderEmail": "email_remitente",
      "subject": "asunto_del_correo",
      "amount": "monto_mencionado",
      "method": "transferencia/depósito/etc",
      "reservationReference": "fechas_o_referencia_mencionada"
    }
  ],
  "sentimentAnalysis": {
    "positive": número_de_correos_positivos,
    "neutral": número_de_correos_neutrales, 
    "negative": número_de_correos_negativos,
    "score": puntuación_general_de_-1_a_1
  },
  "urgentEmails": [
    {
      "subject": "asunto_del_correo",
      "from": "remitente",
      "reason": "razón_por_la_cual_es_urgente",
      "isClient": true/false,
      "paymentRelated": true/false
    }
  ],
  "actionRequired": ["acción1", "acción2", "acción3"],
  "metadata": {
    "domains": ["dominio1.com", "dominio2.com"],
    "types": ["reservas", "consultas", "quejas", "soporte", "pagos"],
    "trends": "tendencias_observadas",
    "clientEmails": número_de_correos_de_clientes_detectados,
    "paymentEmails": número_de_correos_con_pagos,
    "excludedEmails": número_de_correos_excluidos_google_drive,
    "totalValidEmails": número_de_correos_válidos_analizados
  }
}

Enfócate especialmente en:
- 💰 PAGOS Y TRANSFERENCIAS (MÁXIMA PRIORIDAD): Identificar correos con comprobantes, transferencias o confirmaciones de pago
- 👥 IDENTIFICACIÓN DE CLIENTES: Extraer emails y nombres que podrían corresponder a clientes registrados
- 🏨 Reservas y consultas de alojamiento
- ⚠️ Quejas o problemas de servicio  
- 🧘‍♀️ Consultas sobre servicios del spa
- 📅 Cancelaciones o modificaciones
- 💬 Feedback de huéspedes
- 🚨 Correos que requieren respuesta urgente

INSTRUCCIONES ESPECIALES PARA PAGOS:
- Buscar palabras como: "pago", "transferencia", "depósito", "comprobante", "abono", "envío"
- Extraer montos mencionados (ejemplos: $50.000, 50000, cincuenta mil)
- Identificar métodos de pago mencionados
- Buscar fechas de reserva asociadas

INSTRUCCIONES ESPECIALES PARA FILTRADO:
- OBLIGATORIO: Excluir completamente los correos con asunto "Planilla de reserva"
- OBLIGATORIO: No contar correos de "(Hojas de cálculo de Google)" en estadísticas
- OBLIGATORIO: Solo analizar correos de clientes reales del hotel
- Informar cuántos correos fueron excluidos en "excludedEmails"
- Informar cuántos correos válidos se analizaron en "totalValidEmails"

Responde SOLO con el JSON válido, sin texto adicional.`,
      scheduleConfig: {
        enabled: true,
        times: ['06:00', '12:00', '15:00', '20:00']
      }
    };

    // Aplicar configuración desde variables de entorno si existen
    const envSettings = {
      maxEmails: process.env.EMAIL_ANALYSIS_MAX_EMAILS ? parseInt(process.env.EMAIL_ANALYSIS_MAX_EMAILS) : customHotelSettings.maxEmails,
      textLimit: process.env.EMAIL_ANALYSIS_TEXT_LIMIT ? parseInt(process.env.EMAIL_ANALYSIS_TEXT_LIMIT) : customHotelSettings.textLimit,
      enableSpamFilter: process.env.EMAIL_ANALYSIS_SPAM_FILTER !== 'false',
      customPrompt: process.env.EMAIL_ANALYSIS_CUSTOM_PROMPT || customHotelSettings.customPrompt,
      analysisDepth: (process.env.EMAIL_ANALYSIS_DEPTH as AnalysisSettings['analysisDepth']) || customHotelSettings.analysisDepth,
      enableUrgentDetection: process.env.EMAIL_ANALYSIS_URGENT_DETECTION !== 'false',
      enableSentimentAnalysis: process.env.EMAIL_ANALYSIS_SENTIMENT !== 'false',
      timeouts: {
        emailFetch: process.env.EMAIL_ANALYSIS_TIMEOUT_FETCH ? parseInt(process.env.EMAIL_ANALYSIS_TIMEOUT_FETCH) : customHotelSettings.timeouts.emailFetch,
        aiAnalysis: process.env.EMAIL_ANALYSIS_TIMEOUT_AI ? parseInt(process.env.EMAIL_ANALYSIS_TIMEOUT_AI) : customHotelSettings.timeouts.aiAnalysis
      },
      scheduleConfig: {
        enabled: process.env.EMAIL_ANALYSIS_SCHEDULE_ENABLED !== 'false',
        times: process.env.EMAIL_ANALYSIS_SCHEDULE_TIMES ? process.env.EMAIL_ANALYSIS_SCHEDULE_TIMES.split(',') : customHotelSettings.scheduleConfig.times
      }
    };

    return { ...customHotelSettings, ...envSettings };
  } catch (error) {
    console.error('❌ Error obteniendo configuración de análisis:', error);
    return DEFAULT_ANALYSIS_SETTINGS;
  }
} 