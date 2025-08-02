'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, Brain, CheckCircle, AlertCircle, Eye, Edit, AlertTriangle, Cpu, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { processPDFInvoice, createInvoiceDraft, findSupplierByData, findExistingInvoice } from '@/actions/purchases/pdf-processor'
import { findSupplierWithSuggestions } from '@/lib/client-actions'
import { PDFDataCorrectionModal } from './PDFDataCorrectionModal'
import { getCurrentUser } from '@/actions/configuration/auth-actions'
import { Label } from '@/components/ui/label'

// Interfaces
interface ExtractedData {
  invoiceNumber: string
  supplierInvoiceNumber?: string // Número oficial de la factura del proveedor
  supplierName: string
  supplierRut: string
  issueDate: string
  dueDate: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  confidence: number
  lines?: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
    productId?: string // Nuevo campo para el ID del producto vinculado
  }>
}

interface ProcessingStage {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
}

type ProcessingMethod = 'ai' | 'ocr'

export default function PDFInvoiceUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierSuggestions, setSupplierSuggestions] = useState<any[]>([])
  const [hasExactSupplierMatch, setHasExactSupplierMatch] = useState(false)
  const [processingMethod, setProcessingMethod] = useState<ProcessingMethod>('ai')
  const [enableIntelligentMatching, setEnableIntelligentMatching] = useState(true)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [duplicateInvoice, setDuplicateInvoice] = useState<any>(null)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: 'upload', name: 'Subir Archivo', status: 'pending', progress: 0 },
    { id: 'extract', name: 'Extraer Texto', status: 'pending', progress: 0 },
    { id: 'analyze', name: processingMethod === 'ai' ? 'Analizar con IA' : 'Procesar con OCR', status: 'pending', progress: 0 },
    { id: 'validate', name: 'Validar Datos', status: 'pending', progress: 0 }
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('Error verificando autenticación:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoadingAuth(false)
      }
    }

    checkAuth()
  }, [])

  // Redirigir si no está autenticado
  useEffect(() => {
    if (isLoadingAuth) return // Esperar a que termine la verificación

    if (isAuthenticated === false) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para procesar PDFs",
        variant: "destructive",
      })
      router.push('/login')
    }
  }, [isAuthenticated, isLoadingAuth, router, toast])

  const updateStage = (stageId: string, status: ProcessingStage['status'], progress: number) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId ? { ...stage, status, progress } : stage
    ))
  }

  const resetStages = () => {
    setStages([
      { id: 'upload', name: 'Subir Archivo', status: 'pending', progress: 0 },
      { id: 'extract', name: 'Extraer Texto', status: 'pending', progress: 0 },
      { id: 'analyze', name: processingMethod === 'ai' ? 'Analizar con IA' : 'Procesar con OCR', status: 'pending', progress: 0 },
      { id: 'validate', name: 'Validar Datos', status: 'pending', progress: 0 }
    ])
  }

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setExtractedData(null)
    setExtractedText('')
          setSuppliers([])
      setSupplierSuggestions([])
      setHasExactSupplierMatch(false)
      setDuplicateInvoice(null)
      setShowDuplicateWarning(false)
      resetStages()
    updateStage('upload', 'completed', 100)
  }

  const processPDF = async () => {
    if (!file) return

    // Verificar autenticación antes de procesar
    if (!isAuthenticated) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para procesar PDFs",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    setIsProcessing(true)
    setShowPreview(false)

    try {
      // Etapa 2: Extraer texto
      updateStage('extract', 'processing', 30)
      const fileText = await extractTextFromFile(file)
      
      // Validación robusta del texto extraído
      if (!fileText || typeof fileText !== 'string' || fileText.trim().length === 0) {
        throw new Error('No se pudo extraer texto del PDF. El archivo puede estar vacío o corrupto.')
      }

      console.log('✅ Texto extraído exitosamente:', fileText.length, 'caracteres')
      console.log('📝 Vista previa del texto:', fileText.substring(0, 200) + '...')
      
      setExtractedText(fileText)
      updateStage('extract', 'completed', 100)

      // Etapa 3: Análisis (IA o OCR)
      updateStage('analyze', 'processing', 20)
      
      // SOLUCIÓN DRÁSTICA: Truncar texto inmediatamente para evitar límite de tokens
      console.log('🔍 Aplicando truncado agresivo para evitar límite de tokens...')
      
      // LÍMITE ULTRA CONSERVADOR: 1500 tokens (6,000 caracteres)
      const maxChars = 6000
      let processedText = fileText
      
      if (fileText.length > maxChars) {
        console.log(`⚠️ Texto muy largo (${fileText.length} chars), truncando a ${maxChars} caracteres`)
        processedText = fileText.substring(0, maxChars)
        console.log('📝 Texto truncado agresivamente para evitar límite de tokens de ChatGPT')
      }
      
      // Verificación adicional: si aún es muy largo, truncar más
      if (processedText.length > 6000) {
        console.log(`⚠️ Texto aún muy largo después de filtrado (${processedText.length} chars), truncando a 6000 caracteres`)
        processedText = processedText.substring(0, 6000)
      }
      
      // Verificación final: asegurar que no exceda 4000 caracteres (1000 tokens)
      if (processedText.length > 4000) {
        console.log(`⚠️ Texto aún muy largo (${processedText.length} chars), truncando a 4000 caracteres para garantizar límite`)
        processedText = processedText.substring(0, 4000)
      }
      
      // Intentar extraer partes relevantes del texto truncado
      try {
        // Import dinámico de las funciones de filtrado
        const { extractRelevantInvoiceText, extractCriticalInvoiceText } = await import('@/lib/pdf-text-extractor')
        
        const relevantText = extractRelevantInvoiceText(processedText)
        if (relevantText.length > 0 && relevantText.length < processedText.length) {
          processedText = relevantText
          console.log(`✅ Aplicado filtrado relevante: ${relevantText.length} caracteres`)
        } else {
          // Si el filtrado relevante no reduce el texto, usar extracción crítica
          const criticalText = extractCriticalInvoiceText(processedText)
          if (criticalText.length > 0 && criticalText.length < processedText.length) {
            processedText = criticalText
            console.log(`✅ Aplicado filtrado crítico: ${criticalText.length} caracteres`)
          }
        }
      } catch (error) {
        console.log('⚠️ Error en filtrado relevante, usando extracción crítica:', error)
        try {
          // Import dinámico como fallback
          const { extractCriticalInvoiceText } = await import('@/lib/pdf-text-extractor')
          const criticalText = extractCriticalInvoiceText(processedText)
          if (criticalText.length > 0) {
            processedText = criticalText
            console.log(`✅ Aplicado filtrado crítico como fallback: ${criticalText.length} caracteres`)
          }
        } catch (criticalError) {
          console.log('⚠️ Error en filtrado crítico, usando texto truncado:', criticalError)
        }
      }
      
      const result = await processPDFInvoice(processedText, file.name, file.size, processingMethod)
      
      // Validación robusta del resultado
      if (!result) {
        throw new Error('No se recibió respuesta del procesamiento')
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Error procesando PDF')
      }
      
      if (!result.data || typeof result.data !== 'object') {
        throw new Error('Los datos extraídos del PDF no son válidos')
      }
      
      updateStage('analyze', 'completed', 100)

      // Etapa 4: Validar datos
      updateStage('validate', 'processing', 50)
      
      console.log('📋 Datos extraídos:', {
        supplierName: result.data.supplierName || 'No especificado',
        supplierRut: result.data.supplierRut || 'No especificado',
        totalAmount: result.data.totalAmount || 0,
        confidence: result.data.confidence || 0,
        method: processingMethod
      })
      
      // Buscar proveedores con sugerencias inteligentes
      const supplierRut = result.data.supplierRut || ''
      const supplierName = result.data.supplierName || ''
      
      console.log('🔍 Buscando proveedores con RUT:', supplierRut, 'y nombre:', supplierName)
      
      let foundSuppliers: any[] = []
      let suggestions: any[] = []
      let hasExactMatch = false
      
      try {
        const searchResult = await findSupplierWithSuggestions(supplierRut, supplierName)
        console.log('🔍 Resultado completo de búsqueda:', searchResult)
        
        if (searchResult) {
          hasExactMatch = searchResult.hasExactMatch
          
          if (searchResult.exactMatch) {
            foundSuppliers = [searchResult.exactMatch]
            console.log('✅ Proveedor encontrado exactamente:', searchResult.exactMatch.name)
          } else {
            foundSuppliers = []
            console.log('⚠️ No se encontró proveedor exacto')
          }
          
          suggestions = searchResult.suggestions || []
          console.log('💡 Sugerencias encontradas:', suggestions.length)
          
          // Log detallado de sugerencias
          if (suggestions.length > 0) {
            console.log('📋 Detalle de sugerencias:')
            suggestions.forEach((suggestion, index) => {
              console.log(`  ${index + 1}. ${suggestion.name} (ID: ${suggestion.id})`)
            })
          } else {
            console.log('❌ No se encontraron sugerencias de proveedores')
          }
        } else {
          console.log('⚠️ No se encontraron proveedores ni sugerencias')
          foundSuppliers = []
          suggestions = []
        }
      } catch (searchError) {
        console.error('⚠️ Error buscando proveedores:', searchError)
        foundSuppliers = []
        suggestions = []
      }
      
      setSuppliers(foundSuppliers)
      setSupplierSuggestions(suggestions)
      setHasExactSupplierMatch(hasExactMatch)
      
      // Logs de confirmación del estado
      console.log('📊 Estado actualizado:', {
        foundSuppliers: foundSuppliers.length,
        suggestions: suggestions.length,
        hasExactMatch
      })
      
      // 🚨 VALIDACIÓN DE DUPLICADOS ANTES DE MOSTRAR PREVIEW
      if (result.data?.supplierInvoiceNumber) {
        console.log('🔍 Validando duplicados para factura:', result.data.supplierInvoiceNumber)
        
        const supplierId = hasExactMatch && foundSuppliers.length > 0 ? foundSuppliers[0].id : null
        const existingInvoices = await findExistingInvoice(
          result.data.supplierInvoiceNumber,
          supplierId,
          result.data.supplierName
        )
        
        if (existingInvoices.length > 0) {
          const existingInvoice = existingInvoices[0]
          console.warn('⚠️ Factura duplicada detectada en preview:', {
            numeroFactura: result.data.supplierInvoiceNumber,
            facturaExistente: existingInvoice.number,
            proveedor: existingInvoice.suppliers?.name || result.data.supplierName
          })
          
          // Mostrar advertencia de duplicado en lugar de preview normal
          setDuplicateInvoice({
            existing: existingInvoice,
            new: result.data
          })
          setShowDuplicateWarning(true)
          updateStage('validate', 'completed', 100)
          
          // No establecer extractedData ni mostrar preview normal
          return
        }
      }
      
      // Validación final antes de establecer los datos extraídos
      if (result.data && typeof result.data === 'object') {
        console.log('✅ Estableciendo datos extraídos válidos')
        setExtractedData(result.data)
      } else {
        console.error('❌ Error: Datos extraídos no son válidos para establecer en el estado')
        throw new Error('Los datos extraídos no son válidos para mostrar')
      }
      
      updateStage('validate', 'completed', 100)
      setShowPreview(true)

      toast({
        title: "Éxito",
        description: `PDF procesado exitosamente con ${processingMethod.toUpperCase()}`,
      })

    } catch (error) {
      console.error('❌ Error procesando PDF:', error)
      
      // Marcar la etapa actual como error
      const currentStage = stages.find(s => s.status === 'processing')
      if (currentStage) {
        updateStage(currentStage.id, 'error', 0)
      }

      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido procesando PDF'

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Función mejorada de extracción de texto (solo cliente)
  const extractTextFromFile = async (file: File): Promise<string> => {
    // Verificar que estamos en el navegador
    if (typeof window === 'undefined') {
      throw new Error('La extracción de PDF solo funciona en el navegador')
    }

    // Validación de archivo
    if (!file || !file.name) {
      throw new Error('Archivo no válido')
    }

    console.log('📄 Iniciando extracción de texto para:', file.name, 'Tamaño:', file.size)

    try {
      // SOLO usar texto simulado para archivos de prueba
      if (file.name.toLowerCase().includes('test')) {
        if (processingMethod === 'ai') {
          // Modo IA: generar texto simulado específico para el archivo
          const simulatedText = generateSimulatedInvoiceText(file.name)
          
          // Validación del texto simulado
          if (!simulatedText || typeof simulatedText !== 'string' || simulatedText.trim().length === 0) {
            throw new Error('Error generando texto simulado para desarrollo')
          }

          console.log('✅ Texto simulado generado exitosamente:', simulatedText.length, 'caracteres')
          return simulatedText
        } else {
          // Modo OCR: implementar extracción real (placeholder por ahora)
          const ocrText = await extractWithOCR(file)
          
          if (!ocrText || typeof ocrText !== 'string' || ocrText.trim().length === 0) {
            throw new Error('Error extrayendo texto con OCR')
          }

          console.log('✅ Texto OCR extraído exitosamente:', ocrText.length, 'caracteres')
          return ocrText
        }
      } else {
        // Para archivos reales, usar extracción real de PDF con fallback
        console.log('🔍 Extrayendo texto real del PDF con fallback...')
        
        // Import dinámico de la función de extracción (lazy loading)
        const pdfExtractor = await import('@/lib/pdf-text-extractor')
        const extractedText = await pdfExtractor.extractTextWithFallback(file)
        
        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('No se pudo extraer texto del PDF. El archivo puede estar corrupto o ser una imagen.')
        }
        
        console.log('✅ Texto real extraído exitosamente:', extractedText.length, 'caracteres')
        return extractedText
      }
    } catch (error) {
      console.error('❌ Error en extracción:', error)
      throw error
    }
  }

  // Función de extracción OCR (placeholder)
  const extractWithOCR = async (file: File): Promise<string> => {
    // TODO: Implementar OCR real con Tesseract.js o similar
    console.log('🔍 OCR: Procesando archivo:', file.name)
    
    // Simular procesamiento OCR
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return generateSimulatedInvoiceText(file.name, 'OCR')
  }

  // Función para generar texto simulado específico (SOLO PARA TESTING)
  const generateSimulatedInvoiceText = (fileName: string, method: string = 'IA'): string => {
    // SOLO usar texto simulado si el archivo contiene "test" en el nombre
    if (!fileName.toLowerCase().includes('test')) {
      throw new Error('Solo se permite texto simulado para archivos de prueba')
    }
    
    const baseNumber = fileName.replace(/\D/g, '').slice(-6) || '123456'
    const date = new Date().toLocaleDateString('es-CL')
    
    return `FACTURA SIMULADA PARA TESTING - MÉTODO: ${method}
BASADA EN: ${fileName}

IMPORTANTE: Datos generados específicamente para "${fileName}" en modo desarrollo.
En producción extraería el contenido real del PDF usando ${method}.

FACTURA ELECTRÓNICA
Número: F-2025-${baseNumber}
Fecha: ${date}
Método: ${method}

Proveedor: ${fileName.split('.')[0]} Ltda.
RUT: 11-${baseNumber.slice(0,3)}-${baseNumber.slice(-1)}
Dirección: Av. Providencia 123, Santiago
Teléfono: +56 2 ${baseNumber.slice(0,4)} ${baseNumber.slice(4,6)}

DETALLE DE PRODUCTOS:
1. Producto Simulado A    $${parseInt(baseNumber.slice(0,3)) * 100}
2. Servicio Simulado B    $${parseInt(baseNumber.slice(3,6)) * 50}

Subtotal:     $${parseInt(baseNumber) * 10}
IVA (19%):    $${Math.round(parseInt(baseNumber) * 10 * 0.19)}
TOTAL:        $${Math.round(parseInt(baseNumber) * 10 * 1.19)}

Condiciones: 30 días
Método de extracción: ${method}
Confianza de extracción: ${method === 'IA' ? '95%' : '87%'}

--- FIN FACTURA SIMULADA ---`
  }

  const createDraft = async () => {
    if (!extractedData || !file) return

    try {
      const result = await createInvoiceDraft(extractedData, {
        fileName: file.name,
        filePath: `/uploads/${file.name}`,
        fileSize: file.size
      })

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Borrador de factura creado exitosamente",
        })
        router.push('/dashboard/purchases?tab=review')
      } else {
        throw new Error(result.error || 'Error creando borrador')
      }
    } catch (error) {
      console.error('Error creando borrador:', error)
      
      // Manejar específicamente errores de factura duplicada
      if (error instanceof Error && error.message.startsWith('FACTURA_DUPLICADA|')) {
        const duplicateData = JSON.parse(error.message.split('|')[1])
        setDuplicateInvoice(duplicateData)
        setShowDuplicateWarning(true)
        
        toast({
          title: "⚠️ Factura Duplicada",
          description: `Ya existe una factura con el número ${duplicateData.existingInvoice.supplierInvoiceNumber}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error creando borrador",
          variant: "destructive",
        })
      }
    }
  }

  // Mostrar indicador de carga mientras se verifica la autenticación
  if (isLoadingAuth) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Verificando autenticación...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mostrar mensaje si no está autenticado
  if (isAuthenticated === false) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error de autenticación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8">
            Debes iniciar sesión para procesar PDFs.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selector de Método */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Método de Procesamiento
          </CardTitle>
          <CardDescription>
            Selecciona el método para extraer información del PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={processingMethod === 'ai' ? 'default' : 'outline'}
              onClick={() => {
                setProcessingMethod('ai')
                resetStages()
              }}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Inteligencia Artificial
            </Button>
            <Button
              variant={processingMethod === 'ocr' ? 'default' : 'outline'}
              onClick={() => {
                setProcessingMethod('ocr')
                resetStages()
              }}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              OCR (Reconocimiento Óptico)
            </Button>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {processingMethod === 'ai' ? (
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span>IA analiza el contenido y extrae datos con mayor precisión</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" />
                <span>OCR extrae texto directamente sin procesamiento inteligente</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Opción de Matching Inteligente */}
      {processingMethod === 'ai' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Matching Inteligente de Productos
            </CardTitle>
            <CardDescription>
              Vincula automáticamente productos extraídos con tu base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="intelligent-matching"
                checked={enableIntelligentMatching}
                onChange={(e) => setEnableIntelligentMatching(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="intelligent-matching" className="text-sm font-medium">
                Habilitar matching automático de productos
              </label>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-orange-500" />
                <span>Busca y vincula productos por SKU, nombre y similitud automáticamente</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Factura PDF
          </CardTitle>
          <CardDescription>
            Arrastra un archivo PDF o haz clic para seleccionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const files = e.dataTransfer.files
              if (files.length > 0) {
                handleFileSelect(files[0])
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  handleFileSelect(files[0])
                }
              }}
              className="hidden"
            />
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {file ? file.name : 'Seleccionar archivo PDF'}
            </p>
            <p className="text-sm text-gray-500">
              {file ? `Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Solo archivos PDF hasta 10MB'}
            </p>
          </div>

          {file && (
            <div className="mt-4 flex gap-3">
              <Button 
                onClick={processPDF} 
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {processingMethod === 'ai' ? <Brain className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isProcessing ? 'Procesando...' : `Procesar con ${processingMethod.toUpperCase()}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setExtractedData(null)
                  setExtractedText('')
                        setSuppliers([])
      setSupplierSuggestions([])
      setHasExactSupplierMatch(false)
      setDuplicateInvoice(null)
      setShowDuplicateWarning(false)
      resetStages()
                }}
              >
                Limpiar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Stages */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle>Progreso del Procesamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {stage.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {stage.status === 'processing' && (
                      <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {stage.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {stage.status === 'pending' && (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{stage.name}</span>
                      <Badge
                        variant={
                          stage.status === 'completed' ? 'default' :
                          stage.status === 'processing' ? 'secondary' :
                          stage.status === 'error' ? 'destructive' : 'outline'
                        }
                      >
                        {stage.status === 'completed' ? 'Completado' :
                         stage.status === 'processing' ? 'Procesando' :
                         stage.status === 'error' ? 'Error' : 'Pendiente'}
                      </Badge>
                    </div>
                    <Progress value={stage.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Preview */}
      {showPreview && extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Datos Extraídos del PDF
              <Badge variant="secondary" className="ml-2">
                {processingMethod.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Datos Extraídos del PDF */}
            {extractedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Datos Extraídos del PDF
                    <Badge variant={extractedData.confidence > 0.7 ? "default" : "secondary"}>
                      Confianza: {(extractedData.confidence * 100).toFixed(0)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Información de la Factura */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                      <Label className="text-sm font-medium text-gray-600">Número Factura Proveedor</Label>
                      <p className="text-lg font-semibold text-blue-600">{extractedData.supplierInvoiceNumber}</p>
              </div>
              <div>
                      <Label className="text-sm font-medium text-gray-600">RUT</Label>
                      <p className="text-lg font-semibold">{extractedData.supplierRut}</p>
              </div>
              <div>
                      <Label className="text-sm font-medium text-gray-600">Fecha de Vencimiento</Label>
                      <p className="text-lg font-semibold">{extractedData.dueDate || 'No especificada'}</p>
              </div>
              <div>
                      <Label className="text-sm font-medium text-gray-600">IVA (19%)</Label>
                      <p className="text-lg font-semibold text-blue-600">${extractedData.taxAmount?.toLocaleString('es-CL')}</p>
              </div>
              <div>
                      <Label className="text-sm font-medium text-gray-600">Nivel de Confianza</Label>
                      <p className="text-lg font-semibold">{(extractedData.confidence * 100).toFixed(1)}%</p>
              </div>
              <div>
                      <Label className="text-sm font-medium text-gray-600">Proveedor</Label>
                      <p className="text-lg font-semibold">{extractedData.supplierName}</p>
              </div>
              <div>
                      <Label className="text-sm font-medium text-gray-600">Fecha de Emisión</Label>
                      <p className="text-lg font-semibold">{extractedData.issueDate}</p>
              </div>
              <div>
                      <Label className="text-sm font-medium text-gray-600">Subtotal (Neto)</Label>
                      <p className="text-lg font-semibold font-bold">${extractedData.subtotal?.toLocaleString('es-CL')}</p>
              </div>
              <div>
                      <Label className="text-sm font-medium text-gray-600">Monto Total</Label>
                      <p className="text-lg font-semibold font-bold text-green-600">${extractedData.totalAmount?.toLocaleString('es-CL')}</p>
              </div>
            </div>

                  {/* Estado de Vinculación */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">Estado de Vinculación con Base de Datos</h4>
                      <Badge variant={hasExactSupplierMatch ? "default" : (supplierSuggestions.length > 0 ? "secondary" : "destructive")}>
                        {hasExactSupplierMatch ? "Proveedor Encontrado" : (supplierSuggestions.length > 0 ? "Sugerencias Disponibles" : "Proveedor No Encontrado")}
                      </Badge>
                    </div>
                    
                    {/* Información del Proveedor */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h5 className="font-medium mb-2">Proveedor: {extractedData.supplierName}</h5>
                      {hasExactSupplierMatch ? (
                        <div className="space-y-2">
                          <p className="text-sm text-green-600">✅ Encontrado en base de datos</p>
                          <p className="text-sm">ID: {suppliers[0].id}</p>
                          <p className="text-sm">Email: {suppliers[0].email || 'No especificado'}</p>
                        </div>
                      ) : supplierSuggestions.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-blue-600">💡 Proveedores similares encontrados:</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {supplierSuggestions.map((suggestion, index) => (
                              <div key={suggestion.id} className="p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-medium text-blue-900">{suggestion.name}</p>
                                {suggestion.taxId && (
                                  <p className="text-xs text-blue-700">RUT: {suggestion.taxId}</p>
                                )}
                                {suggestion.email && (
                                  <p className="text-xs text-blue-600">{suggestion.email}</p>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600">💡 Puedes seleccionar uno en el paso de corrección de datos</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-red-600">❌ No encontrado en base de datos</p>
                          <p className="text-sm text-gray-600">Se creará automáticamente al procesar la factura</p>
                        </div>
                      )}
                    </div>

                    {/* Información de Productos */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Productos: {extractedData.lines?.length || 0} items</h5>
                      <div className="space-y-2">
                        {extractedData.lines?.map((line, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <p className="font-medium">{line.description}</p>
                              <p className="text-sm text-gray-600">
                                {line.quantity} x ${line.unitPrice?.toLocaleString('es-CL')} = ${line.total?.toLocaleString('es-CL')}
                              </p>
                            </div>
                            <div className="text-right">
                              {line.productId ? (
                                <Badge variant="default" className="text-xs">
                                  ✅ Vinculado (ID: {line.productId})
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  ❓ Sin vincular
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Líneas de la factura */}
            {extractedData.lines && extractedData.lines.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Líneas de la Factura</label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {extractedData.lines.map((line, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">{line.description}</td>
                          <td className="px-4 py-2 text-sm">{line.quantity}</td>
                          <td className="px-4 py-2 text-sm">${line.unitPrice?.toLocaleString('es-CL')}</td>
                          <td className="px-4 py-2 text-sm font-medium">${line.total?.toLocaleString('es-CL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Proveedores encontrados */}
            {suppliers.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Proveedores Similares Encontrados</label>
                <div className="space-y-2">
                  {suppliers.map((supplier, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-blue-50">
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-gray-600">RUT: {supplier.vat}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex gap-3">
              <Button onClick={createDraft} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Crear Borrador de Factura
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCorrectionModal(true)}
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                Corregir Datos para Mejorar IA
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFile(null)
                  setExtractedData(null)
                  setExtractedText('')
                        setSuppliers([])
      setSupplierSuggestions([])
      setHasExactSupplierMatch(false)
      setDuplicateInvoice(null)
      setShowDuplicateWarning(false)
      resetStages()
                  setShowPreview(false)
                }}
              >
                Procesar Otro PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advertencia de Factura Duplicada */}
      {showDuplicateWarning && duplicateInvoice && (
        <Card className="w-full max-w-4xl mx-auto border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-6 w-6" />
              ⚠️ Factura Duplicada Detectada
            </CardTitle>
            <CardDescription className="text-red-700">
              Ya existe una factura con este número en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comparación lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Factura Existente */}
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Factura Existente en el Sistema
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Número Interno:</span> {duplicateInvoice.existing.number}
                  </div>
                  <div>
                    <span className="font-medium">Número Proveedor:</span> {duplicateInvoice.existing.supplierInvoiceNumber}
                  </div>
                  <div>
                    <span className="font-medium">Proveedor:</span> {duplicateInvoice.existing.suppliers?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Fecha:</span> {new Date(duplicateInvoice.existing.issueDate).toLocaleDateString('es-CL')}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> ${duplicateInvoice.existing.total?.toLocaleString('es-CL')}
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span> 
                    <Badge variant={duplicateInvoice.existing.status === 'draft' ? 'secondary' : 'default'} className="ml-2">
                      {duplicateInvoice.existing.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Nueva Factura Escaneada */}
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Factura Escaneada (Nueva)
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Número Proveedor:</span> {duplicateInvoice.new.supplierInvoiceNumber}
                  </div>
                  <div>
                    <span className="font-medium">Proveedor:</span> {duplicateInvoice.new.supplierName}
                  </div>
                  <div>
                    <span className="font-medium">Fecha:</span> {new Date(duplicateInvoice.new.issueDate).toLocaleDateString('es-CL')}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> ${duplicateInvoice.new.totalAmount?.toLocaleString('es-CL')}
                  </div>
                </div>
              </div>
            </div>

            {/* Advertencia */}
            <div className="bg-red-100 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-red-800">¿Qué puedes hacer?</h5>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    <li>• <strong>Verificar:</strong> Revisa si realmente es la misma factura</li>
                    <li>• <strong>Editar existente:</strong> Ve a la factura existente si necesitas modificarla</li>
                    <li>• <strong>Procesar otra:</strong> Escanea un PDF diferente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    window.open(`/dashboard/purchases/${duplicateInvoice.existing.id}`, '_blank')
                  }}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver Factura Existente
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowDuplicateWarning(false)
                    setDuplicateInvoice(null)
                  }}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Ignorar y Continuar
                </Button>
              </div>
              <Button 
                onClick={() => {
                  setFile(null)
                  setExtractedData(null)
                  setExtractedText('')
                  setSuppliers([])
                  setSupplierSuggestions([])
                  setHasExactSupplierMatch(false)
                  setDuplicateInvoice(null)
                  setShowDuplicateWarning(false)
                  resetStages()
                  setShowPreview(false)
                }}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Procesar Otro PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Corrección de Datos */}
      {extractedData && file && extractedText && (
        <PDFDataCorrectionModal
          isOpen={showCorrectionModal}
          onClose={() => setShowCorrectionModal(false)}
          extractedData={extractedData}
          pdfText={extractedText}
          fileName={file.name}
          extractionMethod={processingMethod}
          initialSupplierSuggestions={supplierSuggestions}
          onSave={(correctedData) => {
            setExtractedData(correctedData)
            setShowCorrectionModal(false)
          }}
        />
      )}
    </div>
  )
} 