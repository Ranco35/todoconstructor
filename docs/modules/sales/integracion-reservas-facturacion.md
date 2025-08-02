# Integración Reservas - Facturación

## 📋 Resumen

La integración entre el módulo de reservas y facturación permite generar automáticamente facturas desde reservas finalizadas, transfiriendo todos los datos relevantes (cliente, productos, fechas, pagos) y creando facturas en estado borrador para revisión.

## 🎯 Funcionalidades Implementadas

### ✅ **Generación Automática de Facturas**
- Crear facturas desde reservas finalizadas
- Transferencia automática de datos del cliente
- Inclusión de productos adicionales de la reserva
- Transferencia de pagos realizados
- Generación de número de factura automático
- Estado inicial: borrador para revisión

### ✅ **Interfaz de Usuario**
- Botón "Crear Factura" en detalle de reservas finalizadas
- Página dedicada "Reservas para Facturar" con lista completa
- Modal con vista previa de datos antes de generar factura
- Búsqueda y filtrado de reservas
- Estadísticas de reservas pendientes de facturar

### ✅ **Gestión de Estados**
- Nuevo estado "facturada" para reservas
- Actualización automática al crear factura
- Vista SQL optimizada para consultas
- Triggers automáticos para sincronización

## 🔄 Flujo de Trabajo

### 1. **Reserva Finalizada**
```
Reserva → Check-out → Estado: "finalizada"
```

### 2. **Generación de Factura**
```
Reserva Finalizada → Botón "Crear Factura" → Modal de Confirmación → Factura en Borrador
```

### 3. **Datos Transferidos**
- **Cliente**: Nombre, email, teléfono, RUT
- **Fechas**: Check-in y check-out
- **Productos**: Alojamiento + productos adicionales
- **Pagos**: Historial completo de pagos realizados
- **Totales**: Montos calculados automáticamente

### 4. **Resultado**
- Factura creada en estado "borrador"
- Reserva actualizada a estado "facturada"
- Pagos transferidos a la factura
- Número de factura automático (F-RES-XXXX-YYYY)

## 🛠️ Componentes Implementados

### **Actions**
- `createInvoiceFromReservation()`: Función principal de generación
- `getReservationForInvoice()`: Obtener datos para vista previa

### **Componentes UI**
- `CreateInvoiceFromReservation`: Modal de creación de factura
- `ReservationsToInvoicePage`: Página de listado
- Integración en `ReservationDetailClient`

### **Base de Datos**
- Migración para estado "facturada"
- Vista `reservations_to_invoice`
- Triggers automáticos
- Funciones auxiliares

## 📊 Estructura de Datos

### **ReservationInvoiceData**
```typescript
interface ReservationInvoiceData {
  reservation: {
    id: number;
    guest_name: string;
    guest_email: string;
    check_in: string;
    check_out: string;
    total_amount: number;
    // ... otros campos
  };
  client: {
    id: number;
    nombrePrincipal: string;
    apellido: string;
    email: string;
  };
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  payments: Array<{
    amount: number;
    payment_method: string;
    payment_date: string;
  }>;
}
```

### **Líneas de Factura Generadas**
1. **Línea Principal**: Alojamiento con noches calculadas
2. **Productos Adicionales**: Servicios, comidas, etc.
3. **IVA**: 19% aplicado automáticamente
4. **Descuentos**: 0% por defecto (configurable)

## 🎨 Interfaz de Usuario

### **En Detalle de Reserva**
```tsx
{reservation.status === 'finalizada' && (
  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
    <CreateInvoiceFromReservation
      reservationId={reservation.id}
      reservationStatus={reservation.status}
      onSuccess={() => window.location.reload()}
    />
  </div>
)}
```

### **Página de Listado**
- Estadísticas en tiempo real
- Búsqueda por nombre, email, cliente
- Selección múltiple
- Filtros por estado y fecha
- Vista previa de datos

## 🔧 Configuración

### **Número de Factura Automático**
```
Formato: F-RES-XXXX-YYYY
Ejemplo: F-RES-0026-20250110
```

### **Configuración de Factura**
- **Estado inicial**: `draft` (borrador)
- **Moneda**: CLP (pesos chilenos)
- **Vencimiento**: 30 días por defecto
- **Condiciones**: "30 días" por defecto
- **IVA**: 19% aplicado automáticamente

## 📈 Estadísticas Disponibles

### **Dashboard de Reservas para Facturar**
- Total de reservas finalizadas
- Monto total a facturar
- Pagos realizados
- Productos adicionales
- Reservas seleccionadas

### **Métricas por Reserva**
- Número de noches
- Total de la reserva
- Monto pagado
- Productos adicionales
- Estado de pagos

## 🔍 Validaciones y Seguridad

### **Validaciones Implementadas**
- ✅ Solo reservas finalizadas pueden generar facturas
- ✅ Verificación de cliente existente
- ✅ Validación de fechas (check-out > check-in)
- ✅ Prevención de facturas duplicadas
- ✅ Verificación de datos obligatorios

### **Manejo de Errores**
- Reserva no encontrada
- Cliente no válido
- Error en transferencia de pagos
- Error en creación de factura
- Datos incompletos

## 🚀 Uso Práctico

### **Paso 1: Finalizar Reserva**
1. Ir al detalle de la reserva
2. Cambiar estado a "finalizada"
3. Confirmar check-out

### **Paso 2: Generar Factura**
1. Hacer clic en "Crear Factura"
2. Revisar datos en el modal
3. Confirmar generación
4. Factura creada en estado borrador

### **Paso 3: Revisar y Emitir**
1. Ir a la factura generada
2. Revisar líneas y totales
3. Cambiar estado a "enviada"
4. Registrar pagos si es necesario

## 📋 Checklist de Implementación

- [x] Acción para crear factura desde reserva
- [x] Componente modal de confirmación
- [x] Página de listado de reservas para facturar
- [x] Integración en detalle de reserva
- [x] Migración de base de datos
- [x] Triggers automáticos
- [x] Vista SQL optimizada
- [x] Documentación completa
- [x] Enlaces en dashboard
- [x] Manejo de errores
- [x] Validaciones de seguridad

## 🔮 Próximas Mejoras

### **Funcionalidades Futuras**
- [ ] Generación en lote de facturas
- [ ] Plantillas personalizables
- [ ] Configuración de impuestos por producto
- [ ] Integración con sistemas de pago
- [ ] Notificaciones automáticas
- [ ] Reportes de conversión reserva-factura

### **Optimizaciones**
- [ ] Caché de consultas frecuentes
- [ ] Paginación en listado
- [ ] Filtros avanzados
- [ ] Exportación de datos
- [ ] Auditoría de cambios

## 📞 Soporte

Para dudas o problemas con la integración:
1. Revisar logs de consola
2. Verificar estado de reserva
3. Comprobar datos del cliente
4. Validar permisos de usuario
5. Contactar al equipo de desarrollo

---

**Versión**: 1.0.0  
**Fecha**: Enero 2025  
**Autor**: Sistema Admintermas 