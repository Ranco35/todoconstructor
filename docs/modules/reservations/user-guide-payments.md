# Guía de Usuario - Sistema de Pagos de Reservas

## 👋 Bienvenido al Nuevo Sistema de Pagos

El sistema de reservas ha sido mejorado para garantizar **trazabilidad completa** de todos los pagos y abonos. Ahora cada pago queda registrado con su historial completo, incluyendo fecha, método de pago, referencia y notas.

## 🎯 ¿Qué ha cambiado?

### ✅ Mejoras Implementadas
- **Historial completo**: Todo pago tiene registro detallado
- **Trazabilidad**: Se puede rastrear quién procesó cada pago
- **Consistencia**: Los montos se calculan automáticamente
- **Auditoría**: Sistema preparado para auditorías financieras

### 🔄 Flujo de Trabajo Actualizado
1. **Crear reserva** → Se crea con monto pagado = $0
2. **Agregar pago** → Se registra en el historial automáticamente
3. **Ver historial** → Consultar todos los pagos de la reserva
4. **Auditoría** → Trazabilidad completa de transacciones

## 📋 Cómo Usar el Sistema

### 1. Crear una Nueva Reserva

#### Paso 1: Llenar datos básicos
- Nombre del huésped
- Email y teléfono
- Fechas de check-in y check-out
- Habitación seleccionada
- Total de la reserva

#### Paso 2: Pago inicial (opcional)
- Si hay un pago inicial, se procesa automáticamente
- Se registra en el historial con referencia "PAGO_INICIAL"
- El sistema actualiza automáticamente los montos

#### Paso 3: Confirmar reserva
- La reserva se crea con estado "prereserva"
- Si hay pago inicial, cambia a "confirmada"

### 2. Agregar Pagos/Abonos

#### Opción A: Desde el Calendario de Reservas
1. Hacer clic en la reserva en el calendario
2. Seleccionar pestaña "Pagos"
3. Hacer clic en "Agregar Pago"
4. Completar formulario:
   - **Monto**: Cantidad a pagar
   - **Método**: Efectivo, transferencia, tarjeta, etc.
   - **Referencia**: Número de transferencia, cheque, etc.
   - **Notas**: Observaciones adicionales
5. Hacer clic en "Procesar Pago"

#### Opción B: Desde la Gestión de Reservas
1. Abrir la reserva desde la lista
2. Ir a sección "Gestión de Pagos"
3. Seguir el mismo proceso que en Opción A

### 3. Ver Historial de Pagos

#### Desde la Reserva
1. Abrir la reserva
2. Ir a pestaña "Pagos" o "Historial"
3. Ver lista completa de pagos con:
   - Fecha y hora
   - Monto
   - Método de pago
   - Referencia
   - Notas
   - Quién procesó el pago

#### Consulta General
```sql
-- Ver todos los pagos de una reserva específica
SELECT 
  created_at,
  amount,
  payment_method,
  reference_number,
  notes,
  processed_by
FROM reservation_payments 
WHERE reservation_id = [ID_DE_LA_RESERVA]
ORDER BY created_at DESC;
```

## 💰 Tipos de Pago

### Abono (Pago Parcial)
- **Cuándo**: Cuando el cliente paga una parte del total
- **Estado**: La reserva queda como "parcial"
- **Ejemplo**: Reserva de $200,000, pago de $100,000

### Pago Total
- **Cuándo**: Cuando el cliente paga el monto completo
- **Estado**: La reserva queda como "pagada"
- **Ejemplo**: Reserva de $200,000, pago de $200,000

## 🔍 Información que se Registra

### Para Cada Pago
- ✅ **Monto exacto** del pago
- ✅ **Fecha y hora** del procesamiento
- ✅ **Método de pago** utilizado
- ✅ **Número de referencia** (transferencia, cheque, etc.)
- ✅ **Notas** y observaciones
- ✅ **Usuario** que procesó el pago
- ✅ **Estado anterior** y **nuevo estado** de la reserva
- ✅ **Saldo pendiente** después del pago

### Ejemplo de Registro
```
Pago #123
- Fecha: 15/01/2025 14:30:25
- Monto: $100,000
- Método: Transferencia bancaria
- Referencia: TRX-2025-001234
- Notas: Abono por transferencia desde Banco de Chile
- Procesado por: admin@termasllifen.cl
- Estado anterior: $0 pagado
- Nuevo estado: $100,000 pagado
- Saldo pendiente: $100,000
```

## 📊 Estados de Pago

### No Payment (Sin Pago)
- **Descripción**: Reserva sin pagos registrados
- **Color**: Rojo
- **Acción**: Agregar primer pago

### Partial (Pago Parcial)
- **Descripción**: Reserva con pagos parciales
- **Color**: Amarillo/Naranja
- **Acción**: Continuar con abonos o completar pago

