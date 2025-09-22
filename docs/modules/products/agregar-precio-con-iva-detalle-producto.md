# Agregar Precio con IVA en Detalle de Producto

## 📋 Mejora Implementada

**Fecha:** 23 de enero de 2025  
**Módulo:** Gestión de Productos  
**Componente:** `src/app/dashboard/configuration/products/[id]/page.tsx`

### 🎯 Objetivo

Agregar la visualización de precios con IVA en la página de detalle del producto para proporcionar información financiera completa y transparente.

### ✅ Funcionalidades Agregadas

#### 1. **Cálculo Automático de Precios con IVA**

```typescript
// Calcular precio con IVA
const vatRate = product.vat || 0;
const salePriceWithVAT = product.salePrice 
  ? product.salePrice * (1 + vatRate / 100)
  : 0;
const costPriceWithVAT = product.costPrice 
  ? product.costPrice * (1 + vatRate / 100)
  : 0;
```

#### 2. **Sección de Precios Netos (sin IVA)**

```typescript
{/* Precios Netos */}
<div className="mb-6">
  <h4 className="text-md font-medium text-gray-700 mb-4">Precios Netos (sin IVA)</h4>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <div className="text-xl font-bold text-gray-900">
        ${product.costPrice?.toLocaleString() || '0'}
      </div>
      <div className="text-sm text-gray-500">Precio de Costo</div>
    </div>
    
    <div className="text-center p-4 bg-green-50 rounded-lg">
      <div className="text-xl font-bold text-green-600">
        ${product.salePrice?.toLocaleString() || '0'}
      </div>
      <div className="text-sm text-gray-500">Precio de Venta</div>
    </div>
    
    <div className="text-center p-4 bg-blue-50 rounded-lg">
      <div className="text-xl font-bold text-blue-600">
        {margin}%
      </div>
      <div className="text-sm text-gray-500">Margen de Ganancia</div>
    </div>
  </div>
</div>
```

#### 3. **Sección de Precios con IVA**

```typescript
{/* Precios con IVA */}
{vatRate > 0 && (
  <div className="mb-6">
    <h4 className="text-md font-medium text-gray-700 mb-4">Precios con IVA ({vatRate}%)</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-xl font-bold text-orange-600">
          ${costPriceWithVAT.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">Precio de Costo con IVA</div>
      </div>
      
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-xl font-bold text-purple-600">
          ${salePriceWithVAT.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">Precio de Venta con IVA</div>
      </div>
    </div>
  </div>
)}
```

#### 4. **Desglose Detallado de IVA**

```typescript
{/* Desglose de IVA */}
{vatRate > 0 && product.salePrice && (
  <div className="p-4 bg-blue-50 rounded-lg">
    <h4 className="text-md font-medium text-gray-700 mb-3">Desglose de IVA</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">Precio neto de venta:</span>
        <span className="font-medium">${product.salePrice.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">IVA ({vatRate}%):</span>
        <span className="font-medium text-blue-600">${(salePriceWithVAT - product.salePrice).toLocaleString()}</span>
      </div>
      <div className="flex justify-between font-semibold border-t pt-2 md:col-span-2">
        <span className="text-gray-700">Precio total con IVA:</span>
        <span className="text-purple-600">${salePriceWithVAT.toLocaleString()}</span>
      </div>
    </div>
  </div>
)}
```

### 🎨 Diseño Visual

#### **Colores y Estilos**

- **Precios Netos**: Fondo gris claro (`bg-gray-50`)
- **Precio de Costo con IVA**: Fondo naranja (`bg-orange-50`, `text-orange-600`)
- **Precio de Venta con IVA**: Fondo púrpura (`bg-purple-50`, `text-purple-600`)
- **Desglose de IVA**: Fondo azul claro (`bg-blue-50`)

#### **Layout Responsivo**

- **Desktop**: Grid de 3 columnas para precios netos, 2 columnas para precios con IVA
- **Mobile**: Una columna para todos los precios
- **Desglose**: Grid de 2 columnas en desktop, 1 columna en mobile

### 📊 Información Mostrada

#### **1. Precios Netos (sin IVA)**
- ✅ Precio de Costo
- ✅ Precio de Venta
- ✅ Margen de Ganancia (%)

#### **2. Precios con IVA (si aplica)**
- ✅ Precio de Costo con IVA
- ✅ Precio de Venta con IVA
- ✅ Porcentaje de IVA aplicado

#### **3. Desglose de IVA**
- ✅ Precio neto de venta
- ✅ Monto del IVA
- ✅ Precio total con IVA

### 🔧 Lógica de Mostrado

#### **Condiciones de Visualización**

```typescript
// Solo mostrar precios con IVA si el producto tiene IVA > 0
{vatRate > 0 && (
  // Sección de precios con IVA
)}

// Solo mostrar desglose si hay IVA y precio de venta
{vatRate > 0 && product.salePrice && (
  // Desglose de IVA
)}
```

#### **Cálculos Automáticos**

- **Precio con IVA**: `precio * (1 + vatRate / 100)`
- **Monto del IVA**: `precioConIVA - precioNeto`
- **Formateo**: `toLocaleString()` para separadores de miles

### 🎯 Casos de Uso

#### **1. Producto con IVA (19%)**
```
Precios Netos:
- Costo: $6,247
- Venta: $7,300
- Margen: 16.9%

Precios con IVA (19%):
- Costo: $7,434
- Venta: $8,687

Desglose de IVA:
- Precio neto: $7,300
- IVA (19%): $1,387
- Total con IVA: $8,687
```

#### **2. Producto sin IVA (0%)**
```
Precios Netos:
- Costo: $5,000
- Venta: $6,000
- Margen: 20.0%

(No se muestran precios con IVA ni desglose)
```

### 🚀 Beneficios

#### **Para el Usuario**
- ✅ **Transparencia total** en precios
- ✅ **Información completa** para toma de decisiones
- ✅ **Visualización clara** de impuestos
- ✅ **Fácil comparación** entre precios netos y brutos

#### **Para el Negocio**
- ✅ **Cumplimiento fiscal** transparente
- ✅ **Información precisa** para facturación
- ✅ **Mejor experiencia** del usuario
- ✅ **Datos completos** para análisis

### 📝 Archivos Modificados

- `src/app/dashboard/configuration/products/[id]/page.tsx`

### 🧪 Pruebas Realizadas

1. ✅ **Producto con IVA 19%**: Muestra precios netos, con IVA y desglose
2. ✅ **Producto con IVA 0%**: Solo muestra precios netos
3. ✅ **Producto sin precio**: Maneja valores null/undefined correctamente
4. ✅ **Responsive**: Funciona en desktop y mobile
5. ✅ **Formateo**: Números con separadores de miles

### 🎨 Mejoras Futuras Posibles

- **Selector de tipo de precio**: Neto/Bruto como en el módulo de precios
- **Historial de precios**: Mostrar cambios de precios con IVA
- **Comparación**: Precios de competencia con IVA
- **Exportar**: PDF con información de precios completa

---

**Implementado por:** Sistema de Gestión de Productos  
**Fecha de implementación:** 23 de enero de 2025  
**Estado:** ✅ Completado y funcionando
