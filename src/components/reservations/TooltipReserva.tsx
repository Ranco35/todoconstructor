'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getReservationComments, 
  getReservationMainComment,
  ReservationComment 
} from '@/actions/reservations/comments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Settings } from 'lucide-react';
import { calculateReservationTotalAmount } from '@/utils/currency';

interface TooltipReservaProps {
  reserva: {
    id: number;
    compositeId?: string;
    client_full_name: string;
    package_name: string;
    room_code: string;
    check_in: string;
    check_out: string;
    payment_status: string;
    total_amount: number;
    status: string;
    paid_amount: number;
  };
  user: { 
    name?: string; 
    email: string;
  };
  children: React.ReactNode;
  onOpenManagement?: () => void; // Nueva prop para abrir modal de gestión
}

export function TooltipReserva({ reserva, user, children, onOpenManagement }: TooltipReservaProps) {
  const [comments, setComments] = useState<ReservationComment[]>([]);
  const [mainComment, setMainComment] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPositionLocked, setIsPositionLocked] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    position: 'bottom' | 'top' | 'left' | 'right';
    transform: string;
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
    isFixed?: boolean;
  }>({
    position: 'bottom',
    transform: '-translate-x-1/2',
    left: '0',
    isFixed: false
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadComments();
      if (!isPositionLocked) {
        calculateTooltipPosition();
        // Bloquear posición después de un pequeño delay
        setTimeout(() => {
          setIsPositionLocked(true);
        }, 50);
      }
    } else {
      // Resetear bloqueo cuando se cierra
      setIsPositionLocked(false);
    }
  }, [isOpen, reserva.id]);

  // Cerrar tooltip al hacer clic fuera y manejar scroll/resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsClicked(false);
      }
    };

    const handleResize = () => {
      if (isOpen && !isPositionLocked) {
        // Solo recalcular en resize si no está bloqueado
        // Usar debounce para evitar múltiples recálculos
        const resizeTimeout = setTimeout(() => {
          if (isOpen && !isPositionLocked) {
            calculateTooltipPosition();
          }
        }, 250); // Aumentado de 100ms a 250ms para más estabilidad
        
        return () => clearTimeout(resizeTimeout);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Solo escuchar resize, no scroll para evitar saltos
      window.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Función para calcular la mejor posición del tooltip usando estrategia por zonas
  const calculateTooltipPosition = () => {
    if (!triggerRef.current || isPositionLocked) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Dimensiones estimadas del tooltip (320px ancho, 400px alto máximo)
    const tooltipWidth = 320;
    const tooltipHeight = 400;
    
    // Margen mínimo del viewport
    const margin = 10;
    
    // Calcular posiciones disponibles
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    const triggerMiddle = triggerRect.top + triggerRect.height / 2;
    
    let positionStyles: any = {};
    
    // 🎯 ESTRATEGIA MEJORADA - Detectar bordes y expandir hacia el lado contrario
    
    // Determinar posición vertical
    let verticalPosition: 'top' | 'bottom';
    const spaceBelow = viewportHeight - triggerRect.bottom - margin;
    const spaceAbove = triggerRect.top - margin;
    
    if (spaceBelow >= tooltipHeight || spaceBelow > spaceAbove) {
      // Hay espacio abajo o es más que arriba
      verticalPosition = 'bottom';
      positionStyles.top = '100%';
      positionStyles.marginTop = '8px';
    } else {
      // Mostrar arriba
      verticalPosition = 'top';
      positionStyles.bottom = '100%';
      positionStyles.marginBottom = '8px';
    }
    
    // Determinar posición horizontal con detección de bordes
    let horizontalPosition: 'left' | 'center' | 'right';
    const spaceLeft = triggerRect.left - margin;
    const spaceRight = viewportWidth - triggerRect.right - margin;
    
    // Calcular si el tooltip cabe centrado
    const tooltipHalfWidth = tooltipWidth / 2;
    const canCenter = (triggerCenter - tooltipHalfWidth >= margin) && 
                     (triggerCenter + tooltipHalfWidth <= viewportWidth - margin);
    
    if (canCenter) {
      // Centrar si hay espacio suficiente
      horizontalPosition = 'center';
      positionStyles.left = '50%';
      positionStyles.transform = 'translateX(-50%)';
    } else if (spaceRight >= tooltipWidth) {
      // Expandir hacia la derecha
      horizontalPosition = 'right';
      positionStyles.left = '0px';
      positionStyles.transform = 'none';
    } else if (spaceLeft >= tooltipWidth) {
      // Expandir hacia la izquierda
      horizontalPosition = 'left';
      positionStyles.right = '0px';
      positionStyles.transform = 'none';
    } else {
      // Caso extremo: ajustar al borde más cercano
      if (triggerCenter < viewportWidth / 2) {
        // Más cerca del borde izquierdo
        horizontalPosition = 'left';
        positionStyles.left = '0px';
        positionStyles.transform = 'none';
        // Ajustar ancho máximo si es necesario
        positionStyles.maxWidth = `${triggerRect.right - margin}px`;
      } else {
        // Más cerca del borde derecho
        horizontalPosition = 'right';
        positionStyles.right = '0px';
        positionStyles.transform = 'none';
        // Ajustar ancho máximo si es necesario
        positionStyles.maxWidth = `${viewportWidth - triggerRect.left - margin}px`;
      }
    }
    
    // Aplicar estilos adicionales para evitar parpadeos
    positionStyles.zIndex = '9999';
    positionStyles.pointerEvents = 'auto';
    
    // Si está muy cerca de los bordes, reducir el ancho máximo
    if (triggerRect.left < margin * 2) {
      positionStyles.maxWidth = `${viewportWidth - margin * 2}px`;
    } else if (triggerRect.right > viewportWidth - margin * 2) {
      positionStyles.maxWidth = `${triggerRect.left - margin}px`;
    }

    setTooltipPosition({
      position: verticalPosition,
      isFixed: true,
      ...positionStyles
    });
  };

  const loadComments = async () => {
    try {
      const [commentsData, mainCommentData] = await Promise.all([
        getReservationComments(reserva.id),
        getReservationMainComment(reserva.id)
      ]);
      setComments(commentsData);
      setMainComment(mainCommentData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleMouseEnter = () => {
    if (!isClicked) {
      // Limpiar timeout previo si existe
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      
      // Reducir el retardo para respuesta más rápida
      const timeout = setTimeout(() => {
        setIsOpen(true);
      }, 150); // Reducido de 200ms a 150ms
      
      setHoverTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    if (!isClicked) {
      // Limpiar timeout de apertura si existe
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      
      // Agregar pequeño retardo para evitar cierres accidentales
      const closeTimeout = setTimeout(() => {
        setIsOpen(false);
      }, 100);
      
      setHoverTimeout(closeTimeout);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click se propague al padre
    setIsClicked(true);
    setIsOpen(true);
  };

  const handleClose = () => {
    // Limpiar timeout si existe
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    setIsOpen(false);
    setIsClicked(false);
    setIsPositionLocked(false);
  };

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const handleOpenManagement = () => {
    if (onOpenManagement) {
      handleClose(); // Cerrar el tooltip primero
      onOpenManagement(); // Abrir el modal de gestión
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // ✅ CORRECCIÓN: Solo mostrar fecha sin hora para check-in/check-out
      // Evitar problemas de zona horaria usando formato solo de fecha
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'partial': return 'Parcial';
      case 'no_payment': return 'Sin pago';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'prereserva': return 'Pre-reserva';
      case 'confirmada': return 'Confirmada';
      case 'en_curso': return 'En curso';
      case 'finalizada': return 'Finalizada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prereserva': return 'bg-yellow-100 text-yellow-800';
      case 'confirmada': return 'bg-green-100 text-green-800';
      case 'en_curso': return 'bg-orange-100 text-orange-800';
      case 'finalizada': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calcular clases CSS para el tooltip basado en la posición
  const getTooltipClasses = () => {
    const baseClasses = "absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4";
    // Remover transiciones que causan parpadeo
    const stableClasses = "transform-gpu will-change-transform";
    
    return `${baseClasses} ${stableClasses}`.trim();
  };

  // Calcular estilos inline para el tooltip
  const getTooltipStyles = () => {
    const styles: React.CSSProperties = {
      ...tooltipPosition,
      maxHeight: '400px',
      overflowY: 'auto' as const,
      // Agregar propiedades para estabilidad
      backfaceVisibility: 'hidden',
      perspective: '1000px',
      transformStyle: 'preserve-3d'
    };
    
    // Remover propiedades que no son estilos CSS válidos
    delete (styles as any).position;
    
    return styles;
  };

  return (
    <div className="relative group">
      {/* Trigger */}
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-pointer"
      >
        {children}
      </div>

      {/* Tooltip */}
      {isOpen && (
        <div 
          ref={tooltipRef}
          className={getTooltipClasses()}
          style={getTooltipStyles()}
          onClick={(e) => e.stopPropagation()} // Evitar que clicks dentro del tooltip se propaguen
        >
          {/* Header con botón cerrar */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {reserva.client_full_name}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Hab. {reserva.room_code} • {reserva.package_name}
              </p>
              <p className="text-xs text-gray-600">
                {formatDate(reserva.check_in)} - {formatDate(reserva.check_out)}
              </p>
              <p className="text-xs text-gray-600">
                Total: {formatCurrency(calculateReservationTotalAmount(reserva))}
              </p>
              <p className="text-xs text-gray-600">
                Pagado: {formatCurrency(reserva.paid_amount)} • {getPaymentStatusText(reserva.payment_status)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(reserva.status)}`}>
                  {getStatusText(reserva.status)}
                </span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-lg font-bold ml-2 flex-shrink-0"
              title="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Botón de Gestión de Reserva */}
          {onOpenManagement && (
            <div className="mb-4 border-b border-gray-200 pb-3">
              <button
                onClick={handleOpenManagement}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                title="Abrir gestión completa de la reserva"
              >
                <Settings size={14} />
                Gestionar Reserva
              </button>
            </div>
          )}

          {/* Comentario Principal */}
          {mainComment && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                Comentario Principal
              </h4>
              <div className="bg-gray-50 p-3 rounded text-xs text-gray-800">
                {mainComment}
              </div>
            </div>
          )}

          {/* Historial de Comentarios */}
          {comments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                Comentarios Adicionales ({comments.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-blue-50 p-2 rounded text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-blue-800">
                        {comment.author}
                      </span>
                      <span className="text-blue-600 text-xs">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-blue-900">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mostrar mensaje si no hay comentarios */}
          {!mainComment && comments.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">
                No hay comentarios registrados
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 