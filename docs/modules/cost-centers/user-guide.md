# Guía de Usuario - Centros de Costos

## 🚀 Inicio Rápido

### Acceso al Sistema
1. Navega a **Configuración** → **Centros de Costo**
2. Verás el dashboard principal con estadísticas
3. Usa el botón **"Nuevo Centro de Costo"** para crear el primero

## 📋 Crear un Centro de Costo

### Paso 1: Información Básica
- **Nombre** (requerido): Usa nombres descriptivos como "Administración", "Ventas", "Marketing"
- **Código** (opcional): Código único como "ADM-001", "VEN-001"
- **Descripción**: Explica el propósito del centro

### Paso 2: Jerarquía (Opcional)
- **Centro Padre**: Selecciona un centro existente como padre
- Si no seleccionas padre, será un **Centro Raíz**

### Paso 3: Guardar
- Haz clic en **"Crear Centro de Costo"**
- El sistema validará y guardará automáticamente

## 🏗️ Crear Estructura Jerárquica

### Ejemplo de Estructura Organizacional
```
Administración (ADM-001)
├── Recursos Humanos (ADM-RH-001)
├── Contabilidad (ADM-CONT-001)
└── IT (ADM-IT-001)
    ├── Desarrollo (ADM-IT-DEV-001)
    └── Soporte (ADM-IT-SOP-001)
```

### Pasos para Crear Jerarquía
1. **Crear centros raíz** primero (sin padre)
2. **Crear centros hijos** seleccionando el padre apropiado
3. **Usar códigos** para identificar la jerarquía fácilmente

## 📊 Entender la Tabla Principal

### Columnas de Información
- **ID**: Número único del centro
- **Código**: Código personalizado (si existe)
- **Nombre**: Nombre del centro de costo
- **Centro Padre**: Centro padre en la jerarquía
- **Hijos**: Número de centros hijos
- **Ventas**: Número de ventas asociadas
- **Productos**: Número de productos asociados
- **Estado**: Activo o Inactivo

### Badges y Estados
- 🟢 **Centro Raíz**: Centros sin padre
- 🔵 **Código**: Muestra el código único
- 🟣 **Hijos**: Contador de centros hijos
- 🟢 **Ventas**: Contador de ventas
- 🔵 **Productos**: Contador de productos
- 🟢 **Activo** / 🔴 **Inactivo**: Estado del centro

## ✏️ Editar un Centro de Costo

### Acceso a Edición
1. En la tabla, haz clic en **"Editar"**
2. Se abrirá el formulario de edición

### Campos Editables
- **Nombre**: Puedes cambiar el nombre
- **Código**: Puedes agregar o modificar el código
- **Descripción**: Editar la descripción
- **Centro Padre**: Cambiar la jerarquía
- **Estado**: Activar/desactivar el centro

### Información de Relaciones
La página de edición muestra:
- **Relaciones**: Ventas, productos, permisos asociados
- **Jerarquía**: Centro padre y centros hijos
- **Auditoría**: Fechas de creación y actualización

### Alertas de Precaución
Si el centro tiene relaciones, verás alertas:
- ⚠️ Centros hijos asociados
- ⚠️ Ventas asociadas
- ⚠️ Productos asociados

## 🗑️ Eliminar un Centro de Costo

### Validaciones de Eliminación
El sistema **NO permitirá eliminar** si:
- Tiene centros hijos
- Tiene ventas asociadas
- Tiene productos asociados
- Tiene inventario asociado

### Proceso de Eliminación
1. Haz clic en **"Eliminar"** en la tabla
2. Confirma la eliminación
3. Si hay relaciones, el sistema te informará

## 🔍 Navegación y Filtros

### Paginación
- **10 centros por página** por defecto
- Navega entre páginas con los controles
- Información de total de centros mostrada

### Estadísticas del Dashboard
- **Total Centros**: Número total de centros
- **Centros Activos**: Centros en uso
- **Centros Raíz**: Centros sin padre
- **Con Hijos**: Centros que tienen centros hijos

## 🎯 Casos de Uso Comunes

### Caso 1: Nueva Empresa
1. Crear centros raíz principales (Administración, Ventas, etc.)
2. Crear sub-centros según la estructura organizacional
3. Asignar códigos para identificación rápida

### Caso 2: Reorganización
1. Editar centros existentes para cambiar jerarquía
2. El sistema previene ciclos automáticamente
3. Verificar que las relaciones se mantengan

### Caso 3: Desactivar Centro
1. En lugar de eliminar, desactiva el centro
2. Los centros inactivos no aparecen en selectores
3. Puedes reactivarlo cuando sea necesario

## ⚠️ Validaciones y Errores

### Errores Comunes
- **"Ya existe un centro con ese nombre"**: Usa un nombre único
- **"Ya existe un centro con ese código"**: Usa un código único
- **"No se puede eliminar"**: El centro tiene relaciones activas

### Prevención de Ciclos
- El sistema **automáticamente previene** ciclos jerárquicos
- No puedes hacer que un hijo sea padre de su ancestro
- Mensaje: "Esta asignación crearía un ciclo jerárquico"

## 🔧 Consejos y Mejores Prácticas

### Nomenclatura
- **Nombres descriptivos**: "Administración" en lugar de "Admin"
- **Códigos consistentes**: "ADM-001", "VEN-001", "MKT-001"
- **Descripciones claras**: Explica el propósito del centro

### Jerarquía
- **Planifica la estructura** antes de crear
- **Usa códigos** para identificar niveles
- **Mantén la jerarquía simple** al inicio

### Mantenimiento
- **Revisa regularmente** los centros inactivos
- **Actualiza descripciones** cuando cambien los procesos
- **Usa el estado inactivo** en lugar de eliminar

## 📞 Soporte

### Si Encuentras Problemas
1. Verifica que los nombres y códigos sean únicos
2. Asegúrate de que no haya ciclos en la jerarquía
3. Revisa que no haya relaciones activas antes de eliminar

### Información Útil
- **Fecha de creación**: Se muestra en la edición
- **Última actualización**: Se actualiza automáticamente
- **Relaciones**: Se muestran en la página de edición

---

**¿Necesitas ayuda adicional?**  
Consulta la documentación técnica completa o contacta al equipo de desarrollo. 