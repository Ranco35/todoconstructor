'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Package, 
  XCircle,
  Plus,
  ArrowRight
} from 'lucide-react';
import DirectProductSearch from './DirectProductSearch';
import { confirmProductMatch, markAsNewProduct } from '@/utils/product-matching-ai';

interface ProductMatch {
  extractedProduct: {
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  };
  matchedProduct?: any;
  confidence: number;
  possibleMatches: any[];
  needsConfirmation: boolean;
  reason?: string;
}

interface ProductMatchingConfirmationProps {
  matches: ProductMatch[];
  onConfirmationComplete: (confirmedMatches: ProductMatch[]) => void;
  onCancel: () => void;
}

export default function ProductMatchingConfirmation({
  matches,
  onConfirmationComplete,
  onCancel
}: ProductMatchingConfirmationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmedMatches, setConfirmedMatches] = useState<ProductMatch[]>([...matches]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  const needsConfirmationMatches = matches.filter(m => m.needsConfirmation);
  const currentMatch = needsConfirmationMatches[currentIndex];

  const handleConfirmMatch = (selectedProduct: any) => {
    const updatedMatches = [...confirmedMatches];
    const matchIndex = confirmedMatches.findIndex(m => 
      m.extractedProduct.description === currentMatch.extractedProduct.description
    );
    
    if (matchIndex !== -1) {
      updatedMatches[matchIndex] = confirmProductMatch(currentMatch, selectedProduct);
    }
    
    setConfirmedMatches(updatedMatches);
    
    // Avanzar al siguiente producto que necesita confirmación
    if (currentIndex < needsConfirmationMatches.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowProductSearch(false);
    } else {
      // Terminamos con todas las confirmaciones
      onConfirmationComplete(updatedMatches);
    }
  };

  const handleMarkAsNew = () => {
    const updatedMatches = [...confirmedMatches];
    const matchIndex = confirmedMatches.findIndex(m => 
      m.extractedProduct.description === currentMatch.extractedProduct.description
    );
    
    if (matchIndex !== -1) {
      updatedMatches[matchIndex] = markAsNewProduct(currentMatch);
    }
    
    setConfirmedMatches(updatedMatches);
    
    // Avanzar al siguiente producto
    if (currentIndex < needsConfirmationMatches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onConfirmationComplete(updatedMatches);
    }
  };

  const getReasonText = (reason?: string) => {
    switch (reason) {
      case 'no_matches':
        return 'No se encontraron productos similares en la base de datos';
      case 'multiple_matches':
        return 'Se encontraron múltiples productos similares';
      case 'low_confidence':
        return 'La coincidencia encontrada tiene baja confianza';
      default:
        return 'Producto requiere confirmación manual';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const progress = ((currentIndex + 1) / needsConfirmationMatches.length) * 100;

  if (!currentMatch) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                🤖 Confirmación de Productos IA
              </h2>
              <p className="text-gray-600 mt-1">
                La IA necesita tu ayuda para identificar algunos productos
              </p>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Producto {currentIndex + 1} de {needsConfirmationMatches.length}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Producto Extraído */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Package className="h-5 w-5" />
                Producto Extraído de la Factura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <p className="font-medium text-gray-900">
                    {currentMatch.extractedProduct.description}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cantidad:</span>
                  <p className="font-medium">{currentMatch.extractedProduct.quantity}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Precio:</span>
                  <p className="font-medium">{formatCurrency(currentMatch.extractedProduct.unitPrice)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Razón de la Confirmación */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>¿Por qué necesita confirmación?</strong><br />
              {getReasonText(currentMatch.reason)}
            </AlertDescription>
          </Alert>

          {/* Productos Sugeridos */}
          {currentMatch.possibleMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Productos Similares Encontrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentMatch.possibleMatches.slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleConfirmMatch(product)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">SKU: {product.sku}</Badge>
                          <Badge variant="outline">
                            {Math.round(product.relevanceScore)}% similitud
                          </Badge>
                          {product.salePrice && (
                            <Badge variant="default">
                              {formatCurrency(product.salePrice)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <Button size="sm">Seleccionar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Búsqueda Manual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Otro Producto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showProductSearch ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowProductSearch(true)}
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar manualmente en la base de datos
                </Button>
              ) : (
                <div>
                  <DirectProductSearch
                    placeholder="Buscar producto por nombre, SKU, marca..."
                    onProductSelect={handleConfirmMatch}
                    selectedProducts={[]}
                  />
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowProductSearch(false)}
                    className="mt-2 w-full"
                  >
                    Cancelar búsqueda
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleMarkAsNew}
              variant="outline"
              className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Es un Producto Nuevo
            </Button>
            
            <div className="flex gap-2 flex-1">
              <Button 
                variant="ghost" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar Todo
              </Button>
              
              <Button 
                onClick={() => {
                  // Saltear este producto (mantenerlo como texto)
                  if (currentIndex < needsConfirmationMatches.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                  } else {
                    onConfirmationComplete(confirmedMatches);
                  }
                }}
                variant="outline"
                className="flex-1"
              >
                Saltear por Ahora
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 