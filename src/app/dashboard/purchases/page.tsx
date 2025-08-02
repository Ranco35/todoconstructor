'use client'

import React, { useState, useEffect } from 'react'

// Forzar renderizado dinámico para evitar problemas de prerendering
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Brain,
  Upload,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

// Componentes
import PDFInvoiceUploader from '@/components/purchases/PDFInvoiceUploader'
import { getPurchaseInvoices, getPurchaseInvoiceStats, getInvoicesRequiringReview } from '@/actions/purchases/purchase-invoices'

// Interfaces
interface PurchaseInvoice {
  id: number
  invoice_number: string
  supplier_id: number | null
  invoice_date: string
  due_date: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  status: string
  payment_status: string
  pdf_file_path: string | null
  extraction_confidence: number | null
  manual_review_required: boolean
  notes: string | null
  created_at: string
  Supplier?: {
    id: number
    name: string
    vat: string
    email: string
  }
}

interface Stats {
  total: number
  draft: number
  approved: number
  paid: number
  totalAmount: number
  pendingAmount: number
  averageProcessingTime: number
}

export default function PurchasesPage() {
  const { toast } = useToast()
  
  // Estados principales
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<PurchaseInvoice[]>([])
  const [reviewInvoices, setReviewInvoices] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Cargar datos en paralelo
      const [statsResult, invoicesResult, reviewResult] = await Promise.all([
        getPurchaseInvoiceStats(),
        getPurchaseInvoices({ page: 1, limit: 10 }),
        getInvoicesRequiringReview()
      ])

      if (statsResult.success) {
        setStats(statsResult.data)
      }

      if (invoicesResult.success) {
        setRecentInvoices(invoicesResult.data.invoices)
      }

      if (reviewResult.success) {
        setReviewInvoices(reviewResult.data)
      }

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
      toast({
        title: "Error",
        description: "Error cargando datos del dashboard",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtener color del badge según estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return { variant: 'outline' as const, text: 'Borrador', color: 'bg-gray-500' }
      case 'approved': return { variant: 'default' as const, text: 'Aprobada', color: 'bg-blue-500' }
      case 'paid': return { variant: 'default' as const, text: 'Pagada', color: 'bg-green-500' }
      case 'disputed': return { variant: 'destructive' as const, text: 'Disputada', color: 'bg-red-500' }
      case 'cancelled': return { variant: 'secondary' as const, text: 'Cancelada', color: 'bg-gray-400' }
      default: return { variant: 'outline' as const, text: status, color: 'bg-gray-500' }
    }
  }

  // Obtener color del badge según confianza
  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return { variant: 'outline' as const, text: 'Manual', color: 'bg-gray-500' }
    if (confidence >= 0.9) return { variant: 'default' as const, text: 'Muy alta', color: 'bg-green-500' }
    if (confidence >= 0.7) return { variant: 'secondary' as const, text: 'Alta', color: 'bg-blue-500' }
    if (confidence >= 0.5) return { variant: 'outline' as const, text: 'Media', color: 'bg-yellow-500' }
    return { variant: 'destructive' as const, text: 'Baja', color: 'bg-red-500' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturas de Compras</h1>
          <p className="text-gray-600 mt-1">
            Gestión inteligente de facturas con procesamiento automático por IA
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/purchases/invoices">
              <FileText className="h-4 w-4 mr-2" />
              Ver Todas
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/purchases/invoices/create">
              <Upload className="h-4 w-4 mr-2" />
              Nueva Factura
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Procesador IA
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Revisiones
            {reviewInvoices.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1 text-xs">
                {reviewInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          {/* Estadísticas principales */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.draft || 0} borradores, {stats?.approved || 0} aprobadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(stats.totalAmount || 0).toLocaleString('es-CL')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${(stats.pendingAmount || 0).toLocaleString('es-CL')} pendiente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Facturas Pagadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.paid || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {(stats?.total || 0) > 0 ? (((stats?.paid || 0) / (stats?.total || 1)) * 100).toFixed(1) : 0}% del total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo Procesamiento</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.averageProcessingTime || 0}</div>
                  <p className="text-xs text-muted-foreground">días promedio</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sistema Consolidado Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Brain className="h-5 w-5" />
                Sistema Consolidado de Procesamiento IA
              </CardTitle>
              <CardDescription className="text-blue-700">
                Procesador unificado con IA y OCR + Matching inteligente de productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">IA + OCR</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Matching Inteligente</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Sistema Unificado</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facturas recientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Facturas Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{invoice.invoice_number}</span>
                          <Badge {...getStatusBadge(invoice.status)}>
                            {getStatusBadge(invoice.status).text}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {invoice.Supplier?.name || 'Sin proveedor'}
                        </p>
                        <p className="text-sm font-semibold">
                          ${(invoice.total_amount || 0).toLocaleString('es-CL')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {invoice.extraction_confidence && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            title={`Confianza: ${(invoice.extraction_confidence * 100).toFixed(0)}%`}
                          >
                            <Brain className="h-3 w-3 mr-1" />
                            {(invoice.extraction_confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/purchases/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métricas de IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Rendimiento de IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Facturas procesadas con IA</span>
                      <span>
                        {recentInvoices.filter(i => i.extraction_confidence).length}/{recentInvoices.length}
                      </span>
                    </div>
                    <Progress 
                      value={recentInvoices.length > 0 
                        ? (recentInvoices.filter(i => i.extraction_confidence).length / recentInvoices.length) * 100
                        : 0
                      } 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Confianza promedio</span>
                      <span>
                        {recentInvoices.filter(i => i.extraction_confidence).length > 0
                          ? (recentInvoices
                              .filter(i => i.extraction_confidence)
                              .reduce((sum, i) => sum + (i.extraction_confidence || 0), 0) / 
                            recentInvoices.filter(i => i.extraction_confidence).length * 100
                          ).toFixed(0)
                          : 0
                        }%
                      </span>
                    </div>
                    <Progress 
                      value={recentInvoices.filter(i => i.extraction_confidence).length > 0
                        ? (recentInvoices
                            .filter(i => i.extraction_confidence)
                            .reduce((sum, i) => sum + (i.extraction_confidence || 0), 0) / 
                          recentInvoices.filter(i => i.extraction_confidence).length * 100
                        )
                        : 0
                      } 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {recentInvoices.filter(i => !i.manual_review_required).length}
                      </div>
                      <div className="text-xs text-gray-600">Auto-aprobadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {recentInvoices.filter(i => i.manual_review_required).length}
                      </div>
                      <div className="text-xs text-gray-600">Requieren revisión</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Procesador de IA */}
        <TabsContent value="upload">
          <PDFInvoiceUploader />
        </TabsContent>

        {/* Tab: Lista de facturas */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Facturas de Compra</span>
                <Button asChild>
                  <Link href="/dashboard/purchases/invoices">
                    Ver Lista Completa
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{invoice.invoice_number}</span>
                        <Badge {...getStatusBadge(invoice.status)}>
                          {getStatusBadge(invoice.status).text}
                        </Badge>
                        {invoice.extraction_confidence && (
                          <Badge {...getConfidenceBadge(invoice.extraction_confidence)}>
                            IA: {(invoice.extraction_confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                        {invoice.manual_review_required && (
                          <Badge variant="destructive">Requiere Revisión</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📅 {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('es-CL') : 'Sin fecha'}</span>
                        <span>🏢 {invoice.Supplier?.name || 'Sin proveedor'}</span>
                        <span>💰 ${(invoice.total_amount || 0).toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/purchases/invoices/${invoice.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/purchases/invoices/${invoice.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Facturas que requieren revisión */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Facturas que Requieren Revisión Manual
                <Badge variant="destructive">{reviewInvoices.length}</Badge>
              </CardTitle>
              <CardDescription>
                Estas facturas tienen baja confianza o requieren verificación antes de aprobarse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">¡Todo al día!</h3>
                  <p className="text-gray-600">No hay facturas que requieran revisión manual</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewInvoices.map((invoice) => (
                    <div key={invoice.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{invoice.invoice_number}</span>
                            <Badge variant="destructive">Requiere Revisión</Badge>
                            {invoice.extraction_confidence && (
                              <Badge variant="outline">
                                Confianza: {(invoice.extraction_confidence * 100).toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>📅 {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('es-CL') : 'Sin fecha'}</span>
                            <span>🏢 {invoice.Supplier?.name || 'Sin proveedor'}</span>
                            <span>💰 ${(invoice.total_amount || 0).toLocaleString('es-CL')}</span>
                          </div>
                          {invoice.notes && (
                            <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                              <strong>Notas:</strong> {invoice.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/purchases/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Revisar
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/dashboard/purchases/invoices/${invoice.id}/edit`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 