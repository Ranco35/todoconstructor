import nodemailer from 'nodemailer';

// Tipos para emails
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// Configuración del transporter de Gmail
const createTransporter = () => {
  const config = {
    host: process.env.GMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.GMAIL_PORT || '587'),
    secure: false, // true para puerto 465, false para otros puertos
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };

  console.log('📧 Configurando transporter de Gmail:', {
    host: config.host,
    port: config.port,
    user: config.auth.user ? '✓ Configurado' : '❌ No configurado',
    pass: config.auth.pass ? '✓ Configurado' : '❌ No configurado',
  });

  return nodemailer.createTransport(config);
};

// Función principal para enviar emails
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log('📤 Enviando email:', {
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
    });

    // Verificar configuración
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Variables de entorno de Gmail no configuradas');
      return {
        success: false,
        error: 'Configuración de Gmail incompleta. Revisa las variables de entorno.',
      };
    }

    const transporter = createTransporter();

    // Verificar conexión
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada');

    // Preparar email
    const mailOptions = {
      from: {
        name: 'Termas Llifen - Reservas',
        address: process.env.GMAIL_USER!,
      },
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar email',
    };
  }
}

// Función para probar la configuración de email
export async function testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧪 Probando configuración de email...');

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return {
        success: false,
        message: 'Variables de entorno de Gmail no configuradas. Revisa GMAIL_USER y GMAIL_APP_PASSWORD.',
      };
    }

    const transporter = createTransporter();
    await transporter.verify();

    console.log('✅ Configuración de email validada');
    return {
      success: true,
      message: 'Configuración de Gmail correcta. Listo para enviar emails.',
    };

  } catch (error) {
    console.error('❌ Error en configuración de email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return {
      success: false,
      message: `Error de configuración: ${errorMessage}`,
    };
  }
}

