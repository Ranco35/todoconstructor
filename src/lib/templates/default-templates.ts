import { EmailTemplate } from '../template-engine';

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'budget_quote',
    name: 'Presupuesto de Servicios',
    subject: 'Presupuesto {{numero_presupuesto}} - {{empresa}}',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5530; margin: 0;">{{empresa}}</h1>
            <p style="color: #666; margin: 5px 0;">Hotel & Spa</p>
          </div>
          
          <h2 style="color: #2c5530; border-bottom: 2px solid #2c5530; padding-bottom: 10px;">
            💼 Presupuesto de Servicios
          </h2>
          
          <p>Estimado/a <strong>{{nombre_cliente}}</strong>,</p>
          
          <p>Nos complace presentar el siguiente presupuesto para los servicios solicitados:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Presupuesto N°:</td>
                <td style="padding: 8px 0;">{{numero_presupuesto}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Fecha:</td>
                <td style="padding: 8px 0;">{{fecha_presupuesto}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c5530;">Válido hasta:</td>
                <td style="padding: 8px 0;">{{valido_hasta}}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin: 25px 0;">
            <h3 style="color: #2c5530; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">
              Detalle del Presupuesto
            </h3>
            {{#each items_presupuesto}}
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <strong>\{\{this.descripcion\}\}</strong>
                \{\{#if this.detalle\}\}<div style="color: #666; font-size: 0.9em;">\{\{this.detalle\}\}</div>\{\{/if\}\}
              </div>
              <div style="text-align: right;">
                <div>$\{\{this.precio\}\}</div>
                \{\{#if this.cantidad\}\}<div style="font-size: 0.9em; color: #666;">\{\{this.cantidad\}\} x $\{\{this.precio_unitario\}\}</div>\{\{/if\}\}
              </div>
            </div>
            {{/each}}
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: right;">
            <div style="margin-bottom: 5px;">
              <span style="font-weight: bold; color: #2c5530;">Subtotal:</span>
              <span style="margin-left: 15px;">$\{\{this.subtotal\}\}</span>
            </div>
            <div style="margin-bottom: 5px;">
              <span style="font-weight: bold; color: #2c5530;">Impuestos (\{\{this.impuesto_porcentaje\}\}%):</span>
              <span style="margin-left: 15px;">$\{\{this.impuestos\}\}</span>
            </div>
            <div style="font-size: 1.2em; font-weight: bold; color: #2c5530; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
              <span>Total:</span>
              <span style="margin-left: 15px;">$\{\{this.total\}\}</span>
            </div>
          </div>
          
          {{#if condiciones_especiales}}
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>Condiciones Especiales:</strong> {{condiciones_especiales}}</p>
          </div>
          {{/if}}
          
          <p>Para aceptar este presupuesto o si tiene alguna consulta, no dude en contactarnos.</p>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #2c5530;">
              <strong>📞 {{contacto_persona}}</strong><br>
              {{contacto_cargo}}<br>
              📧 {{contacto_email}}<br>
              📱 {{contacto_telefono}}
            </p>
          </div>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo Comercial</strong><br>
            {{empresa}}
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Este es un email automático, por favor no responder. Para consultas contacte a {{contacto_email}}
            </p>
          </div>
        </div>
      </div>
    `,
    textBody: `
      PRESUPUESTO DE SERVICIOS - {{empresa}}
      
      Estimado/a {{nombre_cliente}},
      
      Nos complace presentar el siguiente presupuesto para los servicios solicitados:
      
      DETALLES DEL PRESUPUESTO:
      - Número: {{numero_presupuesto}}
      - Fecha: {{fecha_presupuesto}}
      - Válido hasta: {{valido_hasta}}
      
      DETALLE DEL PRESUPUESTO:
      {{#each items_presupuesto}}
      * \{\{this.descripcion\}\}\{\{#if this.detalle\}\} (\{\{this.detalle\}\})\{\{/if\}\}: $\{\{this.precio\}\}
        \{\{#if this.cantidad\}\}\{\{this.cantidad\}\} x $\{\{this.precio_unitario\}\}\{\{/if\}\}
      {{/each}}
      
      RESUMEN:
      Subtotal: $\{\{this.subtotal\}\}
      Impuestos (\{\{this.impuesto_porcentaje\}\}%): $\{\{this.impuestos\}\}
      TOTAL: $\{\{this.total\}\}
      
      {{#if condiciones_especiales}}
      CONDICIONES ESPECIALES:
      {{condiciones_especiales}}
      {{/if}}
      
      Para aceptar este presupuesto o si tiene alguna consulta, no dude en contactarnos.
      
      CONTACTO:
      {{contacto_persona}}
      {{contacto_cargo}}
      Email: {{contacto_email}}
      Teléfono: {{contacto_telefono}}
      
      Saludos cordiales,
      Equipo Comercial
      {{empresa}}
      
      ---
      Este es un email automático, por favor no responder.
    `,
    variables: [
      { key: 'nombre_cliente', label: 'Nombre del Cliente', description: 'Nombre completo del cliente', type: 'text', required: true },
      { key: 'email_cliente', label: 'Email del Cliente', description: 'Correo electrónico del cliente', type: 'text', required: true },
      { key: 'empresa', label: 'Nombre de la Empresa', description: 'Ej: Termas Llifen', type: 'text', required: true },
      { key: 'numero_presupuesto', label: 'Número de Presupuesto', description: 'Identificador único del presupuesto', type: 'text', required: true },
      { key: 'fecha_presupuesto', label: 'Fecha del Presupuesto', description: 'Fecha de emisión', type: 'date', required: true },
      { key: 'valido_hasta', label: 'Válido Hasta', description: 'Fecha de vencimiento', type: 'date', required: true },
      { key: 'items_presupuesto', label: 'Ítems del Presupuesto', description: 'Lista de productos/servicios', type: 'array', required: true },
      { key: 'subtotal', label: 'Subtotal', description: 'Suma antes de impuestos', type: 'currency', required: true },
      { key: 'impuesto_porcentaje', label: '% de Impuestos', description: 'Porcentaje de impuestos', type: 'number', required: true },
      { key: 'impuestos', label: 'Valor de Impuestos', description: 'Monto de impuestos', type: 'currency', required: true },
      { key: 'total', label: 'Total', description: 'Monto total con impuestos', type: 'currency', required: true },
      { key: 'condiciones_especiales', label: 'Condiciones Especiales', description: 'Términos adicionales', type: 'text', required: false },
      { key: 'contacto_persona', label: 'Persona de Contacto', description: 'Nombre del responsable', type: 'text', required: true },
      { key: 'contacto_cargo', label: 'Cargo de Contacto', description: 'Cargo del responsable', type: 'text', required: true },
      { key: 'contacto_email', label: 'Email de Contacto', description: 'Correo para consultas', type: 'text', required: true },
      { key: 'contacto_telefono', label: 'Teléfono de Contacto', description: 'Número para consultas', type: 'text', required: true }
    ],
    category: 'client',
    attachmentType: 'pdf'
  },
  // Otras plantillas predeterminadas pueden ir aquí
];

export default defaultTemplates;
