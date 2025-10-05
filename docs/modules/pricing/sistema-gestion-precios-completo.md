# Sistema de Gestión de Precios Completo

## 📋 Resumen Ejecutivo
Sistema de gestión de precios para productos por categoría con configuración de márgenes, reglas de redondeo, actualización masiva, cálculo automático de precios con IVA, y auditoría completa.

## 🎯 Funcionalidades Principales
- ✅ Configuración de márgenes por categoría
- ✅ Reglas de redondeo (decenas, centenas, miles)
- ✅ Actualización masiva de precios
- ✅ Cálculo automático de precios con IVA
- ✅ Historial de cambios y auditoría
- ✅ Interfaz web completa
- ✅ API endpoints
- ✅ Triggers automáticos

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. CategoryProfitConfig
```sql
CREATE TABLE "CategoryProfitConfig" (
  "id" BIGSERIAL PRIMARY KEY,
  "categoryId" BIGINT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
  "defaultProfitMargin" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  "minProfitMargin" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  "maxProfitMargin" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  "roundingRule" VARCHAR(20) DEFAULT 'hundreds' CHECK (roundingRule IN ('none', 'tens', 'hundreds', 'thousands')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" BIGINT REFERENCES "User"("id"),
  "updatedBy" BIGINT REFERENCES "User"("id")
);
```

#### 2. ProductProfitConfig
```sql
CREATE TABLE "ProductProfitConfig" (
  "id" BIGSERIAL PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "profitMargin" DECIMAL(5,2) NOT NULL,
  "roundingRule" VARCHAR(20) DEFAULT 'hundreds' CHECK (roundingRule IN ('none', 'tens', 'hundreds', 'thousands')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" BIGINT REFERENCES "User"("id"),
  "updatedBy" BIGINT REFERENCES "User"("id"),
  UNIQUE("productId")
);
```

#### 3. PriceHistory (Auditoría)
```sql
CREATE TABLE "PriceHistory" (
  "id" BIGSERIAL PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "oldCostPrice" DECIMAL(10,2),
  "newCostPrice" DECIMAL(10,2),
  "oldSalePrice" DECIMAL(10,2),
  "newSalePrice" DECIMAL(10,2),
  "oldFinalPrice" DECIMAL(12,2),
  "newFinalPrice" DECIMAL(12,2),
  "changeReason" VARCHAR(50) NOT NULL,
  "oldProfitMargin" DECIMAL(5,2),
  "newProfitMargin" DECIMAL(5,2),
  "changedBy" BIGINT REFERENCES "User"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. Campos en Product
```sql
-- Campos relevantes en la tabla Product
"costprice" DECIMAL(10,2),     -- Precio de costo
"saleprice" DECIMAL(10,2),     -- Precio de venta (sin IVA)
"finalPrice" DECIMAL(12,2),    -- Precio final con IVA y redondeo aplicado
"vat" DECIMAL(5,2) DEFAULT 19  -- Porcentaje de IVA
```

---

## ⚙️ Funciones SQL

### Trigger de Redondeo Automático
```sql
CREATE OR REPLACE FUNCTION update_final_price_with_vat()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  rounding_rule VARCHAR(20) := 'hundreds';
  final_price DECIMAL(12,2);
