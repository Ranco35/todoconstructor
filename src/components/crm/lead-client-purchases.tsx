'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard } from 'lucide-react';

interface LeadClientPurchasesProps {
  clientId: number;
  leadCreatedAt: string;
}

interface POSSaleItem {
  id: number;
  saleNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  package: 'Paquete',
  other: 'Otro',
};

export default function LeadClientPurchases({ clientId, leadCreatedAt }: LeadClientPurchasesProps) {
  const [posSales, setPosSales] = useState<POSSaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    try {
      const posModule = await import('@/actions/pos/pos-actions');

      const posResult = await posModule.getPOSSalesByClient(clientId, 15);

      const leadDate = new Date(leadCreatedAt);

      // Filter POS sales after lead creation
      if (posResult.success && posResult.data) {
        const filtered = posResult.data
          .filter((s: any) => new Date(s.createdAt || s.date) >= leadDate)
          .map((s: any) => ({
            id: s.id,
            saleNumber: s.saleNumber || `#${s.id}`,
            total: s.total || 0,
            paymentMethod: s.paymentMethod || 'other',
            status: s.status || 'completed',
            createdAt: s.createdAt || s.date,
          }));
        setPosSales(filtered);
      }
    } catch (error) {
      console.error('Error loading client purchases:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4" />
            Compras del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPOS = posSales.length;
  const hasData = totalPOS > 0;

  return (
    <Card className={hasData ? 'border-2 border-green-200' : ''}>
      <CardHeader className={hasData ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg py-3' : 'py-3'}>
        <CardTitle className={`flex items-center gap-2 text-sm ${hasData ? 'text-white' : ''}`}>
          <ShoppingCart className="h-4 w-4" />
          Compras del Cliente
          {hasData && (
            <div className="flex gap-1.5 ml-auto">
              {totalPOS > 0 && <Badge className="bg-white/20 text-white text-[10px]">{totalPOS} venta{totalPOS > 1 ? 's' : ''}</Badge>}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {!hasData ? (
          <div className="text-center py-3 text-muted-foreground">
            <ShoppingCart className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
            <p className="text-xs">Sin compras posteriores a este lead</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* POS Sales */}
            {totalPOS > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ventas POS</p>
                <div className="space-y-1.5">
                  {posSales.map((sale) => (
                    <div key={sale.id} className="flex items-center gap-2 text-xs bg-white p-2 rounded border">
                      <CreditCard className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700 flex-shrink-0">{sale.saleNumber}</span>
                      <span className="font-medium text-green-700 flex-shrink-0">{formatCurrency(sale.total)}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                      </Badge>
                      <span className="text-gray-400 ml-auto flex-shrink-0">{formatDate(sale.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
