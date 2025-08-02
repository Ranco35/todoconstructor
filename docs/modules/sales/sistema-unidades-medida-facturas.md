# Sistema de Unidades de Medida en Facturas

## 📋 **Resumen del Cambio**

**Fecha:** Enero 2025  
**Problema:** Las facturas no manejaban correctamente las unidades de medida de los productos  
**Solución:** Implementar sistema completo de unidades de medida en facturas

## ✅ **Funcionalidad Implementada**

### **1. Campo de Unidad en Líneas de Factura**
- **Migración:** `20250121000000_add_unit_to_invoice_lines.sql`
- **Campo:** `unit VARCHAR(50) DEFAULT 'UND'`
- **Índice:** Para optimizar consultas por unidad
- **Comentario:** Documentación del campo

### **2. Interfaces Actualizadas**
- **CreateInvoiceInput:** Agregado campo `unit` en líneas
- **InvoiceLine:** Agregado campo `unit` opcional
- **ProductImportData:** Agregado campo `unit` para importación

### **3. Creación de Facturas**
- **Desde Reservas:** Obtiene unidad del producto spa
- **Manual:** Usa unidad por defecto 'UND'
- **Desde Presupuesto:** Mantiene unidad original

### **4. Importación/Exportación**
- **Importación:** Soporta campo 'Unidad' en Excel
- **Exportación:** Incluye unidad en plantilla
- **Parser:** Mapea columnas 'Unidad', 'Unit', 'unit'

## 🔧 **Implementación Técnica**

### **Base de Datos**
```sql
-- Migración para agregar campo unit
ALTER TABLE public.invoice_lines 
ADD COLUMN unit VARCHAR(50) DEFAULT 'UND';

-- Índice para optimizar consultas
CREATE INDEX idx_invoice_lines_unit ON public.invoice_lines(unit);
```

### **Interfaces TypeScript**
```typescript
interface InvoiceLine {
  id: number;
  invoiceId: number;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string; // ✅ NUEVO: Unidad de medida
  discountPercent: number;
  taxes: number[];
  subtotal: number;
}
```

### **Creación de Líneas de Factura**
```typescript
const invoiceLines = input.lines.map(line => ({
  invoice_id: invoice.id,
  product_id: line.product_id || null,
  description: line.description,
  quantity: line.quantity,
  unit_price: line.unit_price,
  unit: line.unit || 'UND', // ✅ Unidad de medida
  discount_percent: line.discount_percent,
  taxes: line.taxes,
  subtotal: line.subtotal
}));
```

## 📊 **Flujo de Datos**

### **1. Creación desde Reservas**
```
Reserva → Producto Spa → Obtener unit → Línea Factura
```

### **2. Creación Manual**
```
Formulario → Unidad por defecto 'UND' → Línea Factura
```

### **3. Importación Excel**
```
Excel → Parser → unit field → Base de Datos
```

### **4. Exportación**
```
Base de Datos → unit field → Excel
```

## 🎯 **Casos de Uso**

### **Producto con Unidad Específica**
1. **Producto:** "Café Colombiano"
2. **Unidad:** "KG" (Kilogramo)
3. **Cantidad:** 2
4. **Factura:** Muestra "2 KG de Café Colombiano"

### **Producto con Unidad por Defecto**
1. **Producto:** "Servicio de Masaje"
2. **Unidad:** "UND" (por defecto)
3. **Cantidad:** 1
4. **Factura:** Muestra "1 UND de Servicio de Masaje"

### **Importación con Unidades**
1. **Excel:** Columna "Unidad" con valores "DOC", "KG", "LT"
2. **Importación:** Mapea correctamente a campo `unit`
3. **Resultado:** Productos con unidades específicas

## 🔄 **Compatibilidad**

### **Facturas Existentes**
- ✅ **Compatibles:** Se usa 'UND' por defecto
- ✅ **Sin Errores:** Migración no afecta datos existentes
- ✅ **Progresiva:** Nuevas facturas incluyen unidad

### **Productos Existentes**
- ✅ **Compatibles:** Mantienen unidad actual
- ✅ **Selector:** Funciona con productos existentes
- ✅ **Exportación:** Incluye unidad en Excel

## 📝 **Archivos Modificados**

### **Base de Datos**
- `supabase/migrations/20250121000000_add_unit_to_invoice_lines.sql`

### **Backend**
- `src/actions/sales/invoices/create.ts`
- `src/actions/reservations/create-invoice-from-reservation.ts`
- `src/actions/sales/invoices/list.ts`
- `src/actions/products/import.ts`

### **Parsers**
- `src/lib/import-parsers.ts`

## ✅ **Estado**

**IMPLEMENTADO** - Sistema completo de unidades de medida en facturas

## 🎯 **Beneficios**

1. **Precisión:** Las facturas muestran la unidad correcta del producto
2. **Cálculos:** Permite cálculos automáticos basados en unidades
3. **Importación:** Soporta productos con unidades específicas
4. **Exportación:** Incluye información completa de unidades
5. **Compatibilidad:** No afecta facturas existentes

## 🔮 **Futuras Mejoras**

1. **Conversiones:** Cálculos automáticos entre unidades
2. **Validaciones:** Verificar compatibilidad de unidades
3. **Reportes:** Estadísticas por tipo de unidad
4. **UI:** Mostrar unidad en interfaz de facturas 