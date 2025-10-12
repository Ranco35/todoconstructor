# Acceso al Punto de Venta (POS) - Recepción

## 📍 Cómo Acceder al POS de Recepción

### **Opción 1: Desde el Menú del Dashboard**
1. Ingresa al Dashboard principal
2. En el menú lateral, busca la sección **"🛒 Punto de Venta"**
3. Haz clic para expandir el menú
4. Selecciona **"🏨 POS Recepción"**

### **Opción 2: URL Directa**
- `http://localhost:3001/dashboard/pos/recepcion`
- `http://localhost:3002/dashboard/pos/recepcion` (puerto alternativo)

### **Opción 3: Desde el Dashboard Principal**
Si agregas un botón de acceso rápido en el dashboard principal.

---

## 🏨 POS de Recepción

### **Características**
- ✅ Gestión de ventas para recepción del hotel
- ✅ Asignación de habitaciones
- ✅ Búsqueda de productos
- ✅ Múltiples métodos de pago
- ✅ Descuentos y notas
- ✅ Integración con clientes

### **Funcionalidades**
1. **Carrito de Compras**
   - Agregar/eliminar productos
   - Ajustar cantidades
   - Aplicar descuentos

2. **Información del Cliente**
   - Buscar cliente existente
   - Crear cliente nuevo
   - Asignar habitación

3. **Procesamiento de Pago**
   - Efectivo con cálculo de vuelto
   - Tarjeta
   - Transferencia
   - Múltiples métodos de pago

4. **Finalización de Venta**
   - Genera número de venta (ej: REC-000045)
   - Registra en base de datos
   - Actualiza sesión de caja
   - Imprime recibo (opcional)

---

## 🍽️ POS de Restaurante

### **URL**
- `http://localhost:3001/dashboard/pos/restaurante`

### **Diferencias con Recepción**
- ✅ Gestión de mesas
- ✅ Estados de mesa (disponible, ocupada, limpieza)
- ✅ Asignación de meseros
- ✅ Vista por mesas

---

## 📊 Ventas POS

### **URL**
- `http://localhost:3001/dashboard/pos/sales`

### **Funcionalidades**
- Ver historial de ventas del POS
- Filtrar por fecha, método de pago
- Ver detalles de cada venta
- Generar reportes

---

## 🔧 Estructura en el Menú

```
🛒 Punto de Venta
├── 🏨 POS Recepción        → /dashboard/pos/recepcion
├── 🍽️ POS Restaurante      → /dashboard/pos/restaurante
└── 📊 Ventas POS           → /dashboard/pos/sales
```

---

## 🎯 Usuarios con Acceso

### **SUPER_USER** (Súper Usuario)
- ✅ POS Recepción
- ✅ POS Restaurante
- ✅ Ventas POS
- ✅ Todos los permisos

### **ADMINISTRADOR**
- ✅ POS Recepción
- ✅ POS Restaurante
- ✅ Ventas POS
- ✅ Gestión completa

### **JEFE_SECCION** (Jefe de Sección)
- Configurar según necesidades

### **USUARIO_FINAL**
- Configurar según necesidades

---

## 📝 Flujo de Uso del POS de Recepción

### **Paso a Paso**

1. **Acceder al POS**
   - Click en "🛒 Punto de Venta" → "🏨 POS Recepción"

2. **Verificar Sesión de Caja**
   - Debe haber una sesión activa
   - Si no hay, crear una nueva sesión

3. **Buscar Productos**
   - Usar el buscador en la parte superior
   - Filtrar por categorías
   - Ver productos disponibles

4. **Agregar al Carrito**
   - Click en el producto
   - Ajustar cantidad si es necesario
   - Aplicar descuentos si corresponde

5. **Información del Cliente**
   - Buscar cliente por RUT
   - Crear cliente nuevo si no existe
   - Asignar número de habitación (opcional)

6. **Finalizar Venta**
   - Click en "Finalizar Venta"
   - Seleccionar método de pago
   - Ingresar monto recibido (si es efectivo)
   - Confirmar venta

7. **Resultado**
   - Número de venta generado
   - Venta registrada en sistema
   - Carrito limpiado
   - Listo para siguiente venta

---

## 🔍 Verificación de Ventas

### **Método 1: En el Sistema**
1. Ve a "🛒 Punto de Venta" → "📊 Ventas POS"
2. Verás el listado de todas las ventas
3. Click en una venta para ver detalles

### **Método 2: En Base de Datos**
```sql
-- Ver últimas ventas de Recepción
SELECT * FROM "POSSale" 
WHERE "saleNumber" LIKE 'REC-%'
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Ver items de una venta
SELECT * FROM "POSSaleItem" 
WHERE "saleId" = [ID_VENTA];
```

---

## ⚙️ Configuración

### **Requisitos Previos**
- ✅ Sesión de caja activa
- ✅ Productos cargados en POSProduct
- ✅ Categorías POS configuradas
- ✅ Usuario autenticado

### **Crear Sesión de Caja**
Si no hay sesión activa:
1. El POS mostrará opción de crear sesión
2. Ingresar monto inicial
3. Sesión se crea automáticamente

---

## 📁 Archivos Relacionados

### **Frontend**
- `src/app/dashboard/pos/recepcion/page.tsx` - Página principal
- `src/components/pos/ReceptionPOS.tsx` - Componente del POS
- `src/components/pos/ProductSearch.tsx` - Buscador de productos
- `src/components/pos/ClientSelectorWithCreate.tsx` - Selector de clientes
- `src/components/pos/MultiplePaymentModal.tsx` - Modal de pagos múltiples

### **Backend**
- `src/actions/pos/pos-actions.ts` - Funciones principales
- `src/actions/pos/multiple-payments-actions.ts` - Pagos múltiples

### **Base de Datos**
- Tabla `POSSale` - Ventas
- Tabla `POSSaleItem` - Items de ventas
- Tabla `POSProduct` - Productos del POS
- Tabla `CashSession` - Sesiones de caja

---

## 🚀 Acceso Rápido

### **Enlaces Directos**
- 🏨 **POS Recepción**: `/dashboard/pos/recepcion`
- 🍽️ **POS Restaurante**: `/dashboard/pos/restaurante`
- 📊 **Ventas POS**: `/dashboard/pos/sales`

### **En el Menú Lateral**
```
🛒 Punto de Venta
├── 🏨 POS Recepción     ← AQUÍ ESTÁ
├── 🍽️ POS Restaurante
└── 📊 Ventas POS
```

---

## ✅ Resumen

| Aspecto | Detalle |
|---------|---------|
| **Ubicación en menú** | 🛒 Punto de Venta → 🏨 POS Recepción |
| **URL** | `/dashboard/pos/recepcion` |
| **Función POST** | `createPOSSale()` en `pos-actions.ts:798` |
| **Componente** | `ReceptionPOS.tsx` |
| **Tabla principal** | `POSSale` |
| **Acceso** | SUPER_USER, ADMINISTRADOR |

---

**Fecha de documentación**: 27 de Enero, 2025  
**Estado**: ✅ POS accesible desde el menú  
**Uso principal**: Ventas en recepción del hotel
