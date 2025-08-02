'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Calendar,
  TrendingUp,
  Download,
  Users,
  DollarSign,
  Clock,
  Bed,
  PieChart,
  BarChart3,
  Filter,
  RefreshCw,
  FileText,
  CalendarDays,
  MapPin,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { type ReservationStats, type RecentReservation, type DashboardFilters } from '@/actions/reservations/dashboard';
import AuthGuard from '@/components/shared/AuthGuard';

export default function ReservationReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({});
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
  const [reportData, setReportData] = useState<any>({
    monthlyStats: [],
    roomOccupancy: [],
    guestOrigins: [],
    revenueByMonth: []
  });

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const { getReservationStats, getRecentReservations } = await import('@/actions/reservations/dashboard');
      
      // Cargar estadísticas
      const statsResult = await getReservationStats(filters);
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      // Simular datos de reportes avanzados
      // TODO: Implementar funciones específicas para reportes
      setReportData({
        monthlyStats: [
          { month: 'Enero', reservations: 25, revenue: 2500000, occupancy: 75 },
          { month: 'Febrero', reservations: 32, revenue: 3200000, occupancy: 85 },
          { month: 'Marzo', reservations: 28, revenue: 2800000, occupancy: 80 },
          { month: 'Abril', reservations: 35, revenue: 3500000, occupancy: 90 },
          { month: 'Mayo', reservations: 40, revenue: 4000000, occupancy: 95 },
          { month: 'Junio', reservations: 45, revenue: 4500000, occupancy: 98 }
        ],
        roomOccupancy: [
          { room: 'Habitación 101', occupancy: 85, revenue: 800000 },
          { room: 'Habitación 102', occupancy: 92, revenue: 920000 },
          { room: 'Habitación 201', occupancy: 78, revenue: 750000 },
          { room: 'Habitación 202', occupancy: 88, revenue: 850000 },
          { room: 'Habitación 301', occupancy: 95, revenue: 980000 },
          { room: 'Habitación 302', occupancy: 82, revenue: 800000 }
        ],
        guestOrigins: [
          { origin: 'Santiago', count: 45, percentage: 35 },
          { origin: 'Valparaíso', count: 28, percentage: 22 },
          { origin: 'Concepción', count: 20, percentage: 16 },
          { origin: 'La Serena', count: 15, percentage: 12 },
          { origin: 'Otros', count: 19, percentage: 15 }
        ],
        revenueByMonth: [
          { month: 'Enero', revenue: 2500000, growth: 8 },
          { month: 'Febrero', revenue: 3200000, growth: 28 },
          { month: 'Marzo', revenue: 2800000, growth: -12 },
          { month: 'Abril', revenue: 3500000, growth: 25 },
          { month: 'Mayo', revenue: 4000000, growth: 14 },
          { month: 'Junio', revenue: 4500000, growth: 12 }
        ]
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof DashboardFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
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

  const exportReport = (format: string) => {
    // TODO: Implementar exportación real
    console.log(`Exportando reporte en formato: ${format}`);
    alert(`Funcionalidad de exportación ${format} próximamente disponible`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Cargando reportes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  📊 Reportes Avanzados - Reservas
                </h1>
                <p className="text-gray-600 mt-1">
                  Análisis detallado y métricas de rendimiento
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => exportReport('PDF')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => exportReport('Excel')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => loadReportData()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros de Reportes
              </CardTitle>
              <CardDescription>
                Personaliza el período y criterios de análisis
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
                  <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen Ejecutivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
                <Calendar className="h-4 w-4 text-blue-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-blue-100">
                  Período seleccionado
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
                <Bed className="h-4 w-4 text-green-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.occupancy}%</div>
                <p className="text-xs text-green-100">
                  Promedio del período
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
                <p className="text-xs text-emerald-100">
                  Total del período
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estancia Promedio</CardTitle>
                <Clock className="h-4 w-4 text-purple-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageStay} noches</div>
                <p className="text-xs text-purple-100">
                  Por reserva
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Análisis Detallado */}
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="monthly">📈 Tendencias Mensuales</TabsTrigger>
              <TabsTrigger value="rooms">🏠 Análisis por Habitación</TabsTrigger>
              <TabsTrigger value="guests">👥 Procedencia Huéspedes</TabsTrigger>
              <TabsTrigger value="revenue">💰 Análisis de Ingresos</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tendencias Mensuales</CardTitle>
                  <CardDescription>
                    Evolución de reservas y ocupación por mes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.monthlyStats.map((month: any) => (
                      <div key={month.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{month.month}</h3>
                            <p className="text-sm text-gray-600">{month.reservations} reservas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{formatCurrency(month.revenue)}</div>
                          <div className="text-sm text-gray-500">{month.occupancy}% ocupación</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rooms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis por Habitación</CardTitle>
                  <CardDescription>
                    Rendimiento individual de cada habitación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.roomOccupancy.map((room: any) => (
                      <div key={room.room} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Bed className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{room.room}</h3>
                            <p className="text-sm text-gray-600">{room.occupancy}% ocupación</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{formatCurrency(room.revenue)}</div>
                          <div className="text-sm text-gray-500">Ingresos generados</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Procedencia de Huéspedes</CardTitle>
                  <CardDescription>
                    Análisis geográfico de nuestros clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.guestOrigins.map((origin: any) => (
                      <div key={origin.origin} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{origin.origin}</h3>
                            <p className="text-sm text-gray-600">{origin.count} huéspedes</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600">{origin.percentage}%</div>
                          <div className="text-sm text-gray-500">Del total</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Ingresos</CardTitle>
                  <CardDescription>
                    Evolución y crecimiento de ingresos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.revenueByMonth.map((month: any) => (
                      <div key={month.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{month.month}</h3>
                            <p className="text-sm text-gray-600">{formatCurrency(month.revenue)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${month.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {month.growth > 0 ? '+' : ''}{month.growth}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {month.growth > 0 ? 'Crecimiento' : 'Decrecimiento'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navegación */}
          <div className="flex justify-center">
            <Link href="/dashboard/reservations">
              <Button className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 