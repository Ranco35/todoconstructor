'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Filter, Search, Info, Users, Clock, CreditCard, Bed, DollarSign, Eye, RefreshCw } from 'lucide-react';
import { Reservation, Room, SpaProduct, Company } from '@/types/reservation';
import { RealLodgingProgram } from '@/actions/reservations/real-lodging-programs';
import { isSameDay } from 'date-fns';
import { formatDateSafe } from '@/utils/dateUtils';
import { parseCompositeReservationId } from '@/utils/reservationUtils';

// Importaciones dinámicas para componentes pesados
import dynamic from 'next/dynamic';

// Lazy loading de componentes pesados
const ReservationCard = dynamic(() => import('./ReservationCard'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-20"></div>
});

const ModularReservationForm = dynamic(() => import('./ModularReservationForm'), {
  loading: () => <div className="animate-pulse bg-white rounded-lg h-96 border"></div>
});

const ReservationManagementModal = dynamic(() => import('./ReservationManagementModal'), {
  loading: () => <div className="animate-pulse bg-white rounded-lg h-96"></div>
});

const ReservationFilters = dynamic(() => import('./ReservationFilters'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded h-10"></div>
});

const ReservationStats = dynamic(() => import('./ReservationStats'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded h-20"></div>
});

const TooltipReserva = dynamic(() => import('./TooltipReserva').then(mod => ({ default: mod.TooltipReserva })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded p-2"></div>
});

// Importaciones normales para acciones (optimizadas después)
import { getReservationById } from '@/actions/reservations/get';
import { getReservationsWithClientInfo, getReservationWithClientInfoById, type ReservationWithClientInfo } from '@/actions/reservations/get-with-client-info';
import { getCalendarColor, getCalendarColorExplicit, RESERVATION_COLOR_LEGEND } from '@/utils/reservationColors';

// Tipos importados arriba

interface ReservationCalendarProps {
  initialReservations: Reservation[];
  rooms: Room[];
  spaProducts: SpaProduct[];
  lodgingPrograms: RealLodgingProgram[];
  companies: Company[];
}

