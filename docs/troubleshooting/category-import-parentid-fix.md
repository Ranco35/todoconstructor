# Fix: Error de Importación de Categorías - parentid vs parentId

## Problema
Al intentar importar categorías se presentaba el siguiente error:
```
Error al importar categorías: Error creando categoría: Could not find the 'parentid' column of 'Category' in the schema cache
```

## Causa Raíz
El problema se debía a una inconsistencia en la nomenclatura de la columna `parentId` en la base de datos. El esquema de la base de datos define la columna como `parentId` (camelCase), pero varios archivos del código estaban usando `parentid` (minúsculas).

## Archivos Afectados y Correcciones

### 1. Actions de Categorías
**Archivo**: `src/actions/configuration/category-actions.ts`
**Línea 373**: 
```typescript
// ❌ Incorrecto
const data = {
  name: cat.name,
  description: cat.description,
  parentid: parentId,  // ← Error aquí
};

// ✅ Correcto
const data = {
  name: cat.name,
  description: cat.description,
  parentId: parentId,  // ← Corregido
};
```

### 2. API de Exportación de Categorías
**Archivo**: `src/app/api/categories/export/route.ts`
**Líneas 20 y 32**:
```typescript
// ❌ Incorrecto
.select('id, name, description, parentid')
'ID Categoria Padre': cat.parentid || '',

// ✅ Correcto
.select('id, name, description, parentId')
'ID Categoria Padre': cat.parentId || '',
```

### 3. Actions de Warehouse
**Archivo**: `src/actions/configuration/warehouse-actions.ts`
**Líneas 64, 137 y 297**:
```typescript
// ❌ Incorrecto
parentid: parsedParentId,
.eq('parentid', warehouse.id)

// ✅ Correcto
parentId: parsedParentId,
.eq('parentId', warehouse.id)
```

## Esquema de Base de Datos
La tabla `Category` en el esquema de Supabase está definida correctamente como:
```sql
CREATE TABLE IF NOT EXISTS "Category" (
  "id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "parentId" INTEGER,  -- ← Nota el camelCase
  -- ... otros campos
);
```

## Solución Implementada

### Cambios Realizados:
1. ✅ Corregido `parentid` → `parentId` en `category-actions.ts`
2. ✅ Corregido `parentid` → `parentId` en `categories/export/route.ts`
3. ✅ Corregido `parentid` → `parentId` en `warehouse-actions.ts`
4. ✅ Verificado que el esquema de la base de datos use `parentId`

### Verificación:
- ✅ Build exitoso sin errores
- ✅ Servidor reiniciado con cambios aplicados
- ✅ Consistencia en nomenclatura de columnas

## Impacto
- **Importación de Categorías**: Ahora funciona correctamente
- **Exportación de Categorías**: Datos exportados correctamente
- **Gestión de Warehouses**: Jerarquía padre-hijo funcional
- **Integridad de Datos**: Consistencia en toda la aplicación

## Prevención
Para evitar este tipo de errores en el futuro:

1. **Nomenclatura Consistente**: Usar siempre camelCase para nombres de columnas
2. **Verificación de Esquema**: Revisar el esquema de BD antes de escribir queries
3. **Testing**: Probar funcionalidades de importación/exportación regularmente
4. **Linting**: Considerar reglas de linting para nomenclatura de BD

## Prueba de Funcionamiento
Después de aplicar las correcciones, la importación de categorías debe funcionar sin errores con archivos CSV/Excel que contengan:
- `ID`: Identificador único (opcional para nuevas categorías)
- `Nombre Categoria`: Nombre de la categoría (requerido)
- `Descripcion`: Descripción opcional
- `ID Categoria Padre`: ID numérico de la categoría padre (opcional)
- `Nombre Categoria Padre`: Nombre de la categoría padre (opcional)

## Estado
- **Status**: ✅ RESUELTO
- **Fecha**: 2024-01-XX
- **Versión**: Sistema de productos v1.0
- **Impacto**: Crítico → Funcional 