'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import InvoiceTable from '@/components/sales/InvoiceTable';
import InvoiceForm from '@/components/sales/InvoiceForm';
import PaymentModal from '@/components/sales/PaymentModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, TrendingUp, Clock, DollarSign } from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleEditSuccess = () => {
    setEditingInvoice(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleViewInvoice = (invoice: any) => {
    setViewingInvoice(invoice);
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
  };

  const handlePaymentClick = (invoiceId: number) => {
    setSelectedInvoiceForPayment(invoiceId);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y administra todas las facturas de venta
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Facturas</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">-</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Pendiente</p>
                <p className="text-2xl font-bold text-red-600">-</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-green-600">-</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Facturas */}
      <InvoiceTable
        key={refreshKey}
        onEditInvoice={handleEditInvoice}
        onViewInvoice={handleViewInvoice}
        onRefresh={() => setRefreshKey(prev => prev + 1)}
        onPaymentClick={handlePaymentClick}
      />

      {/* Modal Crear Factura */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Factura</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar Factura */}
      <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Factura</DialogTitle>
          </DialogHeader>
          {editingInvoice && (
            <InvoiceForm
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingInvoice(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalle */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalle de Factura</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Número</p>
                  <p className="text-lg font-semibold">{viewingInvoice.number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <p className="text-lg font-semibold">{viewingInvoice.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Cliente</p>
                  <p className="text-lg font-semibold">
                    {viewingInvoice.client 
                      ? `${viewingInvoice.client.firstName} ${viewingInvoice.client.lastName}`
                      : 'Cliente no encontrado'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg font-semibold">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                      minimumFractionDigits: 0
                    }).format(viewingInvoice.total)}
                  </p>
                </div>
              </div>

              {viewingInvoice.lines && viewingInvoice.lines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Líneas de Factura</h3>
                  <div className="space-y-2">
                    {viewingInvoice.lines.map((line: any, index: number) => (
                      <div key={index} className="border rounded p-3 bg-gray-50">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium">{line.description}</p>
                          </div>
                          <div>
                            <p className="text-sm">Cantidad: {line.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm">
                              Precio: {new Intl.NumberFormat('es-CL', {
                                style: 'currency',
                                currency: 'CLP',
                                minimumFractionDigits: 0
                              }).format(line.unitPrice)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              Subtotal: {new Intl.NumberFormat('es-CL', {
                                style: 'currency',
                                currency: 'CLP',
                                minimumFractionDigits: 0
                              }).format(line.subtotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingInvoice.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Notas</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{viewingInvoice.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setViewingInvoice(null)}>
                  Cerrar
                </Button>
                <Button onClick={() => {
                  setViewingInvoice(null);
                  setEditingInvoice(viewingInvoice);
                }}>
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedInvoiceForPayment(null);
        }}
        onSuccess={handlePaymentSuccess}
        initialInvoiceId={selectedInvoiceForPayment || undefined}
      />
    </div>
  );
} 