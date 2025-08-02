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
          
          <p>¡Gracias por elegirnos! Su reserva ha sido confirmada con éxito.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c5530; margin-top: 0;">Detalles de su Reserva</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530; width: 40%;">Número de Reserva:</td>
                <td style="padding: 8px 0;">#${'{{' + 'numero_reserva' + '}}'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Check-in:</td>
                <td style="padding: 8px 0;">${'{{' + 'fecha_checkin' + '}}'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Check-out:</td>
                <td style="padding: 8px 0;">${'{{' + 'fecha_checkout' + '}}'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Habitación:</td>
                <td style="padding: 8px 0;">${'{{' + 'habitacion' + '}}'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Paquete:</td>
                <td style="padding: 8px 0;">${'{{' + 'paquete' + '}}'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Total:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold;">$${'{{' + 'total_reserva' + '}}'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2c5530;"><strong>📍 Ubicación:</strong> Camino Huilo Huilo, Panguipulli, Región de Los Ríos</p>
            <p style="margin: 10px 0 0 0; color: #2c5530;"><strong>📞 Contacto:</strong> +56 63 2318 000</p>
          </div>
          
          <p>Si tiene alguna pregunta o necesita realizar cambios en su reserva, no dude en contactarnos.</p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo de Reservas</strong><br>
            {{empresa}}
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
      CONFIRMACIÓN DE RESERVA - {{empresa}}
      
      Estimado/a {{nombre_cliente}},
      
      ¡Gracias por elegirnos! Su reserva ha sido confirmada con éxito.
      
      DETALLES DE LA RESERVA:
      - Número: #{{numero_reserva}}
      - Check-in: {{fecha_checkin}}
      - Check-out: {{fecha_checkout}}
      - Habitación: {{habitacion}}
      - Paquete: {{paquete}}
      - Total: ${{total_reserva}}
      
      UBICACIÓN:
      Camino Huilo Huilo, Panguipulli, Región de Los Ríos
      
      CONTACTO:
      Teléfono: +56 63 2318 000
      Email: reservas@termasllifen.cl
      
      Saludos cordiales,
      Equipo de Reservas
      {{empresa}}
      
      ---
      Este es un email automático, por favor no responder.
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
    category: 'client',
    attachmentType: 'none'
  },
  {
    id: 'payment_confirmation',
    name: 'Confirmación de Pago',
    subject: 'Confirmación de Pago - Reserva #{{numero_reserva}} - {{empresa}}',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0;">{{empresa}}</h1>
            <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
          </div>
          
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            💳 Confirmación de Pago Recibido
          </h2>
          
          <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
          
          <p>Hemos recibido su pago. A continuación, los detalles de la transacción:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #2c5530; margin-top: 0;">Detalles del Pago</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530; width: 40%;">Monto Pagado:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #28a745;">$\{\{monto_pagado\}\}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Método de Pago:</td>
                <td style="padding: 8px 0;">{{metodo_pago}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Fecha del Pago:</td>
                <td style="padding: 8px 0;">{{fecha_pago}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Número de Reserva:</td>
                <td style="padding: 8px 0;">#{{numero_reserva}}</td>
              </tr>
              {{#if referencia_pago}}
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Referencia:</td>
                <td style="padding: 8px 0;">{{referencia_pago}}</td>
              </tr>
              {{/if}}
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c5530; margin-top: 0;">Detalles de la Reserva</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530; width: 40%;">Check-in:</td>
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
                <td style="padding: 8px 0;">$\{\{total_reserva\}\}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Total Pagado:</td>
                <td style="padding: 8px 0; font-weight: bold;">$\{\{total_pagado\}\}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Saldo Pendiente:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #dc3545;">$\{\{saldo_restante\}\}</td>
              </tr>
            </table>
          </div>
          
          {{#ifCond saldo_restante '>' 0}}
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Saldo Pendiente:</strong> Queda un saldo de $\{\{saldo_restante\}\} por pagar antes del check-in.
            </p>
          </div>
          {{else}}
          <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;">
              <strong>🎉 ¡Felicitaciones!</strong> Su reserva está completamente pagada.
            </p>
          </div>
          {{/ifCond}}
          
          <p>Si tiene alguna pregunta sobre su pago o reserva, no dude en contactarnos.</p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo de Reservas</strong><br>
            {{empresa}}
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
      CONFIRMACIÓN DE PAGO - {{empresa}}
      
      Estimado/a {{nombre_cliente}},
      
      Hemos recibido su pago. A continuación, los detalles de la transacción:
      
      DETALLES DEL PAGO:
      - Monto: $\{\{monto_pagado\}\}
      - Método: {{metodo_pago}}
      - Fecha: {{fecha_pago}}
      - Reserva: #{{numero_reserva}}
      {{#if referencia_pago}}- Referencia: {{referencia_pago}}{{/if}}
      
      DETALLES DE LA RESERVA:
      - Check-in: {{fecha_checkin}}
      - Check-out: {{fecha_checkout}}
      - Habitación: {{habitacion}}
      - Paquete: {{paquete}}
      - Total Reserva: $\{\{total_reserva\}\}
      - Total Pagado: $\{\{total_pagado\}\}
      - Saldo Pendiente: $\{\{saldo_restante\}\}
      
      {{#ifCond saldo_restante '>' 0}}
      ⚠️  ATENCIÓN: Queda un saldo pendiente de $\{\{saldo_restante\}\} que debe ser cancelado antes del check-in.
      {{else}}
      ✅ Su reserva está completamente pagada.
      {{/ifCond}}
      
      Si tiene alguna pregunta, no dude en contactarnos.
      
      Saludos cordiales,
      Equipo de Reservas
      {{empresa}}
      
      ---
      Este es un email automático, por favor no responder.
    `,
    variables: [
      { key: 'nombre_cliente', label: 'Nombre del Cliente', description: 'Nombre completo del huésped', type: 'text', required: true },
      { key: 'email_cliente', label: 'Email del Cliente', description: 'Correo electrónico del huésped', type: 'text', required: true },
      { key: 'empresa', label: 'Nombre de la Empresa', description: 'Ej: Termas Llifen', type: 'text', required: true },
      { key: 'numero_reserva', label: 'Número de Reserva', description: 'ID de la reserva', type: 'text', required: true },
      { key: 'monto_pagado', label: 'Monto Pagado', description: 'Monto de este pago', type: 'currency', required: true },
      { key: 'metodo_pago', label: 'Método de Pago', description: 'Ej: Transferencia, Tarjeta, Efectivo', type: 'text', required: true },
      { key: 'fecha_pago', label: 'Fecha del Pago', description: 'Fecha en que se realizó el pago', type: 'date', required: true },
      { key: 'referencia_pago', label: 'Referencia de Pago', description: 'Número de transacción o referencia', type: 'text', required: false },
      { key: 'fecha_checkin', label: 'Fecha de Check-in', description: 'Fecha de entrada', type: 'date', required: true },
      { key: 'fecha_checkout', label: 'Fecha de Check-out', description: 'Fecha de salida', type: 'date', required: true },
      { key: 'habitacion', label: 'Habitación', description: 'Código o nombre de la habitación', type: 'text', required: true },
      { key: 'paquete', label: 'Paquete', description: 'Tipo de paquete contratado', type: 'text', required: true },
      { key: 'total_reserva', label: 'Total de la Reserva', description: 'Monto total de la reserva', type: 'currency', required: true },
      { key: 'total_pagado', label: 'Total Pagado', description: 'Suma de todos los pagos realizados', type: 'currency', required: true },
      { key: 'saldo_restante', label: 'Saldo Restante', description: 'Monto pendiente por pagar', type: 'currency', required: true }
    ],
    category: 'client',
    attachmentType: 'pdf'
  }
];

export default reservationTemplates;
