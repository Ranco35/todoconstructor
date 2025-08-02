# Uso obligatorio de final_price_with_vat en Reservas y Paquetes

## Resumen

Desde julio 2025, el módulo de reservas y creación de paquetes debe mostrar y calcular SIEMPRE los precios usando el campo `final_price_with_vat` del producto real. Esto asegura que todos los precios sean consistentes, correctos y con IVA incluido.

---

## ¿Qué cambia?
- Ya no se calcula el precio con IVA en frontend ni backend.
- Se usa directamente el valor de `final_price_with_vat`.
- Si el campo es nulo, se muestra advertencia y se omite el producto.

---

## Ejemplo de uso

```ts
const precioFinal = product.final_price_with_vat ?? product.saleprice;
```

---

## Beneficios
- Cero errores de cálculo
- Consistencia en reservas, paquetes y reportes
- Mejor experiencia para el usuario y el administrador

---

## Auditoría
- Revisar que todos los productos tengan `saleprice` y `vat` configurados
- El trigger mantiene el campo actualizado automáticamente

---

## Fecha de implementación
Julio 2025 