BEGIN
  -- Obtener regla de redondeo de la categoría
  SELECT cpc."roundingRule" INTO rounding_rule
  FROM "CategoryProfitConfig" cpc
  WHERE cpc."categoryId" = NEW."categoryid"
    AND cpc."isActive" = true;
  
  -- Si no hay configuración, usar por defecto
  IF rounding_rule IS NULL THEN
    rounding_rule := 'hundreds';
  END IF;
  
  -- Calcular precio base con IVA
  final_price := COALESCE(NEW."saleprice", 0) * (1 + COALESCE(NEW."vat", 0)/100);
  
  -- Aplicar regla de redondeo
  CASE rounding_rule
    WHEN 'tens' THEN
      final_price := ROUND(final_price / 10) * 10;
    WHEN 'hundreds' THEN
      final_price := ROUND(final_price / 100) * 100;
    WHEN 'thousands' THEN
      final_price := ROUND(final_price / 1000) * 1000;
    WHEN 'none' THEN
      final_price := ROUND(final_price);
    ELSE
      final_price := ROUND(final_price / 100) * 100;
  END CASE;
  
  NEW."finalPrice" := final_price;
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta en cada INSERT/UPDATE
CREATE TRIGGER trg_update_final_price_with_vat 
BEFORE INSERT OR UPDATE ON "Product" 
FOR EACH ROW EXECUTE FUNCTION update_final_price_with_vat();
```

---

## 🔧 Funciones JavaScript/TypeScript

### Cálculo de Precios (`src/utils/price-utils.ts`)

#### Función Principal de Cálculo
```typescript
export function calculateCompletePrice(
  costPrice: number,
  profitMargin: number,
  vatRate: number = 19,
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands' = 'hundreds'
): PriceCalculation {
  const salePrice = calculateSalePriceFromCost(costPrice, profitMargin, roundingRule);
  const finalPrice = calculateFinalPriceWithVAT(salePrice, vatRate, roundingRule);
  const profitAmount = calculateProfitAmount(costPrice, salePrice);
  
  return {
    costPrice,
    profitMargin,
    salePrice,
    finalPrice,
    profitAmount,
    roundingRule
  };
}
```

#### Cálculo de Precio de Venta
```typescript
export function calculateSalePriceFromCost(
  costPrice: number,
  profitMargin: number,
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands' = 'hundreds'
): number {
  if (!costPrice || costPrice <= 0) return 0;
  
  const calculatedPrice = costPrice * (1 + profitMargin / 100);
  
  switch (roundingRule) {
    case 'tens':
      return Math.round(calculatedPrice / 10) * 10;
    case 'hundreds':
      return Math.round(calculatedPrice / 100) * 100;
    case 'thousands':
      return Math.round(calculatedPrice / 1000) * 1000;
    case 'none':
    default:
      return Math.round(calculatedPrice * 100) / 100;
  }
}
```

#### Cálculo de Precio Final con IVA
```typescript
export function calculateFinalPriceWithVAT(
  salePrice: number, 
  vatRate: number = 19,
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands' = 'none'
): number {
  const priceWithVAT = salePrice * (1 + vatRate / 100);
  
  switch (roundingRule) {
    case 'tens':
      return Math.round(priceWithVAT / 10) * 10;
    case 'hundreds':
      return Math.round(priceWithVAT / 100) * 100;
    case 'thousands':
      return Math.round(priceWithVAT / 1000) * 1000;
    case 'none':
    default:
      return Math.round(priceWithVAT);
  }
}
```

---

## 🎨 Componentes Frontend

### Configuración de Categorías (`src/components/pricing/CategoryProfitConfigForm.tsx`)
```typescript
interface CategoryProfitConfig {
  id: number;
  categoryId: number;
  defaultProfitMargin: number;
  minProfitMargin: number;
  maxProfitMargin: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  Category?: {
    id: number;
    name: string;
  };
}

// Función para actualizar precios de categoría
const handleUpdatePrices = async (categoryId: number, categoryName: string) => {
  if (!confirm(`¿Estás seguro de que quieres actualizar los precios de todos los productos de la categoría "${categoryName}"?`)) {
    return;
  }

  try {
    setUpdatingPrices(categoryId);
    setError(null);
    setSuccess(null);

    const response = await fetch('/api/pricing/update-category-prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId,
        reason: 'margin_adjustment'
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      const { updated, errors } = result.data || { updated: 0, errors: [] };
      setSuccess(`Precios actualizados exitosamente: ${updated} productos actualizados${errors.length > 0 ? `. ${errors.length} errores.` : '.'}`);
      if (errors.length > 0) {
        console.warn('Errores durante la actualización:', errors);
      }
    } else {
      setError(result.error || 'Error al actualizar precios');
    }
  } catch (error) {
    console.error('Error updating prices:', error);
    setError('Error interno del servidor');
  } finally {
    setUpdatingPrices(null);
  }
};
```

### Tarjeta de Producto (`src/components/website/ProductCard.tsx`)
```typescript
// Función para formatear precio
const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar precio'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price)
}

// Renderizado del precio
{product.finalPrice ? (
  <div>
    <span className="text-2xl font-bold text-green-600">
      {formatPrice(product.finalPrice)}
    </span>
    <span className="text-sm text-gray-500 ml-2">
      (IVA {product.vat || 0}% incluido)
    </span>
  </div>
) : (
  <span className="text-lg font-semibold text-gray-600">
    Consultar precio
  </span>
)}
```

---

## 🌐 API Endpoints

### Actualización de Precios por Categoría (`src/app/api/pricing/update-category-prices/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { updateCategoryPricesFromCost } from '@/actions/pricing/price-management-actions';

export async function POST(request: NextRequest) {
  try {
    const { categoryId, reason = 'margin_adjustment' } = await request.json();

    if (!categoryId || typeof categoryId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'ID de categoría requerido' },
        { status: 400 }
      );
    }

    const result = await updateCategoryPricesFromCost(categoryId, reason);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en API update-category-prices:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

---

## 📊 Reglas de Redondeo

### Tipos de Redondeo Disponibles
1. **`none`** - Sin redondeo (mantiene decimales)
2. **`tens`** - Redondeo a decenas (ej: 1,234 → 1,230)
3. **`hundreds`** - Redondeo a centenas (ej: 1,234 → 1,200)
4. **`thousands`** - Redondeo a miles (ej: 1,234 → 1,000)

### Ejemplo de Cálculo
```
Producto: OSB 11mm Casa ULTU
Costo: $12,000
Margen: 25%
IVA: 19%
Regla de Redondeo: Decenas

Cálculo:
1. Precio con margen: $12,000 × 1.25 = $15,000
2. Precio con IVA: $15,000 × 1.19 = $17,850
3. Redondeo a decenas: ROUND(17,850 / 10) × 10 = $17,850
4. Precio final: $17,850
```

