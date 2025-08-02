'use client';

import { useState, useEffect } from 'react';
import { Reservation, Room, Company } from '@/types/reservation';
import { X, Filter } from 'lucide-react';

interface ReservationFiltersProps {
  reservations: Reservation[];
  onFilterChange: (filtered: Reservation[]) => void;
  rooms: Room[];
  companies: Company[];
}

export default function ReservationFilters({
  reservations,
  onFilterChange,
  rooms,
  companies
}: ReservationFiltersProps) {
  const [filters, setFilters] = useState({
    status: '',
    clientType: '',
    roomId: '',
    companyId: '',
    paymentStatus: '',
    checkInFrom: '',
    checkInTo: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let filtered = [...reservations];

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.clientType) {
      filtered = filtered.filter(r => r.client_type === filters.clientType);
    }

    if (filters.roomId) {
      filtered = filtered.filter(r => r.room_id === parseInt(filters.roomId));
    }

    if (filters.companyId) {
      filtered = filtered.filter(r => r.company_id === parseInt(filters.companyId));
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(r => r.payment_status === filters.paymentStatus);
    }

    if (filters.checkInFrom) {
      filtered = filtered.filter(r => r.check_in >= filters.checkInFrom);
    }

    if (filters.checkInTo) {
      filtered = filtered.filter(r => r.check_in <= filters.checkInTo);
    }

    onFilterChange(filtered);
  }, [filters, reservations, onFilterChange]);

  const clearFilters = () => {
    setFilters({
      status: '',
      clientType: '',
      roomId: '',
      companyId: '',
      paymentStatus: '',
      checkInFrom: '',
      checkInTo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {Object.values(filters).filter(v => v !== '').length} activos
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X size={14} />
              Limpiar
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="completed">Completada</option>
            </select>
          </div>

          {/* Tipo de Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Cliente
            </label>
            <select
              value={filters.clientType}
              onChange={(e) => setFilters(prev => ({ ...prev, clientType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="individual">Individual</option>
              <option value="corporate">Corporativo</option>
            </select>
          </div>

          {/* Habitación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Habitación
            </label>
            <select
              value={filters.roomId}
              onChange={(e) => setFilters(prev => ({ ...prev, roomId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.number} - {room.type}
                </option>
              ))}
            </select>
          </div>

          {/* Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <select
              value={filters.companyId}
              onChange={(e) => setFilters(prev => ({ ...prev, companyId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado de Pago
            </label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="no_payment">Sin pago</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pagado</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>

          {/* Fecha Check-in Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Desde
            </label>
            <input
              type="date"
              value={filters.checkInFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, checkInFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Fecha Check-in Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Hasta
            </label>
            <input
              type="date"
              value={filters.checkInTo}
              onChange={(e) => setFilters(prev => ({ ...prev, checkInTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
} 