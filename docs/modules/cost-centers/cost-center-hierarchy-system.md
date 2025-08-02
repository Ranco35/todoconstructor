# Sistema de Centros de Costos Jerárquicos

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo de gestión de centros de costos con estructura jerárquica que permite organizar los costos de la empresa de manera eficiente y escalable. El sistema incluye funcionalidades CRUD completas, validaciones de seguridad, y una interfaz de usuario moderna.

## 🏗️ Arquitectura del Sistema

### Modelo de Datos Mejorado

```prisma
model Cost_Center {
  id          Int           @id @default(autoincrement())
  name        String        @unique          // Nombre único del centro
  description String?                        // Descripción opcional
  code        String?       @unique          // Código único opcional
  isActive    Boolean       @default(true)   // Estado activo/inactivo
  parentId    Int?                           // Referencia al centro padre
  createdAt   DateTime      @default(now())  // Auditoría de creación
  updatedAt   DateTime      @updatedAt       // Auditoría de actualización
  
  // Relaciones jerárquicas
  Parent      Cost_Center?  @relation("CostCenterHierarchy", fields: [parentId], references: [id])
  Children    Cost_Center[] @relation("CostCenterHierarchy")
  
  // Relaciones existentes mantenidas
  Inventory   Inventory?
  Permission  Permission[]
  Sale        Sale[]
  Module      Module[]      @relation("ModuleCost_Centers")
  Product     Product[]     @relation("ProductCost_Centers")
  Role        Role[]        @relation("RoleCost_Centers")
  Supplier    Supplier[]    @relation("SupplierCost_Centers")
}
```

### Características Principales

✅ **Estructura Jerárquica** - Centros padre/hijo ilimitados  
✅ **Códigos Únicos** - Sistema de códigos personalizables  
✅ **Estados Activos** - Control de centros activos/inactivos  
✅ **Auditoría Completa** - Timestamps de creación y actualización  
✅ **Validaciones Robustas** - Prevención de ciclos jerárquicos  
✅ **Relaciones Protegidas** - Validación antes de eliminación  

## 🚀 Funcionalidades Implementadas

### 1. Server Actions (`src/actions/configuration/cost-center-actions.ts`)

#### Operaciones CRUD
- `createCostCenter()` - Crear nuevo centro de costo
- `updateCostCenter()` - Actualizar centro existente
- `deleteCostCenterAction()` - Eliminar con validaciones
- `getCostCenters()` - Listar con paginación y jerarquía
- `getCostCenterById()` - Obtener centro específico
- `getCostCentersForParent()` - Obtener opciones para padre
- `getActiveCostCenters()` - Obtener centros activos para selectores

#### Validaciones de Seguridad
- Prevención de ciclos jerárquicos
- Validación de códigos únicos
- Verificación de relaciones antes de eliminar
- Control de estado activo/inactivo

### 2. Componentes de Interfaz

#### Tabla Principal (`src/components/shared/CostCenterTable.tsx`)
- Visualización jerárquica de centros
- Contadores de relaciones (ventas, productos, hijos)
- Estados visuales (activo/inactivo)
- Acciones de edición y eliminación
- Paginación integrada

#### Formulario (`src/components/shared/CostCenterForm.tsx`)
- Campos para nombre, código, descripción
- Selector jerárquico de centro padre
- Control de estado activo (solo en edición)
- Validaciones en tiempo real
- Información de auditoría

#### Selector (`src/components/shared/CostCenterSelector.tsx`)
- Componente reutilizable para formularios
- Carga automática de centros activos
- Visualización de jerarquía en opciones
- Estados de carga y error

### 3. Páginas de Gestión

#### Lista Principal (`src/app/dashboard/configuration/cost-centers/page.tsx`)
- Dashboard con estadísticas
- Tabla con paginación
- Acciones de creación y gestión
- Filtros por estado y jerarquía

#### Creación (`src/app/dashboard/configuration/cost-centers/create/page.tsx`)
- Formulario de creación
- Consejos y ayuda contextual
- Validaciones en tiempo real
- Navegación intuitiva

#### Edición (`src/app/dashboard/configuration/cost-centers/edit/[id]/page.tsx`)
- Formulario de edición
- Información de relaciones
- Alertas de precaución
- Auditoría de cambios

## 🔧 Validaciones y Seguridad

### Prevención de Ciclos Jerárquicos
```typescript
async function checkForHierarchyCycle(childId: number, potentialParentId: number): Promise<boolean> {
  let currentParentId = potentialParentId;
  
  while (currentParentId) {
    if (currentParentId === childId) {
      return true; // Se encontró un ciclo
    }
    
    const parent = await prisma.cost_Center.findUnique({
      where: { id: currentParentId },
      select: { parentId: true }
    });
    
    currentParentId = parent?.parentId || null;
  }
  
  return false; // No se encontró ciclo
}
```

