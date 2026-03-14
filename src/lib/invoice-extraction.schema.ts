/**
 * Invoice Extraction Schema - JSON Schema para Structured Outputs
 * Última actualización: 2026-01-28
 *
 * Define el schema exacto que OpenAI debe retornar usando Structured Outputs.
 * Compatible con OpenAI JSON Schema format.
 */

import { z } from 'zod';

// ============================================
// ZOD SCHEMAS (para validación en TypeScript)
// ============================================

export const SupplierSchema = z.object({
  name: z.string().min(1, 'Nombre de proveedor requerido'),
  rut: z.string().regex(/^\d{1,2}\.\d{3}\.\d{3}[-.]?[\dkK]$/i, 'RUT inválido'),
  address: z.string().optional(),
  giro: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const InvoiceHeaderSchema = z.object({
  folio: z.string().min(1, 'Número de factura requerido'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser YYYY-MM-DD'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  currency: z.enum(['CLP', 'USD', 'EUR']).default('CLP'),
  net: z.number().nonnegative().optional(), // Subtotal neto
  tax: z.number().nonnegative().optional(), // IVA
  total: z.number().nonnegative(), // Total a pagar
  exento: z.number().nonnegative().optional(), // Monto exento
  confidence: z.number().min(0).max(1).optional(), // Confianza de extracción
});

export const LineItemSchema = z.object({
  description: z.string().min(1, 'Descripción requerida'),
  sku: z.string().optional().nullable(),
  quantity: z.number().positive('Cantidad debe ser positiva'),
  unit: z.string().optional().nullable(), // UN, KG, LT, CJ, etc.
  unitPrice: z.number().nonnegative('Precio unitario debe ser no negativo'),
  discount: z.number().min(0).max(1).optional(), // Descuento 0-1 (ej: 0.1 = 10%)
  lineTotal: z.number().nonnegative('Total de línea debe ser no negativo'),
  taxAffectation: z.enum(['AFFECTO', 'EXENTO', 'NO_INFO']).default('NO_INFO'),
  confidence: z.number().min(0).max(1).optional(),
});

export const ExtractionResultSchema = z.object({
  supplier: SupplierSchema,
  header: InvoiceHeaderSchema,
  lineItems: z.array(LineItemSchema).min(1, 'Debe haber al menos un item'),
  warnings: z.array(z.string()).optional().default([]),
});

// ============================================
// TYPES (inferidos de Zod)
// ============================================

export type Supplier = z.infer<typeof SupplierSchema>;
export type InvoiceHeader = z.infer<typeof InvoiceHeaderSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ============================================
// JSON SCHEMA (para OpenAI Structured Outputs)
// ============================================

/**
 * Genera JSON Schema compatible con OpenAI
 * OpenAI usa formato JSON Schema estándar
 */
export function getOpenAIJsonSchema() {
  return {
    type: 'object',
    properties: {
      supplier: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre completo del proveedor' },
          rut: {
            type: 'string',
            description: 'RUT del proveedor en formato XX.XXX.XXX-X',
            pattern: '^\\d{1,2}\\.\\d{3}\\.\\d{3}[-.]?[\\dkK]$'
          },
          address: { type: 'string', description: 'Dirección del proveedor' },
          giro: { type: 'string', description: 'Giro comercial del proveedor' },
          phone: { type: 'string', description: 'Teléfono del proveedor' },
          email: { type: 'string', format: 'email', description: 'Email del proveedor' },
        },
        required: ['name', 'rut'],
        additionalProperties: false
      },
      header: {
        type: 'object',
        properties: {
          folio: { type: 'string', description: 'Número de factura (folio)' },
          issueDate: {
            type: 'string',
            description: 'Fecha de emisión en formato YYYY-MM-DD',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$'
          },
          dueDate: {
            type: 'string',
            description: 'Fecha de vencimiento en formato YYYY-MM-DD o null',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            nullable: true
          },
          currency: {
            type: 'string',
            enum: ['CLP', 'USD', 'EUR'],
            default: 'CLP',
            description: 'Moneda de la factura'
          },
          net: {
            type: 'number',
            description: 'Subtotal neto (sin IVA)',
            minimum: 0
          },
          tax: {
            type: 'number',
            description: 'Monto de IVA (19% típicamente)',
            minimum: 0
          },
          total: {
            type: 'number',
            description: 'Total a pagar (neto + IVA)',
            minimum: 0
          },
          exento: {
            type: 'number',
            description: 'Monto exento de IVA',
            minimum: 0
          },
          confidence: {
            type: 'number',
            description: 'Confianza de extracción (0-1)',
            minimum: 0,
            maximum: 1
          },
        },
        required: ['folio', 'issueDate', 'total'],
        additionalProperties: false
      },
      lineItems: {
        type: 'array',
        description: 'Lista de items/productos de la factura',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Descripción completa del producto/servicio',
              minLength: 1
            },
            sku: {
              type: 'string',
              description: 'Código SKU o código de producto si está disponible',
              nullable: true
            },
            quantity: {
              type: 'number',
              description: 'Cantidad del producto',
              minimum: 0.01,
              exclusiveMinimum: true
            },
            unit: {
              type: 'string',
              description: 'Unidad de medida: UN (unidad), KG (kilogramo), LT (litro), CJ (caja), etc.',
              nullable: true
            },
            unitPrice: {
              type: 'number',
              description: 'Precio unitario del producto',
              minimum: 0
            },
            discount: {
              type: 'number',
              description: 'Descuento aplicado (0-1, ej: 0.1 = 10%)',
              minimum: 0,
              maximum: 1
            },
            lineTotal: {
              type: 'number',
              description: 'Total de la línea (quantity * unitPrice * (1 - discount))',
              minimum: 0
            },
            taxAffectation: {
              type: 'string',
              enum: ['AFFECTO', 'EXENTO', 'NO_INFO'],
              default: 'NO_INFO',
              description: 'Si el item está afecto o exento de IVA'
            },
            confidence: {
              type: 'number',
              description: 'Confianza de extracción de este item (0-1)',
              minimum: 0,
              maximum: 1
            },
          },
          required: ['description', 'quantity', 'unitPrice', 'lineTotal'],
          additionalProperties: false
        }
      },
      warnings: {
        type: 'array',
        description: 'Advertencias sobre la extracción (páginas vacías, datos faltantes, etc.)',
        items: { type: 'string' },
        default: []
      },
    },
    required: ['supplier', 'header', 'lineItems'],
    additionalProperties: false
  };
}

