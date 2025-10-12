# Guía de Inicio Rápido - POS Recepción

## 🚀 Cómo Iniciar el POS de Recepción

### **Paso 1: Acceder al POS**
- URL: `http://localhost:3001/dashboard/pos/recepcion`
- O desde el menú: **🛒 Punto de Venta**

### **Paso 2: Crear Sesión de Caja**

Cuando accedas por primera vez, verás este mensaje:
```
⚠️ No hay una sesión de caja activa. 
   Debe iniciar una sesión para comenzar a vender.
```

**¿Qué hacer?**
1. Haz click en el botón **"Iniciar Sesión de Caja"**
2. Ingresa el **monto inicial** (efectivo en caja al inicio)
   - Ejemplo: `50000` (cincuenta mil pesos)
3. Click en **"Crear Sesión"**

### **Paso 3: POS Listo**
✅ Ahora puedes comenzar a vender

---

## 🛒 Cómo Usar el POS

### **1. Buscar Productos**
- Usa el buscador en la parte superior
- O filtra por categorías a la izquierda

### **2. Agregar al Carrito**
- Click en el producto
- Se agrega automáticamente al carrito
- Ajusta cantidad con botones `+` y `-`

### **3. Aplicar Descuentos (Opcional)**
- Click en icono de descuento en el producto
- Selecciona tipo: porcentaje o monto fijo
- Ingresa el valor

### **4. Información del Cliente (Opcional)**
- Buscar cliente existente por RUT
- O crear cliente nuevo
- Asignar número de habitación si aplica

### **5. Finalizar Venta**
- Click en **"Finalizar Venta"**
- Selecciona método de pago:
  - 💵 Efectivo
  - 💳 Tarjeta
  - 🏦 Transferencia
  - 💰 Múltiples pagos
- Confirma la venta

### **6. Resultado**
- ✅ Número de venta generado (ej: REC-000045)
- ✅ Carrito limpiado
- ✅ Listo para siguiente venta

---

## ⚠️ Solución a Warnings Comunes

### **Warning: "Missing Description for DialogContent"**
- **Qué es**: Advertencia de accesibilidad
- **Impacto**: Ninguno en funcionalidad
- **Solución**: Se puede ignorar, no afecta el uso

### **Warning: "CSS was preloaded but not used"**
- **Qué es**: Optimización de Next.js
- **Impacto**: Ninguno en funcionalidad
- **Solución**: Se puede ignorar, es normal en desarrollo

### **Error: "No hay sesión de caja activa"**
- **Qué es**: No hay sesión de caja creada
- **Solución**: Crear sesión de caja (ver Paso 2 arriba)

---

## 🔧 Problemas Comunes y Soluciones

### **Problema 1: No se cargan productos**
**Síntomas**: El POS se abre pero no hay productos

**Solución**:
1. Verifica que existan productos en `POSProduct`
2. Ejecuta el sincronizador de productos POS
3. O crea productos de ejemplo

**Diagnóstico**:
```sql
-- Verificar productos POS
SELECT COUNT(*) FROM "POSProduct" WHERE "isActive" = true;
```

### **Problema 2: No se puede crear sesión**
**Síntomas**: Error al intentar crear sesión

**Solución**:
1. Verifica que exista el tipo de caja "Recepción"
2. Verifica que tu usuario tenga permisos

**Diagnóstico**:
```sql
-- Verificar tipo de caja
SELECT * FROM "CashRegisterType" WHERE id = 1;
```

### **Problema 3: Productos sin precio**
**Síntomas**: Productos aparecen con precio $0

**Solución**:
1. Verifica que los productos en `POSProduct` tengan precio
2. Ejecuta actualización de precios desde configuración

**Diagnóstico**:
```sql
-- Verificar precios
SELECT sku, name, price FROM "POSProduct" WHERE price = 0 OR price IS NULL;
```

---

## 📊 Verificar Estado del Sistema

### **Productos Disponibles**
```sql
SELECT COUNT(*) as total FROM "POSProduct" WHERE "isActive" = true;
```

### **Sesión Activa**
```sql
SELECT * FROM "CashSession" 
WHERE "isActive" = true 
AND "cashRegisterTypeId" = 1
ORDER BY "createdAt" DESC
LIMIT 1;
```

### **Últimas Ventas**
```sql
SELECT * FROM "POSSale" 
WHERE "saleNumber" LIKE 'REC-%'
ORDER BY "createdAt" DESC
LIMIT 5;
```

---

## 🎯 Checklist de Inicio

Antes de usar el POS por primera vez:

- [ ] ✅ Usuario autenticado (SUPER_USER o ADMINISTRADOR)
- [ ] ✅ Productos cargados en POSProduct
- [ ] ✅ Categorías POS configuradas
- [ ] ✅ Tipo de caja "Recepción" existe
- [ ] ✅ Crear sesión de caja con monto inicial
- [ ] ✅ Verificar que productos tengan precios

---

## 🔄 Flujo Normal de Trabajo Diario

### **Inicio del Día**
1. Acceder a POS Recepción
2. Crear sesión de caja
3. Ingresar monto inicial (efectivo en caja)

### **Durante el Día**
1. Procesar ventas normalmente
2. Las ventas en efectivo suman al monto de caja
3. Ver estadísticas en tiempo real

### **Fin del Día**
1. Cerrar sesión de caja
2. Cuadrar caja (físico vs sistema)
3. Generar reporte de ventas

---

## 🆘 Si Algo No Funciona

### **Opción 1: Revisar Consola del Navegador**
1. Presiona `F12` para abrir DevTools
2. Ve a la pestaña "Console"
3. Busca mensajes de error en rojo

### **Opción 2: Verificar en Base de Datos**
Ejecuta las consultas SQL de diagnóstico arriba

### **Opción 3: Ejecutar Diagnóstico del Sistema**
El POS incluye un sistema de diagnóstico automático que se ejecuta al cargar

### **Opción 4: Contactar Soporte**
Con los siguientes datos:
- Screenshot del error
- Logs de la consola
- Paso exacto donde falló

---

## ✅ Resumen Rápido

| Paso | Acción |
|------|--------|
| 1 | Acceder a `/dashboard/pos/recepcion` |
| 2 | Crear sesión de caja (si no existe) |
| 3 | Buscar productos y agregar al carrito |
| 4 | Finalizar venta con método de pago |
| 5 | ✅ Venta registrada |

---

## 📞 URLs Importantes

| Función | URL |
|---------|-----|
| POS Recepción | `/dashboard/pos/recepcion` |
| Ventas POS | `/dashboard/pos/sales` |
| Sesiones de Caja | `/dashboard/pettyCash/sessions` |
| Productos | `/dashboard/configuration/products` |

---

**Fecha**: 27 de Enero, 2025  
**Estado**: ✅ Guía completa  
**Tipo de Usuario**: SUPER_USER, ADMINISTRADOR
