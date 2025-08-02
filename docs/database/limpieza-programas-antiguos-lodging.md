# Limpieza de Programas Antiguos - lodging_programs

## 🚨 Problema Identificado

El sistema tenía **dos fuentes de programas de alojamiento**:

### ❌ **Datos Antiguos (ELIMINAR)**
**Tabla:** `lodging_programs`
- "Paquete Romántico" ($250,000)
- "Programa Luna de Miel" ($450,000)  
- "Programa Ejecutivo" ($180,000)
- "Programa Familiar" ($380,000)

**❌ Problemas:**
- Datos de ejemplo/prueba
- No se usan en producción
- Causan confusión en selecciones

### ✅ **Datos Reales (CORRECTOS)**
**Tabla:** `packages_modular`
- "SOLO_ALOJAMIENTO" (Solo la habitación + servicios básicos)
- "DESAYUNO" (Habitación + desayuno + piscina termal + WiFi)
- "TODO_INCLUIDO" (Todo incluido + entretenimiento premium)
- "PKG-MEDIA-PENSIÓM-175181874581" (Media Pensión)

**✅ Ventajas:**
- Datos reales de producción
- Sistema modular completo
- Precios dinámicos por persona/edad
- Productos adicionales configurables

## 🧹 Proceso de Limpieza

### 1. **Script de Limpieza Segura**
Archivo: `scripts/clean-old-lodging-programs.sql`

**Características:**
- ✅ Backup automático antes de eliminar
- ✅ Verificaciones de dependencias
- ✅ Eliminación selectiva (solo datos de ejemplo)
- ✅ Validación de integridad del sistema

### 2. **Ejecución en Supabase**
```sql
-- El script debe ejecutarse en Supabase SQL Editor
-- NO desde terminal (es un archivo SQL)

-- 1. Ir a Supabase Dashboard
-- 2. SQL Editor
-- 3. Pegar el contenido del script
-- 4. Ejecutar
```

### 3. **Verificaciones Incluidas**
- **Dependencias activas**: Verifica si hay reservas usando lodging_programs
- **Integridad del sistema**: Confirma que packages_modular funciona
- **Backup de seguridad**: Crea tabla `lodging_programs_backup`
- **Estado final**: Muestra programas reales disponibles

## 🔍 Estado del Código

### ✅ **Sistema Actualizado Correctamente**
**Búsqueda realizada:** No se encontraron referencias activas a `lodging-programs` en el código.

**Esto confirma que:**
- El sistema ya migró a `packages_modular`
- No hay componentes usando datos antiguos
- La limpieza es segura

### 📁 **Archivos del Sistema Modular**
```
src/actions/products/modular-products.ts     ✅ Usa packages_modular
src/components/reservations/ModularReservationForm.tsx  ✅ Usa packages_modular  
scripts/apply-modular-reservations-table.sql  ✅ Referencias correctas
supabase/migrations/*.sql                     ✅ Sistema modular completo
```

## 📊 Después de la Limpieza

### **Tabla `packages_modular` (MANTENER)**
```sql
-- Programas reales disponibles:
SELECT id, code, name, description, is_active 
FROM packages_modular 
WHERE is_active = true 
ORDER BY sort_order;
```

**Resultado esperado:**
- `SOLO_ALOJAMIENTO` ✅
- `DESAYUNO` ✅  
- `TODO_INCLUIDO` ✅
- `PKG-MEDIA-PENSIÓM-*` ✅

### **Tabla `lodging_programs` (ELIMINADA)**
```sql
-- Después de la limpieza debe estar vacía o eliminada:
SELECT COUNT(*) FROM lodging_programs; -- 0 registros
```

## 🚀 Beneficios de la Limpieza

### **1. Claridad del Sistema**
- ❌ ANTES: 2 fuentes de programas (confuso)
- ✅ DESPUÉS: 1 fuente real (packages_modular)

### **2. Rendimiento Mejorado**
- Menos consultas a tablas innecesarias
- Menor complejidad en el código
- Datos más precisos

### **3. Mantenimiento Simplificado**
- Una sola fuente de verdad
- Easier debugging y desarrollo
- Consistency en toda la aplicación

## 🔧 Troubleshooting

### **Si hay errores al ejecutar el script:**

1. **Error de permisos:**
   ```sql
   -- Verificar permisos de usuario
   SELECT current_user, session_user;
   ```

2. **Error de dependencias:**
   ```sql
   -- Verificar foreign keys
   SELECT * FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY' 
   AND constraint_name LIKE '%lodging_programs%';
   ```

3. **Error de backup:**
   ```sql
   -- Crear backup manual si falla automático
   CREATE TABLE lodging_programs_backup AS 
   SELECT * FROM lodging_programs;
   ```

## ✅ Checklist Post-Limpieza

- [ ] **Script ejecutado exitosamente**
- [ ] **Backup creado** (`lodging_programs_backup`)
- [ ] **Datos antiguos eliminados** (5 programas de ejemplo)
- [ ] **packages_modular funcionando** (4+ paquetes activos)
- [ ] **Sistema de reservas operativo**
- [ ] **No errores en aplicación**

## 📝 Notas Importantes

1. **Backup Disponible:** Los datos eliminados están en `lodging_programs_backup` por seguridad

2. **Rollback si es necesario:**
   ```sql
   -- Solo en caso de emergencia
   INSERT INTO lodging_programs 
   SELECT * FROM lodging_programs_backup;
   ```

3. **Monitoreo post-limpieza:** Verificar que las reservas sigan funcionando normalmente

## 🎯 Conclusión

La limpieza elimina **datos obsoletos de ejemplo** y mantiene **solo los programas reales** en `packages_modular`. Esto mejora la claridad, rendimiento y mantenibilidad del sistema de reservas.

**Estado Final:**
- ❌ `lodging_programs`: Eliminados datos antiguos
- ✅ `packages_modular`: Programas reales activos
- ✅ Sistema funcionando con datos correctos 