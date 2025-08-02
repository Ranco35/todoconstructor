'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { getAllPOSSales, deletePOSSalesInBulk } from '@/actions/pos/pos-actions'
import { getCurrentUser } from '@/actions/configuration/auth-actions'
import { ArrowLeft, Search, Filter, Calendar, Trash2, Check, X, ShoppingCart, CreditCard, Building2, Eye } from 'lucide-react'
import Link from 'next/link'

interface POSSale {
  id: number
  saleNumber: string
  date: string
  customerName: string
  total: number
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER'
  status: 'COMPLETADO' | 'PENDIENTE' | 'CANCELADO'
  location: string
  items?: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

interface Filters {
  posType: string
  paymentMethod: string
  status: string
  dateFrom: string
  dateTo: string
}

interface Stats {
  totalSales: number
  totalAmount: number
  cashSales: number
  cardSales: number
  transferSales: number
}

export default function POSSalesPage() {
  const [sales, setSales] = useState<POSSale[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalAmount: 0,
    cashSales: 0,
    cardSales: 0,
    transferSales: 0
  })
  
  const [filters, setFilters] = useState<Filters>({
    posType: '',
    paymentMethod: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })
  
  // Estados para selección múltiple y eliminación
  const [selectedSales, setSelectedSales] = useState<number[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  // Verificar si el usuario es administrador
  const isAdmin = currentUser?.role === 'ADMIN' || 
                  currentUser?.role === 'admin' || 
                  currentUser?.role === 'ADMINISTRADOR' ||
                  currentUser?.role === 'Administrador Sistema'
  
  useEffect(() => {
    if (currentUser) {
      setUserLoaded(true)
    }
  }, [currentUser])

  const resetFilters = () => {
    setFilters({
      posType: '',
      paymentMethod: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    })
    setSearchTerm('')
    setCurrentPage(1)
  }

  const loadSales = async () => {
    try {
      setLoading(true)
      const response = await getAllPOSSales({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        registerTypeId: filters.posType ? (filters.posType === 'reception' ? 1 : filters.posType === 'restaurant' ? 2 : undefined) : undefined,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        paymentMethod: filters.paymentMethod,
        status: filters.status
      })
      
      if (response.success && response.data) {
        const salesData = Array.isArray(response.data) ? response.data : []
        setSales(salesData)
        setTotalPages(Math.ceil((response.total || 0) / pageSize))
        
        // Calcular estadísticas
        const cashSales = salesData.filter(s => s.paymentMethod === 'CASH').length
        const cardSales = salesData.filter(s => s.paymentMethod === 'CARD').length
        const transferSales = salesData.filter(s => s.paymentMethod === 'TRANSFER').length
        const totalAmount = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0)
        
        setStats({
          totalSales: salesData.length,
          totalAmount,
          cashSales,
          cardSales,
          transferSales
        })
      } else {
        // Si no hay datos válidos, resetear a arrays vacíos
        setSales([])
        setStats({
          totalSales: 0,
          totalAmount: 0,
          cashSales: 0,
          cardSales: 0,
          transferSales: 0
        })
      }
    } catch (error) {
      console.error('Error loading sales:', error)
      // En caso de error, asegurar que sales sea un array vacío
      setSales([])
      setStats({
        totalSales: 0,
        totalAmount: 0,
        cashSales: 0,
        cardSales: 0,
        transferSales: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    loadSales()
  }, [currentPage, searchTerm, filters])

  // Funciones para filtros rápidos
  const setQuickFilter = (filterType: 'today' | 'yesterday' | 'thisWeek') => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    let dateFrom = ''
    let dateTo = todayStr
    
    switch (filterType) {
      case 'today':
        dateFrom = todayStr
        dateTo = todayStr
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        dateFrom = yesterdayStr
        dateTo = yesterdayStr
        break
      case 'thisWeek':
        const startOfWeek = new Date(today)
        const dayOfWeek = startOfWeek.getDay()
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Lunes como primer día
        startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract)
        dateFrom = startOfWeek.toISOString().split('T')[0]
        break
    }
    
    setFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo
    }))
  }

  // Funciones para selección múltiple
  const toggleSelectSale = (saleId: number) => {
    if (!saleId) return
    
    setSelectedSales(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    )
  }

  const toggleSelectAll = () => {
    if (!sales || !Array.isArray(sales)) return
    
    if (selectedSales.length === sales.length) {
      setSelectedSales([])
    } else {
      setSelectedSales(sales.map(sale => sale.id))
    }
  }

  // Función para eliminar ventas seleccionadas
  const handleDeleteSelected = async () => {
    if (!selectedSales || selectedSales.length === 0) return
    
    const confirmed = confirm(`¿Estás seguro de que deseas eliminar ${selectedSales.length} venta(s)?`)
    if (!confirmed) return
    
    try {
      setIsDeleting(true)
      const result = await deletePOSSalesInBulk(selectedSales)
      
      if (result.success) {
        toast({
          title: "Ventas eliminadas",
          description: `Se eliminaron ${selectedSales.length} venta(s) exitosamente`,
        })
        setSelectedSales([])
        await loadSales() // Recargar la lista
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar las ventas",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting sales:', error)
      toast({
        title: "Error",
        description: "Error al eliminar las ventas",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETADO':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completado</Badge>
      case 'PENDIENTE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'CANCELADO':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <ShoppingCart className="h-4 w-4" />
      case 'CARD':
        return <CreditCard className="h-4 w-4" />
      case 'TRANSFER':
        return <Building2 className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/pos" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4" />
              Volver al POS
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Historial de Ventas POS
          </h1>
          <p className="text-gray-600 mt-1">
            Visualiza todas las ventas realizadas en el sistema POS
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-lg font-bold text-green-600">$</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Monto Total</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Efectivo</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cashSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tarjeta</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cardSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Transferencias</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.transferSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Rápidos */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickFilter('today')}
                className="flex items-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickFilter('yesterday')}
                className="flex items-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                Ayer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickFilter('thisWeek')}
                className="flex items-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                Esta Semana
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filtros Avanzados */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </div>
              {isAdmin && selectedSales && selectedSales.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Eliminando...' : `Eliminar (${selectedSales.length})`}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número de venta, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros en grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de POS
                </label>
                <Select value={filters.posType || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, posType: value === 'all' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="restaurant">Restaurante</SelectItem>
                    <SelectItem value="reception">Recepción</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Desde
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Hasta
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <Select value={filters.paymentMethod || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value === 'all' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="CARD">Tarjeta</SelectItem>
                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="COMPLETADO">Completado</SelectItem>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={resetFilters} variant="outline" size="sm">
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ventas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ventas ({sales?.length || 0})
            </CardTitle>
            <p className="text-sm text-gray-600">
              Haz doble clic en el número de venta o fecha para ver los detalles completos
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !sales || sales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron ventas con los filtros seleccionados
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tabla */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        {isAdmin && (
                          <th className="text-left p-3 w-12">
                            <button
                              onClick={toggleSelectAll}
                              className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 hover:bg-gray-100"
                              title={selectedSales.length === (sales?.length || 0) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                            >
                              {selectedSales.length === (sales?.length || 0) && (sales?.length || 0) > 0 ? (
                                <Check className="h-4 w-4 text-blue-600" />
                              ) : null}
                            </button>
                          </th>
                        )}
                        <th className="text-left p-3">Número</th>
                        <th className="text-left p-3">Fecha</th>
                        <th className="text-left p-3">Cliente</th>
                        <th className="text-left p-3">Mesa/Habitación</th>
                        <th className="text-left p-3">Método</th>
                        <th className="text-left p-3">Total</th>
                        <th className="text-left p-3">Estado</th>
                        <th className="text-left p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(sales || []).map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                          {isAdmin && (
                            <td className="p-3">
                              <button
                                onClick={() => toggleSelectSale(sale.id)}
                                className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 hover:bg-gray-100"
                              >
                                {selectedSales && selectedSales.includes(sale.id) ? (
                                  <Check className="h-4 w-4 text-blue-600" />
                                ) : null}
                              </button>
                            </td>
                          )}
                          <td className="p-3">
                            <span className="font-mono text-sm">{sale.saleNumber || 'N/A'}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-gray-600">
                              {sale.date ? new Date(sale.date).toLocaleDateString('es-CL') : 'Fecha no disponible'}
                            </span>
                            <br />
                            <span className="text-xs text-gray-400">
                              {sale.date ? new Date(sale.date).toLocaleTimeString('es-CL', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) : '--:--'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                              <span className="text-xs font-medium">
                                {sale.customerName ? sale.customerName.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
                              </span>
                              </div>
                              <span className="text-sm">{sale.customerName || 'Cliente sin nombre'}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-gray-600">{sale.location || '-'}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(sale.paymentMethod)}
                              <span className="text-sm">
                                {sale.paymentMethod === 'CASH' ? 'Efectivo' : 
                                 sale.paymentMethod === 'CARD' ? 'Tarjeta' : 
                                 sale.paymentMethod === 'TRANSFER' ? 'Transferencia' :
                                 'Desconocido'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-green-600">
                              ${sale.total ? sale.total.toLocaleString() : '0'}
                            </span>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(sale.status || 'PENDIENTE')}
                          </td>
                          <td className="p-3">
                            <Link href={`/dashboard/pos/sales/${sale.id}`}>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                Ver
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 