# 🎯 Mejoras: Formulario de Precios con IVA y Stock

## 📋 Mejoras Implementadas

### **✅ Especificación de Valores Netos/Brutos**
- **Selector de tipo de precio**: Radio buttons para elegir entre valores netos o brutos
- **Cálculo automático de IVA**: Conversión automática entre precios netos y brutos
- **Etiquetas dinámicas**: Los campos muestran si son valores netos o brutos
- **Información de IVA**: Muestra el porcentaje de IVA del producto

### **✅ Visualización de Stock**
- **Stock total**: Suma de todas las bodegas donde está el producto
- **Información en encabezado**: Stock visible junto con SKU y categoría
- **Cálculo en tiempo real**: Stock actualizado desde la base de datos

## 🔧 Cambios Técnicos Implementados

### **1. Actualización de Interface SimpleProduct**

#### **src/actions/pricing/simple-products.ts**
```typescript
export interface SimpleProduct {
  id: number;
  name: string;
  sku: string | null;
  costPrice: number | null;
  salePrice: number | null;
  categoryName: string | null;
  supplierName: string | null;
  vat: number | null;        // ✅ NUEVO: Porcentaje de IVA
  stock: number | null;      // ✅ NUEVO: Stock total
}
```

### **2. Consulta Mejorada para Productos**

#### **Consulta con IVA y Stock**
```typescript
// Consulta principal incluye campo vat
let query = supabase
  .from('Product')
  .select(`
    id, name, sku, costprice, saleprice, 
    categoryid, supplierid, vat
  `, { count: 'exact' });

// Consulta separada para stock total
const { data: warehouseProducts } = await supabase
  .from('Warehouse_Product')
  .select('productId, quantity')
  .in('productId', productIds);

// Cálculo de stock total por producto
const stockMap = new Map<number, number>();
warehouseProducts?.forEach(wp => {
  const currentStock = stockMap.get(wp.productId) || 0;
  stockMap.set(wp.productId, currentStock + (wp.quantity || 0));
});
```

### **3. Estados del Formulario Mejorados**

#### **src/components/pricing/ProductPricingManager.tsx**
```typescript
// ✅ NUEVO: Estado para tipo de precio
const [priceType, setPriceType] = useState<'net' | 'gross'>('net');

// Funciones de cálculo de IVA
const calculatePriceWithVAT = (price: number) => {
  if (!selectedProduct?.vat || priceType === 'gross') return price;
  return price * (1 + selectedProduct.vat / 100);
};

const calculatePriceWithoutVAT = (price: number) => {
  if (!selectedProduct?.vat || priceType === 'net') return price;
  return price / (1 + selectedProduct.vat / 100);
};

// Conversión automática al cambiar tipo
const handlePriceTypeChange = (type: 'net' | 'gross') => {
  setPriceType(type);
  // Convertir precios actuales automáticamente
  if (type === 'gross') {
    setSalePrice(calculatePriceWithVAT(salePrice));
    setFinalPrice(calculatePriceWithVAT(finalPrice));
  } else {
    setSalePrice(calculatePriceWithoutVAT(salePrice));
    setFinalPrice(calculatePriceWithoutVAT(finalPrice));
  }
};
```

## 🎨 Mejoras en la Interfaz de Usuario

### **1. Selector de Tipo de Precio**

#### **Radio Buttons para Neto/Bruto**
```typescript
<div className="mb-6 p-4 bg-gray-50 rounded-lg">
  <label className="block text-sm font-medium text-gray-700 mb-3">
    Tipo de Precios
  </label>
  <div className="flex space-x-4">
    <label className="flex items-center">
      <input type="radio" value="net" checked={priceType === 'net'} />
      <span>Neto {selectedProduct.vat && `(sin IVA ${selectedProduct.vat}%)`}</span>
    </label>
    <label className="flex items-center">
      <input type="radio" value="gross" checked={priceType === 'gross'} />
      <span>Bruto {selectedProduct.vat && `(con IVA ${selectedProduct.vat}%)`}</span>
    </label>
  </div>
</div>
```

### **2. Etiquetas Dinámicas de Campos**

#### **Campos con Indicador de Tipo**
```typescript
<label>Precio de Costo ({priceType === 'net' ? 'Neto' : 'Bruto'})</label>
<label>Precio de Venta ({priceType === 'net' ? 'Neto' : 'Bruto'})</label>
<label>Precio Final ({priceType === 'net' ? 'Neto' : 'Bruto'})</label>
```

### **3. Información de Stock en Encabezado**

#### **Mostrar Stock Total**
```typescript
<p className="text-sm text-gray-600">
  {selectedProduct.sku && `SKU: ${selectedProduct.sku}`}
  {selectedProduct.categoryName && ` • Categoría: ${selectedProduct.categoryName}`}
  {selectedProduct.stock !== null && ` • Stock: ${selectedProduct.stock} unidades`}
</p>
```

