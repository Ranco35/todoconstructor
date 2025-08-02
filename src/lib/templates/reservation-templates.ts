import { EmailTemplate } from '../template-engine';

const reservationTemplates: EmailTemplate[] = [
  {
    id: 'reservation_confirmation',
    name: 'Confirmación de Reserva',
    subject: 'Confirmación de Reserva #{{numero_reserva}} - {{empresa}}',
    htmlBody: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5530; margin: 0;">{{empresa}}</h1>
          <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
        </div>
        
        <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
          ✅ Confirmación de Reserva
        </h2>
        
        <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
          
          <p>¡Gracias por elegirnos! Su reserva ha sido confirmada exitosamente. A continuación los detalles:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #2c5530; width: 40%;">Número de Reserva:</td>
              <td style="padding: 8px 0;">#{{numero_reserva}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Check-in:</td>
                <td style="padding: 8px 0;">{{fecha_checkin}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Check-out:</td>
                <td style="padding: 8px 0;">{{fecha_checkout}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Habitación:</td>
                <td style="padding: 8px 0;">{{habitacion}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Paquete:</td>
                <td style="padding: 8px 0;">{{paquete}}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Total Reserva:</td>
                <td style="padding: 8px 0; font-weight: bold; font-size: 18px;">{{total_reserva}}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #2c5530;"><strong>📍 Ubicación:</strong> Llifen, Futrono, Región de Los Ríos</p>
                      <p style="margin: 10px 0 0 0; color: #2c5530;"><strong>📞 Contacto:</strong> +56 9 6645 7193</p>
        </div>
        
          <p>¡Esperamos brindarle una experiencia inolvidable en {{empresa}}!</p>
        
        <p style="margin-top: 30px;">
          Saludos cordiales,<br>
            <strong>Equipo de Reservas {{empresa}}</strong>
        </p>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            Este es un email automático, por favor no responder. Para consultas contacte a reservas@termasllifen.cl
          </p>
        </div>
      </div>
      </div>
    `,
    textBody: `
      Confirmación de Reserva {{numero_reserva}} - {{empresa}}
      
      Estimado/a {{nombre_cliente}},
      
      Su reserva ha sido confirmada exitosamente:
      
      Reserva N°: {{numero_reserva}}
      Check-in: {{fecha_checkin}}
      Check-out: {{fecha_checkout}}
      Habitación: {{habitacion}}
      Paquete: {{paquete}}
      Total: {{total_reserva}}
      
      Ubicación: Llifen, Futrono, Región de Los Ríos
              Contacto: +56 9 6645 7193
      
      ¡Esperamos brindarle una experiencia inolvidable!
      
      Saludos cordiales,
      Equipo de Reservas {{empresa}}
    `,
    variables: [
      { key: 'nombre_cliente', label: 'Nombre del Cliente', description: 'Nombre completo del huésped', type: 'text', required: true },
      { key: 'email_cliente', label: 'Email del Cliente', description: 'Correo electrónico del huésped', type: 'text', required: true },
      { key: 'empresa', label: 'Nombre de la Empresa', description: 'Ej: Termas Llifen', type: 'text', required: true },
      { key: 'numero_reserva', label: 'Número de Reserva', description: 'ID de la reserva', type: 'text', required: true },
      { key: 'fecha_checkin', label: 'Fecha de Check-in', description: 'Fecha de entrada', type: 'date', required: true },
      { key: 'fecha_checkout', label: 'Fecha de Check-out', description: 'Fecha de salida', type: 'date', required: true },
      { key: 'habitacion', label: 'Habitación', description: 'Código o nombre de la habitación', type: 'text', required: true },
      { key: 'paquete', label: 'Paquete', description: 'Tipo de paquete contratado', type: 'text', required: true },
      { key: 'total_reserva', label: 'Total de la Reserva', description: 'Monto total con formato', type: 'currency', required: true }
    ],
    category: 'reservation',
    attachmentType: 'none'
  },
  {
    id: 'payment_confirmation',
    name: 'Confirmación de Pago',
    subject: 'Pago Confirmado - Reserva #{{numero_reserva}} - {{empresa}}',
    htmlBody: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5530; margin: 0;">{{empresa}}</h1>
          <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
        </div>
        
        <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            💳 Confirmación de Pago
        </h2>
        
        <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
        
          <p>¡Gracias! Hemos recibido su pago. A continuación el detalle:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530; width: 40%;">Reserva N°:</td>
                <td style="padding: 8px 0;">#{{numero_reserva}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Habitación:</td>
                <td style="padding: 8px 0;">{{habitacion}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Paquete:</td>
                <td style="padding: 8px 0;">{{paquete}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Total Reserva:</td>
                <td style="padding: 8px 0;">{{total_reserva}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Total Pagado:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #28a745;">{{total_pagado}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Saldo Restante:</td>
                <td style="padding: 8px 0;">{{saldo_restante}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Fecha de Pago:</td>
                <td style="padding: 8px 0;">{{fecha_pago}}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;"><strong>✅ Pago Confirmado</strong></p>
            <p style="margin: 5px 0 0 0; color: #155724;">Su pago ha sido procesado exitosamente.</p>
          </div>
          
          <p>¡Gracias por su pago! Su reserva está confirmada.</p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo de Reservas {{empresa}}</strong>
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Este es un email automático, por favor no responder. Para consultas contacte a reservas@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    textBody: `
      Confirmación de Pago - Reserva {{numero_reserva}} - {{empresa}}
      
      Estimado/a {{nombre_cliente}},
      
      Hemos recibido su pago:
      
      Reserva N°: {{numero_reserva}}
      Habitación: {{habitacion}}
      Paquete: {{paquete}}
      Total Reserva: {{total_reserva}}
      Total Pagado: {{total_pagado}}
      Saldo Restante: {{saldo_restante}}
      
      ¡Gracias por su pago! Su reserva está confirmada.
      
      Saludos cordiales,
      Equipo de Reservas {{empresa}}
    `,
    variables: [
      { key: 'nombre_cliente', label: 'Nombre del Cliente', description: 'Nombre completo del huésped', type: 'text', required: true },
      { key: 'empresa', label: 'Nombre de la Empresa', description: 'Ej: Termas Llifen', type: 'text', required: true },
      { key: 'numero_reserva', label: 'Número de Reserva', description: 'ID de la reserva', type: 'text', required: true },
      { key: 'habitacion', label: 'Habitación', description: 'Código o nombre de la habitación', type: 'text', required: true },
      { key: 'paquete', label: 'Paquete', description: 'Tipo de paquete contratado', type: 'text', required: true },
      { key: 'total_reserva', label: 'Total de la Reserva', description: 'Monto total de la reserva', type: 'currency', required: true },
      { key: 'total_pagado', label: 'Total Pagado', description: 'Monto total pagado', type: 'currency', required: true },
      { key: 'saldo_restante', label: 'Saldo Restante', description: 'Saldo pendiente por pagar', type: 'currency', required: true },
      { key: 'fecha_pago', label: 'Fecha de Pago', description: 'Fecha en que se realizó el pago', type: 'date', required: true }
    ],
    category: 'client',
    attachmentType: 'none'
  },
  {
    id: 'reservation_reminder',
    name: 'Recordatorio de Reserva',
    subject: 'Recordatorio - Su reserva en {{empresa}} es mañana',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0;">{{empresa}}</h1>
            <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
          </div>
          
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            🔔 Recordatorio de Reserva
          </h2>
          
          <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
          
          <p>Le recordamos que su reserva es <strong>mañana</strong>. ¡Esperamos verle pronto!</p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #856404; width: 40%;">Reserva N°:</td>
                <td style="padding: 8px 0; color: #856404;">#{{numero_reserva}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #856404;">Check-in:</td>
                <td style="padding: 8px 0; color: #856404;">{{fecha_checkin}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #856404;">Check-out:</td>
                <td style="padding: 8px 0; color: #856404;">{{fecha_checkout}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #856404;">Habitación:</td>
                <td style="padding: 8px 0; color: #856404;">{{habitacion}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #856404;">Paquete:</td>
                <td style="padding: 8px 0; color: #856404;">{{paquete}}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2c5530;">📍 Información Importante:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #2c5530;">
              <li>Check-in desde las 15:00 hrs</li>
              <li>Ubicación: Llifen, Futrono, Región de Los Ríos</li>
                              <li>Contacto: +56 9 6645 7193</li>
              <li>Traiga su documento de identidad</li>
            </ul>
          </div>
          
          <p>¡Esperamos brindarle una experiencia inolvidable!</p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo de Reservas {{empresa}}</strong>
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Este es un email automático, por favor no responder. Para consultas contacte a reservas@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    textBody: `
      Recordatorio de Reserva - {{empresa}}
      
      Estimado/a {{nombre_cliente}},
      
      Le recordamos que su reserva es mañana:
      
      Reserva N°: {{numero_reserva}}
      Check-in: {{fecha_checkin}}
      Check-out: {{fecha_checkout}}
      Habitación: {{habitacion}}
      Paquete: {{paquete}}
      
      Información importante:
      - Check-in desde las 15:00 hrs
      - Ubicación: Llifen, Futrono, Región de Los Ríos
      - Contacto: +56 9 6645 7193
      - Traiga su documento de identidad
      
      ¡Esperamos brindarle una experiencia inolvidable!
      
      Saludos cordiales,
      Equipo de Reservas {{empresa}}
    `,
    variables: [
      { key: 'nombre_cliente', label: 'Nombre del Cliente', description: 'Nombre completo del huésped', type: 'text', required: true },
      { key: 'empresa', label: 'Nombre de la Empresa', description: 'Ej: Termas Llifen', type: 'text', required: true },
      { key: 'numero_reserva', label: 'Número de Reserva', description: 'ID de la reserva', type: 'text', required: true },
      { key: 'fecha_checkin', label: 'Fecha de Check-in', description: 'Fecha de entrada', type: 'date', required: true },
      { key: 'fecha_checkout', label: 'Fecha de Check-out', description: 'Fecha de salida', type: 'date', required: true },
      { key: 'habitacion', label: 'Habitación', description: 'Código o nombre de la habitación', type: 'text', required: true },
      { key: 'paquete', label: 'Paquete', description: 'Tipo de paquete contratado', type: 'text', required: true }
    ],
    category: 'reservation',
    attachmentType: 'none'
  }
];

export default reservationTemplates;
