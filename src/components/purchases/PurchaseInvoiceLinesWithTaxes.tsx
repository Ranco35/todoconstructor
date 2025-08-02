'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Calculator, X, Package, Search } from 'lucide-react';
import { TAX_TYPES, TAX_CONFIG } from '@/constants/supplier';
import { toast } from 'sonner';
import DirectProductSearch from './DirectProductSearch';

interface InvoiceLineTax {
  id?: number;
  taxType: string;
  taxName: string;
  taxRate: number;
  taxAmount: number;
  isRetention: boolean;
  taxBase: number;
}

// interface Product - Removida, ahora se usa ProductFrontend de NormalProductSearch

interface InvoiceLine {
  id?: number;
  productId?: number;
  product?: Product;
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  taxes: InvoiceLineTax[];
  lineTotal: number;
}

interface PurchaseInvoiceLinesWithTaxesProps {
  lines: InvoiceLine[];
  supplierId?: number;
  onChange: (lines: InvoiceLine[]) => void;
  onTotalsChange: (totals: { subtotal: number; totalTaxes: number; total: number }) => void;
}

export default function PurchaseInvoiceLinesWithTaxes({
  lines,
  supplierId,
  onChange,
  onTotalsChange
}: PurchaseInvoiceLinesWithTaxesProps) {
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [editingLineProductSearch, setEditingLineProductSearch] = useState<number | null>(null);
  const [newLine, setNewLine] = useState<InvoiceLine>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    discountAmount: 0,
    subtotal: 0,
    taxes: [],
    lineTotal: 0
  });

  // Calcular totales cuando cambien las líneas
  useEffect(() => {
    const totals = calculateTotals();
    onTotalsChange(totals);
  }, [lines]);

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const totalTaxes = lines.reduce((sum, line) => 
      sum + line.taxes.reduce((taxSum, tax) => 
        taxSum + (tax.isRetention ? -tax.taxAmount : tax.taxAmount), 0
      ), 0
    );
    const total = subtotal + totalTaxes;
    
    return { subtotal, totalTaxes, total };
  };

  const calculateLineSubtotal = (line: Partial<InvoiceLine>) => {
    const quantity = line.quantity || 0;
    const unitPrice = line.unitPrice || 0;
    const discountAmount = line.discountAmount || 0;
    return (quantity * unitPrice) - discountAmount;
  };

  const addTaxToLine = (lineIndex: number, taxType: string) => {
    const line = lines[lineIndex];
    const taxConfig = TAX_CONFIG[taxType as keyof typeof TAX_CONFIG];
    
    if (!taxConfig) {
      toast.error('Tipo de impuesto no válido');
      return;
    }

    if (line.taxes.some(tax => tax.taxType === taxType)) {
      toast.error('Este tipo de impuesto ya está agregado a la línea');
      return;
    }

    const taxBase = line.subtotal;
    const taxAmount = (taxBase * taxConfig.defaultRate) / 100;
    
    const newTax: InvoiceLineTax = {
      taxType,
      taxName: TAX_TYPES.find(t => t.value === taxType)?.label || taxType,
      taxRate: taxConfig.defaultRate,
      taxAmount,
      isRetention: taxConfig.isRetention,
      taxBase
    };

    const updatedLines = [...lines];
    updatedLines[lineIndex] = {
      ...line,
      taxes: [...line.taxes, newTax],
      lineTotal: line.subtotal + line.taxes.reduce((sum, tax) => 
        sum + (tax.isRetention ? -tax.taxAmount : tax.taxAmount), 0
      ) + (newTax.isRetention ? -newTax.taxAmount : newTax.taxAmount)
    };

    onChange(updatedLines);
  };

  const removeTaxFromLine = (lineIndex: number, taxIndex: number) => {
    const updatedLines = [...lines];
    const line = updatedLines[lineIndex];
    
    line.taxes.splice(taxIndex, 1);
    line.lineTotal = line.subtotal + line.taxes.reduce((sum, tax) => 
      sum + (tax.isRetention ? -tax.taxAmount : tax.taxAmount), 0
    );

    onChange(updatedLines);
  };

  // Manejar selección de producto en nueva línea  
  const handleProductSelectForNewLine = (product: any) => {
    // DirectProductSearch devuelve un producto directamente
    setNewLine(prev => ({
      ...prev,
      productId: product.id,
      description: product.name,
      productCode: product.sku || '',
      unitPrice: product.costPrice || product.salePrice || 0
    }));
    setShowProductSearch(false);
    toast.success(`Producto "${product.name}" seleccionado`);
  };

  // Manejar selección de producto para línea existente
  const handleProductSelectForExistingLine = (product: any) => {
    if (product && editingLineProductSearch !== null) {
      const lineIndex = editingLineProductSearch;
      
      // Actualizar la línea existente
      const updatedLines = [...lines];
      updatedLines[lineIndex] = {
        ...updatedLines[lineIndex],
        productId: product.id,
        description: product.name,
        productCode: product.sku || '',
        unitPrice: product.costPrice || product.salePrice || 0
      };
      
      // Recalcular subtotal con el nuevo precio
      const updatedLine = updatedLines[lineIndex];
      updatedLine.subtotal = calculateLineSubtotal(updatedLine);
      updatedLine.lineTotal = updatedLine.subtotal + updatedLine.taxes.reduce((sum, tax) => 
        sum + (tax.isRetention ? -tax.taxAmount : tax.taxAmount), 0
      );
      
      onChange(updatedLines);
      setEditingLineProductSearch(null);
      setEditingLineIndex(null);
      toast.success(`Producto "${product.name}" actualizado en la línea`);
    }
  };

  const addNewLine = () => {
    if (!newLine.description.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }

    const subtotal = calculateLineSubtotal(newLine);
    const lineToAdd: InvoiceLine = {
      ...newLine,
      subtotal,
      lineTotal: subtotal + newLine.taxes.reduce((sum, tax) => 
        sum + (tax.isRetention ? -tax.taxAmount : tax.taxAmount), 0
      )
    };

    onChange([...lines, lineToAdd]);
    setNewLine({
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      subtotal: 0,
      taxes: [],
      lineTotal: 0
    });
    setShowProductSearch(false);
  };

  const removeLine = (index: number) => {
    const updatedLines = lines.filter((_, i) => i !== index);
    onChange(updatedLines);
  };

  const updateLine = (index: number, field: keyof InvoiceLine, value: any) => {
    const updatedLines = [...lines];
    const line = { ...updatedLines[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'discountAmount') {
      line.subtotal = calculateLineSubtotal(line);
      
      // Recalcular impuestos basados en el nuevo subtotal
      line.taxes = line.taxes.map(tax => ({
        ...tax,
        taxBase: line.subtotal,
        taxAmount: (line.subtotal * tax.taxRate) / 100
      }));
      
      line.lineTotal = line.subtotal + line.taxes.reduce((sum, tax) => 
        sum + (tax.isRetention ? -tax.taxAmount : tax.taxAmount), 0
      );
    }
    
    updatedLines[index] = line;
    onChange(updatedLines);
  };

  // FUNCIÓN OBSOLETA - Reemplazada por handleProductSelectForExistingLine con NormalProductSearch
  // const selectProductForLine = (lineIndex: number, productId: number) => { ... }

  const clearProductFromLine = (lineIndex: number) => {
    const updatedLines = [...lines];
    const line = updatedLines[lineIndex];
    
    // Limpiar datos del producto pero mantener cantidad y precios manuales
    line.productId = undefined;
    line.product = undefined;
    line.productCode = '';
    // Mantener description, quantity, unitPrice para edición manual
    
    // Limpiar impuestos automáticos
    line.taxes = [];
    line.lineTotal = line.subtotal;
    
    updatedLines[lineIndex] = line;
    onChange(updatedLines);
    
    toast.success('Producto eliminado de la línea');
  };

  const enableProductSelector = (lineIndex: number) => {
    setEditingLineProductSearch(lineIndex);
    setEditingLineIndex(lineIndex);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTaxBadgeColor = (taxType: string) => {
    if (taxType.includes('ANTICIPADO')) return 'bg-orange-100 text-orange-800';
    if (taxType.includes('IVA_C')) return 'bg-blue-100 text-blue-800';
    if (taxType.includes('RETENCION')) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Líneas de Factura
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabla de líneas existentes */}
        {lines.length > 0 && (
          <div className="mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Impuestos</TableHead>
                  <TableHead>Total Línea</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, lineIndex) => (
                  <TableRow key={lineIndex}>
                    <TableCell>
                      <div className="space-y-2">
                        {/* Información del producto */}
                        <div>
                          <div className="font-medium">{line.description}</div>
                          {line.productCode && (
                            <div className="text-sm text-gray-500">Código: {line.productCode}</div>
                          )}
                        </div>
                        
                        {/* Controles de producto */}
                        <div className="flex gap-2">
                          {editingLineProductSearch === lineIndex ? (
                            // Selector avanzado de productos activo
                            <div className="w-full">
                              <div className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-blue-800">🔍 Cambiar Producto</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingLineProductSearch(null);
                                      setEditingLineIndex(null);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                                                 <DirectProductSearch
                                   placeholder="Buscar productos por nombre, SKU, marca..."
                                   onProductSelect={handleProductSelectForExistingLine}
                                   selectedProducts={lines.filter(line => line.productId).map(line => ({
                                     id: line.productId!,
                                     name: line.description,
                                     sku: line.productCode || ''
                                   }))}
                                 />
                              </div>
                            </div>
                          ) : (
                            // Botones de control
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => enableProductSelector(lineIndex)}
                                className="text-xs"
                              >
                                <Search className="h-3 w-3 mr-1" />
                                {line.productId ? 'Cambiar' : 'Seleccionar'}
                              </Button>
                              {line.productId && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => clearProductFromLine(lineIndex)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Quitar
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Indicador de producto seleccionado */}
                        {line.productId && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Package className="h-3 w-3" />
                            Producto vinculado
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(lineIndex, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20"
                        min="0"
                        step="0.001"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(lineIndex, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24"
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {/* Impuestos existentes */}
                        <div className="flex flex-wrap gap-1">
                          {line.taxes.map((tax, taxIndex) => (
                            <Badge 
                              key={taxIndex} 
                              variant="secondary"
                              className={`${getTaxBadgeColor(tax.taxType)} text-xs`}
                            >
                              {tax.taxName}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1 hover:bg-red-100"
                                onClick={() => removeTaxFromLine(lineIndex, taxIndex)}
                              >
                                ×
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Selector para agregar impuesto */}
                        <Select onValueChange={(taxType) => addTaxToLine(lineIndex, taxType)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="+ Agregar impuesto" />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_TYPES.map(taxType => (
                              <SelectItem 
                                key={taxType.value} 
                                value={taxType.value}
                                disabled={line.taxes.some(tax => tax.taxType === taxType.value)}
                              >
                                {taxType.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(line.lineTotal)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(lineIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Formulario para nueva línea */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Agregar Nueva Línea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda de productos */}
            {showProductSearch && (
              <div className="mb-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                <Label className="text-blue-800 font-medium">🔍 Buscar Producto</Label>
                <div className="mt-2">
                  <DirectProductSearch
                    placeholder="Buscar productos por nombre, SKU, marca..."
                    onProductSelect={handleProductSelectForNewLine}
                    selectedProducts={lines.filter(line => line.productId).map(line => ({
                      id: line.productId!,
                      name: line.description,
                      sku: line.productCode || ''
                    }))}
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="newDescription">Descripción *</Label>
                <div className="flex gap-2">
                  <Input
                    id="newDescription"
                    value={newLine.description}
                    onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                    placeholder="Descripción del producto/servicio"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProductSearch(!showProductSearch)}
                    className="px-3"
                    title={showProductSearch ? "Cerrar búsqueda" : "Buscar productos"}
                  >
                    {showProductSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {newLine.productId && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                    <Package className="h-3 w-3" />
                    Producto vinculado: {newLine.productCode}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="newQuantity">Cantidad</Label>
                <Input
                  id="newQuantity"
                  type="number"
                  value={newLine.quantity}
                  onChange={(e) => setNewLine({ ...newLine, quantity: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.001"
                />
              </div>
              
              <div>
                <Label htmlFor="newUnitPrice">Precio Unitario</Label>
                <Input
                  id="newUnitPrice"
                  type="number"
                  value={newLine.unitPrice}
                  onChange={(e) => setNewLine({ ...newLine, unitPrice: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={addNewLine}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Línea
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de totales */}
        {lines.length > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Subtotal:</span>
                <div className="text-lg">{formatCurrency(calculateTotals().subtotal)}</div>
              </div>
              <div>
                <span className="font-medium">Total Impuestos:</span>
                <div className="text-lg">{formatCurrency(calculateTotals().totalTaxes)}</div>
              </div>
              <div>
                <span className="font-medium">Total:</span>
                <div className="text-xl font-bold">{formatCurrency(calculateTotals().total)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 