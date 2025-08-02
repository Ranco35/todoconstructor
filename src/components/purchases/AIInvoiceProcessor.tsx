'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Bot, 
  Search, 
  Package, 
  CheckCircle, 
  AlertTriangle,
  X,
  Loader2,
  Building2
} from 'lucide-react';
import { extractTextFromPDF } from '@/lib/pdf-text-extractor';
import { processAIExtractedInvoice, createDraftInvoiceFromAI } from '@/actions/purchases/pdf-processor';
import ProductMatchingConfirmation from './ProductMatchingConfirmation';
import SupplierSelectionConfirmation, { SupplierInfo } from './SupplierSelectionConfirmation';
import { toast } from 'sonner';

interface AIInvoiceProcessorProps {
  onSuccess?: (invoice: any) => void;
  onCancel?: () => void;
}

export default function AIInvoiceProcessor({ onSuccess, onCancel }: AIInvoiceProcessorProps) {
  type Step = 'upload' | 'extracting' | 'processing' | 'confirming_products' | 'confirming_supplier' | 'creating' | 'complete';
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [processedData, setProcessedData] = useState<{
    supplier?: SupplierInfo;
    invoice: any;
    products: any[];
    productMatches: any[];
    requiresConfirmation: boolean;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const stepInfo = {
    upload: { title: 'Subir PDF', icon: Upload, color: 'blue' },
    extracting: { title: 'Extrayendo Texto', icon: FileText, color: 'yellow' },
    processing: { title: 'Procesando con IA', icon: Bot, color: 'purple' },
    confirming_products: { title: 'Confirmando Productos', icon: Search, color: 'orange' },
    confirming_supplier: { title: 'Confirmando Proveedor', icon: Building2, color: 'indigo' },
    creating: { title: 'Creando Factura', icon: Package, color: 'green' },
    complete: { title: 'Completado', icon: CheckCircle, color: 'green' }
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Por favor selecciona un archivo PDF válido');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleProcessInvoice = async () => {
    if (!selectedFile) return;

    try {
      // Paso 1: Extraer texto del PDF
      setCurrentStep('extracting');
      setProgress(10);
      
      const extractedText = await extractTextFromPDF(selectedFile);
      setExtractedText(extractedText);
      setProgress(30);

      // Paso 2: Simular llamada a IA para extraer datos estructurados
      // NOTA: Aquí debes integrar tu sistema de IA existente
      setCurrentStep('processing');
      setProgress(50);
      
      const aiExtractedData = await extractDataWithAI(extractedText);
      setProgress(70);

      // Paso 3: Procesar con matching inteligente de productos y proveedores
      const processedData = await processAIExtractedInvoice(aiExtractedData);
      setProcessedData(processedData);
      setProgress(90);

      console.log('🔄 Datos procesados:', {
        hasSupplier: !!processedData.supplier,
        supplierSuggestions: processedData.supplierSuggestions?.length || 0,
        requiresSupplierConfirmation: processedData.requiresSupplierConfirmation,
        requiresProductConfirmation: processedData.requiresProductConfirmation
      });

      // Paso 4: Verificar qué tipo de confirmación necesita
      if (processedData.requiresSupplierConfirmation) {
        setCurrentStep('confirming_supplier');
        setProgress(95);
      } else if (processedData.requiresProductConfirmation) {
        setCurrentStep('confirming_products');
        setProgress(95);
      } else {
        // Crear factura directamente
        await createFinalInvoice(processedData, processedData.productMatches);
      }

    } catch (error) {
      console.error('Error procesando factura:', error);
      setError(error instanceof Error ? error.message : 'Error procesando la factura');
    }
  };

  const createFinalInvoice = async (data: any, confirmedMatches: any[]) => {
    try {
      setCurrentStep('creating');
      setProgress(98);

      const draftInvoice = await createDraftInvoiceFromAI(data, confirmedMatches);
      
      setCurrentStep('complete');
      setProgress(100);

      toast.success('🎉 Factura creada exitosamente con productos vinculados');
      
      if (onSuccess) {
        onSuccess(draftInvoice);
      }

    } catch (error) {
      console.error('Error creando factura:', error);
      setError('Error creando la factura final');
    }
  };

  // ╔════════════════════════════════════════════════════════════════════════════════════════╗
  // ║ 🔌 PUNTO DE INTEGRACIÓN CON TU SISTEMA DE IA EXISTENTE                                ║
  // ║                                                                                        ║
  // ║ REEMPLAZA esta función con tu sistema de IA que ya funciona:                         ║
  // ║ - Recibe: texto extraído del PDF                                                     ║
  // ║ - Devuelve: datos estructurados (proveedor, productos, fechas, montos)              ║
  // ╚════════════════════════════════════════════════════════════════════════════════════════╝
  const extractDataWithAI = async (text: string): Promise<{
    supplier: {
      name: string;
      taxId?: string;
      address?: string;
    } | null;
    invoice: {
      number: string;
      date: string;
      total: number;
      subtotal: number;
      tax: number;
    };
    products: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
  }> => {
    console.log('🤖 Llamando a tu sistema de IA con texto extraído...');
    console.log(`📄 Texto para IA (${text.length} caracteres):`, text.substring(0, 500) + '...');

    // ⚠️ IMPORTANTE: REEMPLAZA ESTA FUNCIÓN CON TU SISTEMA DE IA ⚠️
    // 
    // Ejemplos de integración:
    // 
    // 1. Si usas OpenAI:
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{
    //     role: "user", 
    //     content: `Extrae datos estructurados de esta factura: ${text}`
    //   }]
    // });
    //
    // 2. Si usas Claude/Anthropic:
    // const response = await anthropic.messages.create({
    //   model: "claude-3-opus-20240229",
    //   messages: [{ role: "user", content: `Extrae datos: ${text}` }]
    // });
    //
    // 3. Si usas tu propia API:
    // const response = await fetch('/api/ai/extract-invoice', {
    //   method: 'POST',
    //   body: JSON.stringify({ text }),
    //   headers: { 'Content-Type': 'application/json' }
    // });
    
    // 🎭 SIMULACIÓN TEMPORAL - ELIMINAR cuando integres tu IA real
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay de IA
    
    // ⚠️ DATOS DE EJEMPLO - Reemplazar con respuesta real de tu IA
    return {
      supplier: {
        name: "Proveedor Extraído por IA",
        taxId: "12.345.678-9", 
        address: "Dirección detectada automáticamente"
      },
      invoice: {
        number: "F-123456",
        date: new Date().toISOString().split('T')[0],
        total: 89500,
        subtotal: 75210,
        tax: 14290
      },
      products: [
        {
          description: "COCA COLA SIN AZUCAR X06 LATA 350 CC",
          quantity: 6,
          unitPrice: 3300,
          subtotal: 19800
        },
        {
          description: "HARINA QUINTAL 25 KG", 
          quantity: 3,
          unitPrice: 18500,
          subtotal: 55500
        },
        {
          description: "40253", // Solo código SKU detectado
          quantity: 1,
          unitPrice: 14200,
          subtotal: 14200
        }
      ]
    };
  };

  const resetProcessor = () => {
    setCurrentStep('upload');
    setProgress(0);
    setSelectedFile(null);
    setExtractedText('');
    setProcessedData(null);
    setError('');
  };

  // Handle product matching confirmation
  if (currentStep === 'confirming_products' && processedData) {
    return (
      <ProductMatchingConfirmation
        matches={processedData.productMatches}
        onConfirmationComplete={(confirmedMatches) => {
          // After confirming products, check if we need to confirm supplier
          const updatedData = { ...processedData, productMatches: confirmedMatches };
          setProcessedData(updatedData);
          
          if (updatedData.supplier) {
            // If we have a supplier, proceed to create invoice
            createFinalInvoice(updatedData, confirmedMatches);
          } else {
            // If no supplier, show supplier selection
            setCurrentStep('confirming_supplier');
          }
        }}
        onCancel={onCancel || resetProcessor}
      />
    );
  }

  // Handle supplier selection with suggestions
  if (currentStep === 'confirming_supplier' && processedData) {
    return (
      <SupplierSelectionConfirmation
        extractedSupplier={processedData.extractedSupplierData}
        suggestions={processedData.supplierSuggestions || []}
        onSupplierSelected={(supplier) => {
          if (supplier) {
            // Update the processed data with the selected supplier
            const updatedData = {
              ...processedData,
              supplier: supplier
            };
            setProcessedData(updatedData);
            
            // Check if still needs product confirmation
            if (processedData.requiresProductConfirmation) {
              setCurrentStep('confirming_products');
            } else {
              // Proceed to create the invoice with the selected supplier
              createFinalInvoice(updatedData, updatedData.productMatches);
            }
          } else {
            // User wants to create a new supplier
            toast.info('Redirigiendo a la creación de nuevo proveedor...');
            // In a real implementation, you would navigate to the supplier creation form
            // and then return to this flow with the new supplier ID
          }
        }}
        onCancel={onCancel || resetProcessor}
        onCreateNewSupplier={() => {
          // Handle new supplier creation
          toast.info('Por favor, crea el nuevo proveedor primero');
          // In a real implementation, you would open a modal or navigate to the supplier form
          // and then return to this flow with the new supplier ID
        }}
      />
    );
  }

  const currentStepInfo = stepInfo[currentStep];
  const Icon = currentStepInfo.icon;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            🤖 Procesador de Facturas IA + Matching Inteligente
          </CardTitle>
          <p className="text-gray-600">
            Sube un PDF, la IA extrae los datos y vincula automáticamente los productos
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {Object.entries(stepInfo).map(([key, info], index) => {
              const isActive = key === currentStep;
              const isCompleted = Object.keys(stepInfo).indexOf(currentStep) > index;
              const StepIcon = info.icon;

              return (
                <div key={key} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2
                    ${isActive ? `border-${info.color}-500 bg-${info.color}-50` : 
                      isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}
                  `}>
                    <StepIcon className={`h-5 w-5 ${
                      isActive ? `text-${info.color}-600` :
                      isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <span className={`text-xs mt-1 ${
                    isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {info.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="w-full" />

          {/* Content based on current step */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              {/* File Upload Area */}
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                  ${selectedFile ? 'border-green-500 bg-green-50' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    <p className="font-medium text-green-800">{selectedFile.name}</p>
                    <p className="text-sm text-green-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-gray-600">
                      Arrastra un PDF aquí o
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer ml-1">
                        selecciona un archivo
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500">Máximo 10MB</p>
                  </div>
                )}
              </div>

              {selectedFile && (
                <Button 
                  onClick={handleProcessInvoice} 
                  className="w-full"
                  size="lg"
                >
                  <Bot className="h-5 w-5 mr-2" />
                  🚀 Procesar con IA + Matching Inteligente
                </Button>
              )}
            </div>
          )}

          {/* Processing Steps */}
          {currentStep !== 'upload' && currentStep !== 'confirming' && (
            <div className="space-y-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    {currentStep === 'complete' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    )}
                    <div>
                      <h3 className="font-medium">{currentStepInfo.title}</h3>
                      <p className="text-sm text-gray-600">
                        {currentStep === 'extracting' && 'Extrayendo texto del PDF...'}
                        {currentStep === 'processing' && 'La IA está analizando los datos...'}
                        {currentStep === 'creating' && 'Creando factura con productos vinculados...'}
                        {currentStep === 'complete' && '¡Factura creada exitosamente!'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {processedData && currentStep !== 'complete' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">📊 Resumen del Procesamiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {processedData.summary?.totalProducts || 0}
                        </p>
                        <p className="text-xs text-gray-600">Total Productos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {processedData.summary?.automaticMatches || 0}
                        </p>
                        <p className="text-xs text-gray-600">Automáticos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">
                          {processedData.summary?.needsConfirmation || 0}
                        </p>
                        <p className="text-xs text-gray-600">Confirmaciones</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {processedData.summary?.noMatches || 0}
                        </p>
                        <p className="text-xs text-gray-600">Sin Match</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {currentStep === 'complete' && (
            <div className="flex gap-3">
              <Button onClick={resetProcessor} variant="outline" className="flex-1">
                Procesar Otra Factura
              </Button>
              <Button onClick={onCancel} className="flex-1">
                Finalizar
              </Button>
            </div>
          )}

          {currentStep !== 'upload' && currentStep !== 'complete' && currentStep !== 'confirming' && onCancel && (
            <Button variant="ghost" onClick={onCancel} className="w-full">
              Cancelar Procesamiento
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 