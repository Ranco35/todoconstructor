# Modal de Abonos/Pagos para Reservas

## 🚀 Uso Rápido

```tsx
import AddPaymentModal from '@/components/reservations/AddPaymentModal';

// En tu componente de reservas
<AddPaymentModal
  reservationId={reservation.id}
  currentPaidAmount={reservation.paid_amount}
  totalAmount={reservation.total_amount}
  pendingAmount={reservation.pending_amount}
  paymentStatus={reservation.payment_status}
/>
```

## 📋 Características

- ✅ **7 métodos de pago** (efectivo, tarjeta, transferencia, etc.)
- ✅ **Cálculos automáticos** de montos y estados
- ✅ **Validaciones frontend** completas
- ✅ **Comentarios automáticos** en la reserva
- ✅ **Estados de pago** actualizados automáticamente

## 🎯 Flujo Automático

1. Usuario ingresa monto y método de pago
2. Sistema valida los datos
3. Se registra el pago en la tabla `payments`
4. Se actualiza automáticamente la reserva con nuevos montos
5. Se agrega comentario automático con detalles del pago
6. Se refresca la página para mostrar cambios

## 💰 Estados de Pago

- **no_payment**: Sin pagos registrados
- **partial**: Pagos parciales, aún hay saldo pendiente  
- **paid**: Completamente pagado
- **overdue**: Vencido (para futuras implementaciones)

¡El sistema está listo para uso en producción! 🚀 