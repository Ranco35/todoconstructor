// Motor de plantillas para emails con variables
export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'array';
  required: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: TemplateVariable[];
  category: 'client' | 'supplier' | 'system' | 'reservation';
  attachmentType?: 'pdf' | 'none';
}

export interface TemplateData {
  [key: string]: any;
}

// Variables disponibles por categoría
export const templateVariables: Record<string, TemplateVariable[]> = {
  client: [
    { key: 'nombre_cliente', label: 'Nombre del Cliente', description: 'Nombre completo del cliente', type: 'text', required: true },
    { key: 'email_cliente', label: 'Email del Cliente', description: 'Dirección de correo del cliente', type: 'text', required: true },
    { key: 'fecha_actual', label: 'Fecha Actual', description: 'Fecha actual del sistema', type: 'date', required: false },
    { key: 'empresa', label: 'Nombre de la Empresa', description: 'Termas Llifen', type: 'text', required: false },
  ],
  budget: [
    { key: 'numero_presupuesto', label: 'Número de Presupuesto', description: 'Identificador único del presupuesto', type: 'text', required: true },
    { key: 'fecha_presupuesto', label: 'Fecha del Presupuesto', description: 'Fecha de creación del presupuesto', type: 'date', required: true },
    { key: 'valido_hasta', label: 'Válido Hasta', description: 'Fecha de expiración del presupuesto', type: 'date', required: true },
    { key: 'subtotal', label: 'Subtotal', description: 'Subtotal sin impuestos', type: 'currency', required: true },
    { key: 'impuestos', label: 'Impuestos (IVA)', description: 'Valor de impuestos aplicados', type: 'currency', required: true },
    { key: 'total', label: 'Total', description: 'Monto total del presupuesto', type: 'currency', required: true },
    { key: 'items_presupuesto', label: 'Items del Presupuesto', description: 'Lista de productos/servicios cotizados', type: 'array', required: true },
    { key: 'contacto_persona', label: 'Persona de Contacto', description: 'Encargado de ventas', type: 'text', required: false },
    { key: 'contacto_telefono', label: 'Teléfono de Contacto', description: 'Número de contacto comercial', type: 'text', required: false },
  ],
  reservation: [
    { key: 'numero_reserva', label: 'Número de Reserva', description: 'ID único de la reserva', type: 'text', required: true },
    { key: 'fecha_checkin', label: 'Fecha de Check-in', description: 'Fecha de entrada', type: 'date', required: true },
    { key: 'fecha_checkout', label: 'Fecha de Check-out', description: 'Fecha de salida', type: 'date', required: true },
    { key: 'habitacion', label: 'Habitación', description: 'Código de la habitación asignada', type: 'text', required: true },
    { key: 'paquete', label: 'Paquete', description: 'Tipo de paquete contratado', type: 'text', required: true },
    { key: 'total_reserva', label: 'Total de la Reserva', description: 'Monto total de la reserva', type: 'currency', required: true },
    { key: 'numero_huespedes', label: 'Número de Huéspedes', description: 'Cantidad de personas', type: 'number', required: true },
    { key: 'tipo_habitacion', label: 'Tipo de Habitación', description: 'Categoría de la habitación', type: 'text', required: true },
    { key: 'estado_reserva', label: 'Estado de la Reserva', description: 'Estado actual de la reserva', type: 'text', required: true },
    { key: 'politicas_cancelacion', label: 'Políticas de Cancelación', description: 'Términos de cancelación', type: 'text', required: false },
  ],
  payment: [
    { key: 'monto_pagado', label: 'Monto Pagado', description: 'Cantidad pagada', type: 'currency', required: true },
    { key: 'metodo_pago', label: 'Método de Pago', description: 'Forma de pago utilizada', type: 'text', required: true },
    { key: 'fecha_pago', label: 'Fecha de Pago', description: 'Fecha del pago', type: 'date', required: true },
    { key: 'saldo_restante', label: 'Saldo Restante', description: 'Monto pendiente por pagar', type: 'currency', required: true },
    { key: 'referencia_pago', label: 'Referencia de Pago', description: 'Número de referencia o transacción', type: 'text', required: false },
    { key: 'total_pagado', label: 'Total Pagado', description: 'Suma de todos los pagos realizados', type: 'currency', required: true },
  ],
  supplier: [
    { key: 'nombre_proveedor', label: 'Nombre del Proveedor', description: 'Razón social del proveedor', type: 'text', required: true },
    { key: 'email_proveedor', label: 'Email del Proveedor', description: 'Correo del proveedor', type: 'text', required: true },
  ],
  purchase_order: [
    { key: 'numero_orden', label: 'Número de Orden', description: 'ID de la orden de compra', type: 'text', required: true },
    { key: 'fecha_orden', label: 'Fecha de Orden', description: 'Fecha de creación de la orden', type: 'date', required: true },
    { key: 'fecha_entrega', label: 'Fecha de Entrega', description: 'Fecha solicitada de entrega', type: 'date', required: true },
    { key: 'direccion_entrega', label: 'Dirección de Entrega', description: 'Lugar de entrega', type: 'text', required: true },
    { key: 'items_orden', label: 'Items de la Orden', description: 'Productos/servicios solicitados', type: 'array', required: true },
    { key: 'observaciones', label: 'Observaciones', description: 'Notas adicionales', type: 'text', required: false },
  ]
};