// Plantillas de email predefinidas
export const emailTemplates = {
  // Plantilla para envío de presupuestos
  budgetQuote: (data: {
    clientName: string;
    budgetId: string;
    budgetNumber: string;
    items: Array<{name: string; quantity: number; price: number; total: number}>;
    subtotal: number;
    taxes: number;
    total: number;
    validUntil: string;
    contactPerson: string;
    contactPhone: string;
  }): EmailTemplate => ({
    subject: `Presupuesto ${data.budgetNumber} - Termas Llifen`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0;">Termas Llifen</h1>
            <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
          </div>
          
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            💼 Presupuesto de Servicios
          </h2>
          
          <p>Estimado/a <strong>${data.clientName}</strong>,</p>
          
          <p>Nos complace presentar el siguiente presupuesto para los servicios solicitados:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Presupuesto N°:</td>
                <td style="padding: 8px 0;">${data.budgetNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Fecha:</td>
                <td style="padding: 8px 0;">${new Date().toLocaleDateString('es-CL')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Válido hasta:</td>
                <td style="padding: 8px 0;">${data.validUntil}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #2c5530; margin-top: 30px;">Detalle de Servicios:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #2c5530; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Servicio</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Cant.</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Precio Unit.</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${item.name || 'Producto'}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity || 0}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${(item.price || 0).toLocaleString('es-CL')}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${(item.total || 0).toLocaleString('es-CL')}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #f8f9fa;">
                <td colspan="3" style="padding: 10px; font-weight: bold; text-align: right; border: 1px solid #ddd;">Subtotal:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">$${(data.subtotal || 0).toLocaleString('es-CL')}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td colspan="3" style="padding: 10px; font-weight: bold; text-align: right; border: 1px solid #ddd;">IVA (19%):</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">$${(data.taxes || 0).toLocaleString('es-CL')}</td>
              </tr>
              <tr style="background-color: #2c5530; color: white;">
                <td colspan="3" style="padding: 15px; font-weight: bold; text-align: right; border: 1px solid #ddd;">TOTAL:</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; border: 1px solid #ddd;">$${(data.total || 0).toLocaleString('es-CL')}</td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2c5530;"><strong>📞 Contacto para consultas:</strong></p>
            <p style="margin: 5px 0; color: #2c5530;">${data.contactPerson}</p>
            <p style="margin: 0; color: #2c5530;">${data.contactPhone}</p>
          </div>
          
          <p>Esperamos que nuestro presupuesto sea de su agrado. No dude en contactarnos para aclarar cualquier consulta.</p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo Comercial Termas Llifen</strong>
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Este presupuesto es válido hasta la fecha indicada. Para reservar, contacte a reservas@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Presupuesto ${data.budgetNumber} - Termas Llifen
      
      Estimado/a ${data.clientName},
      
      Presupuesto N°: ${data.budgetNumber}
      Fecha: ${new Date().toLocaleDateString('es-CL')}
      Válido hasta: ${data.validUntil}
      
      Detalle de Servicios:
      ${data.items.map(item => `${item.name} - Cant: ${item.quantity} - Precio: $${item.price.toLocaleString('es-CL')} - Total: $${item.total.toLocaleString('es-CL')}`).join('\n')}
      
      Subtotal: $${data.subtotal.toLocaleString('es-CL')}
      IVA (19%): $${data.taxes.toLocaleString('es-CL')}
      TOTAL: $${data.total.toLocaleString('es-CL')}
      
      Contacto: ${data.contactPerson} - ${data.contactPhone}
      
      Saludos cordiales,
      Equipo Comercial Termas Llifen
    `,
  }),

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
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Número de Reserva:</td>
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

  // Plantilla para confirmación de pago de reserva
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
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Monto Pagado:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #28a745;">$${data.paymentAmount.toLocaleString('es-CL')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Método de Pago:</td>
                <td style="padding: 8px 0;">${data.paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Fecha de Pago:</td>
                <td style="padding: 8px 0;">${data.paymentDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Saldo Restante:</td>
                <td style="padding: 8px 0; font-weight: bold; ${data.remainingBalance > 0 ? 'color: #dc3545;' : 'color: #28a745;'}">
                  ${data.remainingBalance > 0 ? `$${data.remainingBalance.toLocaleString('es-CL')}` : 'PAGADO COMPLETAMENTE ✅'}
                </td>
              </tr>
            </table>
          </div>

          <h3 style="color: #2c5530;">Detalles de la Reserva:</h3>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Reserva N°:</td>
                <td style="padding: 8px 0;">#${data.reservationId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Check-in:</td>
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
                <td style="padding: 8px 0; font-weight: bold;">$${data.reservationDetails.totalAmount.toLocaleString('es-CL')}</td>
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
          
          <p>Muchas gracias por su pago. Esperamos brindarle una experiencia inolvidable en Termas Llifen.</p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo de Reservas Termas Llifen</strong>
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Para consultas sobre su pago, contacte a reservas@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Confirmación de Pago - Termas Llifen
      
      Estimado/a ${data.clientName},
      
      Confirmamos el recibo de su pago:
      
      PAGO RECIBIDO:
      Monto: $${data.paymentAmount.toLocaleString('es-CL')}
      Método: ${data.paymentMethod}
      Fecha: ${data.paymentDate}
      Saldo Restante: ${data.remainingBalance > 0 ? `$${data.remainingBalance.toLocaleString('es-CL')}` : 'PAGADO COMPLETAMENTE'}
      
      DETALLES DE RESERVA:
      Reserva N°: #${data.reservationId}
      Check-in: ${data.reservationDetails.checkIn}
      Check-out: ${data.reservationDetails.checkOut}
      Habitación: ${data.reservationDetails.roomCode}
      Paquete: ${data.reservationDetails.packageName}
      Total: $${data.reservationDetails.totalAmount.toLocaleString('es-CL')}
      
      Gracias por su pago.
      
      Saludos cordiales,
      Equipo de Reservas Termas Llifen
    `,
  }),

  // Plantilla para confirmación de abono a proveedor
  supplierPaymentConfirmation: (data: {
    supplierName: string;
    paymentAmount: number;
    paymentMethod: string;
    paymentDate: string;
    invoiceNumber?: string;
    orderNumber?: string;
    reference: string;
    remainingBalance: number;
  }): EmailTemplate => ({
    subject: `Confirmación de Pago Procesado - ${data.reference} - Termas Llifen`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0;">Termas Llifen</h1>
            <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
          </div>
          
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            🏢 Confirmación de Pago a Proveedor
          </h2>
          
          <p>Estimado equipo de <strong>${data.supplierName}</strong>,</p>
          
          <p>Por medio de la presente, confirmamos que hemos procesado el siguiente pago:</p>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #2c5530; margin: 0 0 15px 0;">💳 Pago Procesado</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Monto Pagado:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #28a745;">$${data.paymentAmount.toLocaleString('es-CL')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Método de Pago:</td>
                <td style="padding: 8px 0;">${data.paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Fecha de Procesamiento:</td>
                <td style="padding: 8px 0;">${data.paymentDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Referencia:</td>
                <td style="padding: 8px 0;">${data.reference}</td>
              </tr>
              ${data.invoiceNumber ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">N° Factura:</td>
                <td style="padding: 8px 0;">${data.invoiceNumber}</td>
              </tr>
              ` : ''}
              ${data.orderNumber ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">N° Orden:</td>
                <td style="padding: 8px 0;">${data.orderNumber}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Saldo Restante:</td>
                <td style="padding: 8px 0; font-weight: bold; ${data.remainingBalance > 0 ? 'color: #dc3545;' : 'color: #28a745;'}">
                  ${data.remainingBalance > 0 ? `$${data.remainingBalance.toLocaleString('es-CL')}` : 'CANCELADO COMPLETAMENTE ✅'}
                </td>
              </tr>
            </table>
          </div>

          ${data.paymentMethod.toLowerCase().includes('transferencia') ? 
            `<div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
              <p style="margin: 0; color: #0c5460;"><strong>💰 Transferencia Bancaria:</strong> El pago será procesado dentro de 24-48 horas hábiles.</p>
            </div>` : ''
          }
          
          <p>Agradecemos la excelente relación comercial que mantenemos y esperamos seguir trabajando juntos.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2c5530;"><strong>📞 Contacto contable:</strong></p>
            <p style="margin: 5px 0; color: #2c5530;">Email: contabilidad@termasllifen.cl</p>
            <p style="margin: 0; color: #2c5530;">Teléfono: +56 63 2318 000</p>
          </div>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Departamento de Contabilidad<br>Termas Llifen</strong>
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Este es un comprobante de pago. Para consultas, contacte a contabilidad@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Confirmación de Pago a Proveedor - Termas Llifen
      
      Estimado equipo de ${data.supplierName},
      
      Confirmamos el procesamiento del siguiente pago:
      
      PAGO PROCESADO:
      Monto: $${data.paymentAmount.toLocaleString('es-CL')}
      Método: ${data.paymentMethod}
      Fecha: ${data.paymentDate}
      Referencia: ${data.reference}
      ${data.invoiceNumber ? `N° Factura: ${data.invoiceNumber}` : ''}
      ${data.orderNumber ? `N° Orden: ${data.orderNumber}` : ''}
      Saldo Restante: ${data.remainingBalance > 0 ? `$${data.remainingBalance.toLocaleString('es-CL')}` : 'CANCELADO COMPLETAMENTE'}
      
      Contacto contable: contabilidad@termasllifen.cl
      
      Saludos cordiales,
      Departamento de Contabilidad
      Termas Llifen
    `,
  }),

  // Plantilla para pedidos a proveedores
  supplierPurchaseOrder: (data: {
    supplierName: string;
    orderNumber: string;
    orderDate: string;
    deliveryDate: string;
    items: Array<{name: string; quantity: number; unit: string; price: number; total: number}>;
    subtotal: number;
    taxes: number;
    total: number;
    deliveryAddress: string;
    contactPerson: string;
    contactPhone: string;
    notes?: string;
  }): EmailTemplate => ({
    subject: `Orden de Compra ${data.orderNumber} - Termas Llifen`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0;">Termas Llifen</h1>
            <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
          </div>
          
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            📋 Orden de Compra
          </h2>
          
          <p>Estimado equipo de <strong>${data.supplierName}</strong>,</p>
          
          <p>Por medio de la presente, solicitamos formalmente los siguientes productos/servicios:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Orden N°:</td>
                <td style="padding: 8px 0; font-weight: bold; font-size: 16px;">${data.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Fecha de Orden:</td>
                <td style="padding: 8px 0;">${data.orderDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Fecha de Entrega Solicitada:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #dc3545;">${data.deliveryDate}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #2c5530; margin-top: 30px;">Detalle de Productos Solicitados:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #2c5530; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Producto/Servicio</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Cant.</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Unidad</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Precio Unit.</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.unit}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.price.toLocaleString('es-CL')}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.total.toLocaleString('es-CL')}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #f8f9fa;">
                <td colspan="4" style="padding: 10px; font-weight: bold; text-align: right; border: 1px solid #ddd;">Subtotal:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">$${data.subtotal.toLocaleString('es-CL')}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td colspan="4" style="padding: 10px; font-weight: bold; text-align: right; border: 1px solid #ddd;">IVA (19%):</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #ddd;">$${data.taxes.toLocaleString('es-CL')}</td>
              </tr>
              <tr style="background-color: #2c5530; color: white;">
                <td colspan="4" style="padding: 15px; font-weight: bold; text-align: right; border: 1px solid #ddd;">TOTAL ORDEN:</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; border: 1px solid #ddd;">$${data.total.toLocaleString('es-CL')}</td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">📍 Información de Entrega:</h4>
            <p style="margin: 5px 0; color: #856404;"><strong>Dirección:</strong> ${data.deliveryAddress}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>Contacto:</strong> ${data.contactPerson}</p>
            <p style="margin: 0; color: #856404;"><strong>Teléfono:</strong> ${data.contactPhone}</p>
          </div>

          ${data.notes ? `
          <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h4 style="color: #0c5460; margin: 0 0 10px 0;">📝 Observaciones:</h4>
            <p style="margin: 0; color: #0c5460;">${data.notes}</p>
          </div>
          ` : ''}
          
          <p><strong>Favor confirmar recepción de esta orden y fecha estimada de entrega.</strong></p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Departamento de Compras<br>Termas Llifen</strong>
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Para confirmar esta orden, responda a compras@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Orden de Compra ${data.orderNumber} - Termas Llifen
      
      Estimado equipo de ${data.supplierName},
      
      Solicitamos los siguientes productos/servicios:
      
      ORDEN DE COMPRA:
      N° Orden: ${data.orderNumber}
      Fecha: ${data.orderDate}
      Entrega Solicitada: ${data.deliveryDate}
      
      PRODUCTOS SOLICITADOS:
      ${data.items.map(item => `${item.name} - Cant: ${item.quantity} ${item.unit} - Precio: $${item.price.toLocaleString('es-CL')} - Total: $${item.total.toLocaleString('es-CL')}`).join('\n')}
      
      Subtotal: $${data.subtotal.toLocaleString('es-CL')}
      IVA (19%): $${data.taxes.toLocaleString('es-CL')}
      TOTAL: $${data.total.toLocaleString('es-CL')}
      
      ENTREGA:
      Dirección: ${data.deliveryAddress}
      Contacto: ${data.contactPerson} - ${data.contactPhone}
      
      ${data.notes ? `Observaciones: ${data.notes}` : ''}
      
      Favor confirmar recepción y fecha de entrega.
      
      Saludos cordiales,
      Departamento de Compras
      Termas Llifen
    `,
  }),

  testEmail: (): EmailTemplate => ({
    subject: 'Prueba de Configuración de Email - Termas Llifen',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #2c5530;">✅ Email de Prueba</h1>
          <p>¡La configuración de Gmail está funcionando correctamente!</p>
          <p style="color: #666;">Este es un email de prueba desde el sistema Admintermas.</p>
          <div style="margin-top: 30px; padding: 20px; background-color: white; border-radius: 8px;">
            <p><strong>Configuración exitosa:</strong></p>
            <p>📧 Servidor: Gmail SMTP</p>
            <p>📤 Enviado desde: reservas@termasllifen.cl</p>
            <p>⏰ Fecha: ${new Date().toLocaleString('es-CL')}</p>
          </div>
        </div>
      </div>
    `,
    text: `
      Email de Prueba - Termas Llifen
      
      ¡La configuración de Gmail está funcionando correctamente!
      
      Este es un email de prueba desde el sistema Admintermas.
      
      Configuración exitosa:
      - Servidor: Gmail SMTP
      - Enviado desde: reservas@termasllifen.cl
      - Fecha: ${new Date().toLocaleString('es-CL')}
    `,
  }),
}; 