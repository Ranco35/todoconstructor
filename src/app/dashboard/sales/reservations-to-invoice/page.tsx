'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Search, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import CreateInvoiceFromReservation from '@/components/reservations/CreateInvoiceFromReservation';
import { toast } from '@/hooks/use-toast';

interface ReservationToInvoice {
  id: number;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  status: string;
  client: {
    id: number;
    nombrePrincipal: string;
    apellido: string;
    email: string;
  } | null;
  payments: Array<{
    amount: number;
    payment_method: string;
  }>;
  products_count: number;
  created_at: string;
}

export default function ReservationsToInvoicePage() {
  const [reservations, setReservations] = useState<ReservationToInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservations, setSelectedReservations] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Obtener reservas finalizadas que no tienen factura
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          guest_name,
          guest_email,
          check_in,
          check_out,
          total_amount,
          status,
          created_at,
          client:client_id (
            id,
            nombrePrincipal,
            apellido,
            email
          ),
          payments:reservation_payments (
            amount,
            payment_method
          ),
          products:reservation_products (count)
        `)
        .eq('status', 'finalizada')
        .not('id', 'in', `(
          SELECT reservation_id 
          FROM invoices 
          WHERE reservation_id IS NOT NULL
        )`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reservations:', error);
        toast({
          title: "Error",
          description: "Error al cargar las reservas",
          variant: "destructive"
        });
        return;
      }

      // Procesar datos
      const processedReservations = (data || []).map(reservation => ({
        ...reservation,
        products_count: reservation.products?.length || 0
      }));

      setReservations(processedReservations);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar reservas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(reservation =>
    reservation.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reservation.client?.nombrePrincipal || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedReservations.length === filteredReservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(filteredReservations.map(r => r.id));
    }
  };

  const handleSelectReservation = (reservationId: number) => {
    setSelectedReservations(prev => 
      prev.includes(reservationId) 
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getTotalPaid = (payments: any[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      'finalizada': { label: 'Finalizada', color: 'bg-green-100 text-green-800' },
      'facturada': { label: 'Facturada', color: 'bg-blue-100 text-blue-800' }
    };
    const c = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando reservas para facturar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-600 p-3 rounded-xl shadow-lg">
              <FileText className="text-white text-2xl w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Reservas para Facturar
              </h1>
              <p className="text-gray-600 text-lg">
                Generar facturas desde reservas finalizadas
              </p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{reservations.length}</div>
                  <div className="text-sm text-gray-600">Reservas Finalizadas</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(reservations.reduce((sum, r) => sum + r.total_amount, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Total a Facturar</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {reservations.reduce((sum, r) => sum + getTotalPaid(r.payments), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Pagos Realizados</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedReservations.length}</div>
                  <div className="text-sm text-gray-600">Seleccionadas</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="search">Buscar Reservas</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar por nombre, email o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  disabled={filteredReservations.length === 0}
                >
                  {selectedReservations.length === filteredReservations.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </Button>
                <Button
                  onClick={loadReservations}
                  variant="outline"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Reservas */}
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron reservas' : 'No hay reservas para facturar'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Las reservas finalizadas aparecerán aquí automáticamente'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => (
              <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <input
                          type="checkbox"
                          checked={selectedReservations.includes(reservation.id)}
                          onChange={() => handleSelectReservation(reservation.id)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {reservation.guest_name}
                          </h3>
                          <p className="text-sm text-gray-600">{reservation.guest_email}</p>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Check-in</p>
                            <p className="text-sm text-gray-600">{formatDate(reservation.check_in)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Check-out</p>
                            <p className="text-sm text-gray-600">{formatDate(reservation.check_out)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Total</p>
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(reservation.total_amount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Pagado</p>
                            <p className="text-sm font-semibold text-blue-600">
                              {formatCurrency(getTotalPaid(reservation.payments))}
                            </p>
                          </div>
                        </div>
                      </div>

                      {reservation.client && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <p className="text-sm font-medium text-gray-700">Cliente para Facturación</p>
                          <p className="text-sm text-gray-600">
                            {reservation.client.nombrePrincipal} {reservation.client.apellido}
                          </p>
                          <p className="text-sm text-gray-600">{reservation.client.email}</p>
                        </div>
                      )}

                      {reservation.products_count > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="w-4 h-4" />
                          {reservation.products_count} producto(s) adicional(es)
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <CreateInvoiceFromReservation
                        reservationId={reservation.id}
                        reservationStatus={reservation.status}
                        onSuccess={loadReservations}
                        trigger={
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <FileText className="w-4 h-4 mr-2" />
                            Crear Factura
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 