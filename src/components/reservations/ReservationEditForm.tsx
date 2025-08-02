'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Bed, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Mail, 
  Phone,
  Building,
  CreditCard,
  FileText,
  Percent,
  TrendingUp,
  TrendingDown,
  Save,
  Calculator
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ReservationEditFormProps {
  reservation: any;
}

export default function ReservationEditForm({ reservation }: ReservationEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // ✅ OBTENER USUARIO ACTUAL AL CARGAR COMPONENTE
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/current-user');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
          
          // ✅ ACTUALIZAR authorized_by con el usuario actual automáticamente
          if (userData && userData.name) {
            setFormData(prev => ({
              ...prev,
              authorized_by: userData.name
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Estados para edición
  const [formData, setFormData] = useState({
    // Información del cliente
    guest_name: reservation.guest_name || '',
    guest_email: reservation.guest_email || '',
    guest_phone: reservation.guest_phone || '',
    
    // Detalles de la reserva
    check_in: reservation.check_in || '',
    check_out: reservation.check_out || '',
    guests: reservation.guests || 1,
    status: reservation.status || 'pending',
    authorized_by: reservation.authorized_by || 'Sistema', // Se actualizará con usuario actual
    
    // ✅ INFORMACIÓN FINANCIERA CORREGIDA
    total_amount: reservation.total_amount || 0, // Es el precio FINAL, no base
    payment_status: reservation.payment_status || 'pending',
    
    // ✅ SISTEMA DE DESCUENTOS - Solo para referencia visual
    discount_type: reservation.discount_type || 'none',
    discount_value: reservation.discount_value || 0,
    discount_amount: reservation.discount_amount || 0,
    discount_reason: reservation.discount_reason || '',
    
    // ✅ SISTEMA DE RECARGOS - Solo para referencia visual  
    surcharge_type: reservation.surcharge_type || 'none',
    surcharge_value: reservation.surcharge_value || 0,
    surcharge_amount: reservation.surcharge_amount || 0,
    surcharge_reason: reservation.surcharge_reason || '',
  });

  // ✅ INFORMACIÓN DE HUÉSPEDES MEJORADA
  const getGuestInfo = () => {
    // Intentar obtener información detallada de la reserva modular
    if (reservation.modular_reservation?.[0]) {
      const modular = reservation.modular_reservation[0];
      return {
        adults: modular.adults || 0,
        children: modular.children || 0,
        total: (modular.adults || 0) + (modular.children || 0)
      };
    }
    
    // Fallback a información básica
    return {
      adults: formData.guests || 1,
      children: 0,
      total: formData.guests || 1
    };
  };

  // ✅ CÁLCULO CORRECTO DE DESCUENTOS - Solo actualiza campos de descuento
  useEffect(() => {
    calculateDiscount();
  }, [formData.discount_type, formData.discount_value]);

  // ✅ CÁLCULO CORRECTO DE RECARGOS - Solo actualiza campos de recargo
  useEffect(() => {
    calculateSurcharge();
  }, [formData.surcharge_type, formData.surcharge_value]);

  const calculateDiscount = () => {
    let discountAmount = 0;
    
    // ⚠️ IMPORTANTE: NO calcular sobre total_amount (que ya es final)
    // Solo calcular para mostrar campos de referencia
    const baseForCalculation = formData.total_amount + (formData.discount_amount || 0); // Aproximar precio base
    
    if (formData.discount_type === 'percentage') {
      discountAmount = Math.round(baseForCalculation * (formData.discount_value / 100));
    } else if (formData.discount_type === 'fixed_amount') {
      discountAmount = Math.min(formData.discount_value, baseForCalculation);
    }
    
    setFormData(prev => ({
      ...prev,
      discount_amount: discountAmount
    }));
  };

  const calculateSurcharge = () => {
    let surchargeAmount = 0;
    
    // ⚠️ IMPORTANTE: NO calcular sobre total_amount (que ya es final)
    // Solo calcular para mostrar campos de referencia
    const baseForCalculation = formData.total_amount - (formData.surcharge_amount || 0); // Aproximar precio base
    
    if (formData.surcharge_type === 'percentage') {
      surchargeAmount = Math.round(baseForCalculation * (formData.surcharge_value / 100));
    } else if (formData.surcharge_type === 'fixed_amount') {
      surchargeAmount = formData.surcharge_value;
    }
    
    setFormData(prev => ({
      ...prev,
      surcharge_amount: surchargeAmount
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ FUNCIÓN CORREGIDA - total_amount ES el precio final
  const getFinalAmount = () => {
    // total_amount YA es el precio final con descuentos/recargos aplicados
    return formData.total_amount;
  };

  // ✅ FUNCIÓN PARA CALCULAR PRECIO BASE APROXIMADO (solo para display)
  const getApproximateBaseAmount = () => {
    // Intentar aproximar el precio base para mostrar el desglose
    const discount = formData.discount_amount || 0;
    const surcharge = formData.surcharge_amount || 0;
    return formData.total_amount + discount - surcharge;
  };

  const handleCancel = () => {
    // Si la página se abrió en una nueva pestaña, navega la página padre
    if (window.opener) {
      try {
        window.opener.location.href = '/dashboard/reservations/list';
        window.close();
        // Si no se cierra automáticamente, navega en esta ventana
        setTimeout(() => {
          if (!window.closed) {
            router.push('/dashboard/reservations/list');
          }
        }, 500);
      } catch (error) {
        console.warn('No se pudo manejar la ventana padre:', error);
        router.push('/dashboard/reservations/list');
      }
    } else {
      // Navegar de vuelta a la lista de reservas
      router.push('/dashboard/reservations/list');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Reserva actualizada exitosamente');
        router.push('/dashboard/reservations/list');
      } else {
        const errorData = await response.json();
        toast.error('Error al actualizar la reserva: ' + (errorData.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CL');
  };

  const guestInfo = getGuestInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Editar Reserva #{reservation.id}
        </h2>
        <div className="ml-auto flex gap-2">
          <Button onClick={handleCancel} variant="outline" disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Información del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="guest_name">Nombre del Cliente</Label>
              <Input
                id="guest_name"
                value={formData.guest_name}
                onChange={(e) => handleInputChange('guest_name', e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            
            <div>
              <Label htmlFor="guest_email" className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="guest_email"
                type="email"
                value={formData.guest_email}
                onChange={(e) => handleInputChange('guest_email', e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="guest_phone" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Teléfono
              </Label>
              <Input
                id="guest_phone"
                value={formData.guest_phone}
                onChange={(e) => handleInputChange('guest_phone', e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>

            {reservation.client?.rut && (
              <div>
                <Label>RUT (Solo lectura)</Label>
                <p className="text-gray-900 p-2 bg-gray-50 rounded">
                  {reservation.client.rut}
                </p>
              </div>
            )}

            {reservation.company && (
              <div>
                <Label className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Empresa (Solo lectura)
                </Label>
                <p className="text-gray-900 p-2 bg-gray-50 rounded">
                  {reservation.company.name}
                </p>
              </div>
            )}

            <div>
              <Label>Tipo de Cliente (Solo lectura)</Label>
              <div className="p-2">
                <Badge variant="outline">
                  {reservation.client_type === 'individual' ? 'Individual' : 'Empresarial'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalles de la Reserva */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalles de la Reserva
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="check_in">Check-in</Label>
              <Input
                id="check_in"
                type="date"
                value={formData.check_in}
                onChange={(e) => handleInputChange('check_in', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="check_out">Check-out</Label>
              <Input
                id="check_out"
                type="date"
                value={formData.check_out}
                onChange={(e) => handleInputChange('check_out', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* ✅ INFORMACIÓN DE HUÉSPEDES MEJORADA */}
            <div>
              <Label className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Huéspedes
              </Label>
              <div className="p-2 bg-gray-50 border rounded">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Adultos:</span>
                    <span className="font-medium">{guestInfo.adults}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Niños:</span>
                    <span className="font-medium">{guestInfo.children}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span>Total:</span>
                    <span>{guestInfo.total} personas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ CAMPO AUTORIZADO POR MEJORADO */}
            <div>
              <Label htmlFor="authorized_by" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Autorizado por
              </Label>
              <div className="relative">
                <Input
                  id="authorized_by"
                  value={formData.authorized_by}
                  onChange={(e) => handleInputChange('authorized_by', e.target.value)}
                  placeholder="Cargando usuario..."
                  className={currentUser ? "bg-blue-50 border-blue-200" : ""}
                />
                {currentUser && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Badge variant="outline" className="text-xs">
                      Actual: {currentUser.name}
                    </Badge>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {currentUser ? 
                  `Editando como: ${currentUser.name} (${currentUser.email})` : 
                  'Obteniendo información del usuario...'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ HABITACIÓN Y PROGRAMA MEJORADOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            Habitación y Programa (Solo lectura)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Habitación</Label>
              <p className="text-gray-900 p-2 bg-gray-50 border rounded">
                {reservation.room?.number ? 
                  `#${reservation.room.number} (${reservation.room.type || 'Cuádruple'})` : 
                  reservation.modular_reservation?.[0]?.room_code || 'No especificada'
                }
              </p>
            </div>
            
            <div>
              <Label>Programa/Paquete</Label>
              <p className="text-gray-900 p-2 bg-gray-50 border rounded">
                {reservation.modular_reservation?.[0]?.package_code || 'Programa Modular'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ PRODUCTOS ASOCIADOS MEJORADOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Productos Asociados (Solo lectura)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservation.reservation_products && reservation.reservation_products.length > 0 ? (
            <div className="space-y-2">
              {reservation.reservation_products.map((product: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 border rounded">
                  <span>Producto</span>
                  <div className="text-right">
                    <div>1 x $30.000</div>
                    <div className="text-sm text-gray-500">Total: $30.000</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay productos adicionales asociados</p>
          )}
        </CardContent>
      </Card>

      {/* ✅ INFORMACIÓN FINANCIERA CORREGIDA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Información Financiera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_amount">Total Base de la Reserva</Label>
                <Input
                  id="total_amount"
                  type="number"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Monto base antes de descuentos/recargos
                </p>
              </div>
              
              <div>
                <Label htmlFor="payment_status">Estado de Pago</Label>
                <Select value={formData.payment_status} onValueChange={(value) => handleInputChange('payment_status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Sin Pago</SelectItem>
                    <SelectItem value="partial">Pago Parcial</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* ✅ SISTEMA DE DESCUENTOS CORREGIDO */}
            <div>
              <Label className="flex items-center gap-2 text-lg font-semibold mb-4">
                <TrendingDown className="h-5 w-5 text-green-600" />
                Sistema de Descuentos
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="discount_type">Tipo de Descuento</Label>
                  <Select value={formData.discount_type} onValueChange={(value) => handleInputChange('discount_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin Descuento</SelectItem>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed_amount">Monto Fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.discount_type !== 'none' && (
                  <>
                    <div>
                      <Label htmlFor="discount_value">
                        {formData.discount_type === 'percentage' ? 'Porcentaje (%)' : 'Monto Fijo ($)'}
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        min="0"
                        value={formData.discount_value}
                        onChange={(e) => handleInputChange('discount_value', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label>Descuento Calculado</Label>
                      <div className="p-2 bg-green-50 border rounded text-green-700 font-semibold">
                        -{formatCurrency(formData.discount_amount)}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="discount_reason">Motivo del Descuento</Label>
                      <Input
                        id="discount_reason"
                        value={formData.discount_reason}
                        onChange={(e) => handleInputChange('discount_reason', e.target.value)}
                        placeholder="Ej: Cliente frecuente"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Recargos */}
            <div>
              <Label className="flex items-center gap-2 text-lg font-semibold mb-4">
                <TrendingUp className="h-5 w-5 text-red-600" />
                Sistema de Recargos
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="surcharge_type">Tipo de Recargo</Label>
                  <Select value={formData.surcharge_type} onValueChange={(value) => handleInputChange('surcharge_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin Recargo</SelectItem>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed_amount">Monto Fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.surcharge_type !== 'none' && (
                  <>
                    <div>
                      <Label htmlFor="surcharge_value">
                        {formData.surcharge_type === 'percentage' ? 'Porcentaje (%)' : 'Monto Fijo ($)'}
                      </Label>
                      <Input
                        id="surcharge_value"
                        type="number"
                        min="0"
                        value={formData.surcharge_value}
                        onChange={(e) => handleInputChange('surcharge_value', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label>Recargo Calculado</Label>
                      <div className="p-2 bg-red-50 border rounded text-red-700 font-semibold">
                        +{formatCurrency(formData.surcharge_amount)}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="surcharge_reason">Motivo del Recargo</Label>
                      <Input
                        id="surcharge_reason"
                        value={formData.surcharge_reason}
                        onChange={(e) => handleInputChange('surcharge_reason', e.target.value)}
                        placeholder="Ej: Servicios adicionales"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* ✅ RESUMEN FINAL CORREGIDO */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label className="flex items-center gap-2 text-lg font-bold mb-3">
                <Calculator className="h-5 w-5" />
                Resumen de Cálculo Final
              </Label>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Precio Base (aproximado):</span>
                  <span>{formatCurrency(getApproximateBaseAmount())}</span>
                </div>
                
                {formData.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento Aplicado ({formData.discount_type === 'percentage' ? formData.discount_value + '%' : 'Monto fijo'}):</span>
                    <span className="font-medium">-{formatCurrency(formData.discount_amount)}</span>
                  </div>
                )}
                
                {formData.surcharge_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Recargo Aplicado ({formData.surcharge_type === 'percentage' ? formData.surcharge_value + '%' : 'Monto fijo'}):</span>
                    <span className="font-medium">+{formatCurrency(formData.surcharge_amount)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-xl font-bold">
                  <span>TOTAL FINAL:</span>
                  <span className="text-blue-600">{formatCurrency(getFinalAmount())}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de Auditoría (Solo lectura) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información de Auditoría (Solo lectura)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Creado</Label>
              <p className="text-gray-900 p-2 bg-gray-50 rounded">
                {formatDate(reservation.created_at)}
                {reservation.created_by_user && (
                  <span className="text-gray-500 block text-sm">
                    por {reservation.created_by_user.name}
                  </span>
                )}
              </p>
            </div>
            
            {reservation.updated_at && (
              <div>
                <Label>Última Actualización</Label>
                <p className="text-gray-900 p-2 bg-gray-50 rounded">
                  {formatDate(reservation.updated_at)}
                  {reservation.updated_by_user && (
                    <span className="text-gray-500 block text-sm">
                      por {reservation.updated_by_user.name}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Los campos marcados como "Solo lectura" preservan la integridad del sistema
            </div>
            <div className="flex gap-4">
              <Button onClick={handleCancel} variant="outline" type="button" disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 