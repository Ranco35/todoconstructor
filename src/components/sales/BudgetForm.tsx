'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download } from 'lucide-react';
import ClientSelector from '../clients/ClientSelector';
import ProductSelector from './ProductSelector';
import { exportBudgetToPDF } from '@/utils/pdfExport';

interface BudgetLine {
  tempId: string;
  productId: number | null;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
}

interface BudgetFormData {
  quoteNumber: string;
  clientId: number | null;
  expirationDate: string;
  paymentTerms: string;
  currency: string;
  notes: string;
  total: number;
  lines: BudgetLine[];
}

interface BudgetFormProps {
  onSubmit: (data: BudgetFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<BudgetFormData>;
  isEditing?: boolean;
}

export default function BudgetForm({ onSubmit, onCancel, initialData, isEditing = false }: BudgetFormProps) {
  // Función para generar número automático
  const generateQuoteNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Últimos 2 dígitos del año
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4); // Últimos 4 dígitos del timestamp
    return `P${year}${month}${day}-${timestamp}`;
  };

  const [formData, setFormData] = useState<BudgetFormData>({
    quoteNumber: initialData?.quoteNumber || generateQuoteNumber(),
    clientId: initialData?.clientId || null,
    expirationDate: initialData?.expirationDate || '',
    paymentTerms: initialData?.paymentTerms || '30',
    currency: initialData?.currency || 'CLP',
    notes: initialData?.notes || '',
    total: initialData?.total || 0,
    lines: initialData?.lines || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar formulario cuando lleguen datos iniciales (para modo edición)
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        quoteNumber: initialData.quoteNumber || generateQuoteNumber(),
        clientId: initialData.clientId || null,
        expirationDate: initialData.expirationDate || '',
        paymentTerms: initialData.paymentTerms || '30',
        currency: initialData.currency || 'CLP',
        notes: initialData.notes || '',
        total: initialData.total || 0,
        lines: initialData.lines || [],
      });
    }
  }, [initialData, isEditing]);

  // Calcular totales automáticamente con IVA
  useEffect(() => {
    const subtotalNeto = formData.lines.reduce((sum, line) => sum + line.subtotal, 0);
    const iva = subtotalNeto * 0.19; // IVA 19%
    const total = subtotalNeto + iva;
    setFormData(prev => ({ ...prev, total }));
  }, [formData.lines]);

  const addLine = () => {
    const newLine: BudgetLine = {
      tempId: `temp-${Date.now()}`,
      productId: null,
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      subtotal: 0,
    };
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, newLine],
    }));
  };

  const updateLine = (tempId: string, field: keyof BudgetLine, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.tempId === tempId) {
          const updatedLine = { ...line, [field]: value };
          
          // Recalcular subtotal cuando cambian quantity, unitPrice o discountPercent
          if (['quantity', 'unitPrice', 'discountPercent'].includes(field)) {
            const subtotal = (updatedLine.quantity * updatedLine.unitPrice) * (1 - updatedLine.discountPercent / 100);
            updatedLine.subtotal = subtotal;
          }
          
          return updatedLine;
        }
        return line;
      }),
    }));
  };

  const removeLine = (tempId: string) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.tempId !== tempId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al ${isEditing ? 'actualizar' : 'crear'} el presupuesto`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" data-component="budget-form">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <span className="text-white text-2xl">📋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}
              </h1>
              <p className="text-gray-600 text-lg">
                {isEditing 
                  ? 'Modifique los datos del presupuesto según sea necesario' 
                  : 'Complete la información para generar un presupuesto profesional'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Formulario Principal (ancho completo) */}
          <div>
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Información Principal */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="bg-blue-100 p-2 rounded-lg mr-3">📄</span>
                      Datos Principales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="quoteNumber" className="text-gray-700 font-medium">Número de Presupuesto</Label>
                        <div className="relative">
                          <Input
                            id="quoteNumber"
                            value={formData.quoteNumber}
                            readOnly
                            disabled
                            className="border-gray-200 bg-gray-100 text-gray-700 font-semibold cursor-not-allowed"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-gray-500 text-sm">🔒 Automático</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Cliente</Label>
                        <ClientSelector
                          value={formData.clientId || undefined}
                          onValueChange={(clientId) => setFormData(prev => ({ ...prev, clientId }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency" className="text-gray-700 font-medium">Moneda</Label>
                        <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                          <SelectTrigger className="border-gray-200 focus:border-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                            <SelectItem value="USD">Dólar USD</SelectItem>
                            <SelectItem value="EUR">Euro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Términos y Condiciones */}
                  <div className="bg-amber-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="bg-amber-100 p-2 rounded-lg mr-3">📅</span>
                      Términos y Condiciones
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="expirationDate" className="text-gray-700 font-medium">Fecha de Vencimiento</Label>
                        <Input
                          id="expirationDate"
                          type="date"
                          value={formData.expirationDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                          required
                          className="border-gray-200 focus:border-amber-400 focus:ring-amber-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentTerms" className="text-gray-700 font-medium">Términos de Pago (días)</Label>
                        <Select value={formData.paymentTerms} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}>
                          <SelectTrigger className="border-gray-200 focus:border-amber-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Contado</SelectItem>
                            <SelectItem value="15">15 días</SelectItem>
                            <SelectItem value="30">30 días</SelectItem>
                            <SelectItem value="45">45 días</SelectItem>
                            <SelectItem value="60">60 días</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Líneas del Presupuesto */}
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white flex flex-row items-center justify-between">
                      <CardTitle className="text-xl font-semibold flex items-center">
                        <span className="bg-white bg-opacity-20 rounded-lg p-2 mr-3">🛒</span>
                        Líneas del Presupuesto
                      </CardTitle>
                      <Button 
                        type="button" 
                        onClick={addLine} 
                        size="sm" 
                        variant="secondary"
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Línea
                      </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {formData.lines.map((line) => (
                          <div key={line.tempId} className="bg-white border-2 border-gray-100 hover:border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                              <div className="lg:col-span-1">
                                <Label className="text-gray-700 font-medium">Producto</Label>
                                <ProductSelector
                                  initialValue={line.productName}
                                  onSelect={(product) => {
                                    if (product) {
                                      updateLine(line.tempId, 'productId', product.id);
                                      updateLine(line.tempId, 'productName', product.name);
                                      // Truncar descripción a 255 caracteres para evitar error de BD
                                      const description = (product.description || product.name).slice(0, 255);
                                      updateLine(line.tempId, 'description', description);
                                      updateLine(line.tempId, 'unitPrice', product.salePrice);
                                    }
                                  }}
                                  className="w-full !text-left"
                                />
                              </div>
                              <div className="lg:col-span-2">
                                <Label className="text-gray-700 font-medium">
                                  Descripción 
                                  <span className="text-sm text-gray-500 ml-1">({line.description.length}/255)</span>
                                </Label>
                                <Input
                                  value={line.description}
                                  onChange={(e) => {
                                    // Truncar a 255 caracteres máximo
                                    const value = e.target.value.slice(0, 255);
                                    updateLine(line.tempId, 'description', value);
                                  }}
                                  placeholder="Descripción del producto"
                                  className="border-gray-200 focus:border-purple-400 focus:ring-purple-200"
                                  maxLength={255}
                                />
                              </div>
                              <div>
                                <Label className="text-gray-700 font-medium">Cantidad</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={line.quantity}
                                  onChange={(e) => updateLine(line.tempId, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="border-gray-200 focus:border-purple-400 focus:ring-purple-200"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-700 font-medium">Precio Unit. Neto</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={line.unitPrice}
                                  onChange={(e) => updateLine(line.tempId, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="border-gray-200 focus:border-purple-400 focus:ring-purple-200"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-700 font-medium">Desc. %</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={line.discountPercent}
                                  onChange={(e) => updateLine(line.tempId, 'discountPercent', parseFloat(e.target.value) || 0)}
                                  className="border-gray-200 focus:border-purple-400 focus:ring-purple-200"
                                />
                              </div>
                              <div className="flex items-end justify-between">
                                <div className="flex-1">
                                  <Label className="text-gray-700 font-medium">Subtotal Neto</Label>
                                  <div className="text-lg font-semibold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                                    ${line.subtotal.toLocaleString('es-CL')}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  onClick={() => removeLine(line.tempId)}
                                  variant="destructive"
                                  size="sm"
                                  className="ml-2 self-end"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notas Adicionales */}
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="bg-green-100 p-2 rounded-lg mr-3">📝</span>
                      Notas Adicionales
                    </h3>
                    <div>
                      <Label htmlFor="notes" className="text-gray-700 font-medium">Observaciones y comentarios</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Agregar observaciones, condiciones especiales, etc."
                        rows={4}
                        className="resize-none border-gray-200 focus:border-green-400 focus:ring-green-200"
                      />
                    </div>
                  </div>

                  {/* Resumen Financiero - MOVIDO AL FINAL */}
                  <Card className="border-0 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                      <CardTitle className="text-xl font-semibold flex items-center">
                        <span className="bg-white bg-opacity-20 rounded-lg p-2 mr-3">💰</span>
                        Resumen Financiero
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 bg-gradient-to-b from-green-50 to-white">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Monto Neto */}
                        <div className="bg-white p-4 rounded-xl border border-green-200">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                              ${(formData.lines.reduce((sum, line) => sum + line.subtotal, 0)).toLocaleString('es-CL')}
                            </div>
                            <div className="text-green-600 font-medium">Monto Neto</div>
                          </div>
                        </div>
                        
                        {/* IVA 19% */}
                        <div className="bg-white p-4 rounded-xl border border-green-200">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                              ${(formData.lines.reduce((sum, line) => sum + line.subtotal, 0) * 0.19).toLocaleString('es-CL')}
                            </div>
                            <div className="text-green-600 font-medium">IVA 19%</div>
                          </div>
                        </div>
                        
                        {/* Total */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl border-2 border-green-300">
                          <div className="text-center">
                            <div className="text-3xl font-bold">
                              ${formData.total.toLocaleString('es-CL')}
                            </div>
                            <div className="text-green-200 font-medium">TOTAL</div>
                            <div className="text-green-200 text-sm">{formData.currency}</div>
                          </div>
                        </div>
                      </div>

                      {/* Información de Cálculo */}
                      <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-center mb-2">
                          <span className="text-lg">🧮</span>
                          <span className="ml-2 font-semibold text-gray-800">Fórmula de Cálculo</span>
                        </div>
                        <div className="text-center text-sm text-gray-600">
                          <div className="mb-1">
                            <strong>Subtotal:</strong> Suma de (Cantidad × Precio × (1 - Descuento%))
                          </div>
                          <div className="mb-1">
                            <strong>IVA 19%:</strong> Subtotal × 0.19
                          </div>
                          <div>
                            <strong>Total Final:</strong> Subtotal + IVA
                          </div>
                        </div>
                      </div>

                      {/* Información Adicional */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center text-blue-700">
                            <span className="mr-2">📊</span>
                            <span className="font-medium">Líneas: {formData.lines.length}</span>
                          </div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <div className="flex items-center text-amber-700">
                            <span className="mr-2">📅</span>
                            <span className="font-medium">Pago: {formData.paymentTerms === '0' ? 'Contado' : `${formData.paymentTerms} días`}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-red-400 mr-2">⚠️</span>
                        <p className="text-red-700 font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex justify-end space-x-4 pt-6">
                    {onCancel && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onCancel}
                        className="px-8 py-3"
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        // Obtener datos del cliente si está seleccionado
                        let clientData = undefined;
                        
                        if (formData.clientId) {
                          try {
                            // Intentar obtener datos reales del cliente desde la BD
                            const response = await fetch(`/api/clients/${formData.clientId}`);
                            if (response.ok) {
                              const client = await response.json();
                              clientData = {
                                id: client.id,
                                firstName: client.nombrePrincipal || client.firstName || 'Cliente',
                                lastName: client.apellido || client.lastName || 'Seleccionado',
                                email: client.email || '',
                                phone: client.telefono || client.phone || '',
                                address: client.direccion || client.address || '',
                                city: client.ciudad || client.city || '',
                                rut: client.rut || ''
                              };
                            }
                          } catch (error) {
                            console.log('No se pudieron obtener datos del cliente, usando datos por defecto');
                            clientData = {
                              id: formData.clientId,
                              firstName: 'Cliente',
                              lastName: 'Seleccionado',
                              email: '',
                              phone: '',
                              address: '',
                              city: '',
                              rut: ''
                            };
                          }
                        }
                        
                        exportBudgetToPDF(formData, clientData);
                      }}
                      className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Presupuesto' : 'Crear Presupuesto')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 