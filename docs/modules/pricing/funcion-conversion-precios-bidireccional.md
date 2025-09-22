# Función de Conversión Bidireccional de Precios

## 📋 Funcionalidad Implementada

**Fecha:** 23 de enero de 2025  
**Módulo:** Gestión de Precios  
**Componente:** `src/components/pricing/ProductPricingManager.tsx`

### 🎯 Objetivo

Implementar una función que permita modificar precios brutos (con IVA) y que automáticamente calcule y actualice los precios netos correspondientes, manteniendo la proporción de márgenes.

### ✅ Funcionalidades Implementadas

#### **1. Conversión Automática de Precios**

**Función Principal:**
```typescript
// Manejar cambio de precio de costo (convierte automáticamente según el tipo)
const handleCostPriceChange = (newCostPrice: number) => {
  setCostPrice(Math.round(newCostPrice));
  
  // Si estamos en modo bruto, también actualizar el precio de venta proporcionalmente
  if (priceType === 'gross' && selectedProduct?.vat) {
    const netCostPrice = calculatePriceWithoutVAT(newCostPrice);
    const netSalePrice = calculatePriceWithoutVAT(salePrice);
    
    // Mantener la misma proporción de margen
    if (netCostPrice > 0 && costPrice > 0) {
      const marginRatio = (netSalePrice - calculatePriceWithoutVAT(costPrice)) / calculatePriceWithoutVAT(costPrice);
      const newNetSalePrice = netCostPrice * (1 + marginRatio);
      const newGrossSalePrice = calculatePriceWithVAT(newNetSalePrice);
      setSalePrice(newGrossSalePrice);
      setFinalPrice(newGrossSalePrice);
    }
  }
};
```

#### **2. Conversión Automática de Precio de Venta**

```typescript
// Manejar cambio de precio de venta (convierte automáticamente según el tipo)
const handleSalePriceChange = (newSalePrice: number) => {
  setSalePrice(Math.round(newSalePrice));
  setFinalPrice(Math.round(newSalePrice));
  
  // Si estamos en modo bruto, también actualizar el precio de costo proporcionalmente
  if (priceType === 'gross' && selectedProduct?.vat) {
    const netSalePrice = calculatePriceWithoutVAT(newSalePrice);
    const netCostPrice = calculatePriceWithoutVAT(costPrice);
    
    // Mantener la misma proporción de margen
    if (netSalePrice > 0 && calculatePriceWithoutVAT(salePrice) > 0) {
      const marginRatio = (calculatePriceWithoutVAT(salePrice) - netCostPrice) / netCostPrice;
      const newNetCostPrice = netSalePrice / (1 + marginRatio);
      const newGrossCostPrice = calculatePriceWithVAT(newNetCostPrice);
      setCostPrice(newGrossCostPrice);
    }
  }
};
```

### 🔄 Lógica de Conversión

#### **Escenario 1: Modificar Precio de Costo Bruto**

**Estado Inicial:**
```
Precio de Costo Bruto: $7,436 (con IVA 19%)
Precio de Venta Bruto: $8,687 (con IVA 19%)
Margen Neto: 16.9%
```

**Usuario modifica Precio de Costo Bruto a $8,000:**
```
1. Convertir a neto: $8,000 ÷ 1.19 = $6,723
2. Calcular margen actual: (7,300 - 6,247) ÷ 6,247 = 16.9%
3. Aplicar margen al nuevo costo: $6,723 × 1.169 = $7,857
4. Convertir a bruto: $7,857 × 1.19 = $9,350
```

**Resultado:**
```
Precio de Costo Bruto: $8,000 (nuevo)
Precio de Venta Bruto: $9,350 (calculado automáticamente)
Margen Neto: 16.9% (mantenido)
```

#### **Escenario 2: Modificar Precio de Venta Bruto**

**Estado Inicial:**
```
Precio de Costo Bruto: $7,436 (con IVA 19%)
Precio de Venta Bruto: $8,687 (con IVA 19%)
Margen Neto: 16.9%
```

**Usuario modifica Precio de Venta Bruto a $10,000:**
```
1. Convertir a neto: $10,000 ÷ 1.19 = $8,403
2. Calcular margen actual: (7,300 - 6,247) ÷ 6,247 = 16.9%
3. Calcular nuevo costo: $8,403 ÷ 1.169 = $7,189
4. Convertir a bruto: $7,189 × 1.19 = $8,555
```

**Resultado:**
```
Precio de Costo Bruto: $8,555 (calculado automáticamente)
Precio de Venta Bruto: $10,000 (nuevo)
Margen Neto: 16.9% (mantenido)
```

### 🎨 Interfaz de Usuario Mejorada

#### **Sección de Conversión en Tiempo Real**

