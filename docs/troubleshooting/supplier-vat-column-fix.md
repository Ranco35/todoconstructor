# Fix: Error Columna VAT Faltante en Tabla Supplier

## 🚨 **Problema**

Error al crear proveedores:
```
Error: Error creando proveedor: Could not find the 'vat' column of 'Supplier' in the schema cache
```

## 🔍 **Causa Raíz**

La tabla `Supplier` en la base de datos no contenía la columna `vat`, pero el código estaba intentando insertarla:

### **Estructura Original (Incorrecta)**
```sql
-- En 20250623003309_initial_schema.sql
CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  -- ... otros campos
  "taxId" TEXT,
  -- FALTABA: "vat" TEXT
);
```

### **Código Esperaba VAT**
```typescript
// En src/actions/suppliers/create.ts:185
vat: vat?.trim() || null,  // ❌ Error: columna no existe
```

## ✅ **Solución Implementada**

### **1. Migración Creada**
```sql
-- supabase/migrations/20250628000000_add_vat_to_supplier.sql
ALTER TABLE "Supplier"
ADD COLUMN IF NOT EXISTS "vat" TEXT;

CREATE INDEX IF NOT EXISTS "idx_supplier_vat" ON "Supplier"("vat");
COMMENT ON COLUMN "Supplier"."vat" IS 'Número de VAT/RUT del proveedor para identificación fiscal';
```

### **2. Migración Aplicada**
```bash
npx supabase db push
# ✅ Aplicada exitosamente
```

## 🎯 **Resultado**

- ✅ **Columna `vat` agregada** a tabla `Supplier`
- ✅ **Índice optimizado** para consultas por VAT
- ✅ **Creación de proveedores** funcionando correctamente
- ✅ **Sistema sincronizado** entre código y base de datos

## 📝 **Verificación**

### **Antes**
```
❌ Error: Could not find the 'vat' column of 'Supplier'
```

### **Después**
```
✅ Proveedor creado exitosamente con VAT/RUT
```

## 🔄 **Prevención Futura**

1. **Revisar schema** antes de agregar campos en código
2. **Crear migraciones** para nuevas columnas
3. **Sincronizar** tipos TypeScript con estructura real de BD
4. **Testear** funcionalidades después de cambios de schema

## 📅 **Fecha de Resolución**

- **Fecha**: 2025-06-28
- **Migración**: `20250628000000_add_vat_to_supplier.sql`
- **Estado**: ✅ **RESUELTO COMPLETAMENTE** 