import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getReservationWithClientInfoById } from '@/actions/reservations/get-with-client-info';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Phone, Mail, CreditCard, MapPin, Users, Bed, Package, FileText, Clock, Building, Home, DollarSign, Plus, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getReservationStatusBadge } from '@/utils/reservationStatus';
import AddPaymentModal from '@/components/reservations/AddPaymentModal';
import SimplePaymentHistory from '@/components/reservations/SimplePaymentHistory';

interface ReservationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Obtener parámetros
  const { id } = await params;

  // Obtener la reserva
  const reservation = await getReservationWithClientInfoById(parseInt(id));
  if (!reservation) {
    redirect('/dashboard/reservations');
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">💰 Pagado Completo</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">⚡ Pago Parcial</Badge>;
      case 'no_payment':
        return <Badge className="bg-red-100 text-red-800">💸 Sin Pago</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">⏰ Pago Vencido</Badge>;
      default:
        return <Badge variant="secondary">{paymentStatus}</Badge>;
    }
  };

  const statusBadge = getReservationStatusBadge(reservation.status);

  // Calcular información de pagos
  const totalAmount = reservation.total_amount;
  const paidAmount = reservation.paid_amount || 0;
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/reservations/list">
              <Button variant="outline" size="sm">
                <ArrowLeft size={16} className="mr-2" />
                Volver al Listado
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Detalle de Reserva #{reservation.id}
              </h1>
              <p className="text-gray-600">
                Información completa de la reserva
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/reservations/${reservation.id}/edit`}>
              <Button variant="outline">
                <FileText size={16} className="mr-2" />
                Editar Reserva
              </Button>
            </Link>
            {/* Botón de Edición Modular - Solo si tiene datos modulares */}
            {reservation.modular_reservation && reservation.modular_reservation.length > 0 && (
              <Link href={`/dashboard/reservations/${reservation.id}/edit-modular`}>
                <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
                  <Package size={16} className="mr-2" />
                  Editar Modular
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Estado y Resumen */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {reservation.client_full_name}
                </CardTitle>
                <CardDescription className="text-blue-100">
                  {reservation.package_name}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={statusBadge.color}>
                  {statusBadge.icon} {statusBadge.label}
                </Badge>
                {getPaymentStatusBadge(reservation.payment_status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="text-blue-600" size={24} />
                <div>
                  <p className="font-semibold">Check-in</p>
                  <p className="text-gray-600">{formatDate(reservation.check_in)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-red-600" size={24} />
                <div>
                  <p className="font-semibold">Check-out</p>
                  <p className="text-gray-600">{formatDate(reservation.check_out)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="text-green-600" size={24} />
                <div>
                  <p className="font-semibold">Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(reservation.total_amount)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagos y Ajustes */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="text-green-600" size={20} />
              Pagos y Estado Financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumen de Pagos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={18} className="text-blue-600" />
                  <p className="font-semibold text-blue-900">Total de la Reserva</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={18} className="text-green-600" />
                  <p className="font-semibold text-green-900">Monto Pagado</p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(paidAmount)}
                </p>
                <p className="text-sm text-green-600">
                  {paymentPercentage.toFixed(1)}% del total
                </p>
              </div>
              
              <div className={`rounded-lg p-4 border ${pendingAmount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className={pendingAmount > 0 ? 'text-red-600' : 'text-gray-600'} />
                  <p className={`font-semibold ${pendingAmount > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                    Saldo Pendiente
                  </p>
                </div>
                <p className={`text-2xl font-bold ${pendingAmount > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                  {formatCurrency(pendingAmount)}
                </p>
                {pendingAmount === 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    ✅ Totalmente pagado
                  </p>
                )}
              </div>
            </div>

            {/* Barra de Progreso de Pagos */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progreso de Pago</span>
                <span>{paymentPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Acciones de Pago */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <AddPaymentModal
                reservationId={reservation.id}
                currentPaidAmount={paidAmount}
                totalAmount={totalAmount}
                pendingAmount={pendingAmount}
                paymentStatus={reservation.payment_status}
                trigger={
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    <Plus size={18} className="mr-2" />
                    Agregar Pago
                  </Button>
                }
              />
              
              {pendingAmount > 0 && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <Clock size={16} />
                  <span className="text-sm font-medium">
                    Faltan {formatCurrency(pendingAmount)} por pagar
                  </span>
                </div>
              )}
              
              {pendingAmount === 0 && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">
                    Reserva completamente pagada
                  </span>
                </div>
              )}
            </div>

            {/* Historial de Pagos */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={18} />
                Historial de Pagos
              </h4>
              <SimplePaymentHistory reservationId={reservation.id} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Cliente */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="text-blue-600" size={20} />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User size={18} className="text-gray-500" />
                <div>
                  <p className="font-semibold">Nombre Completo</p>
                  <p className="text-gray-600">{reservation.client_full_name}</p>
                </div>
              </div>
              {reservation.guest_email && (
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-500" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-gray-600">{reservation.guest_email}</p>
                  </div>
                </div>
              )}
              {reservation.guest_phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-500" />
                  <div>
                    <p className="font-semibold">Teléfono</p>
                    <p className="text-gray-600">{reservation.guest_phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Building size={18} className="text-gray-500" />
                <div>
                  <p className="font-semibold">ID Cliente</p>
                  <p className="text-gray-600">#{reservation.client_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Habitaciones */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="text-green-600" size={20} />
                Habitación{reservation.room_count && reservation.room_count > 1 ? 'es' : ''}
                {reservation.room_count && reservation.room_count > 1 && (
                  <Badge variant="outline" className="ml-2">
                    {reservation.room_count} habitaciones
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservation.modular_reservations && reservation.modular_reservations.length > 1 ? (
                <div className="space-y-3">
                  {reservation.modular_reservations.map((modular, index) => (
                    <div key={modular.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Bed size={18} className="text-green-600" />
                        <div>
                          <p className="font-semibold">{modular.room_code}</p>
                          <p className="text-xs text-gray-500">ID Modular: {modular.id}</p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600">
                        {formatCurrency(modular.final_price ?? modular.grand_total)}
                      </p>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Habitaciones:</span>
                      <span className="font-bold text-xl text-green-600">
                        {formatCurrency(
                          reservation.modular_reservations.reduce(
                            (sum, m) => sum + (m.final_price ?? m.grand_total), 
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Bed size={18} className="text-green-600" />
                  <div>
                    <p className="font-semibold">Habitación Asignada</p>
                    <p className="text-gray-600">{reservation.room_code || 'No especificada'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Programa y Servicios */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="text-purple-600" size={20} />
              Programa y Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Package size={18} className="text-purple-600" />
                  <p className="font-semibold text-purple-900">Programa Principal</p>
                </div>
                <p className="text-lg font-bold text-purple-800">
                  {reservation.package_name || 'Sin programa específico'}
                </p>
              </div>

              {reservation.reservation_products && reservation.reservation_products.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Productos y Servicios Incluidos</h4>
                  <div className="space-y-2">
                    {reservation.reservation_products.map((product) => {
                      const cantidad = product.quantity > 1 ? product.quantity : 
                        Math.round(Number(product.total_price) / Number(product.unit_price));
                      
                      return (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div>
                              <p className="font-medium">
                                {product.product?.name || product.modular_product_name || 'Producto'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {cantidad} x {formatCurrency(Number(product.unit_price))}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-green-600">
                            {formatCurrency(Number(product.total_price))}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información Técnica */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="text-gray-600" size={20} />
              Información Técnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-700">ID de Reserva</p>
                  <p className="text-gray-600">#{reservation.id}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">ID Compuesto</p>
                  <p className="text-gray-600 font-mono text-sm">{reservation.compositeId}</p>
                </div>
                {reservation.modularId && (
                  <div>
                    <p className="font-semibold text-gray-700">ID Modular</p>
                    <p className="text-gray-600">#{reservation.modularId}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-700">Fecha de Creación</p>
                  <p className="text-gray-600">{formatDateTime(reservation.created_at)}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Estado de Pago</p>
                  <div className="mt-1">{getPaymentStatusBadge(reservation.payment_status)}</div>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Porcentaje Pagado</p>
                  <p className="text-gray-600">{paymentPercentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              <Link href={`/dashboard/reservations/${reservation.id}/edit`}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <FileText size={18} className="mr-2" />
                  Editar Reserva
                </Button>
              </Link>
              <Link href="/dashboard/reservations/calendar">
                <Button variant="outline" size="lg">
                  <Calendar size={18} className="mr-2" />
                  Ver en Calendario
                </Button>
              </Link>
              <Link href="/dashboard/reservations/list">
                <Button variant="outline" size="lg">
                  <ArrowLeft size={18} className="mr-2" />
                  Volver al Listado
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 