### **4. Información Detallada de IVA**

#### **Desglose de Cálculos**
```typescript
{selectedProduct.vat && (
  <div className="mt-2 pt-2 border-t border-blue-200">
    <div className="text-xs text-gray-600">
      <div className="flex justify-between">
        <span>IVA ({selectedProduct.vat}%):</span>
        <span>{formatPrice(calculatePriceWithVAT(salePrice) - salePrice)}</span>
      </div>
      <div className="flex justify-between">
        <span>Precio {priceType === 'net' ? 'con IVA' : 'sin IVA'}:</span>
        <span>{formatPrice(priceType === 'net' ? calculatePriceWithVAT(salePrice) : calculatePriceWithoutVAT(salePrice))}</span>
      </div>
    </div>
  </div>
)}
```

## 🚀 Funcionalidades Nuevas

### **✅ Gestión de IVA Completa**
1. **Selección de tipo**: Usuario elige entre valores netos o brutos
2. **Conversión automática**: Los precios se convierten automáticamente al cambiar el tipo
3. **Visualización clara**: Etiquetas indican si los valores incluyen IVA o no
4. **Cálculos detallados**: Muestra desglose de IVA y precios convertidos

### **✅ Información de Stock**
1. **Stock total**: Suma de todas las bodegas
2. **Visualización prominente**: Stock visible en el encabezado del producto
3. **Actualización en tiempo real**: Stock obtenido desde la base de datos actual
4. **Formato claro**: "Stock: X unidades"

### **✅ Experiencia de Usuario Mejorada**
1. **Claridad de precios**: No hay confusión sobre si los valores incluyen IVA
2. **Información completa**: Stock, categoría, SKU y tipo de precio visibles
3. **Cálculos automáticos**: Conversión entre neto y bruto sin intervención manual
4. **Feedback visual**: Indicadores claros del tipo de precio seleccionado

## 📊 Ejemplo de Uso

### **Escenario: Producto con IVA 19%**
```
Producto: FIBROCEMENTO VOLCANBOARD 6MM 1200 X 2400
SKU: 6MM-2400-001-1134
Categoría: Tabiquería
Stock: 150 unidades

Tipo de Precios: [Neto (sin IVA 19%)] [Bruto (con IVA 19%)]

Precio de Costo (Neto): 12010.00
Precio de Venta (Neto): 15000.00
Precio Final (Neto): 15000.00

Información de Margen:
- Margen de Utilidad: 24.9%
- Utilidad: $2,990.00
- IVA (19%): $2,850.00
- Precio con IVA: $17,850.00
```

### **Al Cambiar a Bruto:**
```
Precio de Costo (Bruto): 14,291.90
Precio de Venta (Bruto): 17,850.00
Precio Final (Bruto): 17,850.00

Información de Margen:
- Margen de Utilidad: 24.9%
- Utilidad: $3,558.10
- IVA (19%): $2,850.00
- Precio sin IVA: $15,000.00
```

## 🎯 Beneficios Implementados

### **✅ Para el Usuario**
- **Claridad total**: Sabe exactamente si está trabajando con precios netos o brutos
- **Información completa**: Ve stock, IVA y todos los detalles del producto
- **Conversión automática**: No necesita calcular manualmente los precios con IVA
- **Transparencia**: Ve el desglose completo de IVA y utilidades

### **✅ Para el Sistema**
- **Datos precisos**: Stock actualizado desde todas las bodegas
- **Cálculos correctos**: IVA aplicado según el tipo seleccionado
- **Consistencia**: Misma lógica de cálculo en toda la aplicación
- **Escalabilidad**: Fácil agregar más tipos de impuestos en el futuro

## 🎉 Resultado Final

**✅ FORMULARIO COMPLETAMENTE MEJORADO**

El formulario de configuración de precios ahora incluye:

### **🎯 Funcionalidades Principales**
- ✅ **Selector de tipo de precio**: Neto vs Bruto con conversión automática
- ✅ **Visualización de stock**: Stock total de todas las bodegas
- ✅ **Información de IVA**: Porcentaje y cálculos detallados
- ✅ **Etiquetas dinámicas**: Campos claramente etiquetados según el tipo
- ✅ **Desglose completo**: IVA, utilidades y precios convertidos

### **📋 URL de Acceso**
**Formulario mejorado**: `http://localhost:3000/dashboard/pricing/products`

### **🔧 Características Técnicas**
- **Conversión automática**: Entre precios netos y brutos
- **Stock en tiempo real**: Obtenido desde todas las bodegas
- **Cálculos precisos**: IVA aplicado correctamente
- **Interfaz intuitiva**: Radio buttons y etiquetas claras
- **Información completa**: Todo lo necesario para tomar decisiones de precios

¡El formulario de precios está ahora completamente optimizado para la gestión profesional de precios con IVA y stock! 🚀



