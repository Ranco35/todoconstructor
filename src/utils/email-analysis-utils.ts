// Configuración por defecto para análisis de emails
export const DEFAULT_ANALYSIS_SETTINGS = {
  maxEmails: 50,
  textLimit: 1000,
  enableSpamFilter: true,
  analysisDepth: 'detailed' as 'basic' | 'detailed' | 'comprehensive',
  enableUrgentDetection: true,
  enableSentimentAnalysis: true,
  timeouts: {
    emailFetch: 30000, // 30 segundos
    aiAnalysis: 60000  // 60 segundos
  },
  scheduleConfig: {
    enabled: true,
    times: ['08:00', '12:00', '16:00', '20:00']
  },
  customPrompt: ''
};

export type AnalysisSettings = typeof DEFAULT_ANALYSIS_SETTINGS;

// Plantillas de prompts predefinidas
export const PROMPT_TEMPLATES = {
  basic: `Analiza estos {emailCount} correos de {timeSlot} ({today}) y proporciona:

1. **Resumen breve** (2-3 líneas)
2. **Temas principales** (máximo 5)
3. **Correos urgentes** (si los hay)

Correos:
{emailData}`,

  detailed: `Como asistente de análisis de correos electrónicos para el Hotel/Spa Termas Llifén, analiza estos {emailCount} correos de {timeSlot} del {today}:

**INSTRUCCIONES PRINCIPALES:**
- ✅ **IDENTIFICAR CLIENTES:** Para cada correo, extraer email del remitente y verificar si es cliente registrado
- 💰 **DETECTAR PAGOS:** Identificar correos con transferencias, comprobantes o confirmaciones de pago
- 🏨 **ASOCIAR RESERVAS:** Conectar correos con fechas de reserva mencionadas
- 🚨 **PRIORIZAR URGENTES:** Destacar correos que requieren respuesta inmediata

**FORMATO DE RESPUESTA:**

## 📋 RESUMEN EJECUTIVO
[Descripción de 3-4 líneas del período analizado]

## 👥 IDENTIFICACIÓN DE CLIENTES REGISTRADOS
**Clientes Detectados en Correos:**
[Para cada cliente identificado:]
- **Email:** [dirección exacta]
- **Nombre:** [extraído del correo o BD]
- **Tipo de comunicación:** [Pago/Reserva/Consulta]
- **Requiere verificación en BD:** [Sí/No]

## 💰 CORREOS DE PAGOS Y CONFIRMACIONES
**ALTA PRIORIDAD - Requieren asociación con reservas:**
[Para cada correo de pago:]
- **Remitente:** [email + nombre si disponible]
- **Monto mencionado:** [cantidad]
- **Reserva asociada:** [fechas mencionadas]
- **Acción requerida:** [confirmar/asociar/actualizar]

## 📊 ESTADÍSTICAS CLAVE
- Total de correos: {emailCount}
- Clientes registrados identificados: [número]
- Correos de pagos detectados: [número]
- Correos urgentes: [número]
- Sentimiento predominante: [positivo/neutro/negativo]

## 🚨 CORREOS URGENTES
[Listar correos que requieren respuesta inmediata con email del remitente]

## 📌 TEMAS PRINCIPALES
[Top 5 temas más frecuentes]

## 🔗 ASOCIACIONES RECOMENDADAS
**Para asociar correo-cliente-reserva:**
[Para cada asociación sugerida:]
- **Cliente:** [Nombre] ([Email])
- **Reserva:** [Fechas mencionadas]
- **Tipo:** [Pago/Consulta/Modificación]
- **Prioridad:** [Alta/Media/Baja]

## 💡 ACCIONES RECOMENDADAS
1. **Inmediatas (próximas 2 horas):** [Confirmar pagos, responder urgentes]
2. **Seguimientos (24 horas):** [Verificar clientes en BD, asociar reservas]
3. **Administrativas:** [Actualizar historial de comunicaciones]

Correos a analizar:
{emailData}`,

  customerFocused: `Como especialista en experiencia del cliente, analiza estos {emailCount} correos de {timeSlot} ({today}) enfocándote en:

**PRIORIDADES:**
- Satisfacción del cliente
- Quejas o problemas reportados
- Oportunidades de mejora
- Feedback positivo

**ANÁLISIS REQUERIDO:**
1. **👥 Experiencia del Cliente**
2. **⚠️ Problemas Críticos**
3. **✅ Feedback Positivo**
4. **🎯 Oportunidades de Mejora**
5. **📞 Seguimientos Requeridos**

Correos:
{emailData}`,

  operational: `Como gerente de operaciones, analiza estos {emailCount} correos de {timeSlot} ({today}) desde una perspectiva operacional:

**ENFOQUE:**
- Procesos internos
- Eficiencia operacional
- Coordinación entre departamentos
- Temas administrativos

**ESTRUCTURA:**
1. **⚙️ Temas Operacionales**
2. **🔄 Procesos Afectados**
3. **👥 Departamentos Involucrados**
4. **📈 Impacto en Productividad**
5. **🛠️ Acciones Operacionales**

Correos:
{emailData}`,

  clientTracking: `Como especialista en seguimiento de clientes del Hotel/Spa Termas Llifén, analiza estos {emailCount} correos de {timeSlot} ({today}) con ENFOQUE PRINCIPAL en identificación y asociación de clientes:

**OBJETIVO PRINCIPAL:** Identificar qué correos provienen de CLIENTES REGISTRADOS y asociarlos con sus reservas para mantener un historial completo de comunicaciones.

**INSTRUCCIONES CRÍTICAS:**
- Para cada correo, extraer el EMAIL DEL REMITENTE exacto
- Identificar si menciona PAGOS, TRANSFERENCIAS o COMPROBANTES
- Buscar referencias a FECHAS DE RESERVA o NÚMEROS DE CONFIRMACIÓN
- Detectar nombres de clientes en el contenido o firma

**FORMATO DE ANÁLISIS:**

## 🔍 IDENTIFICACIÓN DE CORREOS POR REMITENTE

Para cada correo, proporcionar:
**CORREO #[número]**
- **Email remitente:** [dirección exacta]
- **Nombre detectado:** [del contenido o firma]
- **Tipo de comunicación:** [Pago/Reserva/Consulta/Queja/Otro]
- **Menciona pago:** [Sí/No - con monto si aplica]
- **Menciona reserva:** [Sí/No - con fechas si aplica]
- **Cliente registrado:** [REQUIERE VERIFICACIÓN EN BD]

## 💰 CORREOS DE PAGOS (MÁXIMA PRIORIDAD)

Para cada correo que mencione pagos:
- **Email:** [dirección exacta]
- **Monto:** [cantidad mencionada]
- **Método:** [transferencia/depósito/tarjeta]
- **Fecha de reserva mencionada:** [si aplica]
- **Comprobante adjunto:** [Sí/No]
- **ACCIÓN:** Verificar cliente en BD y asociar con reserva

## 📊 RESUMEN DE IDENTIFICACIÓN
- **Total correos:** {emailCount}
- **Correos con pagos detectados:** [número]
- **Correos con nombres/emails identificables:** [número]  
- **Correos que requieren verificación cliente:** [número]

## 🎯 PRÓXIMAS ACCIONES PRIORIZADAS
1. **VERIFICAR EN BASE DE DATOS** cada email remitente
2. **ASOCIAR PAGOS** con reservas específicas
3. **ACTUALIZAR HISTORIAL** de comunicaciones por cliente
4. **CONFIRMAR RECEPCIÓN** de pagos identificados

Correos a analizar:
{emailData}`
};

