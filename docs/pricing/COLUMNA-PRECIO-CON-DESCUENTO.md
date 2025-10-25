# Columna "Precio con Descuento" en Selector de Productos

**Fecha**: 25 de Octubre, 2025  
**Estado**: ✅ IMPLEMENTADO

---

## 📋 Resumen

Se ha agregado una **columna dinámica** en el selector de productos que muestra el precio final que tendría cada producto después de aplicar el descuento/promoción configurado.

---

## ✨ Características Implementadas

### 1. Visualización del Precio con Descuento

**Ubicación**: Selector de productos en el formulario de nueva promoción

**Características**:
- ✅ Columna dinámica que solo aparece cuando hay tipo y valor de promoción configurados
- ✅ Cálculo automático según el tipo de promoción
- ✅ Muestra el precio final en **verde** con fondo destacado
- ✅ Indica el ahorro en pesos y porcentaje
- ✅ Soporte para todos los tipos de promociones

---

## 💰 Tipos de Promociones Soportados

### 1. Descuento por Porcentaje
```
Precio Original: $10.000
Descuento: 15%
Precio con Descuento: $8.500
Ahorro: $1.500 (15%)
```

### 2. Descuento Fijo
```
Precio Original: $10.000
Descuento: $2.000
Precio con Descuento: $8.000
Ahorro: $2.000 (20%)
```

### 3. Aumento por Porcentaje
```
Precio Original: $10.000
Aumento: 10%
Precio con Descuento: $11.000
Aumento: $1.000
```

### 4. Aumento Fijo
```
Precio Original: $10.000
Aumento: $500
Precio con Descuento: $10.500
Aumento: $500
```

### 5. Precio Especial
```
Precio Original: $10.000
Precio Especial: $7.990
Precio con Descuento: $7.990
Ahorro: $2.010 (20%)
```

---

## 🎨 Interfaz de Usuario

### Columna Solo Visible Cuando Corresponde

La columna **"PRECIO CON DESCUENTO"** solo se muestra cuando:
- El tipo de promoción está seleccionado
- El valor de la promoción es mayor a 0

### Diseño Visual

**Encabezado**:
- Fondo verde claro (`bg-green-50`)
- Texto verde oscuro (`text-green-700`)
- Resaltado para destacarse

**Contenido de la Celda**:
- Precio final en **verde oscuro y negrita**
- Línea secundaria mostrando ahorro o aumento
- Color verde para ahorros, rojo para aumentos

### Ejemplo Visual

```
┌─────────────────┬──────────┬──────────────┬────────────────────────┬─────────────┐
│ Nombre          │ SKU      │ Precio Venta │ Precio con Descuento   │ Costo + IVA │
├─────────────────┼──────────┼──────────────┼────────────────────────┼─────────────┤
│ SIDING CEDRAL   │ 190x-... │ $4.470       │ $3.799                 │ $3.439      │
│                 │          │              │ Ahorro: $671 (15%)     │             │
└─────────────────┴──────────┴──────────────┴────────────────────────┴─────────────┘
```

---

## 🔧 Implementación Técnica

### 1. Props Agregados a ProductMultiSelector

```typescript
interface ProductMultiSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  promotionType?: 'discount_percentage' | 'discount_fixed' | 'markup_percentage' | 'markup_fixed' | 'special_price';
  promotionValue?: number;
}
```

### 2. Función de Cálculo

```typescript
const calculatePromotionPrice = (originalPrice: number): number => {
  if (!promotionType || !promotionValue || promotionValue <= 0) {
    return originalPrice;
  }

  let finalPrice = originalPrice;

  switch (promotionType) {
    case 'discount_percentage':
      finalPrice = originalPrice * (1 - promotionValue / 100);
      break;
    case 'discount_fixed':
      finalPrice = originalPrice - promotionValue;
      break;
    case 'markup_percentage':
      finalPrice = originalPrice * (1 + promotionValue / 100);
      break;
    case 'markup_fixed':
      finalPrice = originalPrice + promotionValue;
      break;
    case 'special_price':
      finalPrice = promotionValue;
      break;
  }

  return Math.max(finalPrice, 0); // No permitir precios negativos
};
```

### 3. Renderizado Condicional

```typescript
{promotionType && promotionValue && promotionValue > 0 && (
  <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase bg-green-50">
    Precio con Descuento
  </th>
)}
```

### 4. Celda con Cálculo y Formato

```typescript
<td className="px-3 py-2 bg-green-50">
  {(() => {
    const originalPrice = product.finalPrice || product.saleprice || 0;
    const promotionPrice = calculatePromotionPrice(originalPrice);
    const savings = originalPrice - promotionPrice;
    const savingsPercent = originalPrice > 0 ? (savings / originalPrice * 100) : 0;
    
    return (
      <div>
        <div className="text-green-700 font-bold">
          {formatPrice(promotionPrice)}
        </div>
        {savings > 0 && (
          <div className="text-xs text-green-600">
            Ahorro: {formatPrice(savings)} ({savingsPercent.toFixed(0)}%)
          </div>
        )}
        {savings < 0 && (
          <div className="text-xs text-red-600">
            Aumento: {formatPrice(Math.abs(savings))}
          </div>
        )}
      </div>
    );
  })()}
</td>
```

---

## 🚀 Flujo de Uso

### Paso a Paso:

