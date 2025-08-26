# Integración del Dashboard con Inventario

## 📋 Descripción
Este documento describe cómo integrar la página de inventario con el dashboard principal.

## 🔄 Pasos de Integración

### 1. Actualizar Menú de Navegación
```typescript
// src/constants/index.ts
export const menus: Record<SidebarProps['role'], MenuItem[]> = {
    admin: [
        // ... otros menús
        {
            label: 'Inventario',
            href: '/configuration/inventory',
            items: [
                { label: 'Gestión de Inventario', href: '/configuration/inventory' },
                { label: 'Bodegas', href: '/configuration/warehouses' },
                { label: 'Ajustes', href: '/configuration/inventory/adjustments' },
            ],
        },
        // ... otros menús
    ],
};
```

### 2. Actualizar Dashboard Principal
```typescript
// src/app/page.tsx
export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      {/* ... otros elementos ... */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ... otros elementos ... */}
        
        <Link
          href="/dashboard/configuration/inventory"
          className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <span className="text-xl mr-3">📦</span>
          <div>
            <p className="font-medium text-gray-900">Gestión de Inventario</p>
            <p className="text-sm text-gray-600">Control de stock y bodegas</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

### 3. Actualizar Página de Configuración
```typescript
// src/app/(dashboard)/configuration/page.tsx
export default function ConfigurationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... otros elementos ... */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ... otros elementos ... */}
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📦</span>
            <h3 className="text-lg font-semibold text-gray-900">Inventario</h3>
          </div>
          <p className="text-gray-600 mb-4">Control de stock y productos</p>
          <a 
            href="/dashboard/configuration/inventory" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Ir a Inventario →
          </a>
        </div>
      </div>
    </div>
  );
}
```

## 🎯 Funcionalidades a Implementar

### 1. Acciones Rápidas
- Ajuste de inventario
- Movimiento de productos
- Agregar productos
- Importar inventario

### 2. Vista de Tabla
- Listado de productos
- Filtros por bodega
- Filtros por categoría
- Búsqueda por nombre/código

### 3. Estadísticas
- Total de productos
- Productos con stock bajo
- Productos próximos a vencer
- Valor total del inventario

## 📝 Notas Importantes

1. **Rutas**:
   - La ruta principal es `/dashboard/configuration/inventory`
   - Las subrutas deben seguir el patrón `/dashboard/configuration/inventory/[action]`

2. **Permisos**:
   - Verificar permisos de usuario
   - Implementar validaciones de acceso
   - Registrar acciones en log

3. **Validaciones**:
   - Validar stock antes de movimientos
   - Validar permisos de bodega
   - Validar formato de importación

## 🔗 Enlaces Relacionados
- [Documentación de Inventario](./inventory.md)
- [Guía de Permisos](../security/permissions.md)
- [Procedimientos de Importación](./import-procedures.md)

## 📅 Última Actualización
- Fecha: Diciembre 2024
- Versión: 1.0.0 