'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Plus,
  User,
  Building,
  Bed,
  Mail,
  Phone,
  Send,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { getReservationStatusBadge } from '@/utils/reservationStatus';
import { sendReservationConfirmationEmail } from '@/actions/emails/email-actions';

interface Reservation {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  authorized_by: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  payment_status: string;
  client_type: string;
  guests: number;
  room?: {
    number: string;
  };
  company?: {
    name: string;
  };
  client?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  modular_reservation?: {
    id: number;
    package_code: string;
    room_code: string;
    adults: number;
    children: number;
    grand_total: number;
    final_price?: number;
    discount_amount?: number;
    surcharge_amount?: number;
    discount_reason?: string;
    surcharge_reason?: string;
  };
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  updated_by_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  client_nombre: string;
  client_rut: string;
}

export default function ReservationsList() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [deletingReservation, setDeletingReservation] = useState<number | null>(null);
  
  // Estados para envío de emails
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    reservationId?: number;
  } | null>(null);

  useEffect(() => {
    loadReservations();
  }, [statusFilter, clientTypeFilter]);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm, statusFilter, clientTypeFilter]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      
      // Construir URL con filtros usando las variables de estado existentes
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (clientTypeFilter && clientTypeFilter !== 'all') params.append('client_type', clientTypeFilter);
      // Las demás propiedades de filtro no están implementadas en este componente
      // Si se necesitan, deben agregarse como estados adicionales
      
      const url = `/api/reservations${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      } else {
        console.error('Error loading reservations:', response.status, response.statusText);
        setError('Error al cargar las reservas');
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
      setError('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    // Filtrar por término de búsqueda - Ahora busca por cliente principal
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.client_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.client_rut?.includes(searchTerm) ||
        r.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.guest_phone.includes(searchTerm) ||
        r.id.toString().includes(searchTerm)
      );
    }

    // Filtrar por estado
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filtrar por tipo de cliente
    if (clientTypeFilter && clientTypeFilter !== 'all') {
      filtered = filtered.filter(r => r.client_type === clientTypeFilter);
    }

    setFilteredReservations(filtered);
  };

  const handleDeleteReservation = async (reservationId: number, guestName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la reserva de ${guestName}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingReservation(reservationId);
    try {
      const { deleteReservation } = await import('@/actions/reservations/delete');
      const result = await deleteReservation(reservationId);
      
      if (result.success) {
        // Actualizar la lista de reservas
        setReservations(prev => prev.filter(r => r.id !== reservationId));
        alert('Reserva eliminada exitosamente');
      } else {
        alert(`Error al eliminar la reserva: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Error al eliminar la reserva');
    } finally {
      setDeletingReservation(null);
    }
  };

  // Función para enviar confirmación por email
  const handleSendConfirmationEmail = async (reservationId: number, clientEmail?: string) => {
    setSendingEmail(reservationId);
    setEmailStatus(null);

    try {
      console.log('📧 Enviando confirmación de reserva por email:', { reservationId, clientEmail });
      
      const result = await sendReservationConfirmationEmail(reservationId, clientEmail);
      
      setEmailStatus({
        type: result.success ? 'success' : 'error',
        message: result.message,
        reservationId: reservationId
      });

      // Limpiar el estado después de unos segundos
      setTimeout(() => {
        setEmailStatus(null);
      }, 5000);

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      setEmailStatus({
        type: 'error',
        message: 'Error inesperado al enviar email',
        reservationId: reservationId
      });

      setTimeout(() => {
        setEmailStatus(null);
      }, 5000);
    } finally {
      setSendingEmail(null);
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">💰 Pagado</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">⚡ Parcial</Badge>;
      case 'no_payment':
        return <Badge className="bg-red-100 text-red-800">💸 Sin pago</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">⏰ Vencido</Badge>;
      default:
        return <Badge variant="secondary">{paymentStatus}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      // Usar formateo seguro para evitar problemas de zona horaria
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Santiago'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Cargando reservas...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              📋 Lista de Reservas
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión completa de todas las reservaciones del sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/reservations">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/reservations/nueva">
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Nueva Reserva
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros y Búsqueda
            </CardTitle>
            <CardDescription>
              Filtra y busca reservas por diferentes criterios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Cliente (nombre/RUT), email, teléfono o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Cliente</label>
                <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="corporate">Corporativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Acciones</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setClientTypeFilter('all');
                  }}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{filteredReservations.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredReservations.filter(r => r.status === 'confirmed').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredReservations.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(filteredReservations.reduce((sum, r) => sum + r.total_amount, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert para estado de email */}
        {emailStatus && (
          <Alert className={`${
            emailStatus.type === 'success' ? 'border-green-200 bg-green-50' :
            emailStatus.type === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-start space-x-2">
              {emailStatus.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
              {emailStatus.type === 'error' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
              {emailStatus.type === 'info' && <Mail className="h-4 w-4 text-blue-600 mt-0.5" />}
              
              <div className="flex-1">
                <AlertDescription className="font-medium">
                  {emailStatus.message}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Lista de reservas */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Reservas
              <Badge variant="outline">{filteredReservations.length} encontradas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            👤 {reservation.client?.name || reservation.client_nombre || reservation.guest_name}
                        </h3>
                          {reservation.client_rut && (
                            <p className="text-sm text-gray-600">RUT: {reservation.client_rut}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                        {(() => {
                          const badge = getReservationStatusBadge(reservation.status);
                          return <Badge className={badge.color}>{badge.icon} {badge.label}</Badge>;
                        })()}
                        {getPaymentStatusBadge(reservation.payment_status)}
                      </div>
                      </div>
                      
                      {/* Información Destacada */}
                      <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium">👤 Cliente:</span>
                            <span className="font-semibold">{reservation.client?.name || reservation.client_nombre || reservation.guest_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium">🏠 Habitación:</span>
                            <span className="font-semibold">
                              {reservation.modular_reservation?.room_code 
                                ? reservation.modular_reservation.room_code.replace('habitacion_', '')
                                : reservation.room?.number || 'No asignada'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium">💰 Total:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(reservation.total_amount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Información Modular */}
                      {reservation.modular_reservation && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-blue-800">📦 Paquete Seleccionado</span>
                            <Badge variant="outline" className="text-xs font-medium">
                              {reservation.modular_reservation.package_code}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
                            <div>
                              <span className="font-medium">Adultos:</span> {reservation.modular_reservation.adults}
                            </div>
                            <div>
                              <span className="font-medium">Niños:</span> {reservation.modular_reservation.children}
                            </div>
                            {reservation.modular_reservation.discount_amount && reservation.modular_reservation.discount_amount > 0 && (
                              <div className="text-green-600">
                                <span className="font-medium">Descuento:</span> {formatCurrency(reservation.modular_reservation.discount_amount)}
                              </div>
                            )}
                            {reservation.modular_reservation.surcharge_amount && reservation.modular_reservation.surcharge_amount > 0 && (
                              <div className="text-red-600">
                                <span className="font-medium">Recargo:</span> {formatCurrency(reservation.modular_reservation.surcharge_amount)}
                              </div>
                            )}
                          </div>
                          {reservation.modular_reservation.discount_reason && (
                            <div className="text-xs text-green-600 mt-1">
                              💰 {reservation.modular_reservation.discount_reason}
                            </div>
                          )}
                          {reservation.modular_reservation.surcharge_reason && (
                            <div className="text-xs text-red-600 mt-1">
                              ⚡ {reservation.modular_reservation.surcharge_reason}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          <span className="font-medium">Email:</span>
                          <span>{reservation.guest_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          <span className="font-medium">Teléfono:</span>
                          <span>{reservation.guest_phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span className="font-medium">Fechas:</span>
                          <span>{formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={14} />
                          <span className="font-medium">Huéspedes:</span>
                          <span>{reservation.guests || (reservation.modular_reservation ? reservation.modular_reservation.adults + reservation.modular_reservation.children : 0)} personas</span>
                        </div>
                        {reservation.authorized_by && reservation.authorized_by !== reservation.guest_name && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Users size={14} />
                            Huésped: {reservation.guest_name}
                          </div>
                        )}
                      </div>
                      
                      {/* Información de Auditoría */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Información de Auditoría</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Creado por:</span>
                            <div className="ml-2">
                              {reservation.created_by_user ? (
                                <span className="text-blue-600">{reservation.created_by_user.name} ({reservation.created_by_user.email})</span>
                              ) : (
                                <span className="text-gray-400">Usuario no disponible</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 ml-2">
                              {formatDate(reservation.created_at)} a las {new Date(reservation.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Última modificación:</span>
                            <div className="ml-2">
                              {reservation.updated_by_user ? (
                                <span className="text-green-600">{reservation.updated_by_user.name} ({reservation.updated_by_user.email})</span>
                              ) : reservation.updated_by ? (
                                <span className="text-gray-400">Usuario modificado</span>
                              ) : (
                                <span className="text-gray-400">Sin modificaciones</span>
                              )}
                            </div>
                            {reservation.updated_at && reservation.updated_at !== reservation.created_at && (
                              <div className="text-xs text-gray-500 ml-2">
                                {formatDate(reservation.updated_at)} a las {new Date(reservation.updated_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-lg text-gray-900">
                        {formatCurrency(reservation.total_amount)}
                      </div>
                      {reservation.modular_reservation && (
                        <div className="text-xs text-blue-600 mt-1">
                          Modular: {formatCurrency(reservation.modular_reservation.final_price || reservation.modular_reservation.grand_total)}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        ID: {reservation.id}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        {reservation.client_type === 'corporate' ? (
                          <>
                            <Building size={12} />
                            <span>{reservation.company?.name || 'Empresa'}</span>
                          </>
                        ) : (
                          <>
                            <User size={12} />
                            <span>Individual</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/reservations/${reservation.id}`)}
                      className="flex items-center gap-1"
                    >
                      <Eye size={14} />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/reservations/${reservation.id}/edit`)}
                      className="flex items-center gap-1"
                    >
                      <Edit size={14} />
                      Editar
                    </Button>
                    {/* Botón de envío de email */}
                    {reservation.guest_email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendConfirmationEmail(reservation.modular_reservation?.id || reservation.id, reservation.guest_email)}
                        disabled={sendingEmail === (reservation.modular_reservation?.id || reservation.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                        title={`Enviar confirmación por email a ${reservation.guest_email}`}
                      >
                        {sendingEmail === (reservation.modular_reservation?.id || reservation.id) ? (
                          <>
                            <Clock size={14} className="animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Email
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReservation(reservation.id, reservation.authorized_by || reservation.guest_name)}
                      disabled={deletingReservation === reservation.id}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                    >
                      {deletingReservation === reservation.id ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Eliminar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredReservations.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No se encontraron reservas
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || statusFilter || clientTypeFilter
                      ? 'Intenta ajustar los filtros para encontrar más resultados'
                      : 'Aún no hay reservas registradas en el sistema'}
                  </p>
                  <Link href="/dashboard/reservations/nueva">
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Crear Primera Reserva
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 