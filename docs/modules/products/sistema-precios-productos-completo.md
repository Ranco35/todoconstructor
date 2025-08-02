# Sistema de Precios en Productos - Documentación Completa

## Resumen Ejecutivo

El sistema de productos de Admintermas maneja un esquema completo de precios que incluye:
- **Precios netos (sin IVA)** para cálculos internos
- **Precios finales con IVA incluido** para clientes
- **Cálculos automáticos** entre valores netos y finales
- **Números enteros** para precios profesionales
- **Redondeo inteligente** a miles o unidades
- **Trigger SQL automático** para mantener consistencia

## Estructura de la Base de Datos

### Tabla Product - Campos de Precios

```sql
CREATE TABLE "Product" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "costprice" DECIMAL(10,2),           -- Precio de costo
  "saleprice" DECIMAL(10,2),           -- Precio de venta NETO (sin IVA)
  "vat" DECIMAL(5,2),                  -- Porcentaje de IVA (19% por defecto)
  "final_price_with_vat" DECIMAL(12,2), -- Precio final con IVA (calculado automáticamente)
  -- ... otros campos
);
```

### Trigger Automático para Precio Final

```sql
CREATE OR REPLACE FUNCTION update_final_price_with_vat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.final_price_with_vat := ROUND(COALESCE(NEW.saleprice,0) * (1 + COALESCE(NEW.vat,0)/100), 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_final_price_with_vat
BEFORE INSERT OR UPDATE ON "Product"
FOR EACH ROW EXECUTE FUNCTION update_final_price_with_vat();
```

## Interfaz de Usuario - Formulario de Precios

### Campos Disponibles

1. **Precio de Costo** (costprice)
   - Campo: `<input type="number" step="0.01" min="0">`
   - Descripción: "Precio de compra al proveedor"
   - Opcional - Solo para productos CONSUMIBLE, ALMACENABLE, INVENTARIO

2. **Precio de Venta Neto** (saleprice)
   - Campo: `<input type="number" step="1" min="0">`
   - Descripción: "Valor Neto (sin IVA)"
   - **Obligatorio** para productos con precios
   - **Solo números enteros** (step="1")

3. **IVA (%)** (vat)
   - Campo: `<input type="number" step="0.01" min="0" max="100">`
   - Valor por defecto: **19%**
   - Descripción: "Porcentaje de impuesto al valor agregado"

4. **Precio Final con IVA Incluido** (calculado)
   - Campo destacado con fondo verde
   - **Editable** - permite modificar y recalcula el neto automáticamente
   - Descripción: "Precio que ve el cliente final"
   - **Solo números enteros**

## Lógica de Cálculo en el Frontend

### 1. Función Principal de Cálculo

```typescript
const calculateFinalPrice = () => {
  if (!formData.salePrice || formData.salePrice <= 0) return 0;
  const vatRate = formData.vat || 19; // IVA por defecto 19%
  return formData.salePrice * (1 + vatRate / 100);
};
```

### 2. Manejo de Cambios de Precio

```typescript
const handlePriceChange = (value: number, type: PriceChangeType) => {
  const intValue = Math.floor(value); // Solo parte entera
  
  if (type === 'neto') {
    setEditSource('neto');
    handleInputChange('salePrice', intValue);
    setFinalPriceInput(intValue * (1 + (formData.vat || 19) / 100));
  } else {
    setEditSource('final');
    setFinalPriceInput(intValue);
    // Calcular neto inverso
    const neto = intValue / (1 + (formData.vat || 19) / 100);
    handleInputChange('salePrice', Math.floor(neto));
  }
};
```

### 3. Sincronización con Cambios de IVA

```typescript
const handleVatOrNetoChange = (value: number, type: VatChangeType) => {
  if (type === 'vat') {
    handleInputChange('vat', value);
    if (editSource === 'neto') {
      setFinalPriceInput((formData.salePrice || 0) * (1 + value / 100));
    } else {
      const neto = finalPriceInput / (1 + value / 100);
      handleInputChange('salePrice', Math.floor(neto));
    }
  }
};
```

### 4. Redondeo Inteligente

