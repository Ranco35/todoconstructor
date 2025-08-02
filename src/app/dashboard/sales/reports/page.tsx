'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Filter, 
  Calendar, 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  FileText,
  Mail,
  Printer,
  Share,
  Target,
  ArrowLeft,
  CalendarDays,
  TrendingDown,
  Activity,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { getSalesReport, getProductPerformance, getClientPerformance, exportSalesReport, getMonthlyProductSales } from '@/actions/sales/reports';
import type { SalesReportFilters, SalesReportData, ProductPerformanceData, ClientPerformanceData, MonthlyProductData } from '@/actions/sales/reports';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  clientId?: number;
  status?: string;
  paymentMethod?: string;
}

const SalesReportsPage = () => {
  const [filtros, setFiltros] = useState<ReportFilters>({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // 1 de enero
    dateTo: new Date().toISOString().split('T')[0], // Hoy
  });

  const [tipoReporte, setTipoReporte] = useState<'general' | 'productos' | 'clientes' | 'productos_mensual'>('general');
  const [formatoExport, setFormatoExport] = useState<'excel' | 'pdf'>('excel');
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [productData, setProductData] = useState<ProductPerformanceData[]>([]);
  const [clientData, setClientData] = useState<ClientPerformanceData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Cargar datos del reporte
  useEffect(() => {
    const cargarReporte = async () => {
      try {
        setLoading(true);
        
        const filters: SalesReportFilters = {
          dateFrom: filtros.dateFrom,
          dateTo: filtros.dateTo,
          clientId: filtros.clientId,
          status: filtros.status,
          paymentMethod: filtros.paymentMethod
        };

        // Cargar datos según el tipo de reporte
        if (tipoReporte === 'general') {
          const result = await getSalesReport(filters);
          if (result.success && result.data) {
            setReportData(result.data);
          }
        } else if (tipoReporte === 'productos') {
          const result = await getProductPerformance(filters);
          if (result.success && result.data) {
            setProductData(result.data);
          }
        } else if (tipoReporte === 'clientes') {
          const result = await getClientPerformance(filters);
          if (result.success && result.data) {
            setClientData(result.data);
          }
        } else if (tipoReporte === 'productos_mensual') {
          const result = await getMonthlyProductSales(filters);
          if (result.success && result.data) {
            setMonthlyData(result.data);
          } else {
            console.error('Error cargando datos mensuales:', result.error);
            setMonthlyData([]);
          }
        }

      } catch (error) {
        console.error('Error cargando reporte:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarReporte();
  }, [filtros, tipoReporte]);

  const generarReporte = () => {
    // Recargar datos con filtros actuales
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const exportarReporte = async () => {
    try {
      setExporting(true);
      
      const filters: SalesReportFilters = {
        dateFrom: filtros.dateFrom,
        dateTo: filtros.dateTo,
        clientId: filtros.clientId,
        status: filtros.status,
        paymentMethod: filtros.paymentMethod
      };

      const result = await exportSalesReport(filters, formatoExport);
      
      if (result.success) {
        alert(`✅ Reporte exportado exitosamente en formato ${formatoExport.toUpperCase()}`);
      } else {
        alert('❌ Error al exportar reporte');
      }
    } catch (error) {
      console.error('Error exportando:', error);
      alert('❌ Error al exportar reporte');
    } finally {
      setExporting(false);
    }
  };

  const enviarPorEmail = () => {
    alert('📧 Funcionalidad de envío por email próximamente disponible');
  };

  const imprimirReporte = () => {
    window.print();
  };

  const compartirReporte = () => {
    alert('🔗 Funcionalidad de compartir próximamente disponible');
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const ReporteCard = ({ titulo, valor, icono: Icon, color = 'blue', subtitulo = '', trend = null }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{titulo}</p>
            <p className="text-2xl font-bold text-gray-900">{valor}</p>
            {subtitulo && <p className="text-xs text-gray-500">{subtitulo}</p>}
            {trend && (
              <div className={`flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(trend)}% vs mes anterior
              </div>
            )}
          </div>
          <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const VistaPrevia = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando reporte...</span>
        </div>
      );
    }

    if (tipoReporte === 'productos_mensual') {
      if (monthlyData.length === 0) {
        return (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No hay datos de productos vendidos para el período seleccionado</p>
          </div>
        );
      }

      const currentMonth = monthlyData[monthlyData.length - 1];
      const totalProducts = monthlyData.reduce((sum, month) => sum + month.products, 0);
      const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
      const avgGrowth = monthlyData.reduce((sum, month) => sum + month.growth, 0) / monthlyData.length;

      return (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ReporteCard
              titulo="Productos Este Mes"
              valor={currentMonth.products}
              icono={ShoppingCart}
              color="blue"
              trend={currentMonth.growth}
            />
            <ReporteCard
              titulo="Ingresos Este Mes"
              valor={formatCurrency(currentMonth.revenue)}
              icono={DollarSign}
              color="green"
              trend={currentMonth.growth}
            />
            <ReporteCard
              titulo="Total Productos"
              valor={totalProducts}
              icono={Package}
              color="purple"
              subtitulo="Período completo"
            />
            <ReporteCard
              titulo="Crecimiento Promedio"
              valor={formatPercentage(avgGrowth)}
              icono={Activity}
              color="orange"
              subtitulo="Mensual"
            />
          </div>

          {/* Gráfico de tendencias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="h-5 w-5" />
                <span>Tendencia de Productos Vendidos por Mes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-24 text-sm font-medium text-gray-600">{month.month}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{month.products} productos</span>
                          <span className="text-sm font-bold">{formatCurrency(month.revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(month.products / Math.max(...monthlyData.map(m => m.products))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center text-sm ${month.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {month.growth > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {Math.abs(month.growth)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {month.uniqueProducts} productos únicos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Análisis detallado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Mejores Meses</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData
                    .sort((a, b) => b.products - a.products)
                    .slice(0, 5)
                    .map((month, index) => (
                      <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{month.month}</p>
                            <p className="text-sm text-gray-500">{month.products} productos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(month.revenue)}</p>
                          <p className="text-sm text-gray-500">
                            {formatPercentage((month.products / totalProducts) * 100)} del total
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Crecimiento por Mes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData
                    .sort((a, b) => b.growth - a.growth)
                    .slice(0, 5)
                    .map((month, index) => (
                      <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant={month.growth > 0 ? "default" : "destructive"}>{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{month.month}</p>
                            <p className="text-sm text-gray-500">{month.products} productos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${month.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {month.growth > 0 ? '+' : ''}{formatPercentage(month.growth)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(month.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top productos del mes actual */}
          {currentMonth.topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Top Productos - {currentMonth.month}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentMonth.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(product.revenue / product.quantity)} c/u
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    if (tipoReporte === 'general' && reportData) {
      return (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ReporteCard
              titulo="Ingresos Totales"
              valor={formatCurrency(reportData.totalRevenue)}
              icono={DollarSign}
              color="green"
            />
            <ReporteCard
              titulo="Total Facturas"
              valor={reportData.totalInvoices}
              icono={FileText}
              color="blue"
            />
            <ReporteCard
              titulo="Total Pagos"
              valor={reportData.totalPayments}
              icono={TrendingUp}
              color="purple"
            />
            <ReporteCard
              titulo="Tasa Conversión"
              valor={formatPercentage(reportData.conversionRate)}
              icono={Target}
              color="orange"
              subtitulo="Presupuesto → Factura"
            />
          </div>

          {/* Productos más vendidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Productos Más Vendidos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(product.revenue / product.quantity)} c/u
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clientes principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Clientes Principales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topClients.slice(0, 5).map((client, index) => (
                  <div key={client.clientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{client.clientName}</p>
                        <p className="text-sm text-gray-500">{client.totalPurchases} compras</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(client.totalRevenue)}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(client.totalRevenue / client.totalPurchases)} promedio
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Métodos de pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Métodos de Pago</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.paymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{method.method}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(method.amount)}</p>
                      <p className="text-sm text-gray-500">
                        {method.count} pagos ({formatPercentage(method.percentage)})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (tipoReporte === 'productos' && productData.length > 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Performance de Productos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productData.slice(0, 10).map((product, index) => (
                <div key={product.productId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <h3 className="font-semibold">{product.productName}</h3>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.totalRevenue)}</p>
                      <p className="text-sm text-gray-500">{product.totalSold} vendidos</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Precio Promedio</p>
                      <p className="font-medium">{formatCurrency(product.averagePrice)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Clientes Únicos</p>
                      <p className="font-medium">{product.topClients.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Rendimiento</p>
                      <p className="font-medium">{formatPercentage((product.totalRevenue / Math.max(reportData?.totalRevenue || 1, 1)) * 100)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (tipoReporte === 'clientes' && clientData.length > 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Performance de Clientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientData.slice(0, 10).map((client, index) => (
                <div key={client.clientId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <h3 className="font-semibold">{client.clientName}</h3>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(client.totalRevenue)}</p>
                      <p className="text-sm text-gray-500">{client.totalInvoices} facturas</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Promedio por Factura</p>
                      <p className="font-medium">{formatCurrency(client.averageInvoiceValue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Última Compra</p>
                      <p className="font-medium">{client.lastPurchaseDate ? new Date(client.lastPurchaseDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pagos Registrados</p>
                      <p className="font-medium">{client.paymentHistory.length}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Selecciona un tipo de reporte para ver los datos</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/sales">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Reportes de Ventas</h1>
              <p className="text-gray-600">Análisis detallado y métricas de rendimiento</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={generarReporte} disabled={loading}>
              <Filter className="w-4 h-4 mr-2" />
              Generar
            </Button>
            <Button onClick={exportarReporte} disabled={exporting || loading}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros de Reportes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filtros.dateFrom}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filtros.dateTo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filtros.status || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviado</option>
                  <option value="paid">Pagado</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  value={filtros.paymentMethod || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, paymentMethod: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="check">Cheque</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Reporte */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tipos de Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant={tipoReporte === 'general' ? 'default' : 'outline'}
                className="h-20 flex-col space-y-2"
                onClick={() => setTipoReporte('general')}
              >
                <BarChart3 className="h-6 w-6" />
                <span>Reporte General</span>
              </Button>
              
              <Button
                variant={tipoReporte === 'productos' ? 'default' : 'outline'}
                className="h-20 flex-col space-y-2"
                onClick={() => setTipoReporte('productos')}
              >
                <Package className="h-6 w-6" />
                <span>Performance Productos</span>
              </Button>
              
              <Button
                variant={tipoReporte === 'clientes' ? 'default' : 'outline'}
                className="h-20 flex-col space-y-2"
                onClick={() => setTipoReporte('clientes')}
              >
                <Users className="h-6 w-6" />
                <span>Performance Clientes</span>
              </Button>

              <Button
                variant={tipoReporte === 'productos_mensual' ? 'default' : 'outline'}
                className="h-20 flex-col space-y-2"
                onClick={() => setTipoReporte('productos_mensual')}
              >
                <CalendarDays className="h-6 w-6" />
                <span>Productos por Mes</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Opciones de Exportación */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Opciones de Exportación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Formato:</label>
                <select
                  value={formatoExport}
                  onChange={(e) => setFormatoExport(e.target.value as 'excel' | 'pdf')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              
              <Button onClick={exportarReporte} disabled={exporting} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              
              <Button onClick={enviarPorEmail} variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Enviar por Email
              </Button>
              
              <Button onClick={imprimirReporte} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              
              <Button onClick={compartirReporte} variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vista Previa */}
        <VistaPrevia />
      </div>
    </div>
  );
};

export default SalesReportsPage; 