/**
 * Valida datos extraídos contra el schema
 */
export function validateExtractionResult(data: unknown): {
  success: boolean;
  data?: ExtractionResult;
  error?: string;
  errors?: z.ZodError;
} {
  try {
    const validated = ExtractionResultSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Datos no válidos según schema',
        errors: error
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Genera prompt mejorado para extracción con schema
 */
export function getExtractionPrompt(pdfText: string, isHeaderPass: boolean = false): string {
  if (isHeaderPass) {
    return `Analiza este texto de factura chilena y extrae SOLO la información del encabezado (proveedor, RUT, folio, fechas, totales).

TEXTO DE LA FACTURA (páginas 1-2):
${pdfText}

INSTRUCCIONES:
1. Extrae el nombre del proveedor EXACTO del texto
2. Extrae el RUT en formato XX.XXX.XXX-X
3. Extrae el número de factura (folio)
4. Extrae fecha de emisión (formato YYYY-MM-DD)
5. Extrae fecha de vencimiento si está disponible
6. Extrae totales: neto, IVA, total a pagar
7. Si solo encuentras el total, calcula: neto = total / 1.19, IVA = total - neto
8. Convierte TODOS los números a valores numéricos sin separadores ni símbolos

Responde SOLO con JSON válido según el schema proporcionado. NO incluyas items de productos en esta pasada.`;
  }

  return `Analiza este texto de factura chilena y extrae SOLO los items/productos (líneas de detalle).

TEXTO DE LA FACTURA (páginas de items):
${pdfText}

INSTRUCCIONES:
1. Extrae CADA item/producto de la factura
2. Para cada item, extrae: descripción, cantidad, precio unitario, total de línea
3. Si hay SKU o código de producto, inclúyelo
4. Si hay unidad de medida (UN, KG, LT, etc.), inclúyela
5. Si hay descuento, inclúyelo como número 0-1 (ej: 0.1 = 10%)
6. Calcula lineTotal = quantity * unitPrice * (1 - discount)
7. Convierte TODOS los números a valores numéricos sin separadores ni símbolos

IMPORTANTE: Extrae TODOS los items, no solo los primeros. Si hay múltiples páginas, extrae items de todas.

Responde SOLO con JSON válido según el schema proporcionado. El JSON debe tener esta estructura:
{
  "lineItems": [
    {
      "description": "...",
      "quantity": 1,
      "unitPrice": 0,
      "lineTotal": 0,
      ...
    }
  ]
}

Si no hay items en este texto, retorna: {"lineItems": []}`;
}
