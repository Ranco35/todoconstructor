# Archivos Obsoletos - Migraciones

## ❌ Archivos Movidos a esta Carpeta

Esta carpeta contiene migraciones y archivos que están **obsoletos** pero se mantienen por historial.

### 📁 **Contenido:**

#### `20250703000002_create_lodging_programs_table.sql`
- **Estado:** ❌ OBSOLETO 
- **Razón:** Creaba tabla `lodging_programs` con datos de ejemplo
- **Reemplazado por:** Sistema modular `packages_modular` + `Product` (categoría 26)
- **Fecha movido:** 2025-01-02

## 🚨 **IMPORTANTE**

**NO ejecutar** estos archivos en producción. Son solo referencia histórica.

### ✅ **Sistema Actual (USAR):**
- **Tabla:** `packages_modular` (paquetes modulares)
- **Tabla:** `Product` con `categoryid = 26` (programas reales)
- **Funciones:** `src/actions/reservations/real-lodging-programs.ts`

### ❌ **Sistema Obsoleto (NO USAR):**
- **Tabla:** `lodging_programs` (eliminada/vaciada)
- **Funciones:** `src/actions/reservations/lodging-programs.ts` (eliminado)

## 📝 **Historial de Cambios**

### **Problema Original:**
- Sistema tenía dos fuentes de programas de alojamiento
- `lodging_programs`: Datos de ejemplo (Paquete Romántico, Luna de Miel, etc.)
- `packages_modular`: Datos reales (SOLO_ALOJAMIENTO, DESAYUNO, etc.)

### **Solución Aplicada:**
1. ✅ Eliminados datos antiguos de `lodging_programs`
2. ✅ Eliminado archivo `lodging-programs.ts`
3. ✅ Movida migración obsoleta a `_obsolete/`
4. ✅ Sistema usa solo `packages_modular` + `Product`

### **Resultado:**
- ✅ Una sola fuente de verdad
- ✅ Sistema más claro y mantenible
- ✅ Sin confusión en selecciones de programas

## 🔄 **Si Necesitas Restaurar (Emergencia):**

```sql
-- Solo en caso de emergencia absoluta
-- (NO recomendado - el sistema actual es mejor)

-- 1. Restaurar migración (si existe backup)
-- 2. Ejecutar migración
-- 3. Restaurar datos desde lodging_programs_backup
```

**⚠️ NOTA:** El sistema actual es superior. Solo restaurar si hay problema crítico. 