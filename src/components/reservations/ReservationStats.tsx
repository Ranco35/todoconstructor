'use client';

import { Reservation } from '@/types/reservation';
import { Calendar, Users, CreditCard, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ReservationStatsProps {
  reservations: Reservation[];
}

export default function ReservationStats({ reservations }: ReservationStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const calculateStats = () => {
    const totalReservations = reservations.length;
    const pendingReservations = reservations.filter(r => r.status === 'pending').length;
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
    const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;
    const completedReservations = reservations.filter(r => r.status === 'completed').length;
    
    const totalRevenue = reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const pendingPayments = reservations.filter(r => 
      r.payment_status === 'partial' || r.payment_status === 'no_payment'
    ).length;
    
    const totalGuests = reservations.reduce((sum, r) => sum + (r.guests || 1), 0);
    
    // Calcular ocupación promedio (simplificado)
    const occupancyRate = totalReservations > 0 ? 
      Math.round((confirmedReservations / totalReservations) * 100) : 0;

    return {
      totalReservations,
      pendingReservations,
      confirmedReservations,
      cancelledReservations,
      completedReservations,
      totalRevenue,
      pendingPayments,
      totalGuests,
      occupancyRate
    };
  };

  const stats = calculateStats();

  const statCards = [
    {
      title: 'Total Reservas',
      value: stats.totalReservations,
      icon: Calendar,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Pendientes',
      value: stats.pendingReservations,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Confirmadas',
      value: stats.confirmedReservations,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Canceladas',
      value: stats.cancelledReservations,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'Total Huéspedes',
      value: stats.totalGuests,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Ingresos Totales',
      value: formatCurrency(stats.totalRevenue),
      icon: CreditCard,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Pagos Pendientes',
      value: stats.pendingPayments,
      icon: TrendingUp,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Ocupación',
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas de Reservas</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <IconComponent size={20} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen adicional */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <h4 className="font-medium mb-2">Reservas del Mes</h4>
          <p className="text-2xl font-bold">
            {reservations.filter(r => {
              const reservationDate = new Date(r.created_at);
              const currentDate = new Date();
              return reservationDate.getMonth() === currentDate.getMonth() &&
                     reservationDate.getFullYear() === currentDate.getFullYear();
            }).length}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <h4 className="font-medium mb-2">Ingresos del Mes</h4>
          <p className="text-2xl font-bold">
            {formatCurrency(
              reservations
                .filter(r => {
                  const reservationDate = new Date(r.created_at);
                  const currentDate = new Date();
                  return reservationDate.getMonth() === currentDate.getMonth() &&
                         reservationDate.getFullYear() === currentDate.getFullYear();
                })
                .reduce((sum, r) => sum + (r.total_amount || 0), 0)
            )}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <h4 className="font-medium mb-2">Promedio por Reserva</h4>
          <p className="text-2xl font-bold">
            {stats.totalReservations > 0 
              ? formatCurrency(stats.totalRevenue / stats.totalReservations)
              : formatCurrency(0)
            }
          </p>
        </div>
      </div>
    </div>
  );
} 