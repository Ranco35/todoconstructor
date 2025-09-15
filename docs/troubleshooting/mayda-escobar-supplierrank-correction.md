# Corrección: Mayda Escobar supplierRank para pagos Part-Time

## 📋 Problema Real Identificado

**Datos actuales de Mayda Escobar (ID: 331):**
```json
{
  "id": 331,
  "name": "Mayda Escobar",
  "category": null,
  "supplierRank": "BASICO",      // ❌ PROBLEMA: debería ser "PART-TIME"
  "isActive": true,              // ✅ Correcto
  "companyType": "EMPRESA_INDIVIDUAL"
}
```

**Problema:** Mayda Escobar tiene `supplierRank = "BASICO"` pero debería tener `supplierRank = "PART-TIME"` para aparecer en el selector de pagos a proveedores Part-Time.

## 🔍 Análisis de la Discrepancia

### Lo que se muestra vs Lo que está en BD
- **En la interfaz:** Aparece como "Part-Time" (posiblemente cache o error visual)
- **En la BD:** `supplierRank = "BASICO"`
- **Para el selector:** Necesita `supplierRank = "PART-TIME"`

### Función de Filtrado Correcta
La función `getPartTimeSuppliers()` está correctamente configurada para filtrar:
```typescript
.eq('supplierRank', 'PART-TIME')  // ✅ Filtro correcto
.eq('isActive', true)             // ✅ Mayda cumple (true)
```

## 🛠️ Solución: Actualizar supplierRank

### Script SQL para Corrección

**Archivo:** `corregir_mayda_escobar_supplierrank.sql`

```sql
-- Actualizar supplierRank de Mayda Escobar
UPDATE "Supplier" 
SET "supplierRank" = 'PART-TIME'
WHERE name = 'Mayda Escobar'
  AND id = 331;
```

### Pasos de Ejecución

1. **Ejecutar en Supabase SQL Editor:**
   ```sql
   UPDATE "Supplier" 
   SET "supplierRank" = 'PART-TIME'
   WHERE name = 'Mayda Escobar' AND id = 331;
   ```

2. **Verificar el cambio:**
   ```sql
   SELECT id, name, "supplierRank", "isActive"
   FROM "Supplier" 
   WHERE name = 'Mayda Escobar';
   ```

3. **Confirmar que aparece en Part-Time:**
   ```sql
   SELECT id, name, "supplierRank", "isActive"
   FROM "Supplier" 
   WHERE "supplierRank" = 'PART-TIME' 
     AND "isActive" = true
   ORDER BY name;
   ```

## ✅ Resultado Esperado

### Después de la corrección:
```json
{
  "id": 331,
  "name": "Mayda Escobar",
  "category": null,
  "supplierRank": "PART-TIME",    // ✅ CORREGIDO
  "isActive": true,
  "companyType": "EMPRESA_INDIVIDUAL"
}
```

### En el selector de pagos Part-Time:
- ✅ Mayda Escobar aparecerá en el dropdown
- ✅ Se podrán hacer pagos desde caja chica
- ✅ Información completa del proveedor disponible

## 🔧 Archivos Relacionados

1. **SQL de corrección:** `corregir_mayda_escobar_supplierrank.sql`
2. **Función de filtrado:** `src/actions/configuration/suppliers-actions.ts`
3. **Modal de pagos:** `src/components/petty-cash/SupplierPaymentForm.tsx`

## 📋 Verificación Post-Corrección

### Prueba en la aplicación:
1. Ir a `/dashboard/pettyCash`
2. Hacer clic en "💰 Pago a Proveedores Part-Time"
3. Verificar que "Mayda Escobar" aparece en el selector
4. Completar un pago de prueba

### Consulta de verificación:
```sql
-- Contar proveedores Part-Time activos
SELECT COUNT(*) as total_part_time
FROM "Supplier" 
WHERE "supplierRank" = 'PART-TIME' 
  AND "isActive" = true;

-- Listar todos los proveedores Part-Time
SELECT name, "supplierRank", "isActive"
FROM "Supplier" 
WHERE "supplierRank" = 'PART-TIME' 
  AND "isActive" = true
ORDER BY name;
```

## 💡 Consideraciones Adicionales

### Valores de supplierRank válidos:
- `BASICO` / `BRONZE`
- `SILVER` 
- `GOLD`
- `PLATINUM`
- `PART-TIME` ← **Valor correcto para Mayda**
- `REGULAR`
- `PREMIUM`

### Consistencia del sistema:
- El campo `supplierRank` debe reflejar el tipo real del proveedor
- La interfaz debe mostrar el valor correcto de la BD
- Los filtros deben usar el mismo campo en todo el sistema

---

**Estado:** 🔄 PENDIENTE EJECUCIÓN SQL  
**Acción requerida:** Ejecutar UPDATE en Supabase  
**Tiempo estimado:** 2 minutos  
**Impacto:** Mayda Escobar disponible para pagos Part-Time  
