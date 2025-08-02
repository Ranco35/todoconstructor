'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase'
import SupplierSearchSelector from '@/components/suppliers/shared/SupplierSearchSelector'
import { Supplier } from '@/types/supplier'
import { getAllActiveSuppliers, getSupplierById } from '@/actions/suppliers/list'
import { saveSupplierCorrection, findSupplierWithCorrections, getSupplierSuggestions } from '@/lib/ai-learning'
import { CompanyType, PaymentTerm, SupplierRank } from '@/constants/supplier'

interface ExtractedData {
  invoiceNumber: string | null
  supplierInvoiceNumber?: string | null // Número oficial de la factura del proveedor
  supplierName: string | null
  supplierRut: string | null
  issueDate: string | null
  dueDate: string | null
  subtotal: number | null
  taxAmount: number | null
  totalAmount: number | null
  confidence: number | null
  lines?: any[]
  notes?: string | null
}

interface PDFDataCorrectionModalProps {
  isOpen: boolean
  onClose: () => void
  extractedData: ExtractedData
  pdfText: string
  fileName: string
  extractionMethod: 'ai' | 'ocr'
  initialSupplierSuggestions?: any[]
  onSave: (correctedData: ExtractedData) => void
}

export function PDFDataCorrectionModal({
  isOpen,
  onClose,
  extractedData,
  pdfText,
  fileName,
  extractionMethod,
  initialSupplierSuggestions = [],
  onSave
}: PDFDataCorrectionModalProps) {
  const [correctedData, setCorrectedData] = useState<ExtractedData>(extractedData)
  const [isLoading, setIsLoading] = useState(false)
  const [correctionNotes, setCorrectionNotes] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const { toast } = useToast()

  // Estado para la búsqueda de proveedores
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierSuggestions, setSupplierSuggestions] = useState<Supplier[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Sincronizar correctedData con extractedData cuando cambie
  useEffect(() => {
    // Limpiar cualquier estado previo y cargar solo los datos de la factura actual
    setCorrectedData(extractedData);
    setSelectedSupplier(null);
    setSupplierSearch('');
    
    console.log('📊 Datos de factura actualizados:', {
      productos: extractedData.lines?.length || 0,
      proveedor: extractedData.supplierName,
      numeroFactura: extractedData.invoiceNumber
    });
    
    // Validar que los productos son únicamente de esta factura
    if (extractedData.lines) {
      console.log('🔍 Productos de la factura:', extractedData.lines.map(line => ({
        descripcion: line.description,
        cantidad: line.quantity,
        precio: line.unitPrice
      })));
    }
  }, [extractedData]);

  // Cargar sugerencias iniciales si están disponibles
  useEffect(() => {
    if (initialSupplierSuggestions && initialSupplierSuggestions.length > 0) {
      setSupplierSuggestions(initialSupplierSuggestions);
      console.log('💡 Sugerencias iniciales cargadas:', initialSupplierSuggestions.length);
    }
  }, [initialSupplierSuggestions]);

  // Cargar proveedor inicial basado en los datos extraídos
  useEffect(() => {
    const loadInitialSupplier = async () => {
      if (!extractedData.supplierName && !extractedData.supplierRut) return;
      
      try {
        // Buscar proveedor considerando correcciones previas
        const supplier = await findSupplierWithCorrections(
          extractedData.supplierName || '',
          extractedData.supplierRut || ''
        );
        
        if (supplier) {
          setSelectedSupplier(supplier);
          setCorrectedData(prev => ({
            ...prev,
            supplierName: supplier.name,
            supplierRut: supplier.vat || ''
          }));
        } else {
          // Si no se encuentra, mantener los datos extraídos
          setSelectedSupplier({
            id: 0,
            name: extractedData.supplierName || 'Proveedor desconocido',
            vat: extractedData.supplierRut || '',
            email: '',
            phone: '',
            street: '',
            city: '',
            countryCode: 'CL',
            active: true,
            companyType: CompanyType.EMPRESA_INDIVIDUAL,
            paymentTerm: PaymentTerm.CONTADO,
            supplierRank: SupplierRank.BASICO,
            rankPoints: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error cargando proveedor inicial:', error);
      }
    };
    
    loadInitialSupplier();
  }, [extractedData.supplierName, extractedData.supplierRut]);

  // Buscar sugerencias de proveedores al cambiar el texto de búsqueda
  useEffect(() => {
    const searchSuppliers = async () => {
      if (!supplierSearch.trim()) {
        setSupplierSuggestions([]);
        return;
      }
      
      setIsLoadingSuggestions(true);
      try {
        // Primero buscar en las correcciones previas
        const correctionSuggestions = await getSupplierSuggestions(supplierSearch);
        
        if (correctionSuggestions.length > 0) {
          setSupplierSuggestions(correctionSuggestions);
          return;
        }
        
        // Si no hay sugerencias de correcciones, buscar en la base de datos
        const { data: dbSuppliers, error } = await createClient()
          .from('suppliers')
          .select('*')
          .or(`name.ilike.%${supplierSearch}%,tax_id.ilike.%${supplierSearch}%`)
          .limit(5);
          
        if (!error && dbSuppliers) {
          setSupplierSuggestions(dbSuppliers);
        }
      } catch (error) {
        console.error('Error buscando proveedores:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    
    const timer = setTimeout(() => {
      searchSuppliers();
    }, 300); // Debounce para evitar muchas llamadas
    
    return () => clearTimeout(timer);
  }, [supplierSearch]);

  // Manejar la selección de un proveedor
  const handleSupplierSelect = useCallback(async (supplier: Supplier | null) => {
    setSelectedSupplier(supplier);
    
    if (supplier) {
      // Actualizar datos del formulario
      setCorrectedData(prev => ({
        ...prev,
        supplierName: supplier.name,
        supplierRut: supplier.vat || ''
      }));
      
      // Guardar corrección si es diferente del original
      if (extractedData.supplierName !== supplier.name || 
          extractedData.supplierRut !== supplier.vat) {
        try {
          await saveSupplierCorrection(
            `Proveedor original: ${extractedData.supplierName} (${extractedData.supplierRut})`,
            { id: supplier.id, name: supplier.name, taxId: supplier.vat || undefined }
          );
          
          toast({
            title: '✅ Aprendizaje guardado',
            description: 'La IA recordará esta selección para futuras facturas similares.'
          });
        } catch (error) {
          console.error('Error guardando corrección:', error);
        }
      }
    } else {
      // Limpiar proveedor
      setCorrectedData(prev => ({
        ...prev,
        supplierName: '',
        supplierRut: ''
      }));
    }
  }, [extractedData.supplierName, extractedData.supplierRut, toast]);

  const handleFieldChange = (field: keyof ExtractedData, value: any) => {
    setCorrectedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para limpiar el estado al cerrar
  const handleCloseModal = () => {
    // Resetear todos los estados del modal
    setCorrectedData(extractedData);
    setSelectedSupplier(null);
    setSupplierSearch('');
    setSupplierSuggestions([]);
    setCorrectionNotes('');
    
    console.log('🧹 Modal cerrado - Estado limpiado');
    onClose();
  };

  const calculateIVA = (subtotal: number) => {
    return Math.round(subtotal * 0.19)
  }

  const calculateTotal = (subtotal: number, iva: number) => {
    return subtotal + iva
  }

  const handleSubtotalChange = (subtotal: number) => {
    const iva = calculateIVA(subtotal)
    const total = calculateTotal(subtotal, iva)
    
    setCorrectedData(prev => ({
      ...prev,
      subtotal,
      taxAmount: iva,
      totalAmount: total
    }))
  }

  const saveCorrectionForTraining = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Identificar campos que fueron corregidos (excluyendo número interno del sistema)
      const correctedFields = []
      if (correctedData.supplierInvoiceNumber !== extractedData.supplierInvoiceNumber) correctedFields.push('supplierInvoiceNumber')
      if (correctedData.supplierName !== extractedData.supplierName) correctedFields.push('supplierName')
      if (correctedData.supplierRut !== extractedData.supplierRut) correctedFields.push('supplierRut')
      if (correctedData.subtotal !== extractedData.subtotal) correctedFields.push('subtotal')
      if (correctedData.taxAmount !== extractedData.taxAmount) correctedFields.push('taxAmount')
      if (correctedData.totalAmount !== extractedData.totalAmount) correctedFields.push('totalAmount')
      if (correctedData.issueDate !== extractedData.issueDate) correctedFields.push('issueDate')
      if (correctedData.dueDate !== extractedData.dueDate) correctedFields.push('dueDate')

      // Detectar cambios en productos
      let productChanges = 0
      let productConnectionsAdded = 0
      let productConnectionsRemoved = 0

      if (correctedData.lines && extractedData.lines) {
        correctedData.lines.forEach((correctedLine, index) => {
          const originalLine = extractedData.lines?.[index]
          if (originalLine) {
            // Producto conectado en corrección pero no en original
            if (correctedLine.productMatch && !originalLine.productMatch) {
              productConnectionsAdded++
              productChanges++
            }
            // Producto desconectado en corrección
            if (!correctedLine.productMatch && originalLine.productMatch) {
              productConnectionsRemoved++
              productChanges++
            }
            // Producto cambiado
            if (correctedLine.productMatch && originalLine.productMatch && 
                correctedLine.productMatch.id !== originalLine.productMatch.id) {
              productChanges++
            }
          }
        })
      }

      if (productChanges > 0) {
        correctedFields.push('productConnections')
      }

      // Preparar metadatos extendidos para training
      const enhancedCorrectionData = {
        ...correctedData,
        productAnalysis: {
          totalLines: correctedData.lines?.length || 0,
          productsConnected: correctedData.lines?.filter(l => l.productMatch).length || 0,
          connectionsAdded: productConnectionsAdded,
          connectionsRemoved: productConnectionsRemoved,
          productChanges: productChanges
        }
      }

      // Guardar corrección para entrenamiento futuro
      const { error: correctionError } = await supabase
        .from('pdf_training_corrections')
        .insert({
          original_data: extractedData,
          corrected_data: enhancedCorrectionData,
          pdf_text: pdfText.substring(0, 5000), // Limitar tamaño
          extraction_method: extractionMethod,
          original_confidence: extractedData.confidence,
          correction_type: 'user_feedback',
          error_fields: correctedFields,
          pdf_file_name: fileName,
          correction_notes: correctionNotes || `Correcciones: ${correctedFields.join(', ')}. Productos: +${productConnectionsAdded}/-${productConnectionsRemoved}`,
          created_at: new Date().toISOString()
        })

      if (correctionError) {
        console.error('Error guardando corrección:', correctionError)
      } else {
        console.log('✅ Corrección guardada para entrenamiento futuro')
      }

      // Llamar callback con datos corregidos
      onSave(correctedData)
      
      toast({
        title: "✅ Datos Corregidos",
        description: `${correctedFields.length} campos corregidos. La IA aprenderá de esta corrección.`,
      })
      
      handleCloseModal()
    } catch (error) {
      console.error('Error guardando corrección:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la corrección",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal} modal={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔧 Corregir Datos Extraídos
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {extractionMethod.toUpperCase()}
            </span>
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Corrige los datos para mejorar la precisión de la IA en futuras facturas
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
                                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <Label htmlFor="supplierInvoiceNumber">Numero Factura Proveedor *</Label>
              <Input
                id="supplierInvoiceNumber"
                value={correctedData.supplierInvoiceNumber || ''}
                onChange={(e) => handleFieldChange('supplierInvoiceNumber', e.target.value)}
                placeholder="ej: 2906383"
                className={extractedData.supplierInvoiceNumber !== correctedData.supplierInvoiceNumber ? 'border-blue-500 bg-blue-50' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">Número oficial que aparece en la factura del proveedor</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Proveedor *</Label>
              <SupplierSearchSelector
                value={selectedSupplier?.id}
                onValueChange={async (supplierId) => {
                  if (supplierId) {
                    // Buscar el proveedor por ID en las sugerencias o hacer fetch
                    const foundSupplier = supplierSuggestions.find(s => s.id === supplierId) ||
                                        await getSupplierById(supplierId);
                    if (foundSupplier) {
                      handleSupplierSelect(foundSupplier);
                    }
                  } else {
                    handleSupplierSelect(null);
                  }
                }}
                placeholder="Buscar proveedor por nombre o RUT..."
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {selectedSupplier 
                  ? `Seleccionado: ${selectedSupplier.name} (${selectedSupplier.vat || 'Sin RUT'})`
                  : 'Busca y selecciona un proveedor de la base de datos'}
              </p>

              {/* Sugerencias de Proveedores */}
              {supplierSuggestions.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    💡 Proveedores similares encontrados:
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {supplierSuggestions.map((suggestion: any, suggestionIndex: number) => (
                      <div 
                        key={suggestion.id}
                        className="p-2 bg-white rounded border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          setSelectedSupplier(suggestion);
                          setCorrectedData(prev => ({
                            ...prev,
                            supplierName: suggestion.name,
                            supplierRut: suggestion.vat || ''
                          }));
                        }}
                      >
                        <p className="text-sm font-medium text-blue-900">{suggestion.name}</p>
                        {suggestion.vat && (
                          <p className="text-xs text-blue-700">RUT: {suggestion.vat}</p>
                        )}
                        {suggestion.email && (
                          <p className="text-xs text-blue-600">{suggestion.email}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    ✨ Haz clic en una sugerencia para seleccionarla
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplierRut">RUT Proveedor</Label>
              <Input
                id="supplierRut"
                value={correctedData.supplierRut || ''}
                onChange={(e) => handleFieldChange('supplierRut', e.target.value)}
                placeholder="12.345.678-9"
                className={extractedData.supplierRut !== correctedData.supplierRut ? 'border-blue-500 bg-blue-50' : ''}
              />
            </div>

            <div>
              <Label htmlFor="supplierName">Nombre del Proveedor</Label>
              <Input
                id="supplierName"
                value={correctedData.supplierName || ''}
                onChange={(e) => handleFieldChange('supplierName', e.target.value)}
                className={extractedData.supplierName !== correctedData.supplierName ? 'border-blue-500 bg-blue-50' : ''}
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issueDate">Fecha de Emisión</Label>
              <Input
                id="issueDate"
                type="date"
                value={correctedData.issueDate || ''}
                onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                className={extractedData.issueDate !== correctedData.issueDate ? 'border-blue-500 bg-blue-50' : ''}
              />
            </div>
            
            <div>
              <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
              <Input
                id="dueDate"
                type="date"
                value={correctedData.dueDate || ''}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                className={extractedData.dueDate !== correctedData.dueDate ? 'border-blue-500 bg-blue-50' : ''}
              />
            </div>
          </div>

          {/* Montos fiscales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">💰 Montos Fiscales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subtotal">Subtotal (Neto)</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={correctedData.subtotal || 0}
                  onChange={(e) => handleSubtotalChange(parseFloat(e.target.value) || 0)}
                  className={extractedData.subtotal !== correctedData.subtotal ? 'border-blue-500 bg-blue-50' : ''}
                />
                <p className="text-xs text-gray-500 mt-1">Monto sin IVA</p>
              </div>
              
              <div>
                <Label htmlFor="taxAmount">IVA (19%)</Label>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  value={correctedData.taxAmount || 0}
                  onChange={(e) => handleFieldChange('taxAmount', parseFloat(e.target.value) || 0)}
                  className={`${extractedData.taxAmount !== correctedData.taxAmount ? 'border-blue-500 bg-blue-50' : ''}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto: ${calculateIVA(correctedData.subtotal || 0).toLocaleString('es-CL')}
                </p>
              </div>
              
              <div>
                <Label htmlFor="totalAmount">Total</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={correctedData.totalAmount || 0}
                  onChange={(e) => handleFieldChange('totalAmount', parseFloat(e.target.value) || 0)}
                  className={`${extractedData.totalAmount !== correctedData.totalAmount ? 'border-blue-500 bg-blue-50' : ''} font-bold`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto: ${calculateTotal(correctedData.subtotal || 0, correctedData.taxAmount || 0).toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </div>

          {/* Productos y líneas de factura */}
          {correctedData.lines && correctedData.lines.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">📦 Productos de la Factura Escaneada</h3>
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {correctedData.lines.length} producto{correctedData.lines.length !== 1 ? 's' : ''} extraído{correctedData.lines.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                <span className="font-medium">ℹ️ Información:</span> Solo se muestran los productos detectados en esta factura específica. 
                Los productos vinculados automáticamente aparecen en verde, los que necesitan confirmación en azul.
              </div>
              
              <div className="space-y-3">
                {correctedData.lines
                  .filter((line, index) => {
                    // Validación adicional: Solo mostrar productos que efectivamente vienen de extractedData
                    const isFromOriginalInvoice = extractedData.lines && 
                                                 index < extractedData.lines.length && 
                                                 line.description === extractedData.lines[index]?.description;
                    
                    if (!isFromOriginalInvoice) {
                      console.warn(`⚠️ Producto filtrado (no es de la factura original):`, line.description);
                    }
                    
                    return isFromOriginalInvoice;
                  })
                  .map((line, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <Label className="text-xs">Descripción</Label>
                        <p className="text-sm font-medium">{line.description}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Cantidad</Label>
                        <p className="text-sm">{line.quantity}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Precio Unitario</Label>
                        <p className="text-sm">${line.unitPrice?.toLocaleString('es-CL')}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Total Línea</Label>
                        <p className="text-sm font-bold">${line.lineTotal?.toLocaleString('es-CL')}</p>
                      </div>
                    </div>

                    {/* Producto encontrado automáticamente */}
                    {line.productMatch && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 mb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <Label className="text-xs text-green-700">✅ Producto Encontrado Automáticamente</Label>
                            <p className="text-sm font-medium text-green-800">{line.productMatch.name}</p>
                            <p className="text-xs text-green-600">
                              SKU: {line.productMatch.sku} | 
                              Precio BD: ${line.productMatch.saleprice?.toLocaleString('es-CL')} | 
                              Confianza: {((line.productMatch.confidence || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Desconectar producto
                              const updatedLines = [...(correctedData.lines || [])]
                              delete updatedLines[index].productId
                              delete updatedLines[index].productMatch
                              handleFieldChange('lines', updatedLines)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Desconectar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Sugerencias de productos */}
                    {!line.productMatch && line.productSuggestions && line.productSuggestions.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <Label className="text-xs text-blue-700">💡 Productos Sugeridos (selecciona uno)</Label>
                        <div className="space-y-2 mt-2">
                          {line.productSuggestions.slice(0, 3).map((suggestion: any, suggestionIndex: number) => (
                            <button
                              key={suggestionIndex}
                              onClick={() => {
                                // Conectar producto sugerido
                                const updatedLines = [...(correctedData.lines || [])]
                                updatedLines[index] = {
                                  ...updatedLines[index],
                                  productId: suggestion.id,
                                  productMatch: {
                                    id: suggestion.id,
                                    name: suggestion.name,
                                    sku: suggestion.sku,
                                    saleprice: 0, // No tenemos precio en sugerencias
                                    confidence: suggestion.matchScore
                                  }
                                }
                                handleFieldChange('lines', updatedLines)
                              }}
                              className="w-full text-left p-2 rounded bg-white hover:bg-blue-100 border text-sm"
                            >
                              <div className="font-medium">{suggestion.name}</div>
                              <div className="text-xs text-gray-600">
                                SKU: {suggestion.sku} | Similitud: {(suggestion.matchScore * 100).toFixed(1)}%
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sin productos encontrados */}
                    {!line.productMatch && (!line.productSuggestions || line.productSuggestions.length === 0) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <Label className="text-xs text-yellow-700">⚠️ No se encontraron productos similares</Label>
                        <p className="text-xs text-yellow-600 mt-1">
                          Este producto no existe en tu base de datos. Considera agregarlo manualmente después.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Resumen de productos */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📊 Resumen de Productos</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Total Líneas:</span>
                    <div className="font-bold">{correctedData.lines.length}</div>
                  </div>
                  <div>
                    <span className="text-blue-700">Conectados:</span>
                    <div className="font-bold text-green-600">
                      {correctedData.lines.filter(l => l.productMatch).length}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700">Sin Conectar:</span>
                    <div className="font-bold text-yellow-600">
                      {correctedData.lines.filter(l => !l.productMatch).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notas de corrección */}
          <div>
            <Label htmlFor="correctionNotes">Notas de Corrección (Opcional)</Label>
            <Textarea
              id="correctionNotes"
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              placeholder="Explica qué errores encontraste para ayudar a mejorar la IA..."
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Estas notas ayudarán a entrenar mejor la IA para futuras facturas
            </p>
          </div>

          {/* Estadísticas de corrección */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">📊 Resumen de Correcciones</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Confianza Original:</span>
                <div className="font-bold">{((extractedData.confidence || 0) * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-gray-600">Método:</span>
                <div className="font-bold">{extractionMethod.toUpperCase()}</div>
              </div>
              <div>
                <span className="text-gray-600">Archivo:</span>
                <div className="font-bold truncate">{fileName}</div>
              </div>
              <div>
                <span className="text-gray-600">Campos Corregidos:</span>
                <div className="font-bold text-blue-600">
                  {[
                    extractedData.invoiceNumber !== correctedData.invoiceNumber && 'Núm. Factura',
                    extractedData.supplierName !== correctedData.supplierName && 'Proveedor',
                    extractedData.supplierRut !== correctedData.supplierRut && 'RUT',
                    extractedData.subtotal !== correctedData.subtotal && 'Subtotal',
                    extractedData.taxAmount !== correctedData.taxAmount && 'IVA',
                    extractedData.totalAmount !== correctedData.totalAmount && 'Total'
                  ].filter(Boolean).length}
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button 
              onClick={saveCorrectionForTraining}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  💾 Guardar y Mejorar IA
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 