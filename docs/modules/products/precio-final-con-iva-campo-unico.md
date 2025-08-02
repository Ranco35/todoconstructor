# Campo único final_price_with_vat en Product

## Resumen

A partir de julio 2025, el sistema utiliza un campo único `final_price_with_vat` en la tabla `Product` para almacenar SIEMPRE el precio final con IVA incluido. Este campo se actualiza automáticamente mediante trigger cada vez que cambian `saleprice` o `vat`.

---

## Ventajas
- Consistencia total en todos los módulos (productos, reservas, paquetes, reportes)
- Sin errores de cálculo ni desincronización
- Mejor performance y trazabilidad
- Integración sencilla con otros sistemas

---

## Implementación técnica

1. **Migración SQL:**
   - Se agrega el campo `final_price_with_vat` a la tabla `Product`.
   - Se crea un trigger para actualizarlo automáticamente.
   - Se actualizan todos los productos existentes.

2. **Backend:**
   - Todas las funciones de sincronización y obtención de precios usan este campo.
   - Si el campo es nulo, se muestra advertencia y se omite el producto.

3. **Frontend:**
   - Todos los formularios y listados muestran el precio desde `final_price_with_vat`.

---

## Ejemplo de uso

```ts
const precioFinal = product.final_price_with_vat ?? product.saleprice;
```

---

## Auditoría y corrección
- Si algún producto tiene `final_price_with_vat` nulo, revisar que tenga `saleprice` y `vat` configurados.
- El trigger asegura que siempre esté actualizado.

---

## Módulos afectados
- Gestión de productos
- Sistema modular (productos modulares)
- Reservas y creación de paquetes
- Reportes y exportaciones

---

## Fecha de implementación
Julio 2025 