// Función para procesar el prompt con variables
export function processPromptTemplate( 
  template: string,
  variables: {
    timeSlot: string;
    emailCount: number;
    emailData: string;
    today: string;
  }
): string {
  let processedPrompt = template;      

  // Reemplazar variables
  processedPrompt = processedPrompt.replace(/{timeSlot}/g, variables.timeSlot);
  processedPrompt = processedPrompt.replace(/{emailCount}/g, variables.emailCount.toString());
  processedPrompt = processedPrompt.replace(/{emailData}/g, variables.emailData);        
  processedPrompt = processedPrompt.replace(/{today}/g, variables.today);

  return processedPrompt;
}

// Función para formatear datos de emails según configuración
export function formatEmailsForAnalysis(
  emails: any[],
  settings: AnalysisSettings
): string {
  let filteredEmails = emails;

  // Aplicar filtro de spam si está habilitado
  if (settings.enableSpamFilter) {     
    filteredEmails = emails.filter(email => !email.isSpam);
  }

  // Limitar número de correos
  if (filteredEmails.length > settings.maxEmails) {
    filteredEmails = filteredEmails.slice(0, settings.maxEmails);
    console.log(`📧 Limitando análisis a ${settings.maxEmails} correos de ${emails.length} total`);
  }

  // Formatear emails según profundidad del análisis
  return filteredEmails.map((email, i) => {
    let emailText = email.text || 'Sin contenido de texto';

    // Aplicar límite de caracteres    
    if (emailText.length > settings.textLimit) {
      emailText = emailText.substring(0, settings.textLimit) + '...';
    }

    // Formato según profundidad       
    switch (settings.analysisDepth) {  
      case 'basic':
        return `${i + 1}. DE: ${email.from.address}\n   ASUNTO: ${email.subject}\n   SPAM: ${email.isSpam ? 'Sí' : 'No'}\n`;

      case 'comprehensive':
        return `${i + 1}. DE: ${email.from.address}\n   ASUNTO: ${email.subject}\n   FECHA: ${email.date}\n   CONTENIDO: ${emailText}\n   SPAM: ${email.isSpam ? 'Sí' : 'No'}\n   PRIORIDAD: ${email.priority || 'Normal'}\n   ETIQUETAS: ${email.labels?.join(', ') || 'Ninguna'}\n`;

      case 'detailed':
      default:
        return `${i + 1}. DE: ${email.from.address}\n   ASUNTO: ${email.subject}\n   FECHA: ${email.date}\n   CONTENIDO: ${emailText}\n   SPAM: ${email.isSpam ? 'Sí' : 'No'}\n`;
    }
  }).join('\n');
}

