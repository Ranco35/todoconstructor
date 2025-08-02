'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Building2, 
  XCircle,
  Plus,
  ArrowRight
} from 'lucide-react';
import { searchSuppliers } from '@/actions/suppliers/list';
import { Input } from '@/components/ui/input';

export interface SupplierInfo {
  id: number;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
}

interface SupplierSelectionConfirmationProps {
  extractedSupplier?: {
    name: string;
    taxId?: string;
  };
  suggestions?: SupplierInfo[];
  onSupplierSelected: (supplier: SupplierInfo | null) => void;
  onCancel: () => void;
  onCreateNewSupplier: () => void;
}

export default function SupplierSelectionConfirmation({
  extractedSupplier,
  suggestions = [],
  onSupplierSelected,
  onCancel,
  onCreateNewSupplier
}: SupplierSelectionConfirmationProps) {
  const [searchTerm, setSearchTerm] = useState(extractedSupplier?.name || '');
  const [searchResults, setSearchResults] = useState<SupplierInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierInfo | null>(null);

  // Search for suppliers when search term changes
  useEffect(() => {
    const search = async () => {
      const term = searchTerm.trim();
      if (!term) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await searchSuppliers(term);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching suppliers:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectSupplier = (supplier: SupplierInfo) => {
    setSelectedSupplier(supplier);
  };

  const handleConfirm = () => {
    if (selectedSupplier) {
      onSupplierSelected(selectedSupplier);
    }
  };

  const handleCreateNew = () => {
    onSupplierSelected(null);
    onCreateNewSupplier();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                🏭 Confirmación de Proveedor
              </h2>
              <p className="text-gray-600 mt-1">
                Selecciona el proveedor de la factura o crea uno nuevo
              </p>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Extracted Supplier Info */}
          {extractedSupplier && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-orange-800 text-lg">
                  <Building2 className="h-5 w-5" />
                  Proveedor detectado en la factura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{extractedSupplier.name}</p>
                  {extractedSupplier.taxId && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">RUT:</span> {extractedSupplier.taxId}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supplier Suggestions */}
          {suggestions.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
                  <CheckCircle className="h-5 w-5" />
                  Proveedores similares encontrados
                </CardTitle>
                <p className="text-sm text-blue-600 mt-1">
                  Selecciona uno de estos proveedores similares o busca otros
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {suggestions.map((supplier) => (
                    <div 
                      key={supplier.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors border ${
                        selectedSupplier?.id === supplier.id 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-white hover:bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => handleSelectSupplier(supplier)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-blue-900">{supplier.name}</p>
                          {supplier.taxId && (
                            <p className="text-sm text-blue-700">RUT: {supplier.taxId}</p>
                          )}
                          {supplier.email && (
                            <p className="text-sm text-blue-600">{supplier.email}</p>
                          )}
                        </div>
                        {selectedSupplier?.id === supplier.id ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <ArrowRight className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Input */}
          <div className="space-y-2">
            <label htmlFor="supplier-search" className="block text-sm font-medium text-gray-700">
              Buscar proveedor existente
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="supplier-search"
                type="text"
                placeholder="Buscar por nombre o RUT..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Search Results */}
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm text-gray-600">Buscando proveedores...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
              <p className="text-sm text-gray-500 mb-2">
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}:
              </p>
              {searchResults.map((supplier) => (
                <div 
                  key={supplier.id}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedSupplier?.id === supplier.id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => handleSelectSupplier(supplier)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.taxId && (
                        <p className="text-sm text-gray-600">RUT: {supplier.taxId}</p>
                      )}
                      {supplier.email && (
                        <p className="text-sm text-gray-600">{supplier.email}</p>
                      )}
                    </div>
                    {selectedSupplier?.id === supplier.id ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>No se encontró un proveedor con "{searchTerm}"</p>
                  <p className="text-sm">
                    Intenta con otro término de búsqueda o crea un nuevo proveedor.
                  </p>
                </AlertDescription>
              </Alert>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">Sugerencias:</h4>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  <li>Verifica la ortografía</li>
                  <li>Intenta con palabras más cortas o parciales</li>
                  <li>Busca por RUT si lo tienes disponible</li>
                  <li>O crea un nuevo proveedor si no lo encuentras</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">
                Escribe el nombre o RUT del proveedor para buscar
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
            <div>
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline"
                onClick={handleCreateNew}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear nuevo proveedor
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={!selectedSupplier}
                className="w-full sm:w-auto"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar proveedor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
