'use server';

import type {
  WhatsAppMessage,
  WhatsAppResponse
} from '@/lib/whatsapp-client';
import { chatWithOpenAI } from '@/actions/ai/openai-actions';
import { ChatMessage } from '@/lib/openai-client';

// Sistema de respuestas automáticas con ChatGPT
export async function processIncomingMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
  try {
    const { isCommand, isBusinessHours } = await import('@/lib/whatsapp-client');
    console.log('🔄 Procesando mensaje de WhatsApp:', {
      from: message.contact?.number,
      body: message.body.substring(0, 100),
    });

    // Verificar si es un comando específico
    if (isCommand(message.body)) {
      return await handleCommand(message);
    }

    // Verificar horarios de atención
    if (!isBusinessHours()) {
      return await sendOutOfHoursMessage(message);
    }

    // Generar respuesta con ChatGPT
    return await generateAIResponse(message);

  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Manejar comandos específicos del hotel
async function handleCommand(message: WhatsAppMessage): Promise<WhatsAppResponse> {
  const { HOTEL_COMMANDS, WHATSAPP_BOT_CONFIG, whatsappManager, isBusinessHours } = await import('@/lib/whatsapp-client');
  const command = extractCommand(message.body);
  const number = message.contact?.number || message.from.replace('@c.us', '');

  let responseText = '';

  switch (command) {
    case '/inicio':
      responseText = WHATSAPP_BOT_CONFIG.welcomeMessage;
      break;

    case '/habitaciones':
      responseText = `🏨 *TIPOS DE HABITACIONES DISPONIBLES*

🛏️ *Habitación Estándar*
• Cama matrimonial o dos camas individuales
• Baño privado con ducha
• WiFi gratuito
• TV cable
• Precio: Desde $50.000/noche

🛏️ *Habitación Superior*
• Cama king size
• Baño con tina y ducha
• Vista al jardín
• Minibar
• Precio: Desde $65.000/noche

🛏️ *Suite Premium*
• Sala de estar separada
• Jacuzzi privado
• Vista panorámica
• Servicio a la habitación 24h
• Precio: Desde $120.000/noche

Para reservar escribe: "Quiero reservar [tipo de habitación]"`;
      break;

    case '/spa':
      responseText = `🧘‍♀️ *SERVICIOS DE SPA DISPONIBLES*

💆‍♀️ *Masajes*
• Relajante con aceites esenciales (60min) - $45.000
• Descontracturante (90min) - $65.000
• Piedras calientes (75min) - $55.000

🛁 *Tratamientos Corporales*
• Exfoliación corporal - $35.000
• Envolturas relajantes - $40.000
• Hidroterapia - $30.000

🧖‍♀️ *Faciales*
• Limpieza facial profunda - $25.000
• Anti-aging - $35.000
• Hidratación intensiva - $28.000

🏊‍♀️ *Piscinas Termales*
• Acceso diario - $15.000
• Acceso con almuerzo - $35.000

*Horarios:* Lunes a Domingo 9:00 - 20:00
*Reservas:* Escribe "Quiero reservar [servicio]"`;
      break;

    case '/restaurante':
      responseText = `🍽️ *RESTAURANTE ADMINTERMAS*

⏰ *Horarios de Atención:*
• Desayuno: 7:00 - 10:30
• Almuerzo: 12:30 - 15:30  
• Cena: 19:00 - 22:00

🥐 *Desayuno Buffet*
• Continental completo
• Frutas frescas, cereales, lácteos
• Pan artesanal, mermeladas
• Precio: $18.000 por persona

🍖 *Especialidades*
• Cordero patagónico
• Salmón grillado
• Pastas artesanales
• Postres caseros

🍷 *Carta de Vinos*
• Selección de vinos locales
• Maridajes especiales
• Cervezas artesanales

Para consultas específicas del menú escribe: "Menú del día"`;
      break;

    case '/reserva':
      responseText = `📅 *HACER UNA RESERVA*

Para procesar tu reserva necesito la siguiente información:

1️⃣ *Tipo de servicio:*
   • Habitación (especifica tipo)
   • Spa (especifica tratamiento)
   • Restaurante

2️⃣ *Fechas:*
   • Fecha de llegada
   • Fecha de salida

3️⃣ *Número de personas:*
   • Adultos
   • Niños (edad)

4️⃣ *Información de contacto:*
   • Nombre completo
   • Email

*Ejemplo:*
"Quiero reservar habitación estándar del 15 al 17 de julio para 2 adultos. Mi nombre es Juan Pérez, email: juan@email.com"

¡Te ayudo a completar tu reserva paso a paso! 😊`;
      break;

    case '/precios':
      responseText = `💰 *TARIFAS ACTUALES*

🏨 *Habitaciones (por noche):*
• Estándar: $50.000 - $55.000
• Superior: $65.000 - $75.000  
• Suite Premium: $120.000 - $150.000

🧘‍♀️ *Spa (por sesión):*
• Masajes: $45.000 - $65.000
• Tratamientos: $25.000 - $40.000
• Piscinas termales: $15.000/día

🍽️ *Restaurante:*
• Desayuno: $18.000
• Almuerzo: $25.000 - $35.000
• Cena: $30.000 - $45.000

📦 *Paquetes:*
• Solo alojamiento
• Media pensión (hab + desayuno)
• Pensión completa
• Todo incluido

*Los precios varían según temporada*
Para cotización exacta comparte tus fechas.`;
      break;

    case '/ubicacion':
      responseText = `📍 *UBICACIÓN Y ACCESO*

🏨 *AdminTermas Hotel & Spa*

📧 Dirección: [Tu dirección completa aquí]
🗺️ Región: [Tu región]
🇨🇱 País: Chile

🚗 *Cómo llegar:*
• Desde Santiago: 3 horas en auto
• Desde aeropuerto: 2.5 horas
• Transporte público disponible

🚌 *Servicios de traslado:*
• Transfer desde aeropuerto
• Pick-up en terminal de buses
• Coordinamos tu llegada

📱 *Coordenadas GPS:*
Lat: [Tu latitud]
Lng: [Tu longitud]

¿Necesitas ayuda con el transporte?`;
      break;

    case '/contacto':
      responseText = `📞 *INFORMACIÓN DE CONTACTO*

🏨 *AdminTermas Hotel & Spa*

📱 *WhatsApp:* Este mismo número
☎️ *Teléfono:* [Tu teléfono]
📧 *Email:* [Tu email]
🌐 *Website:* [Tu website]

⏰ *Atención WhatsApp:*
• Lunes a Domingo: 8:00 - 22:00
• Respuestas automáticas 24/7

📞 *Recepción:*
• 24 horas disponible
• Emergencias atendidas siempre

🗓️ *Reservas:*
• Online por WhatsApp
• Por teléfono
• Email

¡Estamos aquí para ayudarte! 😊`;
      break;

    case '/estado':
      const status = whatsappManager.getStatus();
      responseText = `🤖 *ESTADO DEL BOT*

✅ Estado: ${status.isReady ? 'Operativo' : 'Desconectado'}
📊 Mensajes procesados: ${status.messagesProcessed}
⚡ Última actividad: ${status.lastActivity?.toLocaleString('es-CL') || 'N/A'}
🕐 Horario actual: ${new Date().toLocaleTimeString('es-CL')}
🟢 Horario comercial: ${isBusinessHours() ? 'SÍ' : 'NO'}

*El bot responde automáticamente 24/7*
*Atención personalizada: 8:00 - 22:00*`;
      break;

    default:
      responseText = `❓ Comando no reconocido: ${command}

*Comandos disponibles:*
${Object.entries(HOTEL_COMMANDS).map(([cmd, desc]) => `• ${cmd} - ${desc}`).join('\n')}

O simplemente escribe tu consulta y te ayudo inmediatamente.`;
  }

  return await sendMessage(number, responseText);
}

// Mensaje para fuera de horario comercial
async function sendOutOfHoursMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
  const { WHATSAPP_BOT_CONFIG } = await import('@/lib/whatsapp-client');
  const number = message.contact?.number || message.from.replace('@c.us', '');
  
  const outOfHoursMessage = `🌙 *Fuera de horario comercial*

Gracias por contactar AdminTermas Hotel & Spa.

⏰ *Nuestro horario de atención personalizada es:*
${WHATSAPP_BOT_CONFIG.businessHours.start} - ${WHATSAPP_BOT_CONFIG.businessHours.end} hrs

🤖 *Mientras tanto:*
• Puedo ayudarte con información básica
• Consulta nuestros servicios con /habitaciones, /spa, /restaurante
• Para emergencias llama a recepción: [tu número]

Tu mensaje: "${message.body}"

¿En qué puedo ayudarte ahora? (Respuesta automática)`;

  return await sendMessage(number, outOfHoursMessage);
}

