# Resumen: Sistema de Precios en Productos

## ¿Cómo se guardan los valores netos y con IVA?

### Base de Datos
```sql
-- Tabla Product - Campos de precios
"costprice" DECIMAL(10,2)           -- Precio de costo
"saleprice" DECIMAL(10,2)           -- Precio NETO (sin IVA) - SE GUARDA ESTE
"vat" DECIMAL(5,2)                  -- Porcentaje IVA (19% por defecto)
"final_price_with_vat" DECIMAL(12,2) -- Precio final - SE CALCULA AUTOMÁTICAMENTE
```

### Lo que se guarda vs lo que se calcula
- **SE GUARDA**: `saleprice` (precio neto sin IVA)
- **SE CALCULA**: `final_price_with_vat` (precio final con IVA)
- **TRIGGER SQL**: Calcula automáticamente el precio final cuando se guarda/actualiza

## ¿Cómo se manejan los números enteros?

### Frontend - Formulario
```typescript
// Precio de Venta Neto - SOLO ENTEROS
<input type="number" step="1" min="0">

// Función que fuerza números enteros
const handlePriceChange = (value: number, type: PriceChangeType) => {
  const intValue = Math.floor(value); // Solo parte entera
  // ...
};
```

### Características de números enteros
1. **Campo neto**: `step="1"` (solo enteros)
2. **Cálculos**: `Math.floor(value)` en todas las operaciones
3. **Redondeo**: Botones para redondear a miles o unidades
4. **Razón**: Precios profesionales sin decimales confusos

## Flujo de Datos Completo

```
1. Usuario ingresa: $25.000 (neto)
2. Sistema calcula: $25.000 × 1.19 = $29.750 (final)
3. Se guarda en BD: saleprice = 25000
4. Trigger SQL: final_price_with_vat = 29750
5. Usuario ve: "Precio Final con IVA: $29.750"
```

## Bidireccionalidad

### Editar desde Neto
```
Neto: $25.000 → Final: $29.750
```

### Editar desde Final
```
Final: $30.000 → Neto: $25.210 (calculado)
```

## Ejemplo Práctico

```typescript
// Datos del producto
costprice: 15000      // Precio de costo
saleprice: 25000      // Precio neto (SE GUARDA)
vat: 19               // IVA 19%
final_price_with_vat: 29750  // Calculado automáticamente

// Fórmula: 25000 × (1 + 19/100) = 29750
```

## Ventajas del Sistema

1. **Solo se guarda el neto** - BD simple y consistente
2. **Cálculo automático** - Trigger SQL mantiene coherencia
3. **Números enteros** - Precios profesionales
4. **Bidireccional** - Editar desde neto o final
5. **IVA por defecto** - 19% automático (Chile)

---

**Respuesta directa**: Los valores **netos se guardan** en `saleprice`, los valores **con IVA se calculan** automáticamente. Los números son **siempre enteros** usando `Math.floor()` y `step="1"`. 