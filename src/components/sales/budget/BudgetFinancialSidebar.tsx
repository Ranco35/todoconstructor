'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Save, FileText, ShoppingCart } from 'lucide-react';
import { formatCurrencySimple } from '@/lib/currency';
import { calculateFinancialSummary } from '@/lib/tax-calculations';
import { Badge } from '@/components/ui/badge';

interface BudgetLine {
  subtotal: number;
  displayType: string;
  [key: string]: any;
}

interface BudgetFinancialSidebarProps {
  lines: BudgetLine[];
  total: number;
  currency: string;
  paymentTerms: string;
  checkInDate: string;
  checkOutDate: string;
  clientId: number | null;
  isEditing: boolean;
  loading: boolean;
  onExportPDF: () => void;
  onSaveTemplate?: () => void;
  hasLines: boolean;
}

export default function BudgetFinancialSidebar({
  lines,
  total,
  currency,
  paymentTerms,
  isEditing,
  loading,
  onExportPDF,
  onSaveTemplate,
  hasLines,
}: BudgetFinancialSidebarProps) {
  const { subtotal, iva } = calculateFinancialSummary(lines);
  const productLines = lines.filter(l => l.displayType === 'product').length;

  return (
    <div className="sticky top-6 space-y-4">
      {/* Quick Stats */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumen</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <ShoppingCart className="w-3.5 h-3.5" />
              Productos
            </span>
            <Badge variant="secondary" className="font-mono">{productLines}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <FileText className="w-3.5 h-3.5" />
              Pago
            </span>
            <Badge variant="secondary" className="font-mono">
              {paymentTerms === '0' ? 'Contado' : `${paymentTerms} dias`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Neto</span>
            <span className="font-mono">{formatCurrencySimple(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>IVA 19%</span>
            <span className="font-mono">{formatCurrencySimple(iva)}</span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrencySimple(total)}
                </div>
                <div className="text-xs text-gray-500">{currency}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5"
        >
          {loading
            ? (isEditing ? 'Actualizando...' : 'Creando...')
            : (isEditing ? 'Actualizar Presupuesto' : 'Crear Presupuesto')
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onExportPDF}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
        {onSaveTemplate && hasLines && !isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSaveTemplate}
            className="w-full text-gray-500 hover:text-gray-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar como Plantilla
          </Button>
        )}
      </div>
    </div>
  );
}
