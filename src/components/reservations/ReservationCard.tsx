'use client';

import { Reservation } from '@/types/reservation';
import { ReservationWithClientInfo } from '@/actions/reservations/get-with-client-info';
import { Calendar, User, Phone, Mail, CreditCard, Building, Eye, Trash2, RefreshCw, LogIn, LogOut, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getReservationColor, getCardColor } from '@/utils/reservationColors';
import { checkInReservation, checkOutReservation, confirmReservation } from '@/actions/reservations/update-status';
import { getNextLogicalStatus } from '@/utils/reservationStatus';

interface ReservationCardProps {
  reservation: Reservation | ReservationWithClientInfo;
  onClick?: () => void;
  onDelete?: (reservationId: number) => void;
  onStatusChange?: (reservationId: number, newStatus: string) => void;
  onManage?: () => void; // Nuevo prop para gestionar reserva
  showDeleteButton?: boolean;
  showStatusActions?: boolean;
  showManageButton?: boolean; // Nuevo prop para mostrar botón gestionar
}

export default function ReservationCard({ 
  reservation, 
  onClick, 
  onDelete, 
  onStatusChange, 
  onManage,
  showDeleteButton = false,
  showStatusActions = true,
  showManageButton = false
}: ReservationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la reserva de ${reservation.guest_name}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(reservation.id);
    } catch (error) {
      console.error('Error deleting reservation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (action: string) => {
    if (isUpdatingStatus) return;

    let confirmMessage = '';
    let actionFunction;

    switch (action) {
      case 'checkin':
        confirmMessage = `¿Realizar check-in para ${reservation.guest_name}?`;
        actionFunction = () => checkInReservation(reservation.id);
        break;
      case 'checkout':
        confirmMessage = `¿Realizar check-out para ${reservation.guest_name}?`;
        actionFunction = () => checkOutReservation(reservation.id);
        break;
      case 'confirm':
        confirmMessage = `¿Confirmar reserva de ${reservation.guest_name}?`;
        actionFunction = () => confirmReservation(reservation.id);
        break;
      default:
        return;
    }

    if (!confirm(confirmMessage)) return;

    setIsUpdatingStatus(true);
    try {
      const result = await actionFunction();
      if (result.success) {
        if (onStatusChange) {
          onStatusChange(reservation.id, result.reservation.status);
        }
        // Mostrar mensaje de éxito opcional
        console.log(result.message);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado de la reserva');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Usar la nueva utilidad de colores que combina estado + pago
  const reservationColorInfo = getReservationColor(reservation.status, reservation.payment_status, reservation.paid_amount);
  const cardColorClass = getCardColor(reservation.status, reservation.payment_status, reservation.paid_amount);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_payment':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Funciones auxiliares para manejar ambos tipos de reserva
  const getGuestName = (reservation: Reservation | ReservationWithClientInfo): string => {
    if ('guest_name' in reservation) {
      return reservation.guest_name;
    }
    return (reservation as ReservationWithClientInfo).client_full_name || 'Cliente no encontrado';
  };

  const getGuestEmail = (reservation: Reservation | ReservationWithClientInfo): string => {
    if ('guest_email' in reservation) {
      return reservation.guest_email;
    }
    return 'Sin email';
  };

  const getGuestPhone = (reservation: Reservation | ReservationWithClientInfo): string => {
    if ('guest_phone' in reservation) {
      return reservation.guest_phone;
    }
    return 'Sin teléfono';
  };

  const getRoomNumber = (reservation: Reservation | ReservationWithClientInfo): string => {
    if ('room' in reservation && reservation.room) {
      return reservation.room.number;
    }
    if ('room_code' in reservation) {
      return (reservation as ReservationWithClientInfo).room_code?.replace('habitacion_', '') || 'N/A';
    }
    return 'N/A';
  };

  const getGuestsCount = (reservation: Reservation | ReservationWithClientInfo): number => {
    if ('guests' in reservation) {
      return reservation.guests;
    }
    return 1; // Default para ReservationWithClientInfo
  };

  const getPendingAmount = (reservation: Reservation | ReservationWithClientInfo): number => {
    if ('pending_amount' in reservation) {
      return reservation.pending_amount;
    }
    // Calcular monto pendiente para ReservationWithClientInfo
    return Math.max(0, reservation.total_amount - reservation.paid_amount);
  };

  const getClientType = (reservation: Reservation | ReservationWithClientInfo): string => {
    if ('client_type' in reservation) {
      return reservation.client_type;
    }
    return 'individual'; // Default para ReservationWithClientInfo
  };

  const getCompanyName = (reservation: Reservation | ReservationWithClientInfo): string => {
    if ('company' in reservation && reservation.company) {
      return reservation.company.name;
    }
    return 'Empresa';
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
        onClick ? 'hover:border-blue-300' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">
            {getGuestName(reservation)}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Mail size={14} />
              {getGuestEmail(reservation)}
            </div>
            <div className="flex items-center gap-1">
              <Phone size={14} />
              {getGuestPhone(reservation)}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${reservationColorInfo.bgColor} ${reservationColorInfo.textColor} ${reservationColorInfo.borderColor} border`}>
            {reservationColorInfo.label}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(reservation.payment_status)}`}>
            {reservation.payment_status === 'paid' ? 'Pagado' :
             reservation.payment_status === 'partial' ? 'Parcial' :
             reservation.payment_status === 'no_payment' ? 'Sin pago' :
             reservation.payment_status === 'overdue' ? 'Vencido' : reservation.payment_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} />
          <div>
            <div>Check-in: {formatDate(reservation.check_in)}</div>
            <div>Check-out: {formatDate(reservation.check_out)}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={14} />
          <div>
            <div>Habitación: {getRoomNumber(reservation)}</div>
            <div>Huéspedes: {getGuestsCount(reservation)}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          {getClientType(reservation) === 'corporate' ? (
            <>
              <Building size={14} />
              <span>{getCompanyName(reservation)}</span>
            </>
          ) : (
            <>
              <User size={14} />
              <span>Individual</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-gray-400" />
          <span className="font-medium text-gray-900">
            {formatCurrency(reservation.total_amount)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* Botones de acción de estado */}
          {showStatusActions && (() => {
            const nextStatus = getNextLogicalStatus(reservation.status, reservation.payment_status);
            if (!nextStatus) return null;
            
            const getStatusIcon = (action: string) => {
              switch (action) {
                case 'confirm':
                  return <CheckCircle size={14} />;
                case 'checkin':
                  return <LogIn size={14} />;
                case 'checkout':
                  return <LogOut size={14} />;
                default:
                  return <CheckCircle size={14} />;
              }
            };

            return (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(nextStatus.action)}
                disabled={isUpdatingStatus}
                className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300"
              >
                {isUpdatingStatus ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    {getStatusIcon(nextStatus.action)}
                    {nextStatus.label}
                  </>
                )}
              </Button>
            );
          })()}
        </div>

        <div className="flex items-center gap-2">
          {showManageButton && onManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManage}
              className="flex items-center gap-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 border-purple-200 hover:border-purple-300"
            >
              <Eye size={14} />
              Gestionar
            </Button>
          )}
          <Link
            href={`/dashboard/reservations/${reservation.id}`}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            <Eye size={14} />
            Ver Detalle
          </Link>
          {showDeleteButton && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
            >
              {isDeleting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Eliminar
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {reservation.reservation_products && reservation.reservation_products.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Servicios incluidos:</div>
          <div className="flex flex-wrap gap-1">
            {reservation.reservation_products.slice(0, 3).map((product) => (
              <span 
                key={product.id}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {product.product?.name || 'Servicio'}
              </span>
            ))}
            {reservation.reservation_products.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{reservation.reservation_products.length - 3} más
              </span>
            )}
          </div>
        </div>
      )}

      {getPendingAmount(reservation) > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Pendiente:</span>
            <span className="font-medium text-red-600">
              {formatCurrency(getPendingAmount(reservation))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 