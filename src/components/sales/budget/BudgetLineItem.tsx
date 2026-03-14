'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, GripVertical } from 'lucide-react';
import ProductSelector from '../ProductSelector';
import { formatCurrencySimple } from '@/lib/currency';

interface BudgetLine {
  tempId: string;
  productId: number | null | undefined;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
  displayType: string;
  sectionTitle?: string;
  noteText?: string;
  sequence: number;
}

interface BudgetLineItemProps {
  line: BudgetLine;
  onUpdate: (tempId: string, field: string, value: any) => void;
  onRemove: (tempId: string) => void;
}

export default function BudgetLineItem({ line, onUpdate, onRemove }: BudgetLineItemProps) {
  return (
    <div className="group bg-white border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-colors">
      {/* Row 1: Product + Description */}
      <div className="flex items-start gap-3">
        <div className="mt-2 text-gray-300 cursor-grab hidden sm:block">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3">
          <div>
            <Label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Producto</Label>
            <ProductSelector
              initialValue={line.productName}
              onSelect={(product) => {
                if (product) {
                  onUpdate(line.tempId, 'productId', product.id);
                  onUpdate(line.tempId, 'productName', product.name);
                  const description = (product.description || product.name).slice(0, 255);
                  onUpdate(line.tempId, 'description', description);
                  onUpdate(line.tempId, 'unitPrice', product.salePrice);
                }
              }}
              className="w-full !text-left"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Descripcion
              <span className="text-gray-400 ml-1 normal-case">({line.description.length}/255)</span>
            </Label>
            <Input
              value={line.description}
              onChange={(e) => onUpdate(line.tempId, 'description', e.target.value.slice(0, 255))}
              placeholder="Descripcion del producto o servicio"
              className="border-gray-200 focus:border-blue-400"
              maxLength={255}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Qty, Price, Discount, Subtotal, Delete */}
      <div className="flex items-end gap-3 mt-3 pl-0 sm:pl-7">
        <div className="w-20">
          <Label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cant.</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={line.quantity}
            onChange={(e) => onUpdate(line.tempId, 'quantity', parseFloat(e.target.value) || 0)}
            className="border-gray-200 focus:border-blue-400 text-center"
          />
        </div>
        <div className="w-32">
          <Label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Precio Neto</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={line.unitPrice}
            onChange={(e) => onUpdate(line.tempId, 'unitPrice', parseFloat(e.target.value) || 0)}
            className="border-gray-200 focus:border-blue-400 text-right"
          />
        </div>
        <div className="w-20">
          <Label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Desc.%</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={line.discountPercent}
            onChange={(e) => onUpdate(line.tempId, 'discountPercent', parseFloat(e.target.value) || 0)}
            className="border-gray-200 focus:border-blue-400 text-center"
          />
        </div>
        <div className="w-32">
          <Label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Subtotal</Label>
          <div className="text-base font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 text-right">
            {formatCurrencySimple(line.subtotal)}
          </div>
        </div>
        <Button
          type="button"
          onClick={() => onRemove(line.tempId)}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
