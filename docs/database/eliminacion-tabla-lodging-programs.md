# Eliminación Completa de Tabla lodging_programs

## 🎯 **Objetivo**
Eliminar completamente la tabla `lodging_programs` que ya no se usa en el sistema, después de haber migrado exitosamente a `packages_modular` y `Product` (categoría 26).

## 📋 **Estado Actual del Sistema**

### ✅ **Sistema Actual (ACTIVO)**
- **Tabla:** `packages_modular` - Paquetes modulares reales
- **Tabla:** `Product` con `categoryid = 26` - Programas de alojamiento
- **Archivo:** `src/actions/reservations/real-lodging-programs.ts`
- **Componentes:** Todos usando `RealLodgingProgram` interface

### ❌ **Sistema Obsoleto (ELIMINAR)**
- **Tabla:** `lodging_programs` - Vacía, no se usa
- **Funciones/Triggers:** Asociados a la tabla obsoleta
- **Backup:** `lodging_programs_backup` (opcional eliminar)

## 🔧 **Script de Eliminación**

### **Archivo:** `scripts/drop-lodging-programs-table.sql`

**Características del script:**
- ✅ **Verificación previa** del estado actual
- ✅ **Detección de dependencias** (foreign keys)
- ✅ **Verificación del sistema actual** (packages_modular)
- ✅ **Eliminación segura** de triggers y funciones
- ✅ **Eliminación completa** de la tabla
- ✅ **Verificación final** del resultado

### **Cómo ejecutar:**

1. **Ir a Supabase Dashboard**
2. **SQL Editor**
3. **Pegar el script completo**
4. **Ejecutar RUN**

## 🛡️ **Verificaciones de Seguridad**

### **1. Verificación de Uso**
```sql
-- El script verifica que la tabla esté vacía
SELECT COUNT(*) FROM lodging_programs; -- Debe ser 0
```

### **2. Verificación de Dependencias**
```sql
-- Busca foreign keys que apunten a la tabla
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND referenced_table_name = 'lodging_programs';
```

### **3. Verificación del Sistema Actual**
```sql
-- Confirma que packages_modular funciona
SELECT COUNT(*) FROM packages_modular WHERE is_active = true;

-- Confirma que productos categoría 26 existen
SELECT COUNT(*) FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
WHERE c.name = 'Programas Alojamiento';
```

## 🔄 **Proceso de Eliminación**

### **Paso 1: Verificar Estado**
- Confirmar que `lodging_programs` está vacía
- Verificar que no hay foreign keys dependientes
- Confirmar que el sistema modular funciona

### **Paso 2: Limpiar Dependencias**
```sql
-- Eliminar trigger
DROP TRIGGER IF EXISTS update_lodging_programs_updated_at ON lodging_programs;

-- Eliminar función
DROP FUNCTION IF EXISTS update_lodging_programs_updated_at();
```

### **Paso 3: Eliminar Tabla**
```sql
-- Eliminar tabla completamente
DROP TABLE IF EXISTS lodging_programs CASCADE;
```

### **Paso 4: Verificar Eliminación**
```sql
-- Confirmar que la tabla fue eliminada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'lodging_programs'; -- Debe devolver 0 filas
```

## 📊 **Estado Final Esperado**

### **Tablas Eliminadas:**
- ❌ `lodging_programs` - ELIMINADA
- ❌ `lodging_programs_backup` - ELIMINADA (opcional)

### **Tablas Activas:**
- ✅ `packages_modular` - 4+ paquetes activos
- ✅ `Product` - Programas categoría 26
- ✅ `Category` - "Programas Alojamiento" (ID 26)

### **Código Funcional:**
- ✅ `real-lodging-programs.ts` - Funciones activas
- ✅ `ReservationModal.tsx` - Usa sistema modular
- ✅ `ReservationCalendar.tsx` - Usa sistema modular

## 🚨 **Verificación Post-Eliminación**

### **1. Verificar Aplicación**
- [ ] Crear nueva reserva funciona
- [ ] Selector de programas funciona
- [ ] No hay errores en consola
- [ ] Calendario de reservas funciona

### **2. Verificar Base de Datos**
- [ ] Tabla `lodging_programs` eliminada
- [ ] Triggers eliminados
- [ ] Funciones eliminadas
- [ ] `packages_modular` funciona
- [ ] Productos categoría 26 activos

### **3. Verificar Datos**
```sql
-- Debe mostrar los paquetes reales
SELECT * FROM packages_modular WHERE is_active = true;

-- Debe mostrar los productos de programas
SELECT p.name, p.saleprice, c.name as categoria
FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
WHERE c.name = 'Programas Alojamiento';
```

## 🔄 **Rollback (Solo Emergencia)**

**Si algo sale mal, puedes restaurar:**
```sql
-- Solo si eliminaste el backup accidentalmente
-- Y necesitas restaurar la estructura (NO los datos)
CREATE TABLE lodging_programs (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  -- ... resto de columnas
);

-- Restaurar datos desde backup (si existe)
INSERT INTO lodging_programs 
SELECT * FROM lodging_programs_backup;
```

**⚠️ NOTA:** No deberías necesitar rollback porque el sistema ya no usa esta tabla.

## 📝 **Beneficios de la Eliminación**

### **1. Claridad del Sistema**
- ❌ ANTES: Confusión con tablas duplicadas
- ✅ DESPUÉS: Una sola fuente de verdad

### **2. Limpieza de Base de Datos**
- ❌ ANTES: Tablas vacías ocupando espacio
- ✅ DESPUÉS: Solo tablas necesarias

### **3. Mantenimiento Simplificado**
- ❌ ANTES: Múltiples esquemas de datos
- ✅ DESPUÉS: Sistema modular unificado

### **4. Menos Confusión para Desarrolladores**
- ❌ ANTES: ¿Qué tabla usar?
- ✅ DESPUÉS: Obviamente `packages_modular`

## 🎉 **Resultado Final**

Después de ejecutar este script, el sistema tendrá:

- ✅ **Sistema limpio** sin tablas obsoletas
- ✅ **Una sola fuente** de programas de alojamiento
- ✅ **Código simplificado** y mantenible
- ✅ **Base de datos optimizada** 
- ✅ **Funcionalidad completa** sin cambios para el usuario

## 🔍 **Checklist de Verificación**

```sql
-- Ejecutar después de la eliminación:

-- 1. Verificar eliminación
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'lodging_programs'; -- Debe ser 0

-- 2. Verificar sistema activo
SELECT COUNT(*) FROM packages_modular 
WHERE is_active = true; -- Debe ser 4+

-- 3. Verificar productos categoría 26
SELECT COUNT(*) FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
WHERE c.name = 'Programas Alojamiento'; -- Debe ser 5+

-- 4. Verificar reservas funcionan
SELECT COUNT(*) FROM reservations 
WHERE created_at > NOW() - INTERVAL '1 day'; -- Debe funcionar
```

✅ **Si todas las verificaciones pasan, la eliminación fue exitosa.** 