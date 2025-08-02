import { NextRequest, NextResponse } from 'next/server';
import { sendCustomEmail } from '@/actions/emails/email-actions';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, subject, html, templateId, reservationId } = body;

    // Validar campos requeridos
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: to, subject, html' },
        { status: 400 }
      );
    }

    // Enviar el email usando la acción existente
    const result = await sendCustomEmail(to, subject, html, true);

    if (result.success) {
      // Log del envío exitoso
      console.log(`✅ Email enviado exitosamente:`, {
        to,
        subject,
        templateId,
        reservationId,
        sentBy: currentUser.email
      });

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Correo enviado exitosamente'
      });
    } else {
      console.error(`❌ Error al enviar email:`, result.message);
      return NextResponse.json(
        { success: false, error: result.message || 'Error desconocido al enviar el correo' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error en API /send-email:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
