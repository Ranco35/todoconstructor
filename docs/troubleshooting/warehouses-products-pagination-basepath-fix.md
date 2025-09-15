Paginación en productos por bodega navega a …/undefined (404)

Estado: Resuelto (2025-08-21)

Síntoma
- Al avanzar de página en la vista de productos por bodega, la URL se construía con un segmento `undefined`, por ejemplo:
  - /dashboard/configuration/inventory/warehouses/10/undefined?search=&stockFilter=withStock&pageSize=10&page=2
- Resultado: 404 / página no encontrada.

Contexto
- Página afectada: /dashboard/configuration/inventory/warehouses/[id]/products
- Componente de paginación: src/components/shared/PaginationControls.tsx

Causa raíz
- El componente PaginationControls requiere los props estándar:
  - basePath (ruta base para construir la URL)
  - pageSize (string)
  - totalCount
  - currentCount
- En la página de productos por bodega no se estaba entregando basePath ni los nombres de props correctos (se pasaba totalItems en vez de totalCount), por lo que el constructor de URL usaba una base indefinida y generaba …/undefined?...

Archivos
- Página: src/app/dashboard/configuration/inventory/warehouses/[id]/products/page.tsx
- Paginación: src/components/shared/PaginationControls.tsx

Corrección aplicada
- Se actualizó la invocación de PaginationControls en la página de productos por bodega para cumplir la interfaz oficial y fijar un basePath explícito.

Fragmento relevante (page.tsx):

<cita>
<ruta>src/app/dashboard/configuration/inventory/warehouses/[id]/products/page.tsx</ruta>
…
<div className="mt-6">
  <PaginationControls
    currentPage={currentPage}
    totalPages={totalPages}
    totalCount={totalCount}
    currentCount={warehouseProducts.length}
    pageSize={String(currentPageSize)}
    basePath={`/dashboard/configuration/inventory/warehouses/${warehouseId}/products`}
  />
</div>
…
</cita>

Notas
- pageSize se pasa como string acorde al tipo del componente.
- basePath apunta a …/warehouses/${warehouseId}/products para evitar rutas relativas ambiguas.
- totalCount/currentCount se alinean con la interfaz estándar.

Pasos de verificación
1) Abrir: /dashboard/configuration/inventory/warehouses/10/products?search=&stockFilter=withStock&pageSize=10&page=1
2) Click en “Siguiente”.
3) Confirmar que la URL resultante es:
   - /dashboard/configuration/inventory/warehouses/10/products?search=&stockFilter=withStock&pageSize=10&page=2
   - Sin el segmento undefined.
4) Cambiar “Por página” (selector de pageSize): verifica que reescribe page=1 y conserva el resto de query params.
5) Probar con diferentes stockFilter y search para asegurar preservación de parámetros.

Revisión de regresión recomendada
- Asegurar que en cada uso de PaginationControls se pase un basePath válido (especialmente en rutas dinámicas [id]) y que se usen los nombres de props correctos: totalCount/currentCount.
- Usos conocidos del componente a revisar si fuese necesario:
  - src/app/dashboard/configuration/inventory/warehouses/page.tsx (OK)
  - src/app/dashboard/configuration/products/page.tsx
  - src/components/inventory/InventoryPhysicalHistory.tsx
  - src/components/inventory/MovementList.tsx
  - src/app/dashboard/customers/list/page.tsx

Lecciones y patrón
- Definir siempre basePath al integrar PaginationControls en páginas bajo rutas dinámicas ([id]).
- Normalizar nombres de props con la interfaz oficial del componente para evitar errores sutiles en la construcción de URLs.

Impacto
- Se elimina el 404 al paginar productos por bodega y se garantiza construcción consistente de URL con preservación de filtros.

