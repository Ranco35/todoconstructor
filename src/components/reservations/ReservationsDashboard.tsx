'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Plus, 
  Users, 
  DollarSign, 
  Clock, 
  Bed, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  List,
  BarChart3,
  Filter,
  RefreshCw,
  CalendarDays,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { type ReservationStats, type RecentReservation, type DashboardFilters, getReservationStats, getRecentReservations } from '@/actions/reservations/dashboard';
import { deleteReservation } from '@/actions/reservations/delete';

export default function ReservationsDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<ReservationStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    revenue: 0,
    occupancy: 0,
    averageStay: 0
  });
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [deletingReservation, setDeletingReservation] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas y reservas recientes en paralelo
      const [statsResult, recentResult] = await Promise.all([
        getReservationStats(filters),
        getRecentReservations(5, filters)
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        console.error('Error loading stats:', statsResult.error);
        // Mantener datos por defecto en caso de error
      }

      if (recentResult.success && recentResult.data) {
        setRecentReservations(recentResult.data);
      } else {
        console.error('Error loading recent reservations:', recentResult.error);
        // Mantener datos por defecto en caso de error
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof DashboardFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: (value && value !== 'all') ? value : undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleDeleteReservation = async (reservationId: number, guestName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la reserva de ${guestName}?`)) {
      return;
    }

    setDeletingReservation(reservationId);
    try {
      const result = await deleteReservation(reservationId);
      
      if (result.success) {
        // Actualizar la lista de reservas recientes
        setRecentReservations(prev => prev.filter(r => r.id !== reservationId));
        // Recargar estadísticas
        await loadDashboardData();
      } else {
        alert(`Error al eliminar la reserva: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Error al eliminar la reserva');
    } finally {
      setDeletingReservation(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pendiente</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">✅ Confirmada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">❌ Cancelada</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">🏁 Completada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Cargando dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🏨 Dashboard de Reservas
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión completa del sistema de reservaciones
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button
              variant="outline"
              onClick={() => loadDashboardData()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros de Dashboard
              </CardTitle>
              <CardDescription>
                Filtra las estadísticas y reservas por fecha y estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Fin</label>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending">⏳ Pendiente</SelectItem>
                      <SelectItem value="confirmed">✅ Confirmada</SelectItem>
                      <SelectItem value="cancelled">❌ Cancelada</SelectItem>
                      <SelectItem value="completed">🏁 Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Acciones</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="flex-1"
                    >
                      Limpiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="flex-1"
                    >
                      Ocultar
                    </Button>
                  </div>
                </div>
              </div>
              {/* Indicador de filtros activos */}
              {(filters.startDate || filters.endDate || (filters.status && filters.status !== 'all')) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CalendarDays className="w-4 h-4" />
                    <span className="font-medium">Filtros activos:</span>
                    {filters.startDate && <Badge variant="outline">Desde: {formatDate(filters.startDate)}</Badge>}
                    {filters.endDate && <Badge variant="outline">Hasta: {formatDate(filters.endDate)}</Badge>}
                    {filters.status && filters.status !== 'all' && <Badge variant="outline">Estado: {filters.status}</Badge>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {(filters.startDate || filters.endDate) ? 'Período seleccionado' : 'Este mes'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
              <Bed className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupancy}%</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +5% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +12% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estancia Promedio</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageStay} noches</div>
              <p className="text-xs text-muted-foreground">
                Por reserva
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estados de reservas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Confirmadas</p>
                  <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Completadas</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.completed}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Canceladas</p>
                  <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚡ Acciones Rápidas
            </CardTitle>
            <CardDescription>
              Acceso directo a las funciones principales del sistema de reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => router.push('/dashboard/reservations/nueva')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-20 flex flex-col items-center justify-center gap-2"
              >
                <Plus size={24} />
                <span className="font-semibold">Nueva Reserva</span>
              </Button>

              <Button
                onClick={() => router.push('/dashboard/reservations/calendar')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:bg-blue-50"
              >
                <Calendar size={24} className="text-blue-600" />
                <span className="font-semibold">Calendario</span>
              </Button>

              <Button
                onClick={() => router.push('/dashboard/reservations/list')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:bg-green-50"
              >
                <List size={24} className="text-green-600" />
                <span className="font-semibold">Lista Completa</span>
              </Button>

              <Button
                onClick={() => router.push('/dashboard/reservations/reports')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:bg-purple-50"
              >
                <BarChart3 size={24} className="text-purple-600" />
                <span className="font-semibold">Reportes</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reservas recientes */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                📋 Reservas Recientes
              </CardTitle>
              <CardDescription>
                Últimas reservas registradas en el sistema
              </CardDescription>
            </div>
            <Link href="/dashboard/reservations/list">
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {reservation.client_nombre} ({reservation.client_rut})
                      </h4>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}
                      </span>
                      {reservation.room_name && (
                        <span className="flex items-center gap-1">
                          <Bed size={14} />
                          {reservation.room_name}
                        </span>
                      )}
                      {reservation.authorized_by && reservation.authorized_by !== reservation.guest_name && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Users size={14} />
                          Huésped: {reservation.guest_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg text-gray-900">
                      {formatCurrency(reservation.total_amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {reservation.id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/reservations/${reservation.id}`)}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/reservations/${reservation.id}/edit`)}
                    >
                      <Edit size={14} />
                    </Button>
                                          <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReservation(reservation.id, reservation.authorized_by || reservation.guest_name)}
                        disabled={deletingReservation === reservation.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                      >
                      {deletingReservation === reservation.id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 