// Función para validar configuración  
export function validateAnalysisSettings(settings: Partial<AnalysisSettings>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (settings.maxEmails && (settings.maxEmails < 1 || settings.maxEmails > 500)) {      
    errors.push('maxEmails debe estar entre 1 y 500');
  }

  if (settings.textLimit && (settings.textLimit < 50 || settings.textLimit > 5000)) {    
    errors.push('textLimit debe estar entre 50 y 5000 caracteres');
  }

  if (settings.analysisDepth && !['basic', 'detailed', 'comprehensive'].includes(settings.analysisDepth)) {
    errors.push('analysisDepth debe ser basic, detailed o comprehensive');
  }

  if (settings.timeouts) {
    if (settings.timeouts.emailFetch && (settings.timeouts.emailFetch < 5000 || settings.timeouts.emailFetch > 300000)) {
      errors.push('timeout de emailFetch debe estar entre 5 y 300 segundos');
    }
    if (settings.timeouts.aiAnalysis && (settings.timeouts.aiAnalysis < 10000 || settings.timeouts.aiAnalysis > 600000)) {
      errors.push('timeout de aiAnalysis debe estar entre 10 y 600 segundos');
    }
  }

  if (settings.customPrompt && settings.customPrompt.length < 100) {
    errors.push('customPrompt debe tener al menos 100 caracteres');
  }

  if (settings.scheduleConfig?.times) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const invalidTimes = settings.scheduleConfig.times.filter(time => !timeRegex.test(time));
    if (invalidTimes.length > 0) {     
      errors.push(`Horarios inválidos: ${invalidTimes.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,      
    errors
  };
}

// Función para aplicar configuración desde localStorage (para el cliente)
export function getClientAnalysisSettings(): AnalysisSettings {
  if (typeof window === 'undefined') { 
    return DEFAULT_ANALYSIS_SETTINGS;  
  }

  try {
    const savedSettings = localStorage.getItem('emailAnalysisSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return { ...DEFAULT_ANALYSIS_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Error cargando configuración del cliente:', error);
  }

  return DEFAULT_ANALYSIS_SETTINGS;    
}

// Función para debugging de configuración
export function debugAnalysisSettings(settings: AnalysisSettings): void {
  console.log('🔧 Configuración de Análisis de Emails:');
  console.log('   📧 Max emails:', settings.maxEmails);
  console.log('   ✂️ Text limit:', settings.textLimit);
  console.log('   🚫 Spam filter:', settings.enableSpamFilter ? 'Habilitado' : 'Deshabilitado');
  console.log('   🔍 Analysis depth:', settings.analysisDepth);
  console.log('   🚨 Urgent detection:', settings.enableUrgentDetection ? 'Habilitado' : 'Deshabilitado');
  console.log('   😊 Sentiment analysis:', settings.enableSentimentAnalysis ? 'Habilitado' : 'Deshabilitado');
  console.log('   ⏱️ Timeouts:', `Email: ${settings.timeouts.emailFetch/1000}s, AI: ${settings.timeouts.aiAnalysis/1000}s`);
  console.log('   📅 Schedule:', settings.scheduleConfig.enabled ? `Habilitado (${settings.scheduleConfig.times.join(', ')})` : 'Deshabilitado');
  console.log('   📝 Custom prompt:', settings.customPrompt.length > 200 ? `${settings.customPrompt.substring(0, 200)}...` : settings.customPrompt);
} 