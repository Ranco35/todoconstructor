import { EmailTemplate } from './email-service';

export const emailTemplates = {
  // Plantilla para confirmación de reserva
  reservationConfirmation: (data: {
    clientName: string;
    reservationId: string;
    checkIn: string;
    checkOut: string;
    roomCode: string;
    packageName: string;
    totalAmount: number;
  }): EmailTemplate => ({
    subject: `Confirmación de Reserva #${data.reservationId} - Termas Llifen`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0;">Termas Llifen</h1>
            <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
          </div>
          
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            ✅ Confirmación de Reserva
          </h2>
          
          <p>Estimado/a <strong>${data.clientName}</strong>,</p>
          
          <p>Nos complace confirmar su reserva en Termas Llifen. A continuación, los detalles de su estadía:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530; width: 40%;">Número de Reserva:</td>
                <td style="padding: 8px 0;">#${data.reservationId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Check-in:</td>
                <td style="padding: 8px 0;">${data.checkIn}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Check-out:</td>
                <td style="padding: 8px 0;">${data.checkOut}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Habitación:</td>
                <td style="padding: 8px 0;">${data.roomCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Paquete:</td>
                <td style="padding: 8px 0;">${data.packageName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Total:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold;">$${data.totalAmount.toLocaleString('es-CL')}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2c5530;"><strong>📍 Ubicación:</strong> Camino Huilo Huilo, Panguipulli, Región de Los Ríos</p>
            <p style="margin: 10px 0 0 0; color: #2c5530;"><strong>📞 Contacto:</strong> +56 63 2318 000</p>
          </div>
          
          <p>Esperamos brindarle una experiencia inolvidable en nuestras termas.</p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo Termas Llifen</strong>
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Este es un email automático, por favor no responder. Para consultas contacte a reservas@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Confirmación de Reserva - Termas Llifen
      
      Estimado/a ${data.clientName},
      
      Nos complace confirmar su reserva en Termas Llifen:
      
      Número de Reserva: #${data.reservationId}
      Check-in: ${data.checkIn}
      Check-out: ${data.checkOut}
      Habitación: ${data.roomCode}
      Paquete: ${data.packageName}
      Total: $${data.totalAmount.toLocaleString('es-CL')}
      
      Ubicación: Camino Huilo Huilo, Panguipulli, Región de Los Ríos
      Contacto: +56 63 2318 000
      
      Esperamos brindarle una experiencia inolvidable.
      
      Saludos cordiales,
      Equipo Termas Llifen
    `,
  }),

  // Plantilla para confirmación de pago
  paymentConfirmation: (data: {
    clientName: string;
    reservationId: string;
    paymentAmount: number;
    paymentMethod: string;
    paymentDate: string;
    remainingBalance: number;
    reservationDetails: {
      checkIn: string;
      checkOut: string;
      roomCode: string;
      packageName: string;
      totalAmount: number;
    };
  }): EmailTemplate => ({
    subject: `Confirmación de Pago - Reserva #${data.reservationId} - Termas Llifen`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0;">Termas Llifen</h1>
            <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
          </div>
          
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            💳 Confirmación de Pago Recibido
          </h2>
          
          <p>Estimado/a <strong>${data.clientName}</strong>,</p>
          
          <p>Hemos recibido su pago por la reserva. A continuación, confirmamos los detalles:</p>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #2c5530; margin: 0 0 15px 0;">✅ Pago Confirmado</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530; width: 40%;">Monto Pagado:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #28a745;">$${data.paymentAmount.toLocaleString('es-CL')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Método de Pago:</td>
                <td style="padding: 8px 0;">${data.paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Fecha del Pago:</td>
                <td style="padding: 8px 0;">${data.paymentDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Número de Reserva:</td>
                <td style="padding: 8px 0;">#${data.reservationId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c5530; margin-top: 0;">Detalles de la Reserva</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530; width: 40%;">Check-in:</td>
                <td style="padding: 8px 0;">${data.reservationDetails.checkIn}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Check-out:</td>
                <td style="padding: 8px 0;">${data.reservationDetails.checkOut}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Habitación:</td>
                <td style="padding: 8px 0;">${data.reservationDetails.roomCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Paquete:</td>
                <td style="padding: 8px 0;">${data.reservationDetails.packageName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Total Reserva:</td>
                <td style="padding: 8px 0;">$${data.reservationDetails.totalAmount.toLocaleString('es-CL')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Total Pagado:</td>
                <td style="padding: 8px 0; font-weight: bold;">$${(data.reservationDetails.totalAmount - data.remainingBalance).toLocaleString('es-CL')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Saldo Pendiente:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #dc3545;">$${data.remainingBalance.toLocaleString('es-CL')}</td>
              </tr>
            </table>
          </div>
          
          ${data.remainingBalance > 0 ? 
            `<div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Saldo Pendiente:</strong> Queda un saldo de $${data.remainingBalance.toLocaleString('es-CL')} por pagar antes del check-in.</p>
            </div>` : 
            `<div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724;"><strong>🎉 ¡Felicitaciones!</strong> Su reserva está completamente pagada.</p>
            </div>`
          }
          
          <p>Muchas gracias por elegir Termas Llifen. Si tiene alguna pregunta, no dude en contactarnos.</p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo de Reservas</strong><br>
            Termas Llifen
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Este es un email automático, por favor no responder. Para consultas contacte a reservas@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Confirmación de Pago - Termas Llifen
      
      Estimado/a ${data.clientName},
      
      Hemos recibido su pago por la reserva. A continuación, confirmamos los detalles:
      
      PAGO CONFIRMADO:
      - Monto: $${data.paymentAmount.toLocaleString('es-CL')}
      - Método: ${data.paymentMethod}
      - Fecha: ${data.paymentDate}
      - Reserva: #${data.reservationId}
      
      DETALLES DE LA RESERVA:
      - Check-in: ${data.reservationDetails.checkIn}
      - Check-out: ${data.reservationDetails.checkOut}
      - Habitación: ${data.reservationDetails.roomCode}
      - Paquete: ${data.reservationDetails.packageName}
      - Total Reserva: $${data.reservationDetails.totalAmount.toLocaleString('es-CL')}
      - Total Pagado: $${(data.reservationDetails.totalAmount - data.remainingBalance).toLocaleString('es-CL')}
      - Saldo Pendiente: $${data.remainingBalance.toLocaleString('es-CL')}
      
      ${data.remainingBalance > 0 
        ? `\n⚠️  ATENCIÓN: Queda un saldo pendiente de $${data.remainingBalance.toLocaleString('es-CL')} que debe ser cancelado antes del check-in.`
        : '\n✅ Su reserva está completamente pagada.'
      }
      
      Muchas gracias por elegir Termas Llifen.
      
      Saludos cordiales,
      Equipo de Reservas
      Termas Llifen
      
      ---
      Este es un email automático, por favor no responder.
    `,
  }),

  // Plantilla para mensaje personalizado
  customMessage: (data: {
    clientName: string;
    reservationId: string;
    message: string;
  }): EmailTemplate => ({
    subject: `Mensaje Importante - Reserva #${data.reservationId} - Termas Llifen`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0;">Termas Llifen</h1>
            <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
          </div>
          
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px; margin-top: 0;">
            ✉️ Mensaje Importante
          </h2>
          
          <p>Estimado/a <strong>${data.clientName}</strong>,</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
            ${data.message.replace(/\n/g, '<br>')}
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2c5530;"><strong>Referencia:</strong> Reserva #${data.reservationId}</p>
            <p style="margin: 10px 0 0 0; color: #2c5530;"><strong>Contacto:</strong> +56 63 2318 000 | reservas@termasllifen.cl</p>
          </div>
          
          <p>Atentamente,</p>
          <p style="margin-top: 0;">
            <strong>Equipo de Reservas</strong><br>
            Termas Llifen
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Este es un email automático, por favor no responder. Para consultas contacte a reservas@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Mensaje Importante - Termas Llifen
      
      Estimado/a ${data.clientName},
      
      ${data.message}
      
      ---
      Referencia: Reserva #${data.reservationId}
      Contacto: +56 63 2318 000 | reservas@termasllifen.cl
      
      Atentamente,
      Equipo de Reservas
      Termas Llifen
      
      ---
      Este es un email automático, por favor no responder.
    `,
  }),
};
