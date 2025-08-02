import { NextRequest, NextResponse } from 'next/server';
import { sendMessage, sendBroadcastMessage, sendWelcomeMessage } from '@/actions/whatsapp/whatsapp-actions';

interface SendMessageRequest {
  to: string;
  message: string;
  type?: 'text' | 'welcome';
}

interface BroadcastRequest {
  phoneNumbers: string[];
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar parámetros básicos
    if (!body.to && !body.phoneNumbers) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere "to" (número individual) o "phoneNumbers" (array para broadcast)',
      }, { status: 400 });
    }

    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere un mensaje válido',
      }, { status: 400 });
    }

    // Envío masivo (broadcast)
    if (body.phoneNumbers && Array.isArray(body.phoneNumbers)) {
      return await handleBroadcast(body as BroadcastRequest);
    }

    // Envío individual
    return await handleSingleMessage(body as SendMessageRequest);

  } catch (error) {
    console.error('❌ Error en API Send:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    }, { status: 500 });
  }
}

// Manejar envío de mensaje individual
async function handleSingleMessage(data: SendMessageRequest): Promise<NextResponse> {
  const { to, message, type = 'text' } = data;

  console.log('📤 API WhatsApp Send: Enviando mensaje individual', {
    to: to.substring(0, 8) + '***',
    messageLength: message.length,
    type,
  });

  // Validar número de teléfono
  if (!/^\+?[\d\s\-\(\)]+$/.test(to)) {
    return NextResponse.json({
      success: false,
      error: 'Formato de número de teléfono inválido',
    }, { status: 400 });
  }

  // Validar longitud del mensaje
  if (message.length > 4096) {
    return NextResponse.json({
      success: false,
      error: 'El mensaje es demasiado largo (máximo 4096 caracteres)',
    }, { status: 400 });
  }

  try {
    let response;

    // Determinar tipo de mensaje
    switch (type) {
      case 'welcome':
        response = await sendWelcomeMessage(to);
        break;
      
      case 'text':
      default:
        response = await sendMessage(to, message);
        break;
    }

    if (response.success) {
      console.log('✅ Mensaje enviado exitosamente');
      return NextResponse.json({
        success: true,
        data: {
          messageId: response.messageId,
          to: to,
          message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      console.error('❌ Error enviando mensaje:', response.error);
      return NextResponse.json({
        success: false,
        error: response.error || 'Error enviando mensaje',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error en handleSingleMessage:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}

// Manejar envío masivo (broadcast)
async function handleBroadcast(data: BroadcastRequest): Promise<NextResponse> {
  const { phoneNumbers, message } = data;

  console.log('📢 API WhatsApp Broadcast: Enviando mensaje masivo', {
    recipients: phoneNumbers.length,
    messageLength: message.length,
  });

  // Validar array de números
  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'Se requiere un array válido de números de teléfono',
    }, { status: 400 });
  }

  // Límite de números por broadcast
  if (phoneNumbers.length > 100) {
    return NextResponse.json({
      success: false,
      error: 'Máximo 100 números por broadcast',
    }, { status: 400 });
  }

  // Validar formato de números
  for (const number of phoneNumbers) {
    if (typeof number !== 'string' || !/^\+?[\d\s\-\(\)]+$/.test(number)) {
      return NextResponse.json({
        success: false,
        error: `Formato inválido en número: ${number}`,
      }, { status: 400 });
    }
  }

  try {
    const response = await sendBroadcastMessage(phoneNumbers, message);

    const successCount = response.results.filter(r => r.success).length;
    const failureCount = response.results.length - successCount;

    console.log(`✅ Broadcast completado: ${successCount} exitosos, ${failureCount} fallidos`);

    return NextResponse.json({
      success: response.success,
      data: {
        totalSent: successCount,
        totalFailed: failureCount,
        totalNumbers: phoneNumbers.length,
        results: response.results,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error en handleBroadcast:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}

// Método GET para información sobre el endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de envío de mensajes WhatsApp',
    endpoints: {
      send: 'POST /api/whatsapp/send',
      broadcast: 'POST /api/whatsapp/send (con phoneNumbers array)',
    },
    usage: {
      singleMessage: {
        method: 'POST',
        body: {
          to: 'string (número de teléfono)',
          message: 'string (mensaje a enviar)',
          type: 'string (opcional: text, welcome)',
        },
      },
      broadcast: {
        method: 'POST',
        body: {
          phoneNumbers: 'string[] (array de números)',
          message: 'string (mensaje a enviar)',
        },
        limits: {
          maxNumbers: 100,
          maxMessageLength: 4096,
        },
      },
    },
    messageTypes: {
      text: 'Mensaje de texto personalizado',
      welcome: 'Mensaje de bienvenida predefinido',
    },
  });
} 