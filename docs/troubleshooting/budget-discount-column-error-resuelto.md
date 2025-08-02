# Error "discount column not found" en Presupuestos - RESUELTO

## Descripción del Error

```
Error: Could not find the 'discount' column of 'sales_quote_lines' in the schema cache
    at handleSubmit (webpack-internal:///(app-pages-browser)/./src/app/dashboard/sales/budgets/create/page.tsx:49:23)
    at async handleSubmit (webpack-internal:///(app-pages-browser)/./src/components/sales/BudgetForm.tsx:127:13)
```

## Análisis del Problema

### 🔍 **Causa Raíz: Inconsistencia en Nombres de Campos**

El sistema tenía una discrepancia en la nomenclatura del campo de descuento en 3 niveles diferentes:

| **Nivel** | **Nombre del Campo** | **Estado** |
|-----------|---------------------|-----------|
| **Base de Datos** | `discount_percent` (snake_case) | ✅ Correcto |
| **Interface Oficial** | `discountPercent` (camelCase) | ✅ Correcto |
| **Componente BudgetForm** | `discount` (incorrecto) | ❌ Error |

### 🏗️ **Esquema de Base de Datos (Correcto)**

```sql
CREATE TABLE public.sales_quote_lines (
    id BIGSERIAL PRIMARY KEY,
    quote_id BIGINT REFERENCES sales_quotes(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    description VARCHAR(255),
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,  -- ✅ Correcto
    taxes JSONB,
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0
);
```

### 📝 **Interface Oficial (Correcta)**

```typescript
// src/types/ventas/budget.ts
export interface BudgetLine {
  id: number;
  quoteId: number;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;  // ✅ Correcto
  taxes: number[];
  subtotal: number;
}
```

### ❌ **Componente BudgetForm (Incorrecto - Causa del Error)**

```typescript
// src/components/sales/BudgetForm.tsx (ANTES)
interface BudgetLine {
  tempId: string;
  productId: number | null;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;        // ❌ INCORRECTO
  subtotal: number;
}
```

## Solución Implementada

### 1. **Corregir Interface Local del Componente**

```typescript
// src/components/sales/BudgetForm.tsx (DESPUÉS)
interface BudgetLine {
  tempId: string;
  productId: number | null;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;  // ✅ CORREGIDO
  subtotal: number;
}
```

### 2. **Actualizar Referencias en el Componente**

```typescript
// ANTES
value={line.discount}
onChange={(e) => updateLine(line.tempId, 'discount', parseFloat(e.target.value) || 0)}

// DESPUÉS
value={line.discountPercent}
onChange={(e) => updateLine(line.tempId, 'discountPercent', parseFloat(e.target.value) || 0)}
```

### 3. **Corregir Mapeo en Servidor**

```typescript
// src/actions/sales/budgets/create.ts (ANTES)
const linesToInsert = input.lines.map((line) => ({
  ...line,
  quote_id: budget.id,
}));

// DESPUÉS
const linesToInsert = input.lines.map((line) => ({
  quote_id: budget.id,
  product_id: line.productId,
  description: line.description,
  quantity: line.quantity,
  unit_price: line.unitPrice,
  discount_percent: line.discountPercent,  // ✅ Mapeo correcto
  taxes: line.taxes,
  subtotal: line.subtotal
}));
```

### 4. **Corregir Página de Creación**

```typescript
// src/app/dashboard/sales/budgets/create/page.tsx (ANTES)
lines: formData.lines.map((line: any) => ({
  product_id: line.productId,
  description: line.description,
  quantity: line.quantity,
  unit_price: line.unitPrice,
  discount: line.discount,  // ❌ INCORRECTO
  subtotal: line.subtotal,
})),

// DESPUÉS
lines: formData.lines.map((line: any) => ({
  productId: line.productId,
  description: line.description,
  quantity: line.quantity,
  unitPrice: line.unitPrice,
  discountPercent: line.discountPercent,  // ✅ CORREGIDO
  taxes: [],
  subtotal: line.subtotal,
})),
```

## Flujo de Datos Corregido

### 📊 **Frontend → Backend → Database**

```
1. BudgetForm.tsx
   └── discountPercent: number

2. create/page.tsx  
   └── discountPercent: line.discountPercent

3. create.ts (server action)
   └── discount_percent: line.discountPercent

4. Database
   └── INSERT INTO sales_quote_lines (discount_percent, ...)
```

## Archivos Modificados

### `src/components/sales/BudgetForm.tsx`
- ✅ Interface `BudgetLine` corregida
- ✅ Referencias `discount` → `discountPercent`
- ✅ Función `updateLine` actualizada
- ✅ Campo del formulario corregido

### `src/actions/sales/budgets/create.ts`
- ✅ Mapeo explícito `discountPercent` → `discount_percent`
- ✅ Eliminado spread operator problemático

### `src/app/dashboard/sales/budgets/create/page.tsx`
- ✅ Envío de `discountPercent` en lugar de `discount`
- ✅ Mapeo de campos en camelCase

## Verificación de Funcionamiento

### ✅ **Flujo Completo Funcional**

1. **Cargar formulario** → Interface carga correctamente
2. **Agregar línea** → `discountPercent: 0` por defecto
3. **Cambiar descuento** → Recálculo automático funciona
4. **Enviar presupuesto** → Mapeo correcto a `discount_percent`
5. **Insertar en BD** → Sin errores de columna faltante

### 🎯 **Resultado**

- ❌ `Error: Could not find the 'discount' column` → **ELIMINADO**
- ✅ Presupuestos se crean correctamente
- ✅ Descuentos se guardan en `discount_percent`
- ✅ Cálculos funcionan correctamente
- ✅ Interface unificada en todo el sistema

## Lecciones Aprendidas

### 🔧 **Mejores Prácticas**

1. **Consistencia de nomenclatura** en todos los niveles
2. **Mapeo explícito** entre frontend y backend
3. **Interfaces oficiales** como fuente de verdad
4. **Validación de esquemas** antes de implementar

### 🛡️ **Prevención de Errores Similares**

1. **Revisar interfaces oficiales** antes de crear locales
2. **Validar mapeo** entre camelCase y snake_case
3. **Probar flujo completo** frontend → backend → database
4. **Documentar** convenciones de nomenclatura

## Estado Final

- ✅ **100% funcional** - Presupuestos se crean sin errores
- ✅ **Nomenclatura consistente** en todos los niveles
- ✅ **Mapeo correcto** entre formatos
- ✅ **Calculadora de descuentos** operativa
- ✅ **Documentación completa** para referencia futura 