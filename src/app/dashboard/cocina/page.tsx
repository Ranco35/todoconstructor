'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getKitchenDashboardData } from '@/actions/cocina/kitchen-actions';
import { ChefHat, Clock, RefreshCw, Users, UtensilsCrossed, Timer, AlertCircle } from 'lucide-react';

interface PendingOrder {
  id: string;
  table: string;
  items: string[];
  orderTime: string;
  priority: 'normal' | 'urgent';
  estimatedTime: number; // en minutos
}

interface KitchenDashboardData {
  pendingOrders: PendingOrder[];
  totalOrders: number;
  averageWaitTime: number;
  currentCapacity: number;
}

export default function CocinaPage() {
  const [dashboardData, setDashboardData] = useState<KitchenDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Cargar datos del dashboard
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar usuario actual
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Verificar permisos de cocina
      if (currentUser.role !== 'COCINA' && 
          currentUser.role !== 'ADMINISTRADOR' && 
          currentUser.role !== 'SUPER_USER' &&
          currentUser.role !== 'JEFE_SECCION') {
        setError('No tienes permisos para acceder al panel de cocina');
        return;
      }

      // Cargar datos específicos de cocina
      const data = await getKitchenDashboardData();
      setDashboardData(data);

    } catch (err) {
      console.error('Error loading kitchen dashboard data:', err);
      setError('Error al cargar los datos de cocina');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh cada 30 segundos para órdenes en tiempo real
  useEffect(() => {
    if (!isLoading && !error) {
      const refreshInterval = setInterval(() => {
        loadDashboardData();
      }, 30000); // 30 segundos
      return () => clearInterval(refreshInterval);
    }
  }, [isLoading, error]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-CL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getOrderAge = (orderTime: string): number => {
    const now = new Date();
    const order = new Date(orderTime);
    return Math.floor((now.getTime() - order.getTime()) / (1000 * 60)); // minutos
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mb-4" />
            <p className="text-lg font-semibold text-gray-700">Cargando panel de cocina...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-lg font-semibold text-red-600 mb-4">{error}</p>
            <Button onClick={loadDashboardData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar nuevamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-500 rounded-full p-3">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Cocina</h1>
              <p className="text-gray-600">
                {formatDate(currentTime)} - {formatTime(currentTime)}
              </p>
            </div>
          </div>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData?.pendingOrders.length || 0}
              </div>
              <p className="text-xs text-gray-600">
                órdenes en cola
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Timer className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData?.averageWaitTime || 0}
              </div>
              <p className="text-xs text-gray-600">
                minutos promedio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total del Día</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData?.totalOrders || 0}
              </div>
              <p className="text-xs text-gray-600">
                órdenes completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capacidad</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData?.currentCapacity || 0}%
              </div>
              <p className="text-xs text-gray-600">
                capacidad actual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Órdenes Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-500" />
              <span>Órdenes Pendientes</span>
            </CardTitle>
            <CardDescription>
              Órdenes que requieren preparación - actualización automática cada 30 segundos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.pendingOrders && dashboardData.pendingOrders.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.pendingOrders.map((order) => {
                  const orderAge = getOrderAge(order.orderTime);
                  const isUrgent = orderAge > order.estimatedTime;
                  
                  return (
                    <div 
                      key={order.id} 
                      className={`border rounded-lg p-4 ${isUrgent ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="text-lg font-bold">
                            {order.table}
                          </Badge>
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority === 'urgent' ? 'URGENTE' : 'NORMAL'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Pedido hace {orderAge} min
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Tiempo estimado</p>
                          <p className="font-semibold">{order.estimatedTime} min</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Productos:</h4>
                          <ul className="space-y-1">
                            {order.items.map((item, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-center">
                                <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex flex-col justify-end space-y-2">
                          <Button 
                            className="w-full" 
                            variant={isUrgent ? "destructive" : "default"}
                          >
                            {isUrgent ? '⚠️ Marcar Listo' : '✅ Marcar Listo'}
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            📝 Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No hay órdenes pendientes
                </h3>
                <p className="text-gray-500">
                  Todas las órdenes están completadas. ¡Buen trabajo!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}