### Paid (Pagado)
- **Descripción**: Reserva completamente pagada
- **Color**: Verde
- **Acción**: Reserva lista para la estadía

## 🚫 Lo que NO se puede hacer

### ❌ Restricciones del Sistema
- **Modificar montos directamente**: Los montos se calculan automáticamente
- **Eliminar pagos**: Los pagos quedan registrados para auditoría
- **Editar pagos históricos**: Solo se pueden agregar nuevos pagos
- **Sobrepasar el total**: El sistema valida que no se exceda el monto total

### ✅ Lo que SÍ se puede hacer
- **Agregar pagos**: En cualquier momento durante la reserva
- **Ver historial completo**: De todos los pagos realizados
- **Agregar notas**: Para cada pago con contexto adicional
- **Consultar saldos**: En tiempo real

## 🔧 Funciones para Administradores

### Verificar Consistencia de Datos
```sql
-- Consulta para verificar que los montos coinciden
SELECT 
  r.id,
  r.guest_name,
  r.paid_amount as pagado_en_reserva,
  COALESCE(SUM(rp.amount), 0) as total_en_pagos,
  CASE 
    WHEN r.paid_amount = COALESCE(SUM(rp.amount), 0) THEN '✅ CONSISTENTE'
    ELSE '❌ INCONSISTENTE'
  END as estado
FROM reservations r
LEFT JOIN reservation_payments rp ON r.id = rp.reservation_id
GROUP BY r.id, r.paid_amount, r.guest_name
ORDER BY estado DESC;
```

### Reporte de Pagos por Período
```sql
-- Pagos realizados en un período específico
SELECT 
  r.guest_name,
  rp.amount,
  rp.payment_method,
  rp.created_at,
  rp.processed_by
FROM reservation_payments rp
JOIN reservations r ON rp.reservation_id = r.id
WHERE rp.created_at BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY rp.created_at DESC;
```

## 📱 Interfaz de Usuario

### Pantalla de Gestión de Pagos
- **Resumen**: Monto total, pagado y pendiente
- **Historial**: Lista de todos los pagos realizados
- **Agregar Pago**: Formulario para nuevos pagos
- **Filtros**: Por fecha, método de pago, usuario

### Indicadores Visuales
- **Verde**: Reserva completamente pagada
- **Amarillo**: Reserva con pagos parciales
- **Rojo**: Reserva sin pagos
- **Iconos**: Para diferentes métodos de pago

## 🆘 Solución de Problemas

### Problema: "No se puede procesar el pago"
**Posibles causas:**
- Monto excede el saldo pendiente
- Error de conexión con la base de datos
- Usuario sin permisos

**Solución:**
1. Verificar el monto a pagar
2. Revisar el saldo pendiente de la reserva
3. Contactar al administrador del sistema

### Problema: "Los montos no coinciden"
**Posibles causas:**
- Error en el trigger SQL
- Datos inconsistentes

**Solución:**
1. Ejecutar consulta de verificación de consistencia
2. Revisar logs del sistema
3. Contactar al equipo técnico

### Problema: "No se ve el historial de pagos"
**Posibles causas:**
- Permisos insuficientes
- Error en la consulta

**Solución:**
1. Verificar permisos de usuario
2. Refrescar la página
3. Contactar al administrador

## 📞 Soporte

### Para Usuarios
- **Capacitación**: Solicitar entrenamiento en el nuevo sistema
- **Dudas**: Consultar con el supervisor inmediato
- **Problemas técnicos**: Contactar al equipo de IT

### Para Administradores
- **Documentación técnica**: Ver `docs/modules/reservations/payment-history-system.md`
- **Scripts de mantenimiento**: Ver carpeta `scripts/`
- **Consultas de auditoría**: Ver sección de monitoreo

## 📈 Beneficios para el Negocio

### 1. **Trazabilidad Completa**
- Todo pago tiene historial detallado
- Se puede rastrear origen de cada transacción
- Cumple estándares de auditoría

### 2. **Prevención de Errores**
- Validaciones automáticas
- No se pueden modificar montos directamente
- Sistema a prueba de errores humanos

### 3. **Auditoría Financiera**
- Historial completo para auditorías
- Cumple requisitos normativos
- Trazabilidad requerida por autoridades

### 4. **Eficiencia Operativa**
- Procesos automatizados
- Menos errores manuales
- Reportes automáticos

---

## 🎓 Capacitación

### Próximas Sesiones
- **Fecha**: Por confirmar
- **Duración**: 2 horas
- **Contenido**: Uso práctico del nuevo sistema
- **Inscripción**: Contactar al supervisor

### Material de Apoyo
- **Manual de usuario**: Este documento
- **Videos tutoriales**: Disponibles en la intranet
- **Preguntas frecuentes**: Sección de soporte

---

*Guía de Usuario - Sistema de Pagos de Reservas*
*Actualizada: Enero 2025*
*Admintermas - Termas de Llifen* 