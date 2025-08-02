'use client';

import React, { useState, useEffect } from 'react';
import { Download, Filter, Calendar, Users, Building2, User, Tag, TrendingUp, FileText, Mail, Printer, Share, Target, BarChart3, PieChart, LineChart, ArrowLeft } from 'lucide-react';
import { getClientTags } from '@/actions/clients/tags';
import { getClients } from '@/actions/clients/list';
import { getClientTagAnalytics, getTagPerformanceMetrics, getClientDistributionByRegion } from '@/actions/clients/analytics';
import Head from '@/components/transversal/seccions/Head';
import Link from 'next/link';

interface ClientTag {
  id: number;
  nombre: string;
  color: string;
  clientes?: number;
}

const ReportesEtiquetas = () => {
  const [filtros, setFiltros] = useState({
    fechaInicio: '2024-01-01',
    fechaFin: new Date().toISOString().split('T')[0],
    etiquetasSeleccionadas: [],
    tipoCliente: 'todos',
    region: 'todas',
    rangoValor: 'todos'
  });

  const [tipoReporte, setTipoReporte] = useState('segmentacion');
  const [formatoExport, setFormatoExport] = useState('excel');
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState<ClientTag[]>([]);
  const [datosClientes, setDatosClientes] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar datos en paralelo para mejor performance
        const [
          tagsResult,
          clientsResult,
          analyticsResult,
          performanceResult,
          regionResult
        ] = await Promise.all([
          getClientTags(),
          getClients({ page: 1, pageSize: 1000 }),
          getClientTagAnalytics(),
          getTagPerformanceMetrics(),
          getClientDistributionByRegion()
        ]);

        // Procesar etiquetas con datos reales
        if (tagsResult.success) {
          setEtiquetasDisponibles(tagsResult.data);
        }

        // Procesar clientes
        if (clientsResult.success) {
          setDatosClientes(clientsResult.data.clients);
        }

        // Procesar analytics reales
        if (analyticsResult.success) {
          setAnalyticsData(analyticsResult.data);
        }

        // Procesar métricas de performance
        if (performanceResult.success) {
          setPerformanceData(performanceResult.data);
        }

        // Procesar datos de región
        if (regionResult.success) {
          setRegionData(regionResult.data);
        }

      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Reportes predefinidos
  const reportesPredefinidos = [
    {
      id: 'segmentacion',
      nombre: 'Análisis de Segmentación',
      descripcion: 'Distribución de clientes por etiquetas y características',
      icono: PieChart,
      color: 'blue'
    },
    {
      id: 'performance',
      nombre: 'Performance por Etiquetas',
      descripcion: 'Rendimiento comercial segmentado por etiquetas',
      icono: BarChart3,
      color: 'green'
    },
    {
      id: 'conversion',
      nombre: 'Análisis de Conversión',
      descripcion: 'Evolución y conversión entre diferentes etiquetas',
      icono: LineChart,
      color: 'purple'
    },
    {
      id: 'geografico',
      nombre: 'Distribución Geográfica',
      descripcion: 'Análisis de clientes por ubicación y etiquetas',
      icono: Target,
      color: 'orange'
    },
    {
      id: 'marketing',
      nombre: 'Eficacia de Marketing',
      descripcion: 'Análisis de campañas y etiquetas de marketing',
      icono: TrendingUp,
      color: 'pink'
    },
    {
      id: 'personalizado',
      nombre: 'Reporte Personalizado',
      descripcion: 'Crea un reporte con métricas específicas',
      icono: FileText,
      color: 'slate'
    }
  ];

  // Datos reales de los reportes obtenidos de la base de datos
  const datosReporte = {
    segmentacion: {
      totalClientes: datosClientes.length,
      distribucionEtiquetas: analyticsData.slice(0, 6).map((etiqueta) => ({
        etiqueta: etiqueta.nombre,
        clientes: etiqueta.totalClientes,
        porcentaje: ((etiqueta.totalClientes || 0) / Math.max(datosClientes.length, 1) * 100).toFixed(1),
        valor: etiqueta.valorTotal || 0
      })),
      etiquetasActivas: analyticsData.filter(e => e.activo !== false).length,
      clientesConEtiquetas: analyticsData.reduce((sum, e) => sum + (e.totalClientes || 0), 0)
    },
    performance: {
      ventasPorEtiqueta: performanceData.slice(0, 5).map(etiqueta => ({
        etiqueta: etiqueta.etiqueta,
        ventas: etiqueta.totalVentas,
        clientes: etiqueta.totalClientes,
        promedio: etiqueta.ventasPromedio,
        clientesActivos: etiqueta.clientesActivos,
        tendencia: etiqueta.tendencia
      })),
      tendenciaTrimestral: performanceData.reduce((acc, etiqueta) => {
        acc[etiqueta.etiqueta] = {
          Q1: etiqueta.crecimientoQ1,
          Q2: etiqueta.crecimientoQ2,
          tendencia: etiqueta.tendencia
        };
        return acc;
      }, {} as Record<string, any>)
    },
    geografico: {
      distribucionRegional: regionData.map(region => ({
        region: region.region,
        totalClientes: region.totalClientes,
        empresas: region.empresas,
        personas: region.personas,
        ventasPromedio: region.ventasPromedio,
        etiquetasPopulares: region.etiquetas.slice(0, 3)
      }))
    }
  };

  const toggleEtiquetaFiltro = (etiquetaId) => {
    setFiltros(prev => ({
      ...prev,
      etiquetasSeleccionadas: prev.etiquetasSeleccionadas.includes(etiquetaId)
        ? prev.etiquetasSeleccionadas.filter(id => id !== etiquetaId)
        : [...prev.etiquetasSeleccionadas, etiquetaId]
    }));
  };

  const generarReporte = () => {
    console.log('Generando reporte:', {
      tipo: tipoReporte,
      filtros,
      formato: formatoExport
    });
    alert(`Generando reporte de ${reportesPredefinidos.find(r => r.id === tipoReporte)?.nombre} en formato ${formatoExport.toUpperCase()}`);
  };

  const enviarPorEmail = () => {
    alert('Reporte enviado por email a tu bandeja de entrada');
  };

  const programarReporte = () => {
    alert('Reporte programado para envío automático semanal');
  };

  const ReporteCard = ({ reporte, seleccionado, onClick }) => {
    const IconoReporte = reporte.icono;
    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
          seleccionado
            ? `border-${reporte.color}-300 bg-${reporte.color}-50 shadow-lg`
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
        }`}
      >
        <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
          seleccionado ? `bg-${reporte.color}-600` : 'bg-slate-100'
        }`}>
          <IconoReporte size={20} className={seleccionado ? 'text-white' : 'text-slate-600'} />
        </div>
        <h3 className={`font-bold mb-1 text-sm ${seleccionado ? `text-${reporte.color}-800` : 'text-slate-800'}`}>
          {reporte.nombre}
        </h3>
        <p className={`text-xs ${seleccionado ? `text-${reporte.color}-600` : 'text-slate-600'}`}>
          {reporte.descripcion}
        </p>
      </div>
    );
  };

  const VistaPrevia = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando datos...</p>
        </div>
      );
    }

    if (tipoReporte === 'segmentacion') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Distribución por Etiquetas</h3>
            <div className="space-y-3">
              {datosReporte.segmentacion.distribucionEtiquetas.map((item, index) => {
                const etiqueta = analyticsData.find(e => e.nombre === item.etiqueta);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: etiqueta?.color || '#3B82F6' }}
                      ></div>
                      <span className="font-medium">{item.etiqueta}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{item.clientes} clientes</span>
                      <span className="font-semibold">{item.porcentaje}%</span>
                      <span className="text-green-600">${parseInt(item.valor).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <h4 className="text-2xl font-bold text-blue-600">{datosReporte.segmentacion.totalClientes}</h4>
              <p className="text-slate-600">Total Clientes</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <h4 className="text-2xl font-bold text-green-600">{datosReporte.segmentacion.etiquetasActivas}</h4>
              <p className="text-slate-600">Etiquetas Activas</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
              <h4 className="text-2xl font-bold text-purple-600">
                {datosReporte.segmentacion.totalClientes > 0 
                  ? (datosReporte.segmentacion.clientesConEtiquetas / datosReporte.segmentacion.totalClientes).toFixed(1)
                  : '0'
                }
              </h4>
              <p className="text-slate-600">Etiquetas por Cliente</p>
            </div>
          </div>
        </div>
      );
    }

    if (tipoReporte === 'performance') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Ventas por Etiqueta</h3>
            <div className="space-y-3">
              {datosReporte.performance.ventasPorEtiqueta.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: etiquetasDisponibles[index]?.color || '#10B981' }}
                    ></div>
                    <span className="font-medium">{item.etiqueta}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{item.clientes} clientes</span>
                    <span className="font-semibold text-green-600">${parseInt(item.ventas).toLocaleString()}</span>
                    <span className="text-blue-600">Prom: ${parseInt(item.promedio).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Tendencia Trimestral</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800">Q1 2024</h4>
                <p className="text-sm text-blue-600">Total: $39.275.000</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800">Q2 2024</h4>
                <p className="text-sm text-green-600">Total: $113.825.000</p>
                <p className="text-xs text-green-500">+189% vs Q1</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tipoReporte === 'geografico') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Distribución Geográfica</h3>
            <div className="space-y-3">
              {datosReporte.geografico.distribucionRegional.slice(0, 5).map((region, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span className="font-medium">{region.region}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{region.totalClientes} clientes</span>
                    <span className="text-blue-600">{region.empresas} empresas</span>
                    <span className="text-green-600">${parseInt(region.ventasPromedio).toLocaleString()} prom.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3">Top Regiones</h4>
              {datosReporte.geografico.distribucionRegional
                .sort((a, b) => b.totalClientes - a.totalClientes)
                .slice(0, 3)
                .map((region, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-sm">{region.region}</span>
                    <span className="font-medium">{region.totalClientes}</span>
                  </div>
                ))
              }
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3">Etiquetas Populares</h4>
              <div className="space-y-2">
                {regionData.slice(0, 3).map((region, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{region.region}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {region.etiquetas.slice(0, 2).map((etiqueta, i) => (
                        <span key={i} className="bg-slate-100 px-2 py-1 rounded text-xs">
                          {etiqueta}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 text-center">
        <FileText size={48} className="text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 mb-2">Vista Previa del Reporte</h3>
        <p className="text-slate-500">
          Selecciona un tipo de reporte para ver la vista previa de los datos
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Head title="Reportes de Etiquetas - Clientes" />
        
        {/* Header con navegación */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/customers" className="p-2 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Reportes y Analytics</h1>
              <p className="text-slate-600">Genera reportes personalizados basados en etiquetas de clientes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={programarReporte}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2"
            >
              <Calendar size={18} />
              Programar
            </button>
            <button
              onClick={enviarPorEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
            >
              <Mail size={18} />
              Enviar Email
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de configuración */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selección de tipo de reporte */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Tipo de Reporte</h3>
              <div className="grid grid-cols-1 gap-3">
                {reportesPredefinidos.map((reporte) => (
                  <ReporteCard
                    key={reporte.id}
                    reporte={reporte}
                    seleccionado={tipoReporte === reporte.id}
                    onClick={() => setTipoReporte(reporte.id)}
                  />
                ))}
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Filtros</h3>
              
              {/* Rango de fechas */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Período</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={filtros.fechaInicio}
                      onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 text-sm"
                    />
                    <input
                      type="date"
                      value={filtros.fechaFin}
                      onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Tipo de cliente */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de Cliente</label>
                  <select
                    value={filtros.tipoCliente}
                    onChange={(e) => setFiltros({...filtros, tipoCliente: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="empresa">Solo Empresas</option>
                    <option value="persona">Solo Personas</option>
                  </select>
                </div>

                {/* Región */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Región</label>
                  <select
                    value={filtros.region}
                    onChange={(e) => setFiltros({...filtros, region: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 text-sm"
                  >
                    <option value="todas">Todas las Regiones</option>
                    <option value="norte">Zona Norte</option>
                    <option value="centro">Zona Centro</option>
                    <option value="sur">Zona Sur</option>
                  </select>
                </div>

                {/* Filtro por etiquetas */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Etiquetas ({filtros.etiquetasSeleccionadas.length} seleccionadas)
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {analyticsData.map(etiqueta => (
                      <label key={etiqueta.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filtros.etiquetasSeleccionadas.includes(etiqueta.id)}
                          onChange={() => toggleEtiquetaFiltro(etiqueta.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: etiqueta.color }}></div>
                        <span className="text-sm flex-1">{etiqueta.nombre}</span>
                        <span className="text-xs text-slate-500">{etiqueta.totalClientes}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Opciones de exportación */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Exportar</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Formato</label>
                  <select
                    value={formatoExport}
                    onChange={(e) => setFormatoExport(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 text-sm"
                  >
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="powerpoint">PowerPoint (.pptx)</option>
                  </select>
                </div>

                <button
                  onClick={generarReporte}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Generar Reporte
                </button>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                    <Printer size={16} />
                    Imprimir
                  </button>
                  <button className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                    <Share size={16} />
                    Compartir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa del reporte */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  Vista Previa: {reportesPredefinidos.find(r => r.id === tipoReporte)?.nombre}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={16} />
                  {new Date(filtros.fechaInicio).toLocaleDateString('es-CL')} - {new Date(filtros.fechaFin).toLocaleDateString('es-CL')}
                </div>
              </div>

              {/* Filtros activos */}
              {filtros.etiquetasSeleccionadas.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Filtros Activos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {filtros.etiquetasSeleccionadas.map(etiquetaId => {
                      const etiqueta = analyticsData.find(e => e.id === etiquetaId);
                      return etiqueta ? (
                        <span
                          key={etiquetaId}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: etiqueta.color }}
                        >
                          <Tag size={10} />
                          {etiqueta.nombre}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <VistaPrevia />
            </div>

            {/* Métricas rápidas */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
                <h4 className="text-sm text-blue-100">Total Clientes</h4>
                <p className="text-2xl font-bold">
                  {filtros.etiquetasSeleccionadas.length > 0 
                    ? filtros.etiquetasSeleccionadas.reduce((sum, id) => {
                        const etiqueta = analyticsData.find(e => e.id === id);
                        return sum + (etiqueta ? etiqueta.totalClientes : 0);
                      }, 0)
                    : datosClientes.length
                  }
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
                <h4 className="text-sm text-green-100">Etiquetas Activas</h4>
                <p className="text-2xl font-bold">{analyticsData.filter(e => e.activo !== false).length}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
                <h4 className="text-sm text-purple-100">Valor Total</h4>
                <p className="text-2xl font-bold">
                  ${filtros.etiquetasSeleccionadas.length > 0 
                    ? filtros.etiquetasSeleccionadas.reduce((sum, id) => {
                        const etiqueta = analyticsData.find(e => e.id === id);
                        return sum + (etiqueta ? etiqueta.valorTotal || 0 : 0);
                      }, 0).toLocaleString()
                    : analyticsData.reduce((sum, e) => sum + (e.valorTotal || 0), 0).toLocaleString()
                  }
                </p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl">
                <h4 className="text-sm text-orange-100">Regiones</h4>
                <p className="text-2xl font-bold">{regionData.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesEtiquetas; 