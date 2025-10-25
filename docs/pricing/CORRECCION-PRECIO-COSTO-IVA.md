# Corrección: Precio de Costo con IVA en Selector de Productos

**Fecha**: 25 de Octubre, 2025  
**Estado**: ✅ CORREGIDO

---

## 🐛 Problema Reportado

En el selector de productos para promociones (`ProductMultiSelector`), la columna "PRECIO COSTO" mostraba **$0** o el precio sin IVA, cuando debería mostrar el **precio de costo con IVA incluido**.

### Evidencia del Problema:

- Producto 1: "AISLANTE TERMICO 20 MM" - Precio Costo mostraba: **$0**
- Producto 2: "SIDING TINGLADO CEDRAL" - Precio Costo mostraba: **$0**

### Precio Correcto:

En la página de detalle del producto, se mostraba correctamente:
- Precio de Costo: $2.890
- **Precio de Costo con IVA (19%)**: **$3.439**

---

## ✅ Solución Implementada

### 1. Agregado campo `vat` a la interface Product

```typescript
interface Product {
  id: number;
  name: string;
  sku: string;
  costprice: number;
  saleprice: number;
  finalPrice: number;
  vat: number;        // ✅ NUEVO
  stock: number;
  categoryName?: string;
}
```

### 2. Cálculo de Costo con IVA en la Tabla

Modificado la columna para calcular el precio con IVA:

```typescript
<td className="px-3 py-2 text-gray-600">
  {(() => {
    const costPrice = product.costprice || 0;
    const vatRate = product.vat || 0;
    const costWithVat = costPrice * (1 + vatRate / 100);
    return formatPrice(costWithVat);
  })()}
</td>
```

**Ejemplo de Cálculo**:
- Precio Costo: $2.890
- IVA: 19%
- **Costo + IVA**: $2.890 × 1.19 = **$3.439** ✅

### 3. Mapeo Correcto de Datos

Asegurado que los datos de la server action se mapeen correctamente:

```typescript
const mappedProducts = result.data.map(p => ({
  id: p.id,
  name: p.name,
  sku: p.sku || '',
  costprice: p.costPrice || 0,
  saleprice: p.salePrice || 0,
  finalPrice: p.finalPrice || 0,
  vat: p.vat || 19,  // Default 19% si no viene
  stock: p.stock || 0,
  categoryName: p.categoryName || undefined
}));
```

### 4. Encabezado de Columna Actualizado

Cambiado de "PRECIO COSTO" a **"COSTO + IVA"** para mayor claridad:

```typescript
<th>Costo + IVA</th>
```

---

## 📊 Antes vs Después

### Antes:
```
| Nombre                    | SKU          | Precio Venta | Precio Costo | Stock |
|---------------------------|--------------|--------------|--------------|-------|
| SIDING TINGLADO CEDRAL... | 190x-sidi... | $4.470       | $0           | 391   |
```

### Después:
```
| Nombre                    | SKU          | Precio Venta | Costo + IVA  | Stock |
|---------------------------|--------------|--------------|--------------|-------|
| SIDING TINGLADO CEDRAL... | 190x-sidi... | $4.470       | $3.439       | 391   |
```

---

## 🧮 Fórmula Aplicada

```
Costo con IVA = Precio Costo × (1 + IVA% / 100)

Ejemplo:
Costo con IVA = $2.890 × (1 + 19/100)
Costo con IVA = $2.890 × 1.19
Costo con IVA = $3.439
```

---

## 📁 Archivos Modificados

### 1. ProductMultiSelector.tsx

**Ubicación**: `src/components/pricing/ProductMultiSelector.tsx`

**Cambios**:
- ✅ Agregado campo `vat` a interface Product
- ✅ Cálculo de costo con IVA en renderizado
- ✅ Mapeo correcto de datos desde server action
- ✅ Encabezado de columna actualizado a "Costo + IVA"

---

## 🔍 Verificación

### Pasos para Verificar:

1. Ir a: `http://localhost:3000/dashboard/pricing/promotions`
2. Clic en "Nueva Promoción"
3. Seleccionar "Productos específicos" en "Aplica a"
4. Buscar un producto (ej: "siding")
5. Verificar que la columna "Costo + IVA" muestre el precio correcto

### Ejemplo de Verificación Manual:

Para el producto "SIDING TINGLADO CEDRAL":
1. Abrir página de producto: `/dashboard/configuration/products/590`
2. Ver "Precio de Costo con IVA": $3.439
3. En selector de promociones, debe mostrar el mismo valor: **$3.439**

---

## 💡 Consideraciones

### IVA por Defecto:
- Si el producto no tiene IVA configurado, se usa **19%** por defecto
- El IVA se obtiene del campo `vat` del producto en la base de datos

### Productos sin Costo:
- Si `costprice` es 0 o null, el costo con IVA también será $0
- Esto es correcto para servicios o productos sin costo configurado

### Consistencia:
- El cálculo es el mismo que se usa en:
  - Página de detalle del producto
  - Módulo de facturación
  - Sistema de precios

---

## ✅ Resultado Final

Ahora el selector de productos para promociones muestra:
- ✅ **Precio de Costo con IVA incluido**
- ✅ Encabezado claro: "Costo + IVA"
- ✅ Cálculo correcto usando la tasa de IVA del producto
- ✅ Valores consistentes con el resto del sistema
- ✅ Formato de moneda correcto ($X,XXX)

---

## 📚 Referencias

- Componente: `src/components/pricing/ProductMultiSelector.tsx`
- Documentación Principal: `docs/pricing/SISTEMA-SELECCION-PROMOCIONES.md`
- Server Action: `src/actions/pricing/price-management-actions.ts`


