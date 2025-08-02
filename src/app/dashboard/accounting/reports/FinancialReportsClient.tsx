'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  FileText, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Settings
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface FinancialReportsClientProps {
  currentUser: User
}

export default function FinancialReportsClient({ currentUser }: FinancialReportsClientProps) {
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const reportTypes = [
    {
      id: 'income-statement',
      title: 'Estado de Resultados',
      description: 'Ingresos, gastos y utilidades por período',
      icon: <TrendingUp className="h-5 w-5" />,
      status: 'available'
    },
    {
      id: 'balance-sheet',
      title: 'Balance General',
      description: 'Activos, pasivos y patrimonio',
      icon: <BarChart3 className="h-5 w-5" />,
      status: 'development'
    },
    {
      id: 'cash-flow',
      title: 'Flujo de Caja',
      description: 'Movimientos de efectivo y equivalentes',
      icon: <DollarSign className="h-5 w-5" />,
      status: 'development'
    },
    {
      id: 'sales-report',
      title: 'Reporte de Ventas',
      description: 'Análisis detallado de ventas por período',
      icon: <ArrowUpRight className="h-5 w-5" />,
      status: 'available'
    },
    {
      id: 'expenses-report',
      title: 'Reporte de Gastos',
      description: 'Análisis de gastos operacionales y compras',
      icon: <ArrowDownRight className="h-5 w-5" />,
      status: 'available'
    },
    {
      id: 'custom-report',
      title: 'Reportes Personalizados',
      description: 'Crear reportes específicos según necesidades',
      icon: <Settings className="h-5 w-5" />,
      status: 'development'
    }
  ]

  const periods = [
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Año' },
    { value: 'custom', label: 'Período Personalizado' }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">Disponible</Badge>
      case 'development':
        return <Badge variant="secondary">En Desarrollo</Badge>
      default:
        return <Badge variant="outline">No Disponible</Badge>
    }
  }

  const handleGenerateReport = (reportId: string) => {
    if (reportTypes.find(r => r.id === reportId)?.status === 'available') {
      // TODO: Implementar navegación a reportes específicos
      console.log(`Generando reporte: ${reportId} para período: ${selectedPeriod}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes financieros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Reportes Financieros
              </h1>
              <p className="text-gray-600 mt-2">
                Generar y analizar reportes financieros para el Hotel/Spa Admintermas
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Usuario:</p>
              <p className="font-medium">{currentUser.name}</p>
              <Badge variant="outline">{currentUser.role}</Badge>
            </div>
          </div>
        </div>

        {/* Selector de Período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Seleccionar Período
            </CardTitle>
            <CardDescription>
              Escoge el período de tiempo para los reportes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period.value)}
                  className="mb-2"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grid de Reportes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {report.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                    </div>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
                <CardDescription className="mt-2">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={report.status !== 'available'}
                  className="w-full"
                  variant={report.status === 'available' ? 'default' : 'secondary'}
                >
                  {report.status === 'available' ? 'Generar Reporte' : 'Próximamente'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Información Adicional */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Información Importante</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Los reportes se generan en tiempo real basándose en datos actuales</li>
                  <li>• Algunos reportes están en desarrollo y estarán disponibles próximamente</li>
                  <li>• Para reportes personalizados, contacta al administrador del sistema</li>
                  <li>• Los datos incluyen información de ventas, compras, gastos y caja chica</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 