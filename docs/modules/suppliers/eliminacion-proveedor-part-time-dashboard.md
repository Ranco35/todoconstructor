# Eliminación de la acción rápida "Proveedor Part-Time" en el Dashboard de Proveedores

## 📝 Resumen
Se eliminó la opción de crear proveedores part-time directamente desde el dashboard de proveedores para simplificar la gestión y evitar duplicidad de flujos. Ahora solo se puede crear un proveedor estándar y luego asignarle la categoría "Part-Time" si corresponde.

---

## 🎯 Motivo del Cambio
- Unificar el flujo de creación de proveedores.
- Evitar confusión entre tipos de proveedor y categorías.
- Mantener la gestión de personal temporal bajo la lógica de categorías, no de flujos separados.
- Simplificar la interfaz y reducir errores de usuario.

---

## 🔧 Cambios Técnicos
- **Archivo modificado:** `src/app/dashboard/suppliers/page.tsx`
- **Acción eliminada:**
  - Botón/acción rápida "Proveedor Part-Time" (icono ⏰, texto "Crear proveedor para personal temporal")
  - Ya no se muestra en la sección de Acciones Rápidas.
- **Flujo actual:**
  - Solo se muestra "Nuevo Proveedor" y "Lista de Proveedores".
  - Si se requiere un proveedor part-time, se crea como proveedor normal y se le asigna la categoría "Part-Time".

---

## ✅ Resultado Final
- El dashboard es más claro y consistente.
- No hay flujos duplicados para crear proveedores.
- La gestión de part-time se realiza solo por categoría.
- Menos confusión para el usuario final.

---

## 📂 Archivos Relevantes
- `src/app/dashboard/suppliers/page.tsx`
- `docs/modules/suppliers/part-time-selector-category.md` (documentación de la lógica de categoría)

---

**Estado:** ✅ Implementado y documentado. 