### Validaciones de Eliminación
- Verificación de centros hijos
- Verificación de ventas asociadas
- Verificación de productos asociados
- Verificación de inventario asociado

### Códigos Únicos
- Validación de unicidad en creación
- Validación de unicidad en actualización (excluyendo el registro actual)
- Manejo de errores de base de datos

## 📊 Interfaz de Usuario

### Dashboard de Estadísticas
- Total de centros de costo
- Centros activos vs inactivos
- Centros raíz (sin padre)
- Centros con hijos

### Tabla con Información Jerárquica
- Visualización de centro padre
- Contador de centros hijos
- Contadores de relaciones (ventas, productos)
- Estados visuales con badges

### Formularios Intuitivos
- Campos organizados lógicamente
- Ayuda contextual
- Validaciones en tiempo real
- Navegación clara

## 🔗 Integración con el Sistema

### Menú de Navegación
- Agregado a "Configuración" → "Centros de Costo"
- Ícono distintivo (🏢)
- Navegación jerárquica mantenida

### Relaciones con Otros Módulos
- **Ventas:** Asociación de ventas a centros de costo
- **Productos:** Asignación de productos a centros
- **Inventario:** Control de inventario por centro
- **Permisos:** Gestión de permisos por centro
- **Roles:** Asignación de roles a centros

## 🎯 Casos de Uso

### 1. Creación de Estructura Organizacional
```
Administración (ADM-001)
├── Recursos Humanos (ADM-RH-001)
├── Contabilidad (ADM-CONT-001)
└── IT (ADM-IT-001)
    ├── Desarrollo (ADM-IT-DEV-001)
    └── Soporte (ADM-IT-SOP-001)
```

### 2. Gestión de Costos por Departamento
- Asignación de productos a centros específicos
- Control de ventas por centro de costo
- Reportes de rentabilidad por centro

### 3. Control de Permisos
- Asignación de roles a centros específicos
- Control granular de acceso por área

## 🚀 Beneficios Implementados

### Para Administradores
- ✅ Organización clara de costos
- ✅ Control granular de permisos
- ✅ Auditoría completa de cambios
- ✅ Prevención de errores jerárquicos

### Para Usuarios
- ✅ Interfaz intuitiva y moderna
- ✅ Navegación clara y lógica
- ✅ Validaciones preventivas
- ✅ Información contextual

### Para el Sistema
- ✅ Escalabilidad jerárquica
- ✅ Integridad de datos
- ✅ Rendimiento optimizado
- ✅ Mantenibilidad mejorada

## 📈 Métricas y Monitoreo

### Estadísticas Disponibles
- Total de centros de costo
- Distribución por estado (activo/inactivo)
- Profundidad de jerarquía
- Relaciones con otros módulos

### Auditoría
- Fechas de creación y actualización
- Historial de cambios
- Control de acceso por usuario

## 🔮 Próximas Mejoras Sugeridas

### Funcionalidades Futuras
- [ ] Reportes de rentabilidad por centro
- [ ] Transferencia masiva de productos entre centros
- [ ] Importación/exportación de estructura jerárquica
- [ ] Dashboard de métricas avanzadas
- [ ] Notificaciones de cambios críticos

### Optimizaciones Técnicas
- [ ] Caché de consultas jerárquicas
- [ ] Paginación virtual para grandes volúmenes
- [ ] Búsqueda avanzada con filtros
- [ ] API REST para integraciones externas

## 📝 Conclusión

El sistema de centros de costos jerárquicos ha sido implementado exitosamente siguiendo las mejores prácticas de desarrollo y los patrones establecidos en el proyecto. La solución proporciona una base sólida para la gestión organizacional de costos con capacidad de crecimiento y adaptación a futuras necesidades del negocio.

### Archivos Creados/Modificados
- ✅ `prisma/schema.prisma` - Modelo actualizado
- ✅ `src/actions/configuration/cost-center-actions.ts` - Server actions
- ✅ `src/components/shared/CostCenterTable.tsx` - Tabla principal
- ✅ `src/components/shared/CostCenterForm.tsx` - Formularios
- ✅ `src/components/shared/CostCenterSelector.tsx` - Selector reutilizable
- ✅ `src/app/dashboard/configuration/cost-centers/` - Páginas de gestión
- ✅ `src/constants/index.ts` - Menú actualizado
- ✅ `src/components/shared/UniversalHorizontalMenu.tsx` - Íconos actualizados

---

**Estado:** ✅ **COMPLETADO**  
**Fecha:** 2024-12-20  
**Versión:** 1.0.0 