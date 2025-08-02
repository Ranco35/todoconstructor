'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Calculator, Package } from 'lucide-react';
import { TAX_TYPES, TAX_CONFIG } from '@/constants/supplier';
import { getProductsForForms, type ProductOption } from '@/actions/purchases/common';
import { toast } from 'sonner';

interface OrderLineTax {
  id?: number;
  taxType: string;
  taxName: string;
  taxRate: number;
  taxAmount: number;
  isRetention: boolean;
  taxBase: number;
}

interface OrderLine {
  tempId: string;
  productId?: number;
  productName: string;
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  taxes: OrderLineTax[];
  lineTotal: number;
}

interface PurchaseOrderLinesWithTaxesProps {
  lines: OrderLine[];
  supplierId?: number;
  onChange: (lines: OrderLine[]) => void;
  onTotalsChange: (totals: { subtotal: number; totalTaxes: number; total: number }) => void;
}

export default function PurchaseOrderLinesWithTaxes({
  lines,
  supplierId,
  onChange,
  onTotalsChange
}: PurchaseOrderLinesWithTaxesProps) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [newLine, setNewLine] = useState<OrderLine>({
    tempId: '',
    productName: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    discountAmount: 0,
    subtotal: 0,
    taxes: [],
    lineTotal: 0
  });

  // Cargar productos al montar
  useEffect(() => {
    loadProducts();
  }, []);

  // Calcular totales cuando cambien las líneas
  useEffect(() => {
    const totals = calculateTotals();
    onTotalsChange(totals);
  }, [lines]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const productsData = await getProductsForForms();
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error cargando lista de productos');
    } finally {
      setLoadingProducts(false);
    }
  };

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

  const calculateLineSubtotal = (line: Partial<OrderLine>) => {
    const quantity = line.quantity || 0;
    const unitPrice = line.unitPrice || 0;
    const discountAmount = line.discountAmount || 0;
    return (quantity * unitPrice) - discountAmount;
  };

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addTaxToLine = (lineIndex: number, taxType: string) => {
    const line = lines[lineIndex];
    const taxConfig = TAX_CONFIG[taxType as keyof typeof TAX_CONFIG];
    
    if (!taxConfig) {
      toast.error('Tipo de impuesto no válido');
      return;
    }

    // Verificar si ya existe este tipo de impuesto
    if (line.taxes.some(tax => tax.taxType === taxType)) {
      toast.error('Este tipo de impuesto ya está agregado a la línea');
      return;
    }

    const taxBase = line.subtotal;
    const taxAmount = (taxBase * taxConfig.defaultRate) / 100;
    
    const newTax: OrderLineTax = {
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

  const addNewLine = () => {
    if (!newLine.productId || !newLine.productName.trim()) {
      toast.error('Debe seleccionar un producto de la lista');
      return;
    }

    const subtotal = calculateLineSubtotal(newLine);
    const lineToAdd: OrderLine = {
      ...newLine,
      tempId: generateTempId(),
      subtotal,
      lineTotal: subtotal + newLine.taxes.reduce((sum, tax) => 
        sum + (tax.isRetention ? -tax.taxAmount : tax.taxAmount), 0
      )
    };

    onChange([...lines, lineToAdd]);
    setNewLine({
      tempId: '',
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      subtotal: 0,
      taxes: [],
      lineTotal: 0
    });
  };

  const removeLine = (tempId: string) => {
    const updatedLines = lines.filter(line => line.tempId !== tempId);
    onChange(updatedLines);
  };

  const updateLine = (tempId: string, field: keyof OrderLine, value: any) => {
    const updatedLines = [...lines];
    const lineIndex = updatedLines.findIndex(line => line.tempId === tempId);
    
    if (lineIndex === -1) return;
    
    const line = { ...updatedLines[lineIndex], [field]: value };
    
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
    
    updatedLines[lineIndex] = line;
    onChange(updatedLines);
  };

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === parseInt(productId));
    if (selectedProduct) {
      setNewLine(prev => ({
        ...prev,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        description: selectedProduct.name,
        productCode: selectedProduct.sku,
        unitPrice: selectedProduct.salePrice || 0
      }));
    }
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
          <Package className="h-5 w-5" />
          Productos de la Orden
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
                  <TableRow key={line.tempId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{line.productName || line.description}</div>
                        {line.productCode && (
                          <div className="text-sm text-gray-500">SKU: {line.productCode}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.tempId, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20"
                        min="0"
                        step="0.001"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.tempId, 'unitPrice', parseFloat(e.target.value) || 0)}
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
                        onClick={() => removeLine(line.tempId)}
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
            <CardTitle className="text-sm">Agregar Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="newProduct">Producto</Label>
                <Select 
                  value={newLine.productId?.toString() || ''} 
                  onValueChange={handleProductSelect}
                  disabled={loadingProducts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProducts ? "Cargando productos..." : "Seleccionar producto"} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {product.sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div>
              <Label htmlFor="newDescription">Descripción (opcional)</Label>
              <Input
                id="newDescription"
                value={newLine.description}
                onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                placeholder="Descripción adicional del producto"
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={addNewLine}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
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