export default function ReservationCalendar({
  initialReservations,
  rooms,
  spaProducts,
  lodgingPrograms,
  companies
}: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('week');
  const [reservations, setReservations] = useState<ReservationWithClientInfo[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<ReservationWithClientInfo[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Nuevos estados para el modal de reservas del día
  const [showDayReservationsModal, setShowDayReservationsModal] = useState(false);
  const [selectedDayReservations, setSelectedDayReservations] = useState<ReservationWithClientInfo[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);

  // Estado para el usuario actual
  const [currentUser, setCurrentUser] = useState<{ name?: string; email: string } | null>(null);

  // Cargar usuario actual
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { getCurrentUser } = await import('@/actions/configuration/auth-actions');
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser({
            name: user.name || user.email,
            email: user.email
          });
        }
      } catch (error) {
        console.error('Error loading current user:', error);
        // Fallback al usuario mock
        setCurrentUser({
          name: 'Admin',
          email: 'admin@termas.com'
        });
      }
    };

    loadCurrentUser();
  }, []);

  // Función para cargar/recargar reservas con información completa del cliente
  const loadReservationsWithClientInfo = async () => {
    try {
      console.log('🔄 Actualizando datos del calendario...');
      const reservationsWithClientInfo = await getReservationsWithClientInfo();
      setReservations(reservationsWithClientInfo);
      setFilteredReservations(reservationsWithClientInfo);
      console.log('✅ Datos del calendario actualizados correctamente');
      // console.log('[DEBUG] RESERVATIONS WITH CLIENT INFO:', reservationsWithClientInfo);
    } catch (error) {
      console.error('Error loading reservations with client info:', error);
    }
  };

  // Cargar reservas al inicializar el componente
  useEffect(() => {
    loadReservationsWithClientInfo();
  }, []);

  // Función para forzar recarga completa con invalidación de cache
  const forceReloadCalendar = async () => {
    try {
      console.log('🔄 Forzando recarga completa del calendario...');
      
      // Invalidar cache del navegador para las APIs de reservas
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Recargar datos
      await loadReservationsWithClientInfo();
      console.log('✅ Recarga completa del calendario finalizada');
    } catch (error) {
      console.error('Error en recarga completa:', error);
      // Fallback: recargar página
      window.location.reload();
    }
  };

  // Escuchar cambios en la URL para refrescar después de ediciones
  useEffect(() => {
    const handleStorageChange = () => {
      loadReservationsWithClientInfo();
    };

    const handleFocus = () => {
      // Recargar cuando la ventana recupera el foco (útil cuando se abre edición en nueva pestaña)
      console.log('🔍 Ventana recuperó el foco - recargando calendario...');
      loadReservationsWithClientInfo();
    };

    // Escuchar eventos personalizados para recarga forzada
    const handleForceReload = () => {
      forceReloadCalendar();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('force-calendar-reload', handleForceReload);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('force-calendar-reload', handleForceReload);
    };
  }, []);

  // console.log('[DEBUG] RESERVATIONS:', reservations);
  // console.log('[DEBUG] ROOMS:', rooms);

  // Filtrar reservas por término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredReservations(reservations);
      return;
    }

    const filtered = reservations.filter(reservation => 
      reservation.client_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.room_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReservations(filtered);
  }, [reservations, searchTerm]);

  // Navegación del calendario
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtener reservas para el período actual
  const getReservationsForPeriod = () => {
    const startOfPeriod = new Date(currentDate);
    const endOfPeriod = new Date(currentDate);

    if (viewType === 'month') {
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
      endOfPeriod.setDate(0);
      endOfPeriod.setHours(23, 59, 59, 999);
    } else if (viewType === 'week') {
      const dayOfWeek = startOfPeriod.getDay();
      startOfPeriod.setDate(startOfPeriod.getDate() - dayOfWeek);
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod.setDate(startOfPeriod.getDate() + 6);
      endOfPeriod.setHours(23, 59, 59, 999);
    } else { // day
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod.setHours(23, 59, 59, 999);
    }

    console.log('[DEBUG] Filtering reservations for period:', {
      viewType,
      startOfPeriod: startOfPeriod.toISOString(),
      endOfPeriod: endOfPeriod.toISOString(),
      totalReservations: filteredReservations.length
    });

    const periodReservations = filteredReservations.filter(reservation => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      
      // Una reserva está en el período si:
      // - El check-in está en el período, O
      // - El check-out está en el período, O  
      // - La reserva abarca todo el período
      const isInPeriod = (checkIn <= endOfPeriod && checkOut >= startOfPeriod);
      
      if (viewType === 'day') {
        // Para vista diaria, solo mostrar reservas que estén activas en este día específico
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        return checkIn <= dayEnd && checkOut > dayStart;
      }
      
      return isInPeriod;
    });

    console.log('[DEBUG] Period reservations found:', periodReservations.length);
    return periodReservations;
  };

  const periodReservations = getReservationsForPeriod();
  
  // TEMPORAL: Mostrar todas las reservas para debug
      // console.log('[DEBUG] All reservations loaded:', filteredReservations);
      // console.log('[DEBUG] Period reservations:', periodReservations);
  // console.log('[DEBUG] Rooms available:', rooms);

  // Obtener semana actual para mostrar en el header
  const getCurrentWeekRange = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    return { startOfWeek, endOfWeek };
  };

  const { startOfWeek, endOfWeek } = getCurrentWeekRange();

  // Función para gestionar reserva
  const gestionarReserva = (roomId: number, date: Date) => {
    const dayReservations = periodReservations.filter(reservation => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      const isSameRoom = reservation.room?.id === roomId;
      const isOccupied = date >= checkIn && date < checkOut;
      return isSameRoom && isOccupied;
    });

    if (dayReservations.length > 0) {
      const reservation = dayReservations[0];
      setLoadingReservation(true);
      getReservationById(reservation.id).then((fresh) => {
        setSelectedReservation(fresh);
        setShowManagementModal(true);
        setLoadingReservation(false);
      });
    } else {
      // Crear nueva reserva
      setShowCreateModal(true);
    }
  };

  // Función para mostrar todas las reservas de un día
  const showAllDayReservations = (date: Date, dayReservations: ReservationWithClientInfo[]) => {
    setSelectedDayReservations(dayReservations);
    setSelectedDayDate(date);
    setShowDayReservationsModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 text-center">
          <h1 className="text-4xl font-light mb-2">🏨 Gestión de Reservas</h1>
          <p className="text-xl opacity-90">Hotel Spa Termas - Sistema de Ocupación</p>
        </div>

        {/* Controles */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Navegación de fechas */}
          <div className="flex items-center gap-4">
            <button 
              onClick={goToPreviousPeriod}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5"
            >
                ← {viewType === 'month' ? 'Mes Anterior' : viewType === 'week' ? 'Semana Anterior' : 'Día Anterior'}
            </button>
            
              <div className="font-semibold text-gray-800 text-lg">
                {viewType === 'month' && (
                  <span>📅 {formatDateSafe(currentDate, { month: 'long', year: 'numeric' })}</span>
                )}
                {viewType === 'week' && (
                  <span>📅 Semana del {formatDateSafe(startOfWeek, { day: 'numeric', month: 'long' })} al {formatDateSafe(endOfWeek, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                )}
                {viewType === 'day' && (
                  <span>📅 {formatDateSafe(currentDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                )}
              </div>
            
            <button 
              onClick={goToNextPeriod}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5"
            >
                {viewType === 'month' ? 'Mes Siguiente' : viewType === 'week' ? 'Semana Siguiente' : 'Día Siguiente'} →
            </button>
          </div>
          
            {/* Leyenda */}
            <div className="flex gap-6 flex-wrap">
              {RESERVATION_COLOR_LEGEND.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded border-2 border-gray-300 ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Controles adicionales */}
          <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
                        <button 
              onClick={goToToday}
              className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors text-sm"
            >
              Hoy
            </button>
            
            <button 
              onClick={forceReloadCalendar}
              className="text-green-600 hover:bg-green-50 px-3 py-1 rounded-md transition-colors text-sm flex items-center gap-1"
              title="Refrescar datos del calendario (fuerza recarga completa)"
            >
              <RefreshCw size={14} />
              Actualizar
            </button>
            
            <div className="flex items-center gap-2">
              {(['month', 'week', 'day'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewType === type 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type === 'month' ? 'Mes' : type === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar reservas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <ReservationFilters
          reservations={reservations}
          onFilterChange={setFilteredReservations}
          rooms={rooms}
          companies={companies}
        />
      )}

        {/* Calendario */}
        <div className="p-8">
          {viewType === 'week' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-spacing-2 min-w-[800px]">
                <thead>
                  <tr>
                    <th className="bg-gradient-to-br from-gray-700 to-gray-800 text-white p-4 text-center font-semibold rounded-t-lg w-32">
                      Habitación / Día
                    </th>
                    {Array.from({ length: 7 }, (_, i) => {
                      // ✅ CORRECCIÓN: Método robusto que evita problemas de zona horaria
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                      const startOfWeek = new Date(date.getTime() - (date.getDay() * 24 * 60 * 60 * 1000));
                      const dayDate = new Date(startOfWeek.getTime() + (i * 24 * 60 * 60 * 1000));
                      
                      return (
                        <th key={i} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 text-center font-semibold rounded-t-lg">
                          {formatDateSafe(dayDate, { weekday: 'short', day: 'numeric' })}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 p-2 text-center font-semibold border-b border-r w-32">
                        {room.number} <span className="block text-xs font-normal text-gray-500">{room.type}</span>
                      </td>
                      {Array.from({ length: 7 }, (_, i) => {
                        // ✅ CORRECCIÓN: Mismo método robusto para consistencia
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                        const startOfWeek = new Date(date.getTime() - (date.getDay() * 24 * 60 * 60 * 1000));
                        const dayDate = new Date(startOfWeek.getTime() + (i * 24 * 60 * 60 * 1000));
                        
                        // LOG para depuración - comentado para reducir spam
                        // reservations.forEach(r => {
                        //   if (r.room_code === room.number) {
                        //     console.log('[RESERVA MATCH]', {
                        //       room_code: r.room_code,
                        //       room_number: room.number,
                        //       check_in: r.check_in,
                        //       check_out: r.check_out,
                        //       cell_date: dayDate.toISOString().slice(0, 10)
                        //     });
                        //   }
                        // });
                        // Filtrar solo reservas de esta habitación y este día
                        const cellReservations = periodReservations.filter(r => {
                          // Manejar ambos formatos: "102" y "habitacion_102"
                          const roomMatch = r.room_code === room.number || 
                                          r.room_code === `habitacion_${room.number}` ||
                                          r.room_code.replace('habitacion_', '') === room.number;
                          
                          // ✅ CORRECCIÓN: Usar formato de fecha local para evitar problemas de zona horaria
                          const cellDate = dayDate.getFullYear() + '-' + 
                                         String(dayDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                         String(dayDate.getDate()).padStart(2, '0');
                          const checkInDate = r.check_in.slice(0, 10); // Solo la parte de fecha
                          const checkOutDate = r.check_out.slice(0, 10); // Solo la parte de fecha
                          
                          // Comparar fechas como strings para evitar problemas de zona horaria
                          const dateMatch = cellDate >= checkInDate && cellDate < checkOutDate;
                          
                          // DEBUG REMOVIDO: Calendario funciona correctamente
                          
                          return roomMatch && dateMatch;
                        });
                        return (
                          <td key={i} className="border-b border-r min-h-[60px] align-top p-1">
                            {cellReservations.length === 0 ? (
                              <div className="text-xs text-gray-400 text-center">Disponible</div>
                            ) : (
                              <>
                                {/* Mostrar las primeras 2 reservas */}
                                                                {cellReservations.slice(0, 2).map((reservation) => {
                                const colorClass = getCalendarColorExplicit(reservation.status, reservation.payment_status, reservation.paid_amount, reservation.total_amount);
                                return (
                                  <TooltipReserva
                                    key={reservation.compositeId}
                                    reserva={reservation}
                                    user={currentUser}
                                    onOpenManagement={() => {
                                      // Abrir modal de gestión desde el tooltip
                                      setLoadingReservation(true);
                                      
                                      try {
                                        // Parsear ID compuesto para obtener ID principal
                                        const { reservationId } = parseCompositeReservationId(reservation.compositeId);
                                        console.log('🔧 [TOOLTIP] Opening management modal for reservation ID:', reservationId);
                                        
                                        getReservationWithClientInfoById(reservationId).then((fresh) => {
                                          if (fresh) {
                                            // Convertir a formato compatible con el modal
                                            const modalReservation = {
                                              ...fresh,
                                              guest_name: fresh.client_full_name,
                                              package_modular_name: fresh.package_name,
                                              room: fresh.room,
                                              reservation_products: fresh.reservation_products
                                            } as any;
                                            setSelectedReservation(modalReservation);
                                            setShowManagementModal(true);
                                          }
                                          setLoadingReservation(false);
                                        });
                                      } catch (error) {
                                        console.error('❌ [ERROR] Invalid composite ID:', reservation.compositeId, error);
                                        setLoadingReservation(false);
                                      }
                                    }}
                                  >
                                    <div
                                      onDoubleClick={(e) => {
                                        // 🎯 USAR ID COMPUESTO - Elimina confusión definitivamente
                                        console.log('🔍 [DEBUG] Double click - Composite ID:', reservation.compositeId);
                                        setLoadingReservation(true);
                                        
                                        try {
                                          // Parsear ID compuesto para obtener ID principal
                                          const { reservationId } = parseCompositeReservationId(reservation.compositeId);
                                          console.log('✅ [DEBUG] Parsed reservation ID:', reservationId);
                                          
                                          getReservationWithClientInfoById(reservationId).then((fresh) => {
                                          if (fresh) {
                                              console.log('✅ [DEBUG] Fresh reservation data loaded:', fresh);
                                            // Convertir a formato compatible con el modal
                                            const modalReservation = {
                                              ...fresh,
                                              guest_name: fresh.client_full_name,
                                              package_modular_name: fresh.package_name,
                                              room: fresh.room,
                                              reservation_products: fresh.reservation_products
                                            } as any;
                                            setSelectedReservation(modalReservation);
                                            setShowManagementModal(true);
                                          }
                                          setLoadingReservation(false);
                                        });
                                        } catch (error) {
                                          console.error('❌ [ERROR] Invalid composite ID:', reservation.compositeId, error);
                                          setLoadingReservation(false);
                                        }
                                      }}
                                      className={`text-xs px-2 py-1 mb-1 rounded cursor-pointer hover:opacity-90 ${colorClass}`}
                                      title={`${reservation.package_name} - Click para comentarios, Doble click para editar`}
                                    >
                                      <span className="font-semibold text-black">
                                        {reservation.client_full_name}
                                      </span>
                                      <span className="ml-1 text-gray-600">({room.number})</span>
                                      <div className="font-bold text-xs text-black mt-0.5">
                                        {reservation.package_name}
                                      </div>
                                    </div>
                                  </TooltipReserva>
                                );
                                })}
                                
                                {/* Botón "+X más" si hay más de 2 reservas */}
                                {cellReservations.length > 2 && (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showAllDayReservations(dayDate, cellReservations);
                                    }}
                                    className="text-xs px-2 py-1 mb-1 rounded cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-center transition-colors"
                                    title={`Ver todas las ${cellReservations.length} reservas de este día`}
                                  >
                                    +{cellReservations.length - 2} más
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
            ))}
                </tbody>
              </table>
        </div>
      )}

          {viewType === 'month' && (
            <div className="grid grid-cols-7 gap-1">
              {/* Días de la semana */}
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                  {day}
                </div>
              ))}
              
              {/* Días del mes */}
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                date.setDate(date.getDate() + i - date.getDay());
                
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                // Filtrar reservas para este día
                const dayReservations = periodReservations.filter(reservation => {
                  const checkIn = new Date(reservation.check_in);
                  const checkOut = new Date(reservation.check_out);
                  return date >= checkIn && date < checkOut;
                });
                return (
                  <div
                    key={i}
                    className={`p-2 min-h-[80px] border border-gray-200 rounded-lg cursor-pointer transition-colors ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                    <div className="space-y-1">
                      {dayReservations.slice(0, 4).map((reservation) => {
                        const colorClass = getCalendarColorExplicit(reservation.status, reservation.payment_status, reservation.paid_amount, reservation.total_amount);
                        return (
                          <TooltipReserva
                            key={reservation.compositeId}
                            reserva={reservation}
                            user={currentUser}
                          >
                            <div
                              onDoubleClick={(e) => {
                                // 🎯 USAR ID COMPUESTO - Vista mensual también
                                console.log('🔍 [DEBUG] Double click monthly - Composite ID:', reservation.compositeId);
                              setLoadingReservation(true);
                                
                                try {
                                  // Parsear ID compuesto para obtener ID principal
                                  const { reservationId } = parseCompositeReservationId(reservation.compositeId);
                                  console.log('✅ [DEBUG] Parsed reservation ID (monthly):', reservationId);
                                  
                                  getReservationWithClientInfoById(reservationId).then((fresh) => {
                                  if (fresh) {
                                      console.log('✅ [DEBUG] Fresh reservation data loaded (monthly):', fresh);
                                    // Convertir a formato compatible con el modal
                                    const modalReservation = {
                                      ...fresh,
                                      guest_name: fresh.client_full_name,
                                      package_modular_name: fresh.package_name,
                                      room: fresh.room,
                                      reservation_products: fresh.reservation_products
                                    } as any;
                                    setSelectedReservation(modalReservation);
                                setShowManagementModal(true);
                                  }
                                setLoadingReservation(false);
                              });
                                } catch (error) {
                                  console.error('❌ [ERROR] Invalid composite ID (monthly):', reservation.compositeId, error);
                                  setLoadingReservation(false);
                                }
                            }}
                              className={`text-xs px-2 py-1 mb-1 rounded cursor-pointer hover:opacity-90 transition-opacity border border-current border-opacity-30 truncate ${colorClass}`}
                              style={{ minWidth: 0 }}
                              title={`${reservation.package_name} - Click para comentarios, Doble click para editar`}
                          >
                              <div className="font-bold truncate">{reservation.client_full_name}{reservation.room_code && <span className="ml-1 font-normal text-[10px] text-gray-700">({reservation.room_code})</span>}</div>
                              <div className="font-bold text-[11px] text-black leading-tight">{reservation.package_name}</div>
                          </div>
                          </TooltipReserva>
                        );
                      })}
                      {dayReservations.length > 4 && (
                        <button
                          onClick={() => showAllDayReservations(date, dayReservations)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                          title={`Ver todas las ${dayReservations.length} reservas de este día`}
                        >
                          +{dayReservations.length - 4} más
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

                    {viewType === 'day' && (
            <div className="space-y-6">
              {/* Header del día */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {formatDateSafe(currentDate, { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {periodReservations.length === 0 
                        ? 'No hay reservas para este día' 
                        : `${periodReservations.length} reserva${periodReservations.length > 1 ? 's' : ''} activa${periodReservations.length > 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Nueva Reserva
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de reservas del día */}
              {periodReservations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    No hay reservas para este día
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Este día está disponible para nuevas reservas
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus size={16} />
                    Crear Nueva Reserva
                  </button>
                </div>
              ) : (
                                <div className="grid gap-6">
                  {periodReservations.map((reservation, index) => {
                    const colorClass = getCalendarColorExplicit(reservation.status, reservation.payment_status, reservation.paid_amount, reservation.total_amount);
                    return (
                    <div key={reservation.compositeId} className="p-1 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200">
                                         <TooltipReserva
                       reserva={reservation}
                       user={currentUser}
                       onOpenManagement={() => {
                         // Abrir modal de gestión desde el tooltip en vista diaria
                         setLoadingReservation(true);
                         
                         try {
                           // Parsear ID compuesto para obtener ID principal
                           const { reservationId } = parseCompositeReservationId(reservation.compositeId);
                           console.log('🔧 [TOOLTIP-DAY] Opening management modal for reservation ID:', reservationId);
                           
                           getReservationWithClientInfoById(reservationId).then((fresh) => {
                             if (fresh) {
                               // Convertir a formato compatible con el modal
                               const modalReservation = {
                                 ...fresh,
                                 guest_name: fresh.client_full_name,
                                 package_modular_name: fresh.package_name,
                                 room: fresh.room,
                                 reservation_products: fresh.reservation_products
                               } as any;
                               setSelectedReservation(modalReservation);
                               setShowManagementModal(true);
                             }
                             setLoadingReservation(false);
                           });
                         } catch (error) {
                           console.error('❌ [ERROR] Invalid composite ID:', reservation.compositeId, error);
                           setLoadingReservation(false);
                         }
                       }}
                     >
                      <div className={`relative border-l-8 border-r-4 border-t-4 border-b-4 rounded-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-102 shadow-lg ${colorClass}`}
                            style={{
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
                              borderRadius: '16px',
                              marginBottom: index < periodReservations.length - 1 ? '8px' : '0'
                            }}>
                                                  {/* Etiqueta de estado en esquina superior derecha */}
                          <div className="absolute top-4 right-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                              reservation.payment_status === 'paid' ? 'bg-green-500 text-white' :
                              reservation.payment_status === 'partial' ? 'bg-yellow-500 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              {reservation.payment_status === 'paid' ? '💰 PAGADO' :
                               reservation.payment_status === 'partial' ? '⚠️ PARCIAL' :
                               '❌ PENDIENTE'}
                            </div>
                          </div>

                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-20">
                            {/* Información del cliente */}
                                                          <div className="flex items-center gap-3 mb-3">
                                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                                  reservation.status === 'active' ? 'bg-green-100' :
                                  reservation.status === 'en_curso' ? 'bg-blue-100' :
                                  reservation.status === 'finalizada' ? 'bg-gray-100' :
                                  'bg-yellow-100'
                                }`}>
                                  <Users className={`w-6 h-6 ${
                                    reservation.status === 'active' ? 'text-green-600' :
                                    reservation.status === 'en_curso' ? 'text-blue-600' :
                                    reservation.status === 'finalizada' ? 'text-gray-600' :
                                    'text-yellow-600'
                                  }`} />
                                  {/* Indicador de estado mini en el avatar */}
                                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                    reservation.status === 'active' ? 'bg-green-500' :
                                    reservation.status === 'en_curso' ? 'bg-blue-500' :
                                    reservation.status === 'finalizada' ? 'bg-gray-500' :
                                    'bg-yellow-500'
                                  }`}></div>
                                </div>
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {reservation.client_full_name}
                                </h3>
                                <p className="text-gray-600">{reservation.package_name}</p>
                              </div>
                            </div>

                            {/* Detalles de la reserva */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Bed className="w-4 h-4" />
                                <span>Habitación {reservation.room_code}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDateSafe(reservation.check_in)} - {formatDateSafe(reservation.check_out)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="w-4 h-4" />
                                <span>${reservation.total_amount.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className={`w-3 h-3 rounded-full ${
                                  reservation.payment_status === 'paid' ? 'bg-green-400' :
                                  reservation.payment_status === 'partial' ? 'bg-yellow-400' :
                                  'bg-red-400'
                                }`}></div>
                                <span className={
                                  reservation.payment_status === 'paid' ? 'text-green-600' :
                                  reservation.payment_status === 'partial' ? 'text-yellow-600' :
                                  'text-red-600'
                                }>
                                  {reservation.payment_status === 'paid' ? 'Pagado' :
                                   reservation.payment_status === 'partial' ? 'Pago Parcial' :
                                   'Sin Pago'}
                                </span>
                              </div>
                            </div>

                                                         {/* Estado de la reserva */}
                             <div className="flex items-center gap-3">
                               <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md border-2 ${
                                 reservation.status === 'active' ? 'bg-green-50 text-green-800 border-green-300' :
                                 reservation.status === 'en_curso' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                 reservation.status === 'finalizada' ? 'bg-gray-50 text-gray-800 border-gray-300' :
                                 'bg-yellow-50 text-yellow-800 border-yellow-300'
                               }`}>
                                 {reservation.status === 'active' ? '🟢 ACTIVA' :
                                  reservation.status === 'en_curso' ? '🔵 EN CURSO' :
                                  reservation.status === 'finalizada' ? '⚫ FINALIZADA' :
                                  '🟡 ' + reservation.status.toUpperCase()}
                               </span>
                               
                               {/* Indicador adicional de tiempo */}
                               <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                 <Clock className="w-3 h-3 inline mr-1" />
                                 {new Date(reservation.check_in) <= new Date() && new Date(reservation.check_out) > new Date() 
                                   ? 'ACTUALMENTE EN HOTEL' 
                                   : new Date(reservation.check_in) > new Date() 
                                   ? 'PRÓXIMA LLEGADA' 
                                   : 'ESTADÍA COMPLETADA'}
                               </span>
                             </div>
                          </div>

                                                     {/* Botones de acción */}
                           <div className="flex items-center gap-2 ml-4">
                             <button
                               onClick={() => {
                                 console.log('🔍 [DEBUG] View button clicked - Composite ID:', reservation.compositeId);
                                 setLoadingReservation(true);
                                 
                                 try {
                                   const { reservationId } = parseCompositeReservationId(reservation.compositeId);
                                   getReservationWithClientInfoById(reservationId).then((fresh) => {
                                     if (fresh) {
                                       const modalReservation = {
                                         ...fresh,
                                         guest_name: fresh.client_full_name,
                                         package_modular_name: fresh.package_name,
                                         room: fresh.room,
                                         reservation_products: fresh.reservation_products
                                       } as any;
                                       setSelectedReservation(modalReservation);
                                       setShowManagementModal(true);
                                     }
                                     setLoadingReservation(false);
                                   });
                                 } catch (error) {
                                   console.error('❌ [ERROR] Invalid composite ID:', reservation.compositeId, error);
                                   setLoadingReservation(false);
                                 }
                               }}
                               className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                               title="Ver/Editar Reserva"
                             >
                               <Eye className="w-5 h-5" />
                               <span className="text-sm font-bold">GESTIONAR</span>
                             </button>
                           </div>
                        </div>
                      </div>
                    </TooltipReserva>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
            >
              + Nueva Reserva
            </button>
            <button 
              onClick={() => {/* Implementar reportes */}}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
            >
              📊 Reportes
            </button>
            <button 
              onClick={() => {/* Implementar exportar */}}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
            >
              📤 Exportar
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
            >
              ⚙️ Configuración
            </button>
          </div>
        </div>
      </div>

      {/* Modal de gestión de reserva */}
      {selectedReservation && showManagementModal && (
        <ReservationManagementModal
          isOpen={showManagementModal}
          onClose={() => {
            setShowManagementModal(false);
            setSelectedReservation(null);
          }}
          reservation={selectedReservation}
          onStatusChange={(reservationId, newStatus) => {
            setReservations(prev => 
              prev.map(r => 
                r.id === reservationId 
                  ? { ...r, status: newStatus as any }
                  : r
              )
            );
          }}
          onPaymentAdded={async (reservationId, amount) => {
            // Recargar los datos completos después del pago
            try {
              const freshReservations = await getReservationsWithClientInfo();
              if (freshReservations.success && freshReservations.data) {
                setReservations(freshReservations.data);
              }
            } catch (error) {
              console.error('Error reloading reservations after payment:', error);
              // Fallback: actualizar solo el monto pagado
            setReservations(prev => 
              prev.map(r => 
                r.id === reservationId 
                  ? { ...r, paid_amount: (r.paid_amount || 0) + amount }
                  : r
              )
            );
            }
          }}
          onReservationUpdated={() => {
            // Recargar todas las reservas cuando se actualiza una
            loadReservationsWithClientInfo();
          }}
          currentUser={currentUser}
        />
      )}

      {/* Modal de creación de reserva */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Nueva Reserva</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <ModularReservationForm
                isEditMode={false}
                onCancel={() => setShowCreateModal(false)}
                onSave={async (formData) => {
                  setShowCreateModal(false);
                  return { success: true };
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de todas las reservas del día */}
      {showDayReservationsModal && selectedDayDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Todas las reservas del {formatDateSafe(selectedDayDate, { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </h2>
                <button
                  onClick={() => setShowDayReservationsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedDayReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay reservas para este día
                  </div>
                ) : (
                  selectedDayReservations.map((reservation) => (
                    <TooltipReserva
                      key={reservation.compositeId}
                      reserva={reservation}
                      user={currentUser}
                    >
                      <div>
                        <ReservationCard
                          reservation={reservation}
                          showManageButton={true}
                          onManage={() => {
                            // 🎯 USAR ID COMPUESTO - Botón gestionar en modal de reservas del día
                            console.log('🔍 [DEBUG] Manage button clicked - Composite ID:', reservation.compositeId);
                            setLoadingReservation(true);
                            
                            try {
                              // Parsear ID compuesto para obtener ID principal
                              const { reservationId } = parseCompositeReservationId(reservation.compositeId);
                              console.log('✅ [DEBUG] Parsed reservation ID (manage button):', reservationId);
                              
                              getReservationWithClientInfoById(reservationId).then((fresh) => {
                              if (fresh) {
                                  console.log('✅ [DEBUG] Fresh reservation data loaded (manage button):', fresh);
                                const modalReservation = {
                                  ...fresh,
                                  guest_name: fresh.client_full_name,
                                  package_modular_name: fresh.package_name,
                                  room: fresh.room,
                                  reservation_products: fresh.reservation_products
                                } as any;
                                setSelectedReservation(modalReservation);
                                setShowManagementModal(true);
                                setShowDayReservationsModal(false);
                              }
                              setLoadingReservation(false);
                            });
                            } catch (error) {
                              console.error('❌ [ERROR] Invalid composite ID (manage button):', reservation.compositeId, error);
                              setLoadingReservation(false);
                            }
                          }}
                          onStatusChange={(reservationId, newStatus) => {
                            setReservations(prev => 
                              prev.map(r => 
                                r.id === reservationId 
                                  ? { ...r, status: newStatus as any }
                                  : r
                              )
                            );
                          }}
                        />
                      </div>
                    </TooltipReserva>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 