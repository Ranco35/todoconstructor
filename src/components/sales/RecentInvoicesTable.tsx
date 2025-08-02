'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText } from 'lucide-react';

interface RecentInvoice {
  id: number;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  client: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface RecentInvoicesTableProps {
  invoices: RecentInvoice[];
  loading?: boolean;
}

const getStatusConfig = (status: string) => {
  const configs = {
    draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
    sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Pagada', color: 'bg-green-100 text-green-800' },
    overdue: { label: 'Vencida', color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800' }
  };
  
  return configs[status as keyof typeof configs] || configs.draft;
};

const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('es-CL')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function RecentInvoicesTable({ invoices, loading = false }: RecentInvoicesTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Facturas Recientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Facturas Recientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No hay facturas recientes</p>
            <p className="text-sm text-gray-400">Las facturas aparecerán aquí cuando se creen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Facturas Recientes</span>
          </CardTitle>
          <Link href="/dashboard/sales/invoices">
            <Button variant="outline" size="sm">
              Ver todas
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const statusConfig = getStatusConfig(invoice.status);
            
            return (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {invoice.number}
                        </span>
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {invoice.client?.name || 'Cliente no especificado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(invoice.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(invoice.total)}
                    </p>
                  </div>
                  
                  <Link href={`/dashboard/sales/invoices/${invoice.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Link href="/dashboard/sales/invoices">
            <Button variant="outline" className="w-full">
              Ver todas las facturas
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 