### Opción: Descargar solo productos con stock distinto de 0 (Ajuste de Inventario)

Esta mejora permite que, al generar la plantilla Excel de "Toma de Inventario Físico", se incluya únicamente los productos que tienen stock distinto de cero en la bodega seleccionada. La opción es un checkbox en el formulario y afecta tanto el conteo mostrado como el contenido del Excel exportado.

#### Uso en la UI
- En `Dashboard → Inventario → Ajuste de Inventario`, marcar el checkbox "Solo productos con stock distinto de 0".
- Debajo del checkbox se mostrará el conteo actualizado de productos que cumplen la condición para la bodega seleccionada.

#### Cambios Frontend
Checkbox y envío del parámetro `onlyNonZeroStock` en la descarga y el conteo:
```198:469:src/components/inventory/InventoryPhysicalForm.tsx
const [onlyNonZeroStock, setOnlyNonZeroStock] = useState(false)
...
// Conteo con filtro opcional
body: JSON.stringify({ warehouseId, onlyNonZeroStock: onlyNonZeroStock })
...
// Descarga de plantilla
body: JSON.stringify({ 
  warehouseId: selectedWarehouseId,
  categoryId: selectedCategoryId,
  includeAllProducts: includeAllProducts,
  onlyNonZeroStock: onlyNonZeroStock
})
...
// Checkbox + conteo visible debajo
<input type="checkbox" checked={onlyNonZeroStock} onChange={(e) => handleToggleOnlyNonZero(e.target.checked)} />
<span>Solo productos con stock distinto de 0</span>
```

#### Cambios API
- Endpoint de conteo soporta `onlyNonZeroStock` para calcular la cifra al vuelo:
```1:61:src/app/api/inventory/physical/count/route.ts
const { warehouseId, categoryId, onlyNonZeroStock } = await request.json()
...
let query = supabase.from('Warehouse_Product').select('id', { count: 'exact', head: true }).eq('warehouseId', warehouseId)
if (onlyNonZeroStock) {
  query = query.neq('quantity', 0)
}
```

- Endpoint de plantilla recibe y pasa el parámetro a la acción:
```1:33:src/app/api/inventory/physical/template/route.ts
const { warehouseId, categoryId, includeAllProducts, onlyNonZeroStock } = await request.json()
...
const buffer = await exportInventoryPhysicalTemplate(warehouseId, categoryId, includeAllProducts, onlyNonZeroStock)
```

#### Cambios en Acción de Exportación
- La acción filtra productos por `quantity !== 0` cuando se exporta por bodega con el flag activo. También refleja el filtro en el texto de filtros del Excel.
```183:394:src/actions/inventory/inventory-physical.ts
export async function exportInventoryPhysicalTemplate(warehouseId: number, categoryId?: number, includeAllProducts?: boolean, onlyNonZeroStock?: boolean) {
  ...
  if (!includeAllProducts && onlyNonZeroStock) {
    products = products.filter((wp: any) => {
      const qty = typeof wp?.quantity === 'number' ? wp.quantity : Number(wp?.quantity || 0)
      return qty !== 0
    })
  }
  ...
  const filtroTexto = includeAllProducts && categoryId 
    ? `Filtros: Categoría: ${categoryName}`
    : `Filtros: Bodega: ${warehouse.name}${onlyNonZeroStock ? ' | Solo stock ≠ 0' : ''}`
}
```

#### Consideraciones
- En modo "Todos los productos de una categoría" el stock inicial es 0; si se marca esta opción la hoja puede resultar vacía. La UI muestra una nota preventiva.
- El conteo bajo el checkbox se muestra solo cuando hay una bodega seleccionada y refleja el estado del filtro en tiempo real.

#### Estado
- Implementación verificada en UI y endpoints. Linter sin errores.

