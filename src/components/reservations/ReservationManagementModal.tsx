'use client';

import { useState, useEffect } from 'react';
import { X, Eye, CreditCard, DollarSign, Calendar, CheckCircle, Clock, Home, User, Building, Phone, Mail, MapPin, FileText, Send } from 'lucide-react';
import { Reservation } from '@/types/reservation';
import SimplePaymentHistory from './SimplePaymentHistory';
import { updateReservationStatus, addReservationPayment } from '@/actions/reservations/management';
import { getReservationStatusBadge } from '@/utils/reservationStatus';
import CreateInvoiceFromReservation from './CreateInvoiceFromReservation';
import ReservationCommentsTab from './ReservationCommentsTab';
import ReservationEmailTab from './ReservationEmailTab';
import { formatDateSafe, formatDateTimeSafe } from '@/utils/dateUtils';
import { calculateReservationTotalAmount } from '@/utils/currency';

interface ReservationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
  onStatusChange: (reservationId: number, newStatus: string) => void;
  onPaymentAdded: (reservationId: number, amount: number) => void;
  onReservationUpdated?: () => void;
  currentUser?: { name?: string; email: string } | null;
}

export default function ReservationManagementModal({
  isOpen,
  onClose,
  reservation,
  onStatusChange,
  onPaymentAdded,
  onReservationUpdated,
  currentUser
}: ReservationManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'status' | 'checkin' | 'factura' | 'comments' | 'emails'>('overview');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // yyyy-mm-dd
  });
  const [isProcessingStatus, setIsProcessingStatus] = useState(false);
  const [auditInfo, setAuditInfo] = useState<{
    created_by_user?: {
      id: string;
      name: string;
      email: string;
    } | null;
    updated_by_user?: {
      id: string;
      name: string;
      email: string;
    } | null;
  } | null>(null);

  // Cargar información de auditoría cuando se abra el modal
  useEffect(() => {
    if (isOpen && reservation?.id) {
      const loadAuditInfo = async () => {
        try {
          if (!reservation?.id) {
            console.warn('No reservation ID available for audit info');
            return;
          }
          
          // Usar API route en lugar de función directa
          const response = await fetch(`/api/reservations/${reservation.id}/audit-info`);
          
          if (response.ok) {
            const auditData = await response.json();
            setAuditInfo(auditData);
          } else {
            console.warn('Failed to fetch audit info:', response.status, response.statusText);
            // Establecer datos por defecto si no se pudo obtener la información
            setAuditInfo({
              created_by_user: {
                id: 'system',
                name: 'Usuario del Sistema',
                email: 'sistema@admintermas.com'
              },
              updated_by_user: null
            });
          }
        } catch (error) {
          console.warn('Audit info temporarily unavailable:', {
            reservationId: reservation?.id,
            error: error instanceof Error ? error.message : String(error)
          });
          // Establecer datos por defecto mientras se resuelve el problema
          setAuditInfo({
            created_by_user: {
              id: 'system',
              name: 'Usuario del Sistema',
              email: 'sistema@admintermas.com'
            },
            updated_by_user: null
          });
        }
      };
      loadAuditInfo();
    }
  }, [isOpen, reservation?.id]);

  if (!isOpen) return null;

  // Calcular estado de pago - USAR SIEMPRE EL VALOR FINAL REAL CON DESCUENTOS
  const totalAmount = calculateReservationTotalAmount(reservation);
  const paidAmount = reservation.paid_amount || 0;
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // 🔍 LOGGING PARA DEBUG
  console.log('💰 GESTIÓN RESERVA - CÁLCULO DE MONTOS:', {
    reservation_id: reservation.id,
    modular_final_price: reservation.modular_reservation?.final_price,
    modular_grand_total: reservation.modular_reservation?.grand_total,
    reservation_total_amount: reservation.total_amount,
    total_amount_calculated: totalAmount,
    paid_amount: paidAmount,
    pending_amount: pendingAmount,
    payment_percentage: paymentPercentage
  });

  // Determinar próximo estado posible
  const getNextStatusOptions = (currentStatus: string) => {
    const options = [];
    if (currentStatus === 'active' || currentStatus === 'confirmada') {
      options.push({
        value: 'en_curso',
        label: 'Check-In (En curso)',
        color: 'bg-orange-500'
      });
    }
    if (currentStatus === 'en_curso') {
      options.push({
        value: 'finalizada',
        label: 'Check-Out (Finalizar)',
        color: 'bg-gray-700'
      });
    }
    // Solo permitir cancelar si no está finalizada ni cancelada
    if (!['finalizada', 'cancelada', 'cancelled'].includes(currentStatus)) {
      options.push({
        value: 'cancelada',
        label: 'Cancelar Reserva',
        color: 'bg-red-600'
      });
    }
    return options;
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsProcessingStatus(true);
    try {
      const result = await updateReservationStatus(reservation.id, newStatus);
      if (result.success) {
        // Recargar los datos de la reserva después del cambio de estado
        if (typeof window !== 'undefined') {
          window.location.reload(); // Refresca el modal y el calendario
        }
        // Alternativamente, podrías volver a consultar la reserva y actualizar el estado local si usas useState
        // Ejemplo:
        // const fresh = await getReservationWithClientInfoById(reservation.id);
        // if (fresh) setReservation(fresh);
        return true; // Indica éxito
      } else {
        alert(`Error: ${result.error}`);
        return false; // Indica error
      }
    } catch (error) {
      alert('Error al actualizar el estado de la reserva');
      return false; // Indica error
    } finally {
      setIsProcessingStatus(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (paymentAmount <= 0 || paymentAmount > pendingAmount) {
      alert('Monto de pago inválido');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const result = await addReservationPayment(
        reservation.id, 
        paymentAmount, 
        paymentMethod, 
        paymentNotes,
        paymentDate
      );
      
      if (result.success) {
        onPaymentAdded(reservation.id, paymentAmount);
        setPaymentAmount(0);
        setPaymentNotes('');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        alert(`Pago procesado exitosamente: $${paymentAmount.toLocaleString()}`);
        // Cambiar a tab de pagos para ver el historial actualizado
        setActiveTab('payments');
        
        // Recargar la página para actualizar los datos
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
      alert('Error al procesar el pago');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Usuario para comentarios - usar el prop o fallback
  const userForComments = currentUser || { name: 'Admin', email: 'admin@termas.com' };

  // --- FECHA DE ÚLTIMA ACTUALIZACIÓN ---
  const getValidDate = (updatedAt?: string, createdAt?: string) => {
    const tryDate = (dateStr?: string) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };
    return tryDate(updatedAt) || tryDate(createdAt) || null;
  };
  const lastUpdateDate = getValidDate(reservation.updated_at, reservation.created_at);

  // --- LÓGICA DE CHECK-IN ---
  const canCheckIn =
    (reservation.status === 'confirmada' || reservation.status === 'active') &&
    (reservation.payment_status === 'partial' || reservation.payment_status === 'paid');

  // --- LÓGICA DE VISUALIZACIÓN DE ESTADO ---
  const getEstadoLabel = (status: string) => {
    switch (status) {
      case 'cancelada':
      case 'cancelled':
        return { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: '❌' };
      case 'confirmada':
        return { label: 'Confirmada', color: 'bg-green-100 text-green-800', icon: '✔️' };
      case 'active':
        return { label: 'Activa', color: 'bg-blue-100 text-blue-800', icon: '🟦' };
      case 'en_curso':
        return { label: 'En curso', color: 'bg-orange-100 text-orange-800', icon: '⏳' };
      case 'finalizada':
        return { label: 'Finalizada', color: 'bg-gray-100 text-gray-800', icon: '🏁' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: 'ℹ️' };
    }
  };
  const estado = getEstadoLabel(reservation.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                <Eye size={24} />
                Gestión de Reserva
              </h2>
              <p className="text-blue-700 mt-1">
                {/* 🎯 USAR NOMBRE ORIGINAL - Problema ya corregido en getReservationWithClientInfoById */}
                {reservation.guest_name}
                {/* 🎯 MOSTRAR ID PRINCIPAL */}
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  ID: {reservation.id}
                </span>
                {reservation.room_code && (
                  <span className="ml-2 text-gray-700 font-semibold">
                    • {reservation.room_count && reservation.room_count > 1 ? 'Habitaciones' : 'Habitación'}: {reservation.room_code}
                  </span>
                )}
                <span className="ml-2 font-bold text-xs text-black bg-yellow-100 rounded px-2 py-0.5 align-middle">
                  {reservation.package_modular_name || reservation.package_code || 'Sin Programa'}
                </span>
                {/* ✅ PROBLEMA RESUELTO - Ya no se muestra información incorrecta */}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Vista General', icon: Eye },
              { id: 'payments', label: 'Pagos', icon: CreditCard },
              { id: 'status', label: 'Estado', icon: CheckCircle },
              { id: 'checkin', label: 'Check-In / Check-Out', icon: Clock },
              { id: 'factura', label: 'Factura', icon: FileText },
              { id: 'comments', label: 'Comentarios', icon: User },
              { id: 'emails', label: 'Correos', icon: Send },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Comentarios */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-blue-900 text-lg mb-4 flex items-center gap-2">
                <User size={20} /> Comentarios de la Reserva
              </h3>
              <ReservationCommentsTab
                reservationId={reservation.id}
                user={userForComments}
              />
            </div>
          )}

          {activeTab === 'emails' && (
            <ReservationEmailTab reservation={reservation} />
          )}

          {/* Tab: Factura */}
          {activeTab === 'factura' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-blue-900 text-lg mb-4 flex items-center gap-2">
                <FileText size={20} /> Información de Facturación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nombre de Facturación</label>
                  <p className="text-gray-900">{reservation.billing_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">RUT</label>
                  <p className="text-gray-900">{reservation.billing_rut}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Dirección</label>
                  <p className="text-gray-900">{reservation.billing_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{reservation.guest_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Teléfono</label>
                  <p className="text-gray-900">{reservation.guest_phone}</p>
                </div>
                                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Reserva (con descuento/recargo)</label>
                    <p className="text-gray-900">${totalAmount.toLocaleString('es-CL')}</p>
                  </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fechas</label>
                  <p className="text-gray-900">{formatDateSafe(reservation.check_in)} - {formatDateSafe(reservation.check_out)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Programa</label>
                  <p className="text-gray-900 font-bold text-xs">{reservation.package_modular_name || reservation.package_code || 'Sin Programa'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Habitación{reservation.room_count && reservation.room_count > 1 ? 'es' : ''}</label>
                  <p className="text-gray-900">{reservation.room_code || 'N/A'}</p>
                  {reservation.room_count && reservation.room_count > 1 && (
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      📋 {reservation.room_count} habitaciones reservadas
                    </p>
                  )}
                </div>
              </div>
              {/* 🏠 SECCIÓN DE MÚLTIPLES HABITACIONES */}
              {reservation.modular_reservations && reservation.modular_reservations.length > 1 && (
                <div>
                  <h4 className="font-semibold mb-2">🏠 Habitaciones Reservadas ({reservation.modular_reservations.length})</h4>
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reservation.modular_reservations.map((modular, index) => (
                        <div key={modular.id} className="bg-white rounded p-3 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-900">
                              🛏️ {modular.room_code}
                            </span>
                            <span className="text-green-700 font-bold text-sm">
                              ${(modular.final_price ?? modular.grand_total).toLocaleString('es-CL')}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            ID Modular: {modular.id}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-blue-900">Total Habitaciones:</span>
                        <span className="font-bold text-green-700 text-lg">
                          ${reservation.modular_reservations.reduce((sum, m) => sum + (m.final_price ?? m.grand_total), 0).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Productos y Servicios</h4>
                {/* Debug logs comentados para reducir spam */}
                {/* {(() => {
                  console.log('🔍 DEBUG - reservation.reservation_products COMPLETO:', reservation.reservation_products);
          console.log('🔍 DEBUG - CADA PRODUCTO EN DETAIL:', reservation.reservation_products?.map((rp, index) => ({
            index,
            product_id: rp.product_id,
            id: rp.id,
            quantity: rp.quantity,
            unit_price: rp.unit_price,
            total_price: rp.total_price,
            product_name: rp.product?.name || rp.modular_product_name || 'Sin nombre',
            product_type: rp.product?.type || 'Sin tipo',
            ratio: Number(rp.total_price) / Number(rp.unit_price)
          })));
                })()} */}
                {reservation.reservation_products && reservation.reservation_products.length > 0 ? (
                  <ul className="list-disc ml-6 space-y-1">
                    {/* Línea de habitación */}
                    {(() => {
                      const roomProduct = reservation.reservation_products.find(
                        (rp) => rp.product?.type === 'HOSPEDAJE'
                      );
                      if (!roomProduct) return null;
                      // Deducir cantidad de noches
                      const noches = roomProduct.quantity > 1 ? roomProduct.quantity : Math.round(Number(roomProduct.total_price) / Number(roomProduct.unit_price));
                      // console.log('🔍 DEBUG - Habitación:', roomProduct, 'Noches deducidas:', noches);
                      return (
                        <li key={`room-${roomProduct.id}`} className="font-semibold text-blue-900">
                          🛏️ Habitación: {roomProduct.product?.name || 'Habitación'} x {noches} noche{noches !== 1 ? 's' : ''} = <span className="text-green-700 font-bold">${Number(roomProduct.total_price).toLocaleString('es-CL')}</span>
                        </li>
                      );
                    })()}
                    {/* Resto de productos y servicios */}
                    {reservation.reservation_products.filter(rp => rp.product?.type !== 'HOSPEDAJE').map((product) => {
                      // Deducir cantidad real si subtotal > unitario
                      let cantidad = product.quantity;
                      if (cantidad === 1 && Number(product.total_price) > Number(product.unit_price)) {
                        cantidad = Math.round(Number(product.total_price) / Number(product.unit_price));
                      }
                      // console.log('🔍 DEBUG PRODUCTO DETALLADO:', {
                      //   product_id: product.product_id,
                      //   id: product.id,
                      //   quantity_original: product.quantity,
                      //   unit_price: product.unit_price,
                      //   total_price: product.total_price,
                      //   name: product.product?.name || product.modular_product_name || product.name || 'Sin nombre',
                      //   type: product.product?.type || 'Sin tipo',
                      //   calculation: `${product.total_price} / ${product.unit_price} = ${Number(product.total_price) / Number(product.unit_price)}`,
                      //   condition_qty_1: cantidad === 1,
                      //   condition_total_gt_unit: Number(product.total_price) > Number(product.unit_price),
                      //   cantidad_final: cantidad,
                      //   raw_product: product
                      // });
                      return (
                        <li key={product.id}>
                          {product.product?.name || product.modular_product_name || product.name || 'Servicio'}: {cantidad} x ${Number(product.unit_price).toLocaleString('es-CL')} = <span className="text-green-700 font-bold">${Number(product.total_price).toLocaleString('es-CL')}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-600">Sin productos adicionales</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Pagos Realizados</h4>
                {reservation.payments && reservation.payments.length > 0 ? (
                  <ul className="list-disc ml-6">
                    {reservation.payments.map((p) => (
                      <li key={p.id}>
                        ${p.amount?.toLocaleString('es-CL')} - {p.method} {p.reference ? `(${p.reference})` : ''} {p.notes ? `- ${p.notes}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">Sin pagos registrados</p>
                )}
              </div>
              <div>
                {reservation.status === 'finalizada' && (
                  <CreateInvoiceFromReservation
                    reservationId={reservation.id}
                    reservationStatus={reservation.status}
                    onSuccess={() => window.location.reload()}
                  />
                )}
                {reservation.status !== 'finalizada' && (
                  <div className="text-sm text-gray-500 italic">Solo se puede crear factura cuando la reserva está finalizada.</div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Check-In / Check-Out */}
          {activeTab === 'checkin' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-blue-900 text-lg mb-4 flex items-center gap-2">
                <Clock size={20} /> Check-In / Check-Out
              </h3>
              
              {/* Información de la reserva */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="font-medium mb-2">Datos del Huésped</div>
                <div>Nombre: <span className="font-semibold">{reservation.guest_name}</span></div>
                <div>Email: <span className="font-semibold">{reservation.guest_email}</span></div>
                <div>Teléfono: <span className="font-semibold">{reservation.guest_phone || 'N/A'}</span></div>
                <div>Habitación(es): <span className="font-semibold">
                  {reservation.room_count && reservation.room_count > 1 
                    ? `${reservation.room_count} habitaciones (${reservation.room_code})` 
                    : reservation.room_code || 'N/A'}
                </span></div>
                <div>Programa: <span className="font-semibold">
                  {reservation.package_modular_name || reservation.package_code || 'Sin programa específico'}
                </span></div>
              </div>

              {/* Estado actual de la reserva */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="font-medium mb-2">Estado Actual</div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${estado.color}`}>
                    {estado.icon} {estado.label}
                  </span>
                  <span className="text-sm text-gray-600">
                    Estado de pago: {
                      reservation.payment_status === 'paid' ? 'Pagado completamente' :
                      reservation.payment_status === 'partial' ? 'Pago parcial' :
                      reservation.payment_status === 'no_payment' ? 'Sin pago' :
                      reservation.payment_status === 'overdue' ? 'Vencido' : 
                      reservation.payment_status
                    }
                  </span>
                </div>
              </div>

              {/* Lógica mejorada para mostrar botones según el estado */}
              {(() => {
                // Normalizar estado para incluir variaciones de reservas modulares
                const currentStatus = reservation.status?.toLowerCase();
                const paymentStatus = reservation.payment_status;

                // Estados válidos SOLO para check-in (antes de estar activo)
                const canCheckInStates = [
                  'prereserva', 'confirmada', 'confirmed', 'reservada', 'reserved', 
                  'pending', 'pendiente'
                ];
                
                // Estados válidos SOLO para check-out (ya activos/en curso)
                const canCheckOutStates = [
                  'en_curso', 'checkin', 'check-in', 'check_in', 'active', 
                  'activa', 'ocupada', 'in_progress'
                ];
                
                // Estados finalizados
                const completedStates = [
                  'finalizada', 'checkout', 'check-out', 'check_out', 
                  'completed', 'finished', 'terminated'
                ];

                // Condiciones para check-in (SOLO si no está ya activo)
                const canCheckIn = canCheckInStates.includes(currentStatus) && 
                                   (['partial', 'paid'].includes(paymentStatus) || 
                                    // Para reservas confirmadas sin pago registrado
                                    (['confirmada', 'confirmed', 'reservada', 'reserved'].includes(currentStatus) && reservation.total_amount > 0)) &&
                                   !completedStates.includes(currentStatus) &&
                                   !canCheckOutStates.includes(currentStatus); // NO check-in si ya está activo

                // Condiciones para check-out (SOLO si está activo/en curso)
                const canCheckOut = canCheckOutStates.includes(currentStatus) &&
                                     !completedStates.includes(currentStatus);

                // Ya está finalizada
                const isCompleted = completedStates.includes(currentStatus);

                // Debug para el usuario
                console.log('🔍 DEBUG Check-in/Check-out Logic:', {
                  reservationId: reservation.id,
                  currentStatus,
                  paymentStatus,
                  totalAmount: reservation.total_amount,
                  canCheckIn,
                  canCheckOut,
                  isCompleted,
                  states: {
                    canCheckInStates: canCheckInStates.includes(currentStatus),
                    canCheckOutStates: canCheckOutStates.includes(currentStatus),
                    completedStates: completedStates.includes(currentStatus)
                  }
                });

                if (isCompleted) {
                  return (
                    <div className="text-center py-8 text-gray-600">
                      <CheckCircle size={48} className="mx-auto mb-2 text-green-500" />
                      <div className="font-semibold text-lg">Check-Out realizado</div>
                      <div className="mt-2 text-sm text-gray-500">
                        La reserva ha sido finalizada exitosamente
                      </div>
                      {pendingAmount > 0 ? (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <span className="text-orange-600 font-semibold">
                            ⚠️ Deuda pendiente: ${pendingAmount.toLocaleString('es-CL')}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <span className="text-green-700 font-semibold">
                            ✅ Sin deuda pendiente
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Información de debug para el usuario */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <div className="font-medium text-blue-900 mb-1">Información de la reserva:</div>
                      <div className="text-blue-800 space-y-1">
                        <div>• Estado actual: <span className="font-medium">{reservation.status}</span></div>
                        <div>• Estado de pago: <span className="font-medium">{paymentStatus}</span></div>
                        <div>• Total: <span className="font-medium">${reservation.total_amount?.toLocaleString('es-CL')}</span></div>
                        {reservation.room_count && reservation.room_count > 1 && (
                          <div>• Tipo: <span className="font-medium text-purple-600">Reserva múltiples habitaciones</span></div>
                        )}
                      </div>
                    </div>

                    {/* Botón de Check-In (SOLO si puede hacer check-in) */}
                    {canCheckIn && !canCheckOut && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 mb-2">
                          ✅ Esta reserva puede realizar check-in
                          {paymentStatus === 'paid' ? ' (pago completo)' : 
                           paymentStatus === 'partial' ? ' (pago parcial)' : 
                           ' (reserva confirmada)'}
                        </div>
                        <button
                          className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2 shadow-lg"
                          onClick={async () => {
                            try {
                              const result = await handleStatusChange('en_curso');
                              // El handleStatusChange ya hace reload, no necesitamos más lógica aquí
                            } catch (error) {
                              console.error('Error en check-in:', error);
                            }
                          }}
                        >
                          🏨 Realizar Check-In (Registrar llegada)
                        </button>
                      </div>
                    )}

                    {/* Botón de Check-Out (SOLO si puede hacer check-out) */}
                    {canCheckOut && !canCheckIn && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 mb-2">
                          🏁 Esta reserva puede realizar check-out
                          {paymentStatus === 'no_payment' && (
                            <div className="text-orange-600 text-xs mt-1">
                              ⚠️ Sin pagos registrados - Se puede procesar check-out y gestionar pagos después
                            </div>
                          )}
                        </div>
                        <button
                          className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg flex items-center justify-center gap-2 shadow-lg"
                          onClick={async () => {
                            try {
                              const confirmed = window.confirm(
                                `¿Está seguro de realizar el check-out?${paymentStatus === 'no_payment' ? '\n\nNOTA: Esta reserva no tiene pagos registrados. Puede gestionar los pagos después del check-out.' : ''}\n\nEsta acción finalizará la reserva.`
                              );
                              if (confirmed) {
                                const result = await handleStatusChange('finalizada');
                                // El handleStatusChange ya hace reload, no necesitamos más lógica aquí
                              }
                            } catch (error) {
                              console.error('Error en check-out:', error);
                            }
                          }}
                        >
                          🏁 Realizar Check-Out (Registrar salida)
                        </button>
                      </div>
                    )}

                    {/* Ninguna acción disponible */}
                    {!canCheckIn && !canCheckOut && !isCompleted && (
                      <div className="text-center py-8 text-gray-500">
                        <Clock size={48} className="mx-auto mb-2" />
                        <div className="font-semibold text-lg">Sin acciones disponibles</div>
                        <div className="mt-2 text-sm">
                          Estado actual: <span className="font-medium">{reservation.status}</span>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <span className="text-yellow-700 text-sm">
                            ℹ️ Verifique el estado de la reserva y el pago para determinar las acciones disponibles
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab: Vista General */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Estado actual */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Estado Actual</h3>
                <div className="flex items-center gap-3">
                  {(() => {
                    const badge = getReservationStatusBadge(reservation.status);
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                  <span className="text-sm text-gray-600">
                    {formatDateSafe(reservation.created_at)}
                  </span>
                </div>
              </div>

              {/* Información del Huésped */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <User size={18} />
                    Información del Huésped
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Nombre:</span>
                      <span>{reservation.guest_name}</span>
                    </div>
                    {reservation.guest_email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span>{reservation.guest_email}</span>
                      </div>
                    )}
                    {reservation.guest_phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <span>{reservation.guest_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Home size={18} />
                    Información de Estadía
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Check-in: {formatDateSafe(reservation.check_in)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Check-out: {formatDateSafe(reservation.check_out)}</span>
                    </div>
                    {/* Mostrar valor de la habitación y del paquete desde reservation_products */}
                    {reservation.reservation_products && reservation.reservation_products.length > 0 && (
                      (() => {
                        const roomProduct = reservation.reservation_products.find(
                          (rp) => rp.product?.type === 'HOSPEDAJE'
                        );
                        const packageProduct = reservation.reservation_products.find(
                          (rp) => rp.product?.type === 'COMBO'
                        );
                        return (
                          <>
                            {roomProduct && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="font-medium">Habitación:</span>
                                <span className="text-green-900 font-semibold">{roomProduct.product?.name}</span>
                                {roomProduct.unit_price && (
                                  <span className="ml-2 text-green-700 font-semibold">${roomProduct.unit_price.toLocaleString()}</span>
                                )}
                              </div>
                            )}
                            {packageProduct && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="font-medium">Paquete:</span>
                                <span className="text-green-900 font-semibold">{packageProduct.product?.name}</span>
                                {packageProduct.unit_price && (
                                  <span className="ml-2 text-green-700 font-semibold">${packageProduct.unit_price.toLocaleString()}</span>
                                )}
                              </div>
                            )}
                            {roomProduct && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="font-medium">Programa:</span>
                                <span className="text-green-900 font-bold text-xs">{reservation.package_modular_name || reservation.package_code || 'Sin Programa'}</span>
                              </div>
                            )}
                          </>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>

              {/* Resumen Financiero */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <DollarSign size={18} />
                  Resumen Financiero
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium">Total Reserva (con descuento/recargo):</span>
                    <span className="text-2xl font-bold text-blue-900">${totalAmount.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium">Pagado:</span>
                    <span className="text-xl font-bold text-green-700">${paidAmount.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium">Pendiente:</span>
                    <span className="text-xl font-bold text-orange-600">${pendingAmount.toLocaleString('es-CL')}</span>
                  </div>
                </div>
                
                {/* Barra de progreso */}
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${paymentPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Información de Auditoría */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  📋 Información de Auditoría
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Información de creación */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-green-700">👤 Creado por:</span>
                    </div>
                    {auditInfo?.created_by_user ? (
                      <div className="space-y-1">
                        <div className="text-gray-900 font-medium">
                          {auditInfo.created_by_user.name}
                        </div>
                        <div className="text-gray-600">
                          {auditInfo.created_by_user.email}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatDateTimeSafe(reservation.created_at)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">
                        {auditInfo === null ? 'Cargando...' : 'No disponible'}
                      </div>
                    )}
                  </div>

                  {/* Información de última modificación */}
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-blue-700">✏️ Última modificación:</span>
                    </div>
                    {auditInfo?.updated_by_user ? (
                      <div className="space-y-1">
                        <div className="text-gray-900 font-medium">
                          {auditInfo.updated_by_user.name}
                        </div>
                        <div className="text-gray-600">
                          {auditInfo.updated_by_user.email}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatDateTimeSafe(reservation.updated_at)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">
                        {auditInfo === null ? 'Cargando...' : 'No disponible'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones de Gestión */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  ⚙️ Acciones de Gestión
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      window.open(`/dashboard/reservations/${reservation.id}/edit`, '_blank');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileText size={16} />
                    Editar Reserva
                  </button>
                  <button
                    onClick={() => {
                      if (onReservationUpdated) {
                        onReservationUpdated();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Refrescar Datos
                  </button>
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  💡 El botón "Editar Reserva" abre la página de edición en una nueva pestaña. Después de editar, usa "Refrescar Datos" para ver los cambios.
                </p>
              </div>
            </div>
          )}

          {/* Tab: Pagos */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Agregar Nuevo Pago */}
              {pendingAmount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <CreditCard size={18} />
                    Procesar Nuevo Pago
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto a Pagar *
                      </label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        max={pendingAmount}
                        min={0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder={`Máximo: $${pendingAmount.toLocaleString()}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Método de Pago *
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="efectivo">💵 Efectivo</option>
                        <option value="transferencia">🏦 Transferencia</option>
                        <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                        <option value="tarjeta_debito">💳 Tarjeta de Débito</option>
                        <option value="cheque">📄 Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Pago *
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handlePaymentSubmit}
                        disabled={isProcessingPayment || paymentAmount <= 0}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <DollarSign size={16} />
                        {isProcessingPayment ? 'Procesando...' : 'Procesar Pago'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas del Pago (opcional)
                    </label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Agregar notas sobre este pago..."
                    />
                  </div>
                </div>
              )}

              {/* Resumen Financiero */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <DollarSign size={18} />
                  Resumen Financiero
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Total Reserva</div>
                    <div className="text-2xl font-bold text-blue-900">
                      ${totalAmount.toLocaleString('es-CL')}
                    </div>
                    <div className="text-xs text-gray-500">(con descuento/recargo)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Total Pagado</div>
                    <div className="text-2xl font-bold text-green-700">
                      ${paidAmount.toLocaleString('es-CL')}
                    </div>
                    <div className="text-xs text-gray-500">({paymentPercentage.toFixed(1)}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Saldo Pendiente</div>
                    <div className="text-2xl font-bold text-orange-600">
                      ${pendingAmount.toLocaleString('es-CL')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pendingAmount > 0 ? 'Pendiente de pago' : 'Completamente pagado'}
                    </div>
                  </div>
                </div>
                
                {/* Barra de progreso */}
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${paymentPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>{paymentPercentage.toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Historial de Pagos */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Historial de Pagos</h3>
                <SimplePaymentHistory reservationId={reservation.id} />
              </div>
            </div>
          )}

          {/* Tab: Estado */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Estado Actual */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Estado Actual de la Reserva</h3>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-medium ${estado.color}`}>
                  <span>{estado.icon}</span>
                  <span>{estado.label}</span>
                </div>
                  <div className="text-sm text-gray-600">
                                    <div>Creada: {formatDateSafe(reservation.created_at)}</div>
                <div>Actualizada: {lastUpdateDate ? formatDateSafe(lastUpdateDate.toISOString()) : 'Sin datos'}</div>
                </div>
              </div>

              {/* Acciones de Estado */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Cambiar Estado</h3>
                {getNextStatusOptions(reservation.status).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full ${option.color} text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium`}
                    disabled={
                      // Solo permitir check-in si hay pago parcial o total
                      option.value === 'en_curso' &&
                      !(['partial', 'paid'].includes(reservation.payment_status) && ['confirmada', 'active'].includes(reservation.status))
                    }
                  >
                    {option.label}
                  </button>
                ))}
                
                {getNextStatusOptions(reservation.status).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No hay cambios de estado disponibles</p>
                    <p className="text-sm">La reserva está en su estado final</p>
                  </div>
                )}
              </div>

              {/* Timeline de Estados (futuro) */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Próximamente</h4>
                <p className="text-sm text-blue-700">
                  Timeline completo de cambios de estado con fechas y responsables
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Reserva ID: {reservation.id} • Última actualización: {lastUpdateDate ? lastUpdateDate.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin datos'}
            </div>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 