# Corrección Error de Importación SupplierTable

## Problema Detectado

Error en la página de importación/exportación de proveedores:

```
Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined.
```

El error se producía porque `SupplierTable` no estaba siendo importado correctamente.

## Causa del Error

En `src/app/dashboard/suppliers/import-export/page.tsx` se estaba intentando importar `SupplierTable` como named export (entre llaves):

```tsx
// ❌ INCORRECTO
import { SupplierTable } from '@/components/suppliers/SupplierTable';
```

Pero en `src/components/suppliers/SupplierTable.tsx` se exporta como default export:

```tsx
// ✅ Es un default export
export default function SupplierTable({ suppliers, currentUserRole }: SupplierTableProps) {
  // ...
}
```

## Solución Aplicada

Se corrigió la importación para usar default import:

```tsx
// ✅ CORRECTO
import SupplierTable from '@/components/suppliers/SupplierTable';
```

## Verificación

- ✅ Error de importación resuelto
- ✅ Página de importación/exportación funcional
- ✅ Componente SupplierTable se renderiza correctamente

## Archivos Modificados

- `src/app/dashboard/suppliers/import-export/page.tsx`

## Fecha

4 de enero de 2025 