```typescript
const handleRedondear = (tipo: RedondeoType = 'mil') => {
  let rounded = finalPriceInput;
  if (tipo === 'mil') {
    rounded = Math.round(finalPriceInput / 1000) * 1000;
  } else {
    rounded = Math.round(finalPriceInput);
  }
  setFinalPriceInput(rounded);
  // Calcular neto inverso
  const neto = Math.round(rounded / (1 + (formData.vat || 19) / 100));
  handleInputChange('salePrice', neto);
};
```

## Características Técnicas

### 1. Números Enteros Obligatorios

- **Precio de Venta Neto**: `step="1"` + `Math.floor(value)`
- **Precio Final**: `Math.floor(value)` en todos los cálculos
- **Razón**: Precios profesionales sin decimales confusos

### 2. Bidireccionalidad

- **Editar Neto → Calcula Final**: `final = neto × (1 + IVA/100)`
- **Editar Final → Calcula Neto**: `neto = final ÷ (1 + IVA/100)`
- **Tracking de Fuente**: Variable `editSource` para saber qué campo editó el usuario

### 3. IVA por Defecto

- **Valor estándar**: 19% (IVA chileno)
- **Aplicación automática**: Se aplica al crear productos nuevos
- **Modificable**: Usuario puede cambiar el porcentaje

### 4. Validaciones Frontend

```typescript
const isBasicFormValid = formData.name && formData.sku;
const showSalePrice = isConsumible || isAlmacenable || isServicio || isCombo;
const showVat = isConsumible || isAlmacenable || isInventario || isServicio || isCombo;
```

## Integración con Otros Módulos

### 1. Productos Modulares

```typescript
// Para productos vinculados a productos reales
CASE 
  WHEN pr.original_id IS NOT NULL THEN
    -- Precio final con IVA desde producto real
    COALESCE(p.saleprice * (1 + COALESCE(p.vat, 19) / 100.0), pr.price) 
  ELSE
    -- Precio del producto modular (YA INCLUYE IVA)
    pr.price
END as final_price
```

### 2. Sistema de Reservas

```sql
-- Función calculate_package_price_modular usa precios finales
'unit_price_with_vat', final_price_with_vat
'vat_included', true
'note', 'Todos los precios incluyen IVA 19%'
```

## Ejemplos Prácticos

### Ejemplo 1: Producto Estándar

```
Precio de Costo: $15.000
Precio de Venta Neto: $25.000
IVA: 19%
Precio Final con IVA: $29.750
```

### Ejemplo 2: Edición desde Precio Final

```
Usuario ingresa Precio Final: $30.000
Sistema calcula:
- Neto = $30.000 ÷ 1.19 = $25.210
- Neto redondeado = $25.210 (entero)
- Final recalculado = $25.210 × 1.19 = $30.000
```

### Ejemplo 3: Redondeo a Miles

```
Precio Final actual: $29.750
Usuario hace clic "Redondear a miles"
- Redondeado = $30.000
- Neto calculado = $30.000 ÷ 1.19 = $25.210
- Neto final = $25.210 (entero)
```

## Análisis de Margen Automático

```typescript
// Cálculo automático en interfaz
const margenBruto = salePrice - costPrice;
const margenPorcentaje = ((salePrice - costPrice) / costPrice) * 100;
const precioConIVA = salePrice * (1 + vat / 100);
```

## Ventajas del Sistema

1. **Transparencia Total**: Usuario ve siempre el precio final
2. **Flexibilidad**: Puede editar desde neto o final
3. **Consistencia**: Trigger SQL garantiza coherencia
4. **Profesionalismo**: Números enteros sin decimales confusos
5. **Automatización**: Cálculos automáticos en tiempo real
6. **Integración**: Compatible con todos los módulos del sistema

## Flujo de Datos Completo

```
1. Usuario ingresa → 2. Validación Frontend → 3. Cálculo Automático → 4. Envío a BD → 5. Trigger SQL → 6. Actualización final_price_with_vat
```

## Mantenimiento y Soporte

- **Logs detallados**: Console.log para debugging
- **Validaciones robustas**: Manejo de valores null/undefined
- **Compatibilidad**: Funciona con todos los tipos de producto
- **Actualización automática**: Trigger mantiene consistencia en BD

---

**Documentación generada:** Julio 2025  
**Sistema:** Admintermas v1.0  
**Módulo:** Productos / Precios  
**Estado:** Completamente funcional 