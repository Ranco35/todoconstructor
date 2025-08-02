# Sincronización Automática de Productos Modulares (Habitaciones, Comidas y Servicios)

## 📋 Resumen

El sistema sincroniza automáticamente los precios de **todos los productos modulares** (habitaciones, comidas, servicios, etc.) cada vez que se ingresa a la página de administración de productos modulares (`/dashboard/admin/productos-modulares`).

- **Habitaciones:** Se sincronizan usando la función `syncRoomPricesWithModular`.
- **Comidas y servicios:** Se sincronizan usando la función `syncModularProductsWithRealPrice`, que actualiza el precio con IVA incluido según el producto real.

---

## ⚙️ ¿Cómo funciona?

1. **Al cargar la página** `/dashboard/admin/productos-modulares`:
   - Se ejecuta primero la sincronización de precios de habitaciones.
   - Luego, se ejecuta la sincronización de precios de productos modulares de comida y servicios.
2. **Ambas sincronizaciones** buscan el producto real asociado y actualizan el precio en el producto modular si es necesario.
3. **El precio de comidas y servicios** se calcula como:
   ```
   Precio final = salePrice * (1 + vat / 100)
   ```
   donde `salePrice` y `vat` se obtienen del producto real.

---

## 🟢 Mensajes y feedback en la interfaz

- Si se actualizan productos modulares de comida/servicio:
  > ✅ X productos modulares de comida/servicio actualizados automáticamente con precio final (IVA incluido).

- Si hay productos que no se pudieron sincronizar (por ejemplo, falta el producto real):
  > ⚠️ Algunos productos modulares de comida/servicio no se pudieron sincronizar:
  > - No se encontró producto real para modular ID X

- Si hay habitaciones sin producto real asociado:
  > ⚠️ Las siguientes habitaciones no se sincronizaron porque no tienen producto real asociado: ...

---

## 🚦 Limitaciones y consideraciones

- **No se usa `revalidatePath` durante el render** para evitar errores de Next.js. La sincronización ocurre en la base de datos y la interfaz muestra el estado actualizado.
- Si necesitas forzar una recarga de la página tras una acción manual, se recomienda implementar un botón de "Sincronizar manualmente" usando una server action.
- La sincronización es **transparente para el usuario**: siempre que ingreses a la página, los precios estarán correctos y actualizados.

---

## 🛠️ Recomendaciones para administración

- Si editas el precio base o el IVA de un producto real (comida, servicio, etc.), simplemente recarga la página de productos modulares para ver el precio actualizado.
- Si ves advertencias de productos no sincronizados, revisa que el producto real exista y esté correctamente vinculado.
- Para auditoría o troubleshooting, revisa los mensajes de advertencia y éxito que aparecen al cargar la página.

---

## 🧩 Lógica técnica implementada

- **Archivo:** `src/app/dashboard/admin/productos-modulares/page.tsx`
- **Funciones clave:**
  - `syncRoomPricesWithModular` (habitaciones)
  - `syncModularProductsWithRealPrice` (comidas y servicios)
- **Mensajes:** Se muestran en la parte superior de la página, con colores y detalles claros.

---

## ✅ Beneficios

- **Cero errores de precios desactualizados** en productos modulares.
- **Transparencia total** para el usuario administrador.
- **Sincronización automática** y sin intervención manual.
- **Feedback inmediato** sobre el estado de la sincronización.

---

**Última actualización:** [fecha automática al guardar este archivo] 