# Sistema de Eliminación de Productos

## 📝 Resumen
El sistema de eliminación de productos está diseñado para funcionar de forma segura y profesional, eliminando todas las dependencias asociadas a un producto antes de borrarlo de la base de datos. El manejo de stock y bodegas está 100% basado en la tabla `Warehouse_Product`, siguiendo buenas prácticas de inventario multi-bodega.

---

## 🚦 Flujo de Eliminación

1. **Verificación de existencia:**
   - Se valida que el producto exista en la tabla `Product`.
2. **Verificación de dependencias:**
   - Se revisa si el producto tiene dependencias en:
     - Bodegas (`Warehouse_Product`)
     - Ventas (`Sale_Product`)
     - Reservas (`Reservation_Product`)
     - Componentes de producto (`Product_Component`)
     - Compras de caja menor (`PettyCashPurchase`)
3. **Eliminación normal:**
   - Si NO hay dependencias, se eliminan todas las asignaciones en bodegas (`Warehouse_Product`) y luego el producto.
4. **Eliminación forzada:**
   - Si hay dependencias y el usuario lo confirma, se eliminan TODAS las dependencias anteriores y luego el producto.
5. **Revalidación:**
   - Se revalidan las páginas de productos e inventario para reflejar los cambios.

---

## 🏪 Lógica de Stock y Bodegas
- **El stock de cada producto se maneja exclusivamente en la tabla `Warehouse_Product`.**
- No existe ni se usa la columna `stockid` ni la tabla `Product_Stock`.
- Cada registro de `Warehouse_Product` representa la cantidad de un producto en una bodega específica.
- Al eliminar un producto, primero se eliminan todas sus asignaciones en bodegas.

---

## ⚙️ Ejemplo de Eliminación (Pseudocódigo)

```ts
// 1. Verificar existencia
const product = await supabase.from('Product').select('id, name').eq('id', id).single();
if (!product) return error;

// 2. Verificar dependencias
// ... (consultas a Warehouse_Product, Sale_Product, etc)

// 3. Eliminar dependencias
await supabase.from('Warehouse_Product').delete().eq('productid', id);
// ... eliminar otras dependencias si es forzado

// 4. Eliminar producto
await supabase.from('Product').delete().eq('id', id);
```

---

## ⚠️ Advertencias y Buenas Prácticas
- **Nunca elimines un producto sin antes eliminar sus dependencias.**
- El sistema previene la eliminación accidental mostrando advertencias y pidiendo confirmación si hay dependencias.
- El modelo es escalable y soporta múltiples bodegas y transferencias.
- Si en el futuro se requiere stock único por producto, se debe rediseñar el modelo.

---

## 🟢 Ventajas del sistema actual
- Compatible con inventario multi-bodega.
- Sin errores de columnas inexistentes.
- Código limpio y fácil de mantener.
- Permite transferencias y mínimos/máximos por bodega.

---

## 📚 Referencias
- Tabla principal de stock: `Warehouse_Product`
- Tabla de productos: `Product`
- Otras dependencias: `Sale_Product`, `Reservation_Product`, `Product_Component`, `PettyCashPurchase`

---

**Última actualización:** [fecha automática por el sistema] 