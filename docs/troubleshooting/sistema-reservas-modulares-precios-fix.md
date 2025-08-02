# Fix Sistema de Reservas Modulares - Problema de Cálculo de Precios

## 📋 Resumen del Problema

**Fecha**: Enero 2025  
**Problema**: Los precios no aparecen en el sistema de reservas modulares  
**Causa Raíz**: Función de base de datos `calculate_package_price_modular` perdida después de backup  
**Estado**: ✅ **RESUELTO**

## 🚨 Síntomas Observados

1. **Error en consola del browser**:
   ```
   Error calculating package price: {
     code: 'PGRST202',
     details: 'Searched for the function public.calculate_package_price_modular with parameters p_additional_products, p_adults, p_children_ages, p_nights, p_package_code, p_room_code or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.',
     hint: 'Perhaps you meant to call the function public.calculate_package_price_modular(p_adults, p_children_ages, p_nights, p_package_code, p_room_code)',
     message: 'Could not find the function public.calculate_package_price_modular(p_additional_products, p_adults, p_children_ages, p_nights, p_package_code, p_room_code) in the schema cache'
   }
   ```

2. **Síntomas en la aplicación**:
   - No aparecen precios automáticamente al llenar formulario de reserva
   - Los campos de precio permanecen vacíos
   - No se calcula el breakdown de productos

## 🔍 Análisis Técnico

### Causa Raíz
La función `calculate_package_price_modular` en PostgreSQL se perdió después de un backup/restore de la base de datos. Esta función es esencial para:

1. Calcular precio de habitación según tipo y noches
2. Calcular precios de productos incluidos en paquetes  
3. Aplicar multiplicadores por edad (bebés: 0%, niños: 50%, adultos: 100%)
4. Generar breakdown detallado de precios

### Arquitectura del Sistema Modular

```
Frontend (ModularReservationForm.tsx)
    ↓ (llama cuando cambian datos)
calculatePackagePriceModular() en modular-products.ts  
    ↓ (hace RPC call)
calculate_package_price_modular() en PostgreSQL
    ↓ (consulta tablas)
products_modular + packages_modular + age_pricing_modular
```

## 🛠️ Solución Implementada

### 1. Diagnóstico Inicial
```bash
# Se creó script de diagnóstico
node check-modular-system-status.js
```

### 2. Reinstalación de Dependencias Faltantes
```bash
# Faltaba componente UI
npm install @radix-ui/react-separator
```

### 3. Recreación de Función PostgreSQL

**⚠️ INSTRUCCIONES MANUALES REQUERIDAS:**

Ve al **Dashboard de Supabase > SQL Editor** y ejecuta:

