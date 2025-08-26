'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MovementFiltersType } from '@/types/inventory'
import { MOVEMENT_TYPE_LABELS } from '@/types/inventory'
import { Filter, X, Search, Calendar, Package, Warehouse } from 'lucide-react'
import ProductFilterSearch from '@/components/inventory/ProductFilterSearch'

interface MovementFiltersProps {
  warehouses: Array<{ id: number; name: string }>
  products: Array<{ id: number; name: string; sku: string }>
  currentFilters: MovementFiltersType
}

export default function MovementFilters({ warehouses, products, currentFilters }: MovementFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<MovementFiltersType>(currentFilters)

  const activeFilters = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length

  const updateFilters = (newFilters: Partial<MovementFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString())
      }
    })
    
    params.delete('page')
    router.push(`/dashboard/inventory/movements?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({})
    router.push('/dashboard/inventory/movements')
  }

  const removeFilter = (key: keyof MovementFiltersType) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    setFilters(newFilters)
    
    const params = new URLSearchParams(searchParams)
    params.delete(key)
    params.delete('page')
    router.push(`/dashboard/inventory/movements?${params.toString()}`)
  }

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId)
    return product ? `${product.name} (${product.sku})` : 'Producto no encontrado'
  }

  const getWarehouseName = (warehouseId: number) => {
    const warehouse = warehouses.find(w => w.id === warehouseId)
    return warehouse ? warehouse.name : 'Bodega no encontrada'
  }

  return (
    <div className="space-y-6">
      {/* Filtros Activos */}
      {activeFilters > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Filtros activos ({activeFilters})</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === '') return null
              
              let label = ''
              let displayValue = value.toString()
              let icon = <Filter className="h-3 w-3" />
              
              switch (key) {
                case 'productId':
                  label = 'Producto'
                  displayValue = getProductName(Number(value))
                  icon = <Package className="h-3 w-3" />
                  break
                case 'fromWarehouseId':
                  label = 'Bodega Origen'
                  displayValue = getWarehouseName(Number(value))
                  icon = <Warehouse className="h-3 w-3" />
                  break
                case 'toWarehouseId':
                  label = 'Bodega Destino'
                  displayValue = getWarehouseName(Number(value))
                  icon = <Warehouse className="h-3 w-3" />
                  break
                case 'movementType':
                  label = 'Tipo'
                  displayValue = MOVEMENT_TYPE_LABELS[value as keyof typeof MOVEMENT_TYPE_LABELS]
                  icon = <Filter className="h-3 w-3" />
                  break
                case 'startDate':
                  label = 'Desde'
                  displayValue = new Date(value).toLocaleDateString('es-CL')
                  icon = <Calendar className="h-3 w-3" />
                  break
                case 'endDate':
                  label = 'Hasta'
                  displayValue = new Date(value).toLocaleDateString('es-CL')
                  icon = <Calendar className="h-3 w-3" />
                  break
                default:
                  label = key
              }
              
              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-300">
                  <span className="flex items-center gap-1">
                    {icon}
                    <span className="text-xs">{label}: {displayValue}</span>
                  </span>
                  <button
                    onClick={() => removeFilter(key as keyof MovementFiltersType)}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-blue-600 hover:text-blue-800">
              Limpiar todos
            </Button>
          </div>
        </div>
      )}

      {/* Formulario de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Producto - buscador inteligente */}
        <div className="space-y-2">
          <Label htmlFor="productId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Package className="h-4 w-4" />
            Producto
          </Label>
          <ProductFilterSearch
            placeholder="Buscar producto..."
            initialValue={filters.productId}
            onSelect={(product) => updateFilters({ productId: product?.id })}
          />
        </div>

        {/* Bodega Origen */}
        <div className="space-y-2">
          <Label htmlFor="fromWarehouseId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Warehouse className="h-4 w-4" />
            Bodega Origen
          </Label>
          <Select
            value={filters.fromWarehouseId?.toString() || 'all'}
            onValueChange={(value) => updateFilters({ fromWarehouseId: value === 'all' ? undefined : parseInt(value) })}
          >
            <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500">
              <SelectValue placeholder="Seleccionar bodega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las bodegas</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bodega Destino */}
        <div className="space-y-2">
          <Label htmlFor="toWarehouseId" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Warehouse className="h-4 w-4" />
            Bodega Destino
          </Label>
          <Select
            value={filters.toWarehouseId?.toString() || 'all'}
            onValueChange={(value) => updateFilters({ toWarehouseId: value === 'all' ? undefined : parseInt(value) })}
          >
            <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500">
              <SelectValue placeholder="Seleccionar bodega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las bodegas</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Movimiento */}
        <div className="space-y-2">
          <Label htmlFor="movementType" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            Tipo
          </Label>
          <Select
            value={filters.movementType || 'all'}
            onValueChange={(value) => updateFilters({ movementType: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha Inicio */}
        <div className="space-y-2">
          <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            Desde
          </Label>
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => updateFilters({ startDate: e.target.value || undefined })}
            className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500"
          />
        </div>

        {/* Fecha Fin */}
        <div className="space-y-2">
          <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            Hasta
          </Label>
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => updateFilters({ endDate: e.target.value || undefined })}
            className="bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <Button onClick={applyFilters} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <Search className="h-4 w-4" />
          Aplicar Filtros
        </Button>
        {activeFilters > 0 && (
          <Button variant="outline" onClick={clearFilters} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Limpiar Filtros
          </Button>
        )}
        <div className="ml-auto text-sm text-gray-500">
          {activeFilters > 0 ? `${activeFilters} filtro(s) activo(s)` : 'Sin filtros aplicados'}
        </div>
      </div>
    </div>
  )
} 