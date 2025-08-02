'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UtensilsCrossed, 
  Calendar, 
  ClipboardList, 
  Users, 
  Clock,
  ChefHat,
  ArrowRight,
  Home,
  UserCheck,
  UserMinus
} from 'lucide-react';
import { getGarzonDashboardData, type GarzonDashboardData, type GarzonReservationSummary } from '@/actions/reservations/garzones';

export default function GarzonesPanel() {
  const [dashboardData, setDashboardData] = useState<GarzonDashboardData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Cargar datos reales del dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getGarzonDashboardData();
      
      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Error al cargar los datos');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ChefHat className="h-8 w-8" />
                Panel de Garzones
              </h1>
              <p className="text-orange-100 mt-2">
                Sistema especializado para personal de servicio del restaurante
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatTime(currentTime)}</div>
              <div className="text-orange-200 text-sm">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>

        {/* Acciones Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* POS Restaurante */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <UtensilsCrossed className="h-6 w-6" />
                Punto de Venta - Restaurante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-100 mb-4">
                Acceso directo al sistema de ventas del restaurante para tomar pedidos y gestionar comandas.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <ClipboardList className="h-4 w-4" />
                  <span>Tomar comandas de mesas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>Gestionar pedidos de clientes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Control de tiempos de servicio</span>
                </div>
              </div>
              <Link href="/dashboard/pos/restaurante">
                <Button className="w-full bg-white text-orange-600 hover:bg-orange-50 font-semibold">
                  Acceder al POS Restaurante
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Calendario de Reservas */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Calendar className="h-6 w-6" />
                Reservas del Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100 mb-4">
                Consulta las reservas y ocupación del hotel para coordinar el servicio de restaurante.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>Ver huéspedes del día</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Horarios de check-in/out</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4" />
                  <span>Estado de habitaciones</span>
                </div>
              </div>
              <Link href="/dashboard/reservations">
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                  Ver Calendario de Reservas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <ClipboardList className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
              <Button
                onClick={loadDashboardData}
                variant="link"
                className="ml-2 p-0 h-auto text-red-600 underline"
              >
                Intentar nuevamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Estadísticas del Hotel */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Ocupación Actual</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {dashboardData.occupiedRooms}/{dashboardData.totalRooms}
                    </p>
                  </div>
                  <Home className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Huéspedes Totales</p>
                    <p className="text-2xl font-bold text-green-800">{dashboardData.totalGuests}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Llegadas Hoy</p>
                    <p className="text-2xl font-bold text-purple-800">{dashboardData.arrivals.length}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Llegadas del Día */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Llegadas de Hoy
              <Badge variant="secondary" className="ml-2">
                {dashboardData?.arrivals.length || 0} reservas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Cargando llegadas del día...</p>
              </div>
            ) : dashboardData?.arrivals && dashboardData.arrivals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.arrivals.map((reservation) => (
                  <div 
                    key={reservation.id}
                    className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {reservation.clientName}
                      </h4>
                      <Badge 
                        variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {reservation.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Home className="h-3 w-3" />
                        <span>Habitación {reservation.roomNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>{reservation.guests} huéspedes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Check-in: {new Date(reservation.checkIn).toLocaleDateString('es-CL')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Check-out: {new Date(reservation.checkOut).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <UserCheck className="h-4 w-4" />
                <AlertDescription>
                  No hay llegadas programadas para hoy.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Salidas del Día */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-600" />
              Salidas de Hoy
              <Badge variant="secondary" className="ml-2">
                {dashboardData?.departures.length || 0} reservas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Cargando salidas del día...</p>
              </div>
            ) : dashboardData?.departures && dashboardData.departures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.departures.map((reservation) => (
                  <div 
                    key={reservation.id}
                    className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {reservation.clientName}
                      </h4>
                      <Badge 
                        variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {reservation.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Home className="h-3 w-3" />
                        <span>Habitación {reservation.roomNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>{reservation.guests} huéspedes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Check-out: {new Date(reservation.checkOut).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <UserMinus className="h-4 w-4" />
                <AlertDescription>
                  No hay salidas programadas para hoy.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Huéspedes Actuales */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Huéspedes Actuales
              <Badge variant="secondary" className="ml-2">
                {dashboardData?.currentGuests.length || 0} habitaciones ocupadas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Cargando huéspedes actuales...</p>
              </div>
            ) : dashboardData?.currentGuests && dashboardData.currentGuests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardData.currentGuests.map((reservation) => (
                  <div 
                    key={reservation.id}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {reservation.clientName}
                      </h4>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Home className="h-3 w-3" />
                        <span>Hab. {reservation.roomNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>{reservation.guests} huéspedes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Hasta: {new Date(reservation.checkOut).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  No hay huéspedes hospedados actualmente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-800 mb-2">Funcionalidades Disponibles:</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• Acceso al POS del restaurante</li>
                  <li>• Consulta de reservas del día</li>
                  <li>• Información de huéspedes</li>
                  <li>• Estado de ocupación</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-2">Permisos del Rol Garzón:</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• ✅ POS Restaurante</li>
                  <li>• ✅ Calendario (solo lectura)</li>
                  <li>• ❌ Configuración del sistema</li>
                  <li>• ❌ Módulos administrativos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}