// Generar respuesta con ChatGPT
async function generateAIResponse(message: WhatsAppMessage): Promise<WhatsAppResponse> {
  try {
    const number = message.contact?.number || message.from.replace('@c.us', '');
    const customerName = message.contact?.name || message.contact?.pushname || 'Cliente';

    // Sistema de prompt específico para el hotel
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `Eres el asistente de WhatsApp de AdminTermas Hotel & Spa en Chile. 

IDENTIDAD:
- Eres amigable, profesional y servicial
- Respondes en español chileno de forma natural  
- Usas emojis apropiados pero sin exceso
- Tu objetivo es ayudar con reservas, información y consultas

SERVICIOS DEL HOTEL:
- Habitaciones: Estándar ($50.000), Superior ($65.000), Suite Premium ($120.000)
- Spa: Masajes, tratamientos, piscinas termales ($15.000-$65.000)
- Restaurante: Desayuno ($18.000), almuerzo/cena ($25.000-$45.000)
- Paquetes: Solo alojamiento, media pensión, pensión completa, todo incluido

HORARIOS:
- Atención personalizada WhatsApp: 8:00-22:00
- Check-in: 15:00, Check-out: 12:00
- Spa: 9:00-20:00
- Restaurante: Desayuno 7:00-10:30, Almuerzo 12:30-15:30, Cena 19:00-22:00

INSTRUCCIONES:
- Responde de forma concisa pero completa
- Si no sabes algo específico, deriva a "llama a recepción"
- Para reservas, pide: fechas, tipo habitación/servicio, número personas, contacto
- Ofrece alternativas cuando algo no esté disponible
- Siempre termina preguntando si puede ayudar en algo más

COMANDOS: El cliente puede usar /habitaciones, /spa, /restaurante, /reserva, /precios, /contacto

Responde como si fueras el recepcionista virtual del hotel.`
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Cliente: ${customerName}
Mensaje: ${message.body}

(Responde directamente al cliente de forma natural y útil)`
    };

    console.log('🤖 Generando respuesta con ChatGPT para WhatsApp...');

    const aiResponse = await chatWithOpenAI({
      messages: [systemMessage, userMessage],
      taskType: 'content_generation',
    });

    if (aiResponse.success && aiResponse.data?.message) {
      // Agregar pie de mensaje si la respuesta no incluye comandos
      let finalResponse = aiResponse.data.message;
      
      if (!finalResponse.includes('/') && !finalResponse.includes('comando')) {
        finalResponse += `\n\n_Tip: Usa /habitaciones, /spa, /restaurante para info rápida_`;
      }

      return await sendMessage(number, finalResponse);
    } else {
      // Fallback si ChatGPT falla
      const fallbackMessage = `Hola ${customerName} 👋

Gracias por tu mensaje. En este momento estoy procesando tu consulta.

Mientras tanto, puedes usar estos comandos rápidos:
• /habitaciones - Ver tipos y precios
• /spa - Servicios de spa
• /restaurante - Menú y horarios
• /reserva - Hacer una reserva

O llama directamente a recepción para atención inmediata.

¿En qué más puedo ayudarte?`;

      return await sendMessage(number, fallbackMessage);
    }

  } catch (error) {
    console.error('❌ Error generando respuesta AI:', error);
    
    // Mensaje de error amigable
    const errorMessage = `Disculpa, tengo problemas técnicos temporales.

Para atención inmediata:
📞 Llama a recepción: [tu número]
⏰ Horario: 24 horas

Intenta nuevamente en unos minutos o usa:
/habitaciones, /spa, /restaurante

¡Gracias por tu paciencia! 🙏`;

    const number = message.contact?.number || message.from.replace('@c.us', '');
    return await sendMessage(number, errorMessage);
  }
}

// Función para enviar mensajes
export async function sendMessage(to: string, message: string): Promise<WhatsAppResponse> {
  try {
    const { formatPhoneNumber, whatsappManager } = await import('@/lib/whatsapp-client');
    const formattedNumber = formatPhoneNumber(to);
    console.log('📤 Enviando mensaje WhatsApp a:', formattedNumber);
    
    const response = await whatsappManager.sendMessage(formattedNumber, message);
    
    if (response.success) {
      console.log('✅ Mensaje enviado exitosamente');
    } else {
      console.error('❌ Error enviando mensaje:', response.error);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error en sendMessage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Función para inicializar el bot de WhatsApp
export async function initializeWhatsAppBot(): Promise<{ success: boolean; error?: string }> {
  try {
    const { whatsappManager } = await import('@/lib/whatsapp-client');
    console.log('🚀 Inicializando bot de WhatsApp...');
    
    // Registrar el handler de mensajes
    whatsappManager.onMessage(async (message) => {
      try {
        await processIncomingMessage(message);
      } catch (error) {
        console.error('❌ Error en message handler:', error);
      }
    });

    // Inicializar el cliente
    await whatsappManager.initialize();
    
    console.log('✅ Bot de WhatsApp inicializado exitosamente');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error inicializando bot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Obtener estado del bot
export async function getWhatsAppStatus() {
  try {
    const { whatsappManager, isBusinessHours, WHATSAPP_BOT_CONFIG } = await import('@/lib/whatsapp-client');
    const status = whatsappManager.getStatus();
    const clientInfo = await whatsappManager.getClientInfo();
    
    return {
      success: true,
      data: {
        ...status,
        clientInfo,
        businessHours: {
          current: isBusinessHours(),
          start: WHATSAPP_BOT_CONFIG.businessHours.start,
          end: WHATSAPP_BOT_CONFIG.businessHours.end,
        },
        config: WHATSAPP_BOT_CONFIG,
      },
    };
  } catch (error) {
    console.error('❌ Error obteniendo estado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Enviar mensaje de bienvenida manual
export async function sendWelcomeMessage(phoneNumber: string): Promise<WhatsAppResponse> {
  const { WHATSAPP_BOT_CONFIG } = await import('@/lib/whatsapp-client');
  return await sendMessage(phoneNumber, WHATSAPP_BOT_CONFIG.welcomeMessage);
}

// Función para broadcast (envío masivo)
export async function sendBroadcastMessage(
  phoneNumbers: string[], 
  message: string
): Promise<{ 
  success: boolean; 
  results: Array<{ number: string; success: boolean; error?: string }> 
}> {
  const results = [];
  
  for (const number of phoneNumbers) {
    try {
      const response = await sendMessage(number, message);
      results.push({
        number,
        success: response.success,
        error: response.error,
      });
      
      // Esperar un poco entre mensajes para evitar spam
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.push({
        number,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  
  return {
    success: successCount > 0,
    results,
  };
} 