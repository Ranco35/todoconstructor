# 🚀 INSTRUCCIONES PARA CONFIGURAR SISTEMA DE RESERVAS

## 📋 Orden de Ejecución

Ejecuta los siguientes scripts en el **Supabase SQL Editor** en este orden exacto:

### 1️⃣ **Crear Categoría Sistema Reservas**
```sql
-- Ejecutar: scripts/create-system-reservations-category.sql
```
**Resultado esperado:** Se crea la categoría "Sistema Reservas" en la tabla Category.

### 2️⃣ **Limpiar Duplicados y Asignar Categoría**
```sql
-- Ejecutar: scripts/clean-modular-duplicates-and-assign-category.sql
```
**Resultado esperado:** 
- Se eliminan productos modulares duplicados
- Se asignan productos reales de habitaciones a la categoría "Sistema Reservas"

### 3️⃣ **Verificación Final**
```sql
-- Ejecutar: scripts/verify-system-reservations-setup.sql
```
**Resultado esperado:** Todas las verificaciones muestran ✅ (éxito)

## 🔍 Verificaciones Esperadas

### ✅ Después del paso 1:
- Categoría "Sistema Reservas" existe en la tabla Category
- ID de categoría disponible para usar

### ✅ Después del paso 2:
- Productos modulares duplicados eliminados
- Productos reales de habitaciones con categoría correcta
- Solo un producto modular por habitación

### ✅ Después del paso 3:
- Todas las verificaciones muestran ✅
- Sistema 100% operativo

## 🚨 Si hay Errores

### Error "relation categories does not exist"
- **Solución:** Usar `"Category"` (con mayúscula y comillas) en lugar de `categories`

### Error "column is_active does not exist"
- **Solución:** La tabla Category no tiene esa columna, usar solo las columnas existentes

### Error "Sistema Reservas no existe"
- **Solución:** Ejecutar primero el script de creación de categoría

## 📊 Estado Final Esperado

```
✅ CATEGORÍA SISTEMA RESERVAS: 1 registro
✅ PRODUCTOS REALES HABITACIONES: 12 productos con categoría correcta
✅ PRODUCTOS MODULARES HABITACIONES: 12 productos únicos
✅ SINCRONIZACIÓN DE PRECIOS: Todos sincronizados
✅ VERIFICACIÓN DUPLICADOS: Todos únicos
📊 RESUMEN FINAL: Sistema 100% operativo
🔧 ESTADO DEL SISTEMA: Todos los componentes funcionando
```

## 🎯 Beneficios Logrados

1. **Categoría Protegida:** "Sistema Reservas" no se puede eliminar desde gestión de productos
2. **Sin Duplicados:** Solo un producto modular por habitación
3. **Sincronización Automática:** Precios se actualizan automáticamente
4. **Organización Clara:** Productos de habitaciones separados del resto
5. **Sistema Robusto:** Validaciones y verificaciones completas

## 🔄 Después de la Configuración

- Los productos de habitaciones aparecerán en la categoría "Sistema Reservas"
- La sincronización de precios funcionará automáticamente
- El sistema de reservas usará los precios correctos
- No habrá duplicados ni conflictos

---

**⚠️ IMPORTANTE:** Ejecutar los scripts en el orden indicado. No saltar pasos. 