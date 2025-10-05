# Guía para Administradores: Cambio de SKUs

## 🎯 ¿Cómo Cambiar un SKU como Administrador?

Como administrador, tienes acceso a una herramienta especial para cambiar SKUs cuando sea necesario. Aquí te explico cómo usarla:

## 📍 **Acceso a la Herramienta**

### Opción 1: Desde el Menú Principal
1. Ve al **Dashboard** (`/dashboard`)
2. En el menú lateral, busca la sección **"🔒 Administración"**
3. Haz clic en **"🔧 Gestión de SKUs"**
4. Te llevará a: `/dashboard/admin/sku-management`

### Opción 2: Acceso Directo
- URL directa: `http://localhost:3002/dashboard/admin/sku-management`

## 🔧 **Proceso Paso a Paso**

### **Paso 1: Buscar el Producto**
1. En el campo **"Buscar producto por ID"**, ingresa el ID del producto
2. Haz clic en **"Buscar"**
3. El sistema mostrará:
   - ID del producto
   - Nombre del producto
   - SKU actual

### **Paso 2: Ingresar Nuevo SKU**
1. En el campo **"Nuevo SKU"**, escribe el SKU que quieres asignar
2. **⚠️ Importante**: Asegúrate de que el nuevo SKU sea único
3. El sistema validará automáticamente la unicidad

### **Paso 3: Código de Confirmación**
1. En el campo **"Código de confirmación"**, ingresa: `ADMIN-SKU-CHANGE`
2. Este código confirma que eres un administrador autorizado

### **Paso 4: Ejecutar el Cambio**
1. Haz clic en el botón rojo **"Cambiar SKU (PELIGROSO)"**
2. El sistema ejecutará el cambio
3. Recibirás una confirmación de éxito o error

## ⚠️ **Advertencias Importantes**

### **Antes de Cambiar un SKU:**
- ✅ **Verificar que no se use en importaciones activas**
- ✅ **Notificar al equipo de desarrollo**
- ✅ **Documentar la razón del cambio**
- ✅ **Verificar que el nuevo SKU no exista**

### **Riesgos del Cambio:**
- ❌ **Errores en importaciones** si el SKU se usa en Excel
- ❌ **Problemas de integración** con sistemas externos
- ❌ **Pérdida de trazabilidad** si no se documenta
- ❌ **Inconsistencia de datos** en reportes

## 🎯 **Casos de Uso Válidos**

### ✅ **Cuándo SÍ cambiar un SKU:**
- **Corregir SKUs incorrectos** creados por error
- **Unificar SKUs duplicados** del mismo producto
- **Cambios requeridos** por estándares de negocio
- **Migración de sistemas** legacy
- **Corrección de formato** (ej: espacios, caracteres especiales)

### ❌ **Cuándo NO cambiar un SKU:**
- **Cambios cosméticos** sin justificación
- **SKUs que se usan** en importaciones activas
- **Sin documentar** la razón del cambio
- **Sin notificar** al equipo

## 🔍 **Cómo Encontrar el ID del Producto**

### Método 1: Lista de Productos
1. Ve a **Productos** → **Lista de Productos**
2. Busca el producto que quieres modificar
3. El ID aparece en la primera columna

### Método 2: Edición de Producto
1. Ve a **Productos** → **Lista de Productos**
2. Haz clic en **"Editar"** del producto
3. El ID aparece en la URL: `/dashboard/configuration/products/edit/[ID]`

### Método 3: Búsqueda por SKU Actual
1. Ve a **Productos** → **Lista de Productos**
2. Usa el buscador para encontrar por SKU
3. El ID aparece en los resultados

## 📋 **Ejemplo Práctico**

### **Escenario**: Cambiar SKU de producto con espacios
- **Producto**: "Tornillo M8 x 20"
- **SKU actual**: "TOR M8 20" (con espacios)
- **SKU nuevo**: "TOR-M8-20" (con guiones)
- **ID del producto**: 123

### **Proceso**:
1. **Buscar**: ID `123`
2. **Nuevo SKU**: `TOR-M8-20`
3. **Código**: `ADMIN-SKU-CHANGE`
4. **Ejecutar**: Botón rojo
5. **Resultado**: ✅ SKU cambiado exitosamente

## 🛡️ **Seguridad y Auditoría**

### **Log de Cambios**
- Todos los cambios quedan registrados en los logs del servidor
- Se incluye: usuario, fecha, SKU anterior, SKU nuevo, ID del producto

### **Validaciones Automáticas**
- ✅ **Unicidad**: El nuevo SKU debe ser único
- ✅ **Existencia**: El producto debe existir
- ✅ **Autorización**: Solo administradores pueden acceder
- ✅ **Confirmación**: Código de confirmación requerido

## 🚨 **Resolución de Problemas**

### **Error: "Producto no encontrado"**
- ✅ Verificar que el ID sea correcto
- ✅ Confirmar que el producto existe en la base de datos

### **Error: "SKU ya existe"**
- ✅ Verificar que el nuevo SKU sea único
- ✅ Buscar productos con SKU similar
- ✅ Usar un SKU diferente

### **Error: "Código de confirmación inválido"**
- ✅ Ingresar exactamente: `ADMIN-SKU-CHANGE`
- ✅ Verificar que no haya espacios adicionales

## 📞 **Soporte**

### **Si necesitas ayuda:**
- 📧 **Contacta al equipo de desarrollo**
- 📝 **Documenta el problema** con capturas de pantalla
- 🔍 **Incluye el ID del producto** y el error exacto

### **Para cambios masivos:**
- 📋 **Contacta al equipo** antes de hacer cambios masivos
- 📊 **Planifica la migración** de datos
- 🔄 **Coordina con otros sistemas** que puedan usar los SKUs

---

**Fecha de creación**: 27 de Enero, 2025  
**Para**: Administradores del sistema  
**Estado**: ✅ Disponible y funcional