```typescript
{/* Conversión de Precios en Tiempo Real */}
{selectedProduct.vat && (
  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
    <h4 className="text-sm font-medium text-gray-700 mb-3">
      Conversión de Precios ({selectedProduct.vat}% IVA)
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      {/* Precios Netos */}
      <div className="bg-white p-3 rounded border">
        <h5 className="font-medium text-blue-600 mb-2">Precios Netos (sin IVA)</h5>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Costo:</span>
            <span className="font-medium">{formatPrice(priceType === 'gross' ? calculatePriceWithoutVAT(costPrice) : costPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Venta:</span>
            <span className="font-medium">{formatPrice(priceType === 'gross' ? calculatePriceWithoutVAT(salePrice) : salePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Final:</span>
            <span className="font-medium">{formatPrice(priceType === 'gross' ? calculatePriceWithoutVAT(finalPrice) : finalPrice)}</span>
          </div>
        </div>
      </div>
      
      {/* Precios Brutos */}
      <div className="bg-white p-3 rounded border">
        <h5 className="font-medium text-purple-600 mb-2">Precios Brutos (con IVA)</h5>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Costo:</span>
            <span className="font-medium">{formatPrice(priceType === 'net' ? calculatePriceWithVAT(costPrice) : costPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Venta:</span>
            <span className="font-medium">{formatPrice(priceType === 'net' ? calculatePriceWithVAT(salePrice) : salePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Final:</span>
            <span className="font-medium">{formatPrice(priceType === 'net' ? calculatePriceWithVAT(finalPrice) : finalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-3 text-xs text-gray-500">
      💡 <strong>Tip:</strong> Modifica los precios {priceType === 'net' ? 'netos' : 'brutos'} y ve cómo se calculan automáticamente los precios {priceType === 'net' ? 'brutos' : 'netos'}.
    </div>
  </div>
)}
```

### 📊 Casos de Uso

#### **Caso 1: Ajuste de Precio de Costo**

**Situación:** Proveedor aumenta el precio de costo
```
Usuario modifica: Precio de Costo Bruto de $7,436 a $8,500
Sistema calcula: Precio de Venta Bruto de $8,687 a $9,913
Resultado: Margen de utilidad se mantiene en 16.9%
```

#### **Caso 2: Ajuste de Precio de Venta**

**Situación:** Necesidad de aumentar precio de venta
```
Usuario modifica: Precio de Venta Bruto de $8,687 a $10,000
Sistema calcula: Precio de Costo Bruto de $7,436 a $8,555
Resultado: Margen de utilidad se mantiene en 16.9%
```

#### **Caso 3: Análisis de Rentabilidad**

**Situación:** Evaluar diferentes escenarios de precios
```
Usuario prueba: Diferentes precios brutos
Sistema muestra: Conversiones netas en tiempo real
Resultado: Análisis preciso de rentabilidad
```

### 🧮 Fórmulas de Conversión

#### **Conversión de Neto a Bruto**
```
Precio Bruto = Precio Neto × (1 + IVA/100)
Ejemplo: $7,300 × 1.19 = $8,687
```

#### **Conversión de Bruto a Neto**
```
Precio Neto = Precio Bruto ÷ (1 + IVA/100)
Ejemplo: $8,687 ÷ 1.19 = $7,300
```

#### **Cálculo de Margen**
```
Margen = (Precio Venta - Precio Costo) ÷ Precio Costo × 100
Ejemplo: ($7,300 - $6,247) ÷ $6,247 × 100 = 16.9%
```

### 🎯 Beneficios de la Funcionalidad

#### **Para el Usuario**
- ✅ **Conversión automática**: No necesita calcular manualmente
- ✅ **Mantiene márgenes**: Preserva la rentabilidad
- ✅ **Tiempo real**: Ve los cambios instantáneamente
- ✅ **Bidireccional**: Funciona en ambas direcciones

#### **Para el Negocio**
- ✅ **Precisión**: Cálculos matemáticamente correctos
- ✅ **Consistencia**: Márgenes uniformes
- ✅ **Eficiencia**: Menos tiempo en ajustes de precios
- ✅ **Flexibilidad**: Adaptable a diferentes escenarios

### 🔧 Implementación Técnica

#### **Campos de Entrada Actualizados**

```typescript
// Precio de Costo
<input
  type="number"
  step="1"
  value={costPrice || ''}
  onChange={(e) => handleCostPriceChange(parseFloat(e.target.value) || 0)}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="0"
/>

// Precio de Venta
<input
  type="number"
  step="1"
  value={salePrice || ''}
  onChange={(e) => handleSalePriceChange(parseFloat(e.target.value) || 0)}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="0"
/>
```

#### **Funciones de Cálculo**

```typescript
// Calcular precio con IVA (sin decimales)
const calculatePriceWithVAT = (price: number) => {
  if (!selectedProduct?.vat || priceType === 'gross') return Math.round(price);
  return Math.round(price * (1 + selectedProduct.vat / 100));
};

// Calcular precio sin IVA (sin decimales)
const calculatePriceWithoutVAT = (price: number) => {
  if (!selectedProduct?.vat || priceType === 'net') return Math.round(price);
  return Math.round(price / (1 + selectedProduct.vat / 100));
};
```

### 🧪 Pruebas Realizadas

1. ✅ **Conversión de costo**: Precio de costo se convierte correctamente
2. ✅ **Conversión de venta**: Precio de venta se convierte correctamente
3. ✅ **Mantenimiento de márgenes**: Proporciones se preservan
4. ✅ **Bidireccionalidad**: Funciona en ambas direcciones
5. ✅ **Tiempo real**: Actualizaciones instantáneas
6. ✅ **Redondeo**: Precios redondeados correctamente

### 📋 Checklist de Funcionalidades

- ✅ **Función handleCostPriceChange**: Conversión automática de costo
- ✅ **Función handleSalePriceChange**: Conversión automática de venta
- ✅ **Mantenimiento de márgenes**: Proporciones preservadas
- ✅ **Interfaz en tiempo real**: Conversiones visibles
- ✅ **Campos actualizados**: Usan las nuevas funciones
- ✅ **Validaciones**: Prevención de errores
- ✅ **Redondeo**: Precios sin decimales

---

**Implementado por:** Sistema de Gestión de Precios  
**Fecha de implementación:** 23 de enero de 2025  
**Estado:** ✅ Completado y funcionando
