"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, History } from 'lucide-react'
import BodegaSelector from '@/components/products/BodegaSelector'
import CategorySelector from '@/components/products/CategorySelector'

import Link from 'next/link'

interface InventoryPhysicalResult {
  success: boolean;
  updated: number;
  errors: number;
  differences: Array<{
    sku: string;
    nombre: string;
    stockAnterior: number;
    stockContado: number;
    diferencia: number;
    comentario?: string;
  }>;
  errorDetails: string[];
}

export default function InventoryPhysicalForm() {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [includeAllProducts, setIncludeAllProducts] = useState(false)
  const [warehouseProductCount, setWarehouseProductCount] = useState<number | null>(null)
  const [categoryProductCount, setCategoryProductCount] = useState<number | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(false)
  const [isLoadingCategoryCount, setIsLoadingCategoryCount] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comentarios, setComentarios] = useState('')
  const [result, setResult] = useState<InventoryPhysicalResult | null>(null)

  const getWarehouseProductCount = async (warehouseId: number) => {
    setIsLoadingCount(true)
    try {
      const response = await fetch('/api/inventory/physical/count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ warehouseId })
      })

      if (response.ok) {
        const data = await response.json()
        setWarehouseProductCount(data.count)
      } else {
        setWarehouseProductCount(null)
      }
    } catch (error) {
      console.error('Error obteniendo conteo:', error)
      setWarehouseProductCount(null)
    } finally {
      setIsLoadingCount(false)
    }
  }

  const getCategoryProductCount = async (categoryId: number) => {
    setIsLoadingCategoryCount(true)
    try {
      const response = await fetch('/api/inventory/physical/count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId })
      })

      if (response.ok) {
        const data = await response.json()
        setCategoryProductCount(data.count)
      } else {
        setCategoryProductCount(null)
      }
    } catch (error) {
      console.error('Error obteniendo conteo por categoría:', error)
      setCategoryProductCount(null)
    } finally {
      setIsLoadingCategoryCount(false)
    }
  }

  const handleWarehouseChange = (warehouseId: number | undefined) => {
    setSelectedWarehouseId(warehouseId || null)
    setWarehouseProductCount(null)
    if (warehouseId) {
      getWarehouseProductCount(warehouseId)
    }
  }

  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId || null)
    setCategoryProductCount(null)
    if (categoryId) {
      getCategoryProductCount(categoryId)
    }
  }

  const handleDownloadTemplate = async () => {
    if (!selectedWarehouseId) {
      alert('Selecciona una bodega primero')
      return
    }

    if (includeAllProducts && !selectedCategoryId) {
      alert('Selecciona una categoría para incluir todos los productos')
      return
    }

    setIsDownloading(true)
    try {
      const response = await fetch('/api/inventory/physical/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          warehouseId: selectedWarehouseId,
          categoryId: selectedCategoryId,
          includeAllProducts: includeAllProducts
        })
      })

      if (!response.ok) {
        throw new Error('Error descargando plantilla')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename = includeAllProducts && selectedCategoryId 
        ? `inventario-fisico-bodega-${selectedWarehouseId}-categoria-${selectedCategoryId}.xlsx`
        : `inventario-fisico-bodega-${selectedWarehouseId}.xlsx`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error descargando plantilla:', error)
      alert('Error descargando plantilla')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedWarehouseId) {
      alert('Selecciona un archivo y una bodega')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('warehouseId', selectedWarehouseId.toString())
      if (comentarios) {
        formData.append('comentarios', comentarios)
      }

      const response = await fetch('/api/inventory/physical/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error en la importación')
      }

      const result = await response.json()
      setResult(result)
    } catch (error) {
      console.error('Error subiendo archivo:', error)
      alert('Error procesando archivo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Toma de Inventario Físico
              </CardTitle>
              <CardDescription>
                Descarga la plantilla Excel, completa el conteo físico y súbela para actualizar el inventario
              </CardDescription>
            </div>
            <Link href="/dashboard/inventory/physical/history">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                Ver Historial
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Paso 1: Selección de Bodega */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bodega</Label>
              <BodegaSelector
                value={selectedWarehouseId ?? undefined}
                onChange={handleWarehouseChange}
              />
              {selectedWarehouseId && (
                <div className="text-sm text-gray-600 mt-2">
                  {isLoadingCount ? (
                    <span>Cargando...</span>
                  ) : warehouseProductCount !== null ? (
                    <span className="font-medium">
                      📦 {warehouseProductCount} productos asignados a esta bodega
                    </span>
                  ) : (
                    <span className="text-red-500">Error obteniendo conteo</span>
                  )}
                </div>
              )}
            </div>

            {/* Opciones de Exportación */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Opciones de Exportación</Label>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportType"
                    checked={!includeAllProducts}
                    onChange={() => setIncludeAllProducts(false)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Solo productos asignados a la bodega</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="exportType"
                    checked={includeAllProducts}
                    onChange={() => setIncludeAllProducts(true)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Todos los productos de una categoría</span>
                </label>
              </div>

              {includeAllProducts && (
                <div className="space-y-2 mt-3">
                  <Label className="text-sm">Seleccionar Categoría</Label>
                  <CategorySelector
                    value={selectedCategoryId ?? undefined}
                    onChange={handleCategoryChange}
                  />
                  {selectedCategoryId && (
                    <div className="text-sm text-gray-600 mt-2">
                      {isLoadingCategoryCount ? (
                        <span>Cargando...</span>
                      ) : categoryProductCount !== null ? (
                        <span className="font-medium">
                          🏷️ {categoryProductCount} productos en esta categoría
                        </span>
                      ) : (
                        <span className="text-red-500">Error obteniendo conteo</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Paso 2: Descarga de Plantilla */}
          <div className="space-y-2">
            <Label>Descargar Plantilla Excel</Label>
            <Button 
              onClick={handleDownloadTemplate}
              disabled={!selectedWarehouseId || isDownloading || (includeAllProducts && !selectedCategoryId)}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Descargando...' : 'Descargar Plantilla'}
            </Button>
          </div>

          <Separator />

          {/* Paso 3: Subida de Archivo */}
          <div className="space-y-2">
            <Label>Subir Archivo Completado</Label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label>Comentarios (opcional)</Label>
            <Textarea
              placeholder="Observaciones sobre la toma de inventario..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <Button 
            onClick={handleFileUpload}
            disabled={!selectedFile || !selectedWarehouseId || isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Procesando...' : 'Procesar Inventario Físico'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              Resultado del Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.updated}</div>
                <div className="text-sm text-muted-foreground">Productos Actualizados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.differences.length}</div>
                <div className="text-sm text-muted-foreground">Diferencias Encontradas</div>
              </div>
            </div>

            {result.differences.length > 0 && (
              <div className="space-y-2">
                <Label>Diferencias de Stock</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.differences.map((diff, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{diff.nombre}</div>
                          <div className="text-sm text-muted-foreground">SKU: {diff.sku}</div>
                        </div>
                        <Badge
                          variant={diff.diferencia > 0 ? "default" : "destructive"}
                          className={diff.diferencia < 0 ? "bg-red-600 text-white border-red-600" : ""}
                        >
                          {diff.diferencia > 0 ? '+' : ''}{diff.diferencia}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Stock Anterior:</span>
                          <span className="ml-2 font-medium">{diff.stockAnterior}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock Contado:</span>
                          <span className="ml-2 font-medium">{diff.stockContado}</span>
                        </div>
                      </div>
                      {diff.comentario && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Comentario:</span> {diff.comentario}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errorDetails.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Errores encontrados:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {result.errorDetails.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 