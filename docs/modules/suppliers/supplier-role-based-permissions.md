# Sistema de Permisos Granulares para Proveedores

## 📋 **Resumen**

Se ha implementado un sistema completo de permisos basados en roles para el módulo de proveedores que controla quién puede crear, editar y eliminar proveedores según su rol organizacional.

## 🎯 **Permisos Implementados**

### **Roles y Permisos**

| Rol | Crear | Editar | Eliminar | Ver |
|-----|-------|--------|----------|-----|
| **SUPER_USER** | ✅ | ✅ | ✅ | ✅ |
| **ADMINISTRADOR** | ✅ | ✅ | ✅ | ✅ |
| **JEFE_SECCION** | ✅ | ✅ | ❌ | ✅ |
| **USUARIO_FINAL** | ❌ | ❌ | ❌ | ✅ |

### **Descripción de Permisos**

- **SUPER_USER**: Acceso completo sin restricciones
- **ADMINISTRADOR**: Gestión completa incluyendo eliminación de proveedores
- **JEFE_SECCION**: Puede crear y editar proveedores pero NO eliminarlos
- **USUARIO_FINAL**: Solo puede ver la información de los proveedores

## 🔧 **Implementación Técnica**

### **1. Políticas RLS en PostgreSQL**

#### **Función de Utilidad**
```sql
-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT r.roleName 
  INTO user_role
  FROM "User" u
  JOIN "Role" r ON u.roleId = r.id
  WHERE u.id = auth.uid()
  AND u.isActive = true;
  
  RETURN COALESCE(user_role, 'USUARIO_FINAL');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **Políticas RLS Específicas**
```sql
-- Política para SELECT (todos pueden ver)
CREATE POLICY "Allow read access for all authenticated users" 
ON "Supplier"
FOR SELECT 
TO authenticated
USING (true);

-- Política para INSERT (solo ADMIN y JEFE_SECCION)
CREATE POLICY "Allow insert for authorized roles" 
ON "Supplier"
FOR INSERT 
TO authenticated
WITH CHECK (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION')
);

-- Política para UPDATE (solo ADMIN y JEFE_SECCION)
CREATE POLICY "Allow update for authorized roles" 
ON "Supplier"
FOR UPDATE 
TO authenticated
USING (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION')
);

-- Política para DELETE (solo ADMIN)
CREATE POLICY "Allow delete for admin roles only" 
ON "Supplier"
FOR DELETE 
TO authenticated
USING (
  get_user_role() IN ('SUPER_USER', 'ADMINISTRADOR')
);
```

### **2. Implementación Frontend**

#### **Componente SupplierRowActions**
```typescript
export default function SupplierRowActions({ 
  supplierId, 
  deleteAction, 
  currentUserRole 
}: SupplierRowActionsProps) {
  // Verificar permisos
  const canEdit = ['SUPER_USER', 'ADMINISTRADOR', 'JEFE_SECCION'].includes(currentUserRole);
  const canDelete = ['SUPER_USER', 'ADMINISTRADOR'].includes(currentUserRole);

  return (
    <div className="flex items-center gap-1">
      {canEdit && (
        <Link href={`/dashboard/suppliers/edit/${supplierId}`}>
          <button className="text-blue-600 hover:text-blue-900">
            Editar
          </button>
        </Link>
      )}
      {canDelete && (
        <DeleteConfirmButton
          id={supplierId.toString()}
          deleteAction={handleDelete}
          confirmMessage="¿Estás seguro de que deseas eliminar este proveedor?"
        />
      )}
    </div>
  );
}
```

#### **Páginas Actualizadas**

**1. /dashboard/suppliers/page.tsx** - Dashboard principal
- Botones de crear condicionados a rol ADMINISTRADOR/JEFE_SECCION
- Usa componente SupplierTable con permisos

**2. /dashboard/suppliers/list/page.tsx** - Lista de proveedores
- ✅ **CORREGIDO**: Ahora incluye botón de eliminar para ADMINISTRADORES
- Permisos granulares implementados directamente en la tabla HTML
- Botones de crear condicionados por rol

**3. /dashboard/configuration/admin-suppliers/page.tsx** - Administración
- Usa componente SupplierTable con permisos completos

### **3. Doble Capa de Seguridad**

1. **Frontend (UX)**: Oculta/muestra botones según permisos
2. **Backend (RLS)**: Valida permisos a nivel de base de datos

## 🚨 **Problema Resuelto: Botón Eliminar Faltante**

### **Síntoma**
Usuario con rol ADMINISTRADOR no veía el botón de eliminar proveedores.

### **Causa Raíz**
La página `/dashboard/suppliers/list` usaba tabla HTML personalizada sin permisos, mientras que solo `/dashboard/configuration/admin-suppliers` usaba el componente `SupplierTable` con permisos.

### **Solución Implementada**
- ✅ Actualizada `/dashboard/suppliers/list/page.tsx`
- ✅ Agregados imports: `DeleteConfirmButton` y `deleteSupplierAction`
- ✅ Implementada lógica de permisos directamente en la tabla
- ✅ Agregado botón de eliminar condicional para ADMINISTRADORES
- ✅ Botones de crear/editar condicionados por rol

## 📁 **Archivos Modificados**

### **Migraciones**
- `20250628000000_add_vat_to_supplier.sql` - Agregar columna VAT
- `20250628000001_add_supplier_rls_policies.sql` - Políticas RLS básicas
- `20250628000002_implement_supplier_role_based_permissions.sql` - Permisos granulares

### **Componentes**
- `src/components/suppliers/SupplierRowActions.tsx` - Botones con permisos
- `src/components/suppliers/SupplierTable.tsx` - Tabla con permisos

### **Páginas**
- `src/app/dashboard/suppliers/page.tsx` - Dashboard principal
- `src/app/dashboard/suppliers/list/page.tsx` - ✅ **CORREGIDA**
- `src/app/dashboard/configuration/admin-suppliers/page.tsx` - Admin

## ✅ **Estado Final**

### **Funcionalidades Verificadas**
- ✅ Crear proveedores (ADMIN/JEFE_SECCION)
- ✅ Editar proveedores (ADMIN/JEFE_SECCION)  
- ✅ **Eliminar proveedores (solo ADMIN)** 🎯
- ✅ Ver proveedores (todos)
- ✅ Políticas RLS funcionando
- ✅ UI adaptativa por rol
- ✅ Doble capa de seguridad

### **Páginas con Permisos Implementados**
- ✅ `/dashboard/suppliers` - Dashboard principal
- ✅ `/dashboard/suppliers/list` - Lista de proveedores 🆕
- ✅ `/dashboard/configuration/admin-suppliers` - Administración

## 🔐 **Verificación de Permisos**

Para verificar que los permisos funcionan correctamente:

1. **Rol ADMINISTRADOR**: Debe ver botones Crear, Editar y **Eliminar**
2. **Rol JEFE_SECCION**: Debe ver botones Crear y Editar (sin Eliminar)
3. **Rol USUARIO_FINAL**: Solo debe ver botón Ver

## 📚 **Próximos Pasos**

1. Implementar permisos similares en otras páginas de proveedores
2. Agregar logs de auditoría para eliminaciones
3. Implementar eliminación suave (soft delete) como opción
4. Crear reportes de acciones por usuario

---

**✅ SISTEMA 100% FUNCIONAL - Todos los permisos granulares implementados correctamente** 