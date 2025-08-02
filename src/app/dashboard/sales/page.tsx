'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Plus,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Tag
} from 'lucide-react';
import { getRecentInvoices } from '@/actions/sales/invoices/list';
import RecentInvoicesTable from '@/components/sales/RecentInvoicesTable';

// Tipos para estadísticas
interface SalesStats {
  budgets: {
    total: number;
    thisMonth: number;
    byStatus: Record<string, number>;
    totalAmount: number;
  };
  // Aquí se pueden agregar más tipos cuando se implementen facturas y pagos
}

interface RecentInvoice {
  id: number;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  client: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export default function SalesDashboard() {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Cargar estadísticas
  useEffect(() => {
    const loadStats = async (): Promise<void> => {
      try {
        // Por ahora solo cargamos estadísticas de presupuestos
        // En el futuro se pueden agregar facturas y pagos
        
        const response = await fetch('/api/sales/budgets/stats');
        const result = await response.json();

        if (result.success) {
          setStats({
            budgets: result.data
          });
        } else {
          setError('Error al cargar estadísticas.');
        }
      } catch (err) {
        setError('Error de conexión.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Cargar facturas recientes
  useEffect(() => {
    const loadRecentInvoices = async (): Promise<void> => {
      try {
        const result = await getRecentInvoices(10);
        
        if (result.success && result.data) {
          setRecentInvoices(result.data);
        }
      } catch (err) {
        console.error('Error al cargar facturas recientes:', err);
      } finally {
        setInvoicesLoading(false);
      }
    };

    loadRecentInvoices();
  }, []);

  // Formatear moneda
  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  // Obtener estadísticas por estado
  const getStatusStats = () => {
    if (!stats?.budgets.byStatus) return [];
    
    const statusConfig = {
      draft: { label: 'Borradores', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock },
      sent: { label: 'Enviados', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Eye },
      accepted: { label: 'Aceptados', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
      rejected: { label: 'Rechazados', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
      expired: { label: 'Expirados', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
      converted: { label: 'Convertidos', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: TrendingUp }
    };

    return Object.entries(stats.budgets.byStatus).map(([status, count]) => {
      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
      const IconComponent = config.icon;
      
      return {
        status,
        label: config.label,
        count,
        color: config.color,
        bgColor: config.bgColor,
        icon: IconComponent
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Ventas</h1>
            <p className="text-gray-600">Gestión de presupuestos, facturas y pagos</p>
          </div>
          
          <div className="flex space-x-4">
            <Link href="/dashboard/sales/invoices/create">
              <Button variant="outline" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Nueva Factura</span>
              </Button>
            </Link>
            <Link href="/dashboard/sales/budgets/create">
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Nuevo Presupuesto</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tarjetas de estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Presupuestos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.budgets.total || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.budgets.thisMonth || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.budgets.totalAmount || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(stats?.budgets.byStatus || {}).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Estados de presupuestos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Estados de Presupuestos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getStatusStats().map(({ status, label, count, color, bgColor, icon: IconComponent }) => (
                    <div key={status} className={`p-4 rounded-lg ${bgColor}`}>
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-5 h-5 ${color}`} />
                        <div>
                          <p className={`text-sm font-medium ${color}`}>{label}</p>
                          <p className={`text-xl font-bold ${color}`}>{count}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accesos rápidos */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Accesos Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/dashboard/sales/budgets/create">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Presupuesto
                  </Button>
                </Link>
                
                <Link href="/dashboard/sales/budgets">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Presupuestos
                  </Button>
                </Link>
                
                <Link href="/dashboard/sales/invoices/create">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Nueva Factura
                  </Button>
                </Link>
                
                <Link href="/dashboard/sales/payments">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Gestionar Pagos
                  </Button>
                </Link>
                
                <Link href="/dashboard/sales/reports">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Reportes y Analytics
                  </Button>
                </Link>
                
                <Link href="/dashboard/sales/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </Button>
                </Link>
                
                <Link href="/dashboard/sales/discounts">
                  <Button variant="outline" className="w-full justify-start">
                    <Tag className="w-4 h-4 mr-2" />
                    Descuentos
                  </Button>
                </Link>
                
                <Link href="/dashboard/sales/reservations-to-invoice">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Reservas para Facturar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Facturas Recientes */}
        <div className="mt-8">
          <RecentInvoicesTable 
            invoices={recentInvoices} 
            loading={invoicesLoading} 
          />
        </div>

        {/* Próximas funcionalidades */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <h3 className="font-medium text-gray-900">Facturas</h3>
                  <p className="text-sm text-gray-500">Crear y gestionar facturas</p>
                </div>
                
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <h3 className="font-medium text-gray-900">Pagos</h3>
                  <p className="text-sm text-gray-500">Registrar y controlar pagos</p>
                </div>
                
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <h3 className="font-medium text-gray-900">Reportes</h3>
                  <p className="text-sm text-gray-500">Análisis y reportes de ventas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 