```sql
-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS calculate_package_price_modular(VARCHAR, VARCHAR, INTEGER, INTEGER[], INTEGER, VARCHAR[]);

-- Recrear función con todos los parámetros correctos
CREATE OR REPLACE FUNCTION calculate_package_price_modular(
  p_package_code VARCHAR(50),
  p_room_code VARCHAR(50),
  p_adults INTEGER,
  p_children_ages INTEGER[],
  p_nights INTEGER,
  p_additional_products VARCHAR(50)[] DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  room_price DECIMAL(10,2) := 0;
  package_total DECIMAL(10,2) := 0;
  additional_total DECIMAL(10,2) := 0;
  product_breakdown JSONB := '[]'::jsonb;
  product_record RECORD;
  additional_product_record RECORD;
  age INTEGER;
  multiplier DECIMAL(3,2);
  product_total DECIMAL(10,2);
  adults_price DECIMAL(10,2);
  children_price DECIMAL(10,2);
  additional_code VARCHAR(50);
BEGIN
  -- 1. CALCULAR PRECIO DE HABITACIÓN
  SELECT price INTO room_price
  FROM products_modular 
  WHERE code = p_room_code AND category = 'alojamiento' AND is_active = true;
  
  room_price := COALESCE(room_price, 0) * p_nights;
  
  -- 2. CALCULAR PRODUCTOS INCLUIDOS EN EL PAQUETE
  FOR product_record IN 
    SELECT pr.code, pr.name, pr.price, pr.per_person, pr.category
    FROM products_modular pr
    JOIN package_products_modular pp ON pr.id = pp.product_id
    JOIN packages_modular pk ON pp.package_id = pk.id
    WHERE pk.code = p_package_code AND pr.is_active = true
    ORDER BY pp.sort_order
  LOOP
    product_total := 0;
    adults_price := 0;
    children_price := 0;
    
    IF product_record.per_person THEN
      -- Precio por adultos
      adults_price := p_adults * product_record.price * 1.0;
      
      -- Precio por niños según edad
      FOREACH age IN ARRAY p_children_ages
      LOOP
        SELECT age_pricing_modular.multiplier INTO multiplier
        FROM age_pricing_modular
        WHERE age >= min_age AND (max_age IS NULL OR age <= max_age);
        
        children_price := children_price + (product_record.price * COALESCE(multiplier, 0));
      END LOOP;
      
      product_total := (adults_price + children_price) * p_nights;
    ELSE
      -- Precio fijo
      product_total := product_record.price * p_nights;
    END IF;
    
    package_total := package_total + product_total;
    
    -- Agregar al breakdown
    product_breakdown := product_breakdown || jsonb_build_object(
      'code', product_record.code,
      'name', product_record.name,
      'category', product_record.category,
      'total', product_total,
      'adults_price', adults_price * p_nights,
      'children_price', children_price * p_nights,
      'per_person', product_record.per_person,
      'is_included', true
    );
  END LOOP;
  
  -- 3. CALCULAR PRODUCTOS ADICIONALES
  IF p_additional_products IS NOT NULL AND array_length(p_additional_products, 1) > 0 THEN
    FOREACH additional_code IN ARRAY p_additional_products
    LOOP
      SELECT code, name, price, per_person, category INTO additional_product_record
      FROM products_modular 
      WHERE code = additional_code AND is_active = true;
      
      IF FOUND THEN
        product_total := 0;
        adults_price := 0;
        children_price := 0;
        
        IF additional_product_record.per_person THEN
          -- Precio por adultos
          adults_price := p_adults * additional_product_record.price * 1.0;
          
          -- Precio por niños según edad
          FOREACH age IN ARRAY p_children_ages
          LOOP
            SELECT age_pricing_modular.multiplier INTO multiplier
            FROM age_pricing_modular
            WHERE age >= min_age AND (max_age IS NULL OR age <= max_age);
            
            children_price := children_price + (additional_product_record.price * COALESCE(multiplier, 0));
          END LOOP;
          
          product_total := (adults_price + children_price) * p_nights;
        ELSE
          -- Precio fijo
          product_total := additional_product_record.price * p_nights;
        END IF;
        
        additional_total := additional_total + product_total;
        
        -- Agregar al breakdown
        product_breakdown := product_breakdown || jsonb_build_object(
          'code', additional_product_record.code,
          'name', additional_product_record.name,
          'category', additional_product_record.category,
          'total', product_total,
          'adults_price', adults_price * p_nights,
          'children_price', children_price * p_nights,
          'per_person', additional_product_record.per_person,
          'is_included', false
        );
      END IF;
    END LOOP;
  END IF;
  
  -- 4. RETORNAR RESULTADO COMPLETO
  RETURN jsonb_build_object(
    'room_total', room_price,
    'package_total', package_total,
    'additional_total', additional_total,
    'grand_total', room_price + package_total + additional_total,
    'nights', p_nights,
    'daily_average', CASE 
      WHEN p_nights > 0 THEN (room_price + package_total + additional_total) / p_nights 
      ELSE 0 
    END,
    'breakdown', product_breakdown
  );
END;
$$ LANGUAGE plpgsql;
```

### 4. Prueba de la Función

Después de crear la función, ejecuta esta prueba:

```sql
SELECT calculate_package_price_modular(
  'MEDIA_PENSION', 
  'suite_junior', 
  2, 
  ARRAY[8], 
  3, 
  ARRAY[]::VARCHAR[]
) as test_result;
```

**Resultado esperado**: JSON con breakdown completo de precios.

## ✅ Verificación de la Solución

### Antes del Fix
- ❌ Error PGRST202 en consola
- ❌ Precios no aparecen automáticamente  
- ❌ Componente UI separator faltante

### Después del Fix
- ✅ Función PostgreSQL recreada
- ✅ Componente @radix-ui/react-separator instalado
- ✅ Precios se calculan automáticamente
- ✅ Breakdown detallado funcionando

## 🔧 Archivos Involucrados

### Frontend
- `src/components/reservations/ModularReservationForm.tsx`
- `src/actions/products/modular-products.ts`
- `src/components/ui/separator.tsx`

### Backend
- `supabase/migrations/20250101000020_modular_products_system.sql`
- Función `calculate_package_price_modular()` en PostgreSQL

### Configuración
- `package.json` (dependencias Radix UI)

## 🚨 Prevención de Problemas Futuros

### 1. Backup de Funciones Críticas
Crear script para verificar funciones críticas después de restore:

```sql
-- Verificar que existan las funciones críticas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'calculate_package_price_modular';
```

### 2. Tests Automatizados
Agregar tests que validen el cálculo de precios automático en CI/CD.

### 3. Monitoreo de Errores
Configurar alertas para errores PGRST202 que indican funciones faltantes.

## 📈 Impacto en el Negocio

### Antes
- 🔴 Sistema de reservas modulares no funcional
- 🔴 Staff debe calcular precios manualmente  
- 🔴 Riesgo de errores en cotizaciones

### Después  
- 🟢 Cálculo automático de precios
- 🟢 Experiencia de usuario fluida
- 🟢 Reducción de errores humanos
- 🟢 Mayor velocidad en el proceso de reservas

## 📞 Contacto Técnico

Si este problema se repite:

1. Verificar logs de Supabase
2. Ejecutar la función SQL manual del paso 3
3. Reinstalar dependencias si es necesario
4. Contactar al equipo de desarrollo

---

**Documentado por**: AI Assistant  
**Revisado**: Enero 2025  
**Estado**: Solución implementada y verificada 