// Plantillas predefinidas
export const defaultTemplates: EmailTemplate[] = [
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

          <h3 style="color: #2c5530; margin-top: 30px;">Resumen del Presupuesto:</h3>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Subtotal:</span>
              <span style="font-weight: bold;">{{subtotal}}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>IVA (19%):</span>
              <span style="font-weight: bold;">{{impuestos}}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 2px solid #2c5530; padding-top: 10px; margin-top: 10px;">
              <span style="font-size: 18px; font-weight: bold;">TOTAL:</span>
              <span style="font-size: 18px; font-weight: bold; color: #2c5530;">{{total}}</span>
            </div>
          </div>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2c5530;"><strong>📞 Contacto para consultas:</strong></p>
            <p style="margin: 5px 0; color: #2c5530;">{{contacto_persona}}</p>
            <p style="margin: 0; color: #2c5530;">{{contacto_telefono}}</p>
          </div>
          
          <p>El detalle completo del presupuesto se encuentra en el archivo adjunto.</p>
          
          <p>Esperamos que nuestro presupuesto sea de su agrado. No dude en contactarnos para aclarar cualquier consulta.</p>
          
          <p style="margin-top: 30px;">
            Saludos cordiales,<br>
            <strong>Equipo Comercial {{empresa}}</strong>
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Este presupuesto es válido hasta la fecha indicada. Para reservar, contacte a reservas@termasllifen.cl
            </p>
          </div>
        </div>
      </div>
    `,
    textBody: `
      Presupuesto {{numero_presupuesto}} - {{empresa}}
      
      Estimado/a {{nombre_cliente}},
      
      Nos complace presentar el siguiente presupuesto:
      
      Presupuesto N°: {{numero_presupuesto}}
      Fecha: {{fecha_presupuesto}}
      Válido hasta: {{valido_hasta}}
      
      RESUMEN:
      Subtotal: {{subtotal}}
      IVA (19%): {{impuestos}}
      TOTAL: {{total}}
      
      Contacto: {{contacto_persona}} - {{contacto_telefono}}
      
      El detalle completo se encuentra en el archivo adjunto.
      
      Saludos cordiales,
      Equipo Comercial {{empresa}}
    `,
    variables: [
      ...templateVariables.client,
      ...templateVariables.budget
    ],
    category: 'client',
    attachmentType: 'pdf'
  },


];

// Motor de reemplazo de variables
export function replaceTemplateVariables(template: string, data: TemplateData = {}): string {
  if (!template || typeof template !== 'string') {
    console.error('Template no válido:', template);
    return '';
  }

  try {
    // Valores por defecto para variables comunes
    const defaultValues: TemplateData = {
      empresa: 'Termas Llifen',
      fecha_actual: new Date().toLocaleDateString('es-CL'),
      contacto_persona: 'Equipo Comercial',
      contacto_telefono: '+56 63 2318 000',
      // Valores por defecto para reservas
      'total_reserva': '$0',
      'monto_pagado': '$0',
      'saldo_restante': '$0',
      'total_pagado': '$0',
      'metodo_pago': 'No especificado',
      'fecha_pago': new Date().toLocaleDateString('es-CL'),
      'referencia_pago': 'No aplica',
      'habitacion': 'No especificada',
      'paquete': 'No especificado',
      'fecha_checkin': 'No especificada',
      'fecha_checkout': 'No especificada',
      'numero_reserva': 'No especificado',
      'nombre_cliente': 'Estimado/a Cliente',
      'email_cliente': 'No especificado',
      'numero_huespedes': 1,
      'tipo_habitacion': 'No especificado',
      'estado_reserva': 'Confirmada',
      'politicas_cancelacion': 'Consultar con el hotel'
    };

    // Combinar datos proporcionados con valores por defecto
    const allData = { ...defaultValues, ...data };
    
    // Primero, reemplazar todas las variables conocidas
    let result = template;
    const allKeys = Object.keys(allData);
    
    allKeys.forEach(key => {
      if (key) {
        const value = allData[key];
        let formattedValue: string;
        
        // Formatear según el tipo de dato
        if (value === undefined || value === null) {
          formattedValue = '';
        } else if (typeof value === 'number') {
          // Si es moneda (contiene claves como total, subtotal, etc.)
          if (key.includes('total') || key.includes('subtotal') || key.includes('impuesto') || 
              key.includes('monto') || key.includes('saldo') || key.includes('pagado')) {
            formattedValue = `$${value.toLocaleString('es-CL')}`;
          } else {
            formattedValue = value.toString();
          }
        } else if (value instanceof Date) {
          formattedValue = value.toLocaleDateString('es-CL');
        } else if (typeof value === 'string' && key.includes('fecha') && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          formattedValue = new Date(value).toLocaleDateString('es-CL');
        } else {
          formattedValue = String(value);
        }
        
        // Crear una expresión regular que coincida con {{key}} sin importar espacios en blanco
        const regex = new RegExp(`\\{\\s*${key}\\s*\\}`, 'g');
        result = result.replace(regex, formattedValue);
      }
    });
    
    // Luego, reemplazar cualquier variable restante con una cadena vacía
    result = result.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g, '');
    
    return result;
  } catch (error) {
    console.error('Error al procesar la plantilla:', error);
    return 'Error al procesar la plantilla. Por favor, verifica el formato.';
  }
}

// Validar que todas las variables requeridas estén presentes
export function validateTemplateData(template: EmailTemplate, data: TemplateData): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  template.variables.forEach(variable => {
    if (variable.required && !data[variable.key]) {
      missing.push(variable.label);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Obtener plantilla por ID
export function getTemplateById(id: string): EmailTemplate | undefined {
  return defaultTemplates.find(template => template.id === id);
}

// Obtener plantillas por categoría
export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return defaultTemplates.filter(template => template.category === category);
} 