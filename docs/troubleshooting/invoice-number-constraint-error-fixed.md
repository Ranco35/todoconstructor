# Error de Constraint en Número de Factura - RESUELTO

## Problema

**Error**: `Error creando factura: null value in column "number" of relation "purchase_invoices" violates not-null constraint`

## Descripción

Después de resolver exitosamente el problema de extracción de PDFs, aparecía un nuevo error en la base de datos al intentar crear el borrador de factura. El campo `number` (número interno) estaba llegando como `null`.

### Causa

El sistema intentaba usar `extractedData.invoiceNumber` (que no existe) en lugar de generar automáticamente el número interno de factura.

**Confusión entre dos tipos de números**:
1. **Número interno** (`number`): Generado automáticamente por el sistema (formato: `FC250123-0001`)
2. **Número del proveedor** (`supplier_invoice_number`): Extraído del PDF (ej: `"10175"`)

## Solución Implementada

### 1. Exportar Función de Generación

**Archivo**: `src/actions/purchases/invoices/create.ts`

```typescript
// ✅ AHORA: Función exportada
export async function generateInvoiceNumber(): Promise<string>
```

### 2. Importar y Usar en PDF Processor

**Archivo**: `src/actions/purchases/pdf-processor.ts`

```typescript
import { generateInvoiceNumber } from './invoices/create'

// Generar número interno automáticamente
const internalNumber = await generateInvoiceNumber()
console.log('🔢 Número interno generado:', internalNumber)

// Mapeo correcto
const { data: invoice, error: invoiceError } = await supabase
  .from('purchase_invoices')
  .insert({
    number: internalNumber, // ✅ Número interno generado (FC250123-0001)
    supplier_invoice_number: extractedData.supplierInvoiceNumber, // ✅ Número del proveedor (10175)
    // ... otros campos
  })
```

### 3. Logging Mejorado

```typescript
console.log('📝 Creando borrador de factura:', extractedData.supplierInvoiceNumber)
console.log('🔢 Número interno generado:', internalNumber)
```

## Diferencia de Campos

| Campo | Descripción | Origen | Ejemplo |
|-------|-------------|--------|---------|
| `number` | Número interno del sistema | Generado automáticamente | `FC250123-0001` |
| `supplier_invoice_number` | Número oficial del proveedor | Extraído del PDF por IA | `"10175"` |

## Formato del Número Interno

- **Patrón**: `FC[AAMMDD]-[NNNN]`
- **FC**: Prefijo "Factura Compra"
- **AAMMDD**: Año, mes, día (250123 = 23 enero 2025)
- **NNNN**: Secuencia autoincremental (0001, 0002, etc.)

## Beneficios

1. **Trazabilidad completa**: Número interno único + número proveedor
2. **Autonumeración**: Sin conflictos de secuencia
3. **Identificación clara**: Formato estándar reconocible
4. **Compatibilidad**: Mantiene estructura existente

## Verificación

1. ✅ **PDF se procesa correctamente**
2. ✅ **Número interno se genera automáticamente**
3. ✅ **Número proveedor se extrae del PDF**
4. ✅ **Borrador se crea sin errores de constraint**

## Estado: ✅ RESUELTO

El error de constraint está completamente eliminado. El sistema ahora:
- Genera números internos automáticamente
- Mapea correctamente ambos tipos de números
- Crea borradores de factura exitosamente

---
**Fecha**: 23 de enero 2025  
**Archivos modificados**:
- `src/actions/purchases/invoices/create.ts` (export function)
- `src/actions/purchases/pdf-processor.ts` (mapeo corregido)

**Impacto**: Sistema de facturas PDF 100% funcional desde extracción hasta creación de borrador 