1. **Ir a Promociones**: `http://localhost:3000/dashboard/pricing/promotions`
2. **Clic en "Nueva Promoción"**
3. **Configurar básicos**:
   - Nombre: "Descuento Verano"
   - Tipo: "Descuento por Porcentaje"
   - Valor: 15
4. **Seleccionar "Productos específicos"**
5. **Ver la columna "Precio con Descuento"** aparecer automáticamente
6. **Buscar y seleccionar productos**
7. **Verificar precios con descuento** antes de guardar

### Ejemplo de Uso Real:

**Escenario**: Quieres hacer una promoción del 20% en productos de construcción

1. Configuras:
   - Tipo: Descuento por Porcentaje
   - Valor: 20

2. Al seleccionar productos, ves inmediatamente:
   ```
   Producto: CEMENTO POLPAICO 25KG
   Precio Original: $8.500
   Precio con Descuento: $6.800
   Ahorro: $1.700 (20%)
   ```

3. Puedes **verificar que el descuento sea correcto** antes de crear la promoción

---

## 💡 Beneficios

### 1. Previsualización en Tiempo Real
- Ver exactamente cómo quedarán los precios
- Verificar que los descuentos sean razonables
- Evitar errores en la configuración

### 2. Comparación Visual
- Precio original vs precio con descuento en la misma fila
- Cálculo automático del ahorro
- Porcentaje de descuento calculado

### 3. Validación Antes de Guardar
- Detectar si un descuento es demasiado agresivo
- Verificar que no haya precios negativos
- Comparar con el costo para evitar pérdidas

### 4. Mejor Toma de Decisiones
- Ver el impacto del descuento en múltiples productos
- Comparar diferentes tipos de promoción
- Ajustar valores antes de confirmar

---

## 📊 Casos de Uso

### Caso 1: Promoción de Fin de Temporada

**Objetivo**: 25% de descuento en productos de verano

**Proceso**:
1. Configurar descuento del 25%
2. Seleccionar productos de verano
3. Ver precios con descuento:
   - Producto A: $10.000 → $7.500
   - Producto B: $15.000 → $11.250
4. Verificar que sigan siendo rentables comparando con "Costo + IVA"
5. Crear promoción

### Caso 2: Precio Especial para Clientes VIP

**Objetivo**: Precio fijo de $99.990 para un producto premium

**Proceso**:
1. Tipo: Precio Especial
2. Valor: 99990
3. Seleccionar producto premium (precio normal: $129.990)
4. Ver descuento: Ahorro de $30.000 (23%)
5. Confirmar promoción

### Caso 3: Aumento por Inflación

**Objetivo**: Aumentar precios 5% por costos

**Proceso**:
1. Tipo: Aumento por Porcentaje
2. Valor: 5
3. Ver nuevos precios en rojo (aumentos)
4. Verificar nuevos márgenes
5. Aplicar aumento

---

## 🔍 Validaciones Implementadas

### 1. Precios No Negativos
```typescript
return Math.max(finalPrice, 0);
```

### 2. Solo Mostrar con Datos Válidos
```typescript
{promotionType && promotionValue && promotionValue > 0 && ...}
```

### 3. Cálculo Correcto según Tipo
- Cada tipo de promoción tiene su lógica específica
- Validado contra la lógica del backend

---

## 📁 Archivos Modificados

### Componente Principal
- `src/components/pricing/ProductMultiSelector.tsx`
  - ✅ Props agregados: `promotionType`, `promotionValue`
  - ✅ Función `calculatePromotionPrice()`
  - ✅ Columna condicional en tabla
  - ✅ Renderizado de ahorro/aumento

### Formulario de Promociones
- `src/components/pricing/PricePromotionsManager.tsx`
  - ✅ Pasando `promotionType` y `promotionValue` a ProductMultiSelector

---

## 📊 Comparación de Columnas

| Columna               | Propósito                                    | Siempre Visible |
|-----------------------|----------------------------------------------|-----------------|
| Nombre                | Identificar producto                         | ✅ Sí           |
| SKU                   | Código del producto                          | ✅ Sí           |
| Precio Venta          | Precio actual de venta                       | ✅ Sí           |
| **Precio con Descuento** | **Precio después de promoción**           | ⚡ Condicional  |
| Costo + IVA           | Costo del producto con impuestos             | ✅ Sí           |
| Stock                 | Cantidad disponible                          | ✅ Sí           |

---

## ✅ Resultado Final

### Antes:
```
| Precio Venta | Costo + IVA |
|--------------|-------------|
| $4.470       | $3.439      |
```

### Después (con promoción 15%):
```
| Precio Venta | Precio con Descuento      | Costo + IVA |
|--------------|---------------------------|-------------|
| $4.470       | $3.799                    | $3.439      |
|              | Ahorro: $671 (15%)        |             |
```

---

## 🎯 Mejoras Futuras Posibles

1. **Color del margen**: Cambiar color si el precio con descuento es menor al costo
2. **Gráfico de barras**: Visualizar descuento con barra
3. **Exportar precios**: Excel con precios originales y con descuento
4. **Comparar promociones**: Ver múltiples escenarios lado a lado
5. **Alertas**: Avisar si descuento es muy grande vs costo

---

## 📚 Referencias

- Componente: `src/components/pricing/ProductMultiSelector.tsx`
- Documentación Principal: `docs/pricing/SISTEMA-SELECCION-PROMOCIONES.md`
- Utilidades de Precio: `src/utils/price-utils.ts`