---

## 🔄 Flujo de Trabajo

### 1. Configuración Inicial
1. Ir a `/dashboard/pricing/categories`
2. Seleccionar categoría (ej: "Tableros construcción")
3. Configurar margen (ej: 25%)
4. Seleccionar regla de redondeo (ej: "Decenas")
5. Guardar configuración

### 2. Actualización de Precios
1. En la tabla de configuraciones, hacer clic en el botón 💰
2. Confirmar la actualización
3. El sistema actualiza todos los productos de la categoría
4. Los precios se calculan con la nueva configuración

### 3. Visualización
1. Ir a `/website`
2. Los productos muestran precios redondeados
3. El precio mostrado es `finalPrice` (con IVA y redondeo)

---

## 🐛 Problemas Resueltos

### 1. Error de Columna
- **Problema**: `column Product.categoryId does not exist`
- **Causa**: Uso de `categoryId` en lugar de `categoryid`
- **Solución**: Corregir referencias en las consultas SQL

### 2. Redondeos No Aplicados
- **Problema**: Los precios no respetaban las reglas de redondeo
- **Causa**: El trigger no aplicaba redondeo al precio final
- **Solución**: Corregir trigger para usar `finalPrice` y aplicar reglas

### 3. Error de Hidratación
- **Problema**: `hydration mismatch` en WebsiteFooter
- **Causa**: Estilos dinámicos en el servidor
- **Solución**: Agregar `'use client'` y estilos específicos

### 4. Campo Incorrecto
- **Problema**: Trigger usaba `final_price_with_vat` inexistente
- **Causa**: Confusión entre snake_case y camelCase
- **Solución**: Usar `finalPrice` (camelCase)

---

## 📁 Archivos del Sistema

### Backend
- `src/actions/pricing/price-management-actions.ts` - Server actions
- `src/utils/price-utils.ts` - Funciones de cálculo
- `src/app/api/pricing/update-category-prices/route.ts` - API endpoint

### Frontend
- `src/components/pricing/CategoryProfitConfigForm.tsx` - Configuración
- `src/components/website/ProductCard.tsx` - Visualización de productos
- `src/components/website/WebsiteFooter.tsx` - Footer corregido

### Base de Datos
- `supabase/migrations/20250122000000_create_price_management_system.sql` - Estructura inicial
- `supabase/migrations/20250123000002_fix_rounding_trigger.sql` - Trigger corregido

### Documentación
- `docs/modules/pricing/sistema-gestion-precios-completo.md` - Este documento

---

## ✅ Estado Actual
- ✅ Configuración por categoría funcionando
- ✅ Reglas de redondeo aplicadas correctamente
- ✅ Actualización masiva operativa
- ✅ Cálculo automático con IVA
- ✅ Trigger funcionando correctamente
- ✅ Frontend actualizado y funcionando
- ✅ API endpoint operativo
- ✅ Historial de cambios implementado
- ✅ Auditoría completa

### Resultados Obtenidos
- Precios calculados automáticamente con márgenes configurados
- Redondeos aplicados según reglas establecidas
- IVA incluido en precios finales
- Actualización masiva funcionando
- Interfaz intuitiva y funcional
- Historial completo para auditoría

---

## 🔧 Mantenimiento

### Para Agregar Nuevas Reglas de Redondeo
1. Actualizar el enum en la base de datos
2. Modificar el switch en `calculateSalePriceFromCost()`
3. Actualizar el CASE en el trigger SQL
4. Agregar opción en el frontend

### Para Cambiar la Lógica de Cálculo
1. Modificar funciones en `price-utils.ts`
2. Actualizar server actions
3. Probar con diferentes escenarios
4. Actualizar documentación

### Para Monitorear el Sistema
1. Revisar `PriceHistory` regularmente
2. Verificar que los triggers funcionen
3. Monitorear errores en la consola
4. Validar precios en el frontend

---

## 📈 Beneficios del Sistema

### Para el Negocio
- **Consistencia**: Precios uniformes por categoría
- **Automatización**: Menos errores manuales
- **Flexibilidad**: Diferentes márgenes por categoría
- **Auditoría**: Historial completo de cambios
- **Eficiencia**: Actualización masiva de precios

### Para los Usuarios
- **Transparencia**: Precios claros con IVA incluido
- **Simplicidad**: Interfaz intuitiva
- **Rapidez**: Cálculos automáticos
- **Confiabilidad**: Precios consistentes

### Para el Desarrollo
- **Mantenibilidad**: Código bien estructurado
- **Escalabilidad**: Fácil agregar nuevas funcionalidades
- **Robustez**: Manejo de errores completo
- **Documentación**: Sistema completamente documentado

---

**Sistema de gestión de precios completamente funcional y documentado.**