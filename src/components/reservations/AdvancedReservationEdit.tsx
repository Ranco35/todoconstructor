'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReservationAuditHistory from '@/components/reservations/ReservationAuditHistory';

interface AdvancedReservationEditProps {
  reservation: any;
}

const AdvancedReservationEdit: React.FC<AdvancedReservationEditProps> = ({ reservation }) => {
  // Estado local editable para cada campo con valores por defecto para recargo
  const [form, setForm] = useState({ 
    ...reservation,
    // Asegurar que los campos de recargo existan
    surcharge_type: reservation?.surcharge_type || 'none',
    surcharge_value: reservation?.surcharge_value || 0,
    surcharge_amount: reservation?.surcharge_amount || 0,
    surcharge_reason: reservation?.surcharge_reason || '',
    // Asegurar que los campos de descuento existan
    discount_type: reservation?.discount_type || 'none',
    discount_value: reservation?.discount_value || 0,
    discount_amount: reservation?.discount_amount || 0,
    discount_reason: reservation?.discount_reason || '',
  });
  const [showPagos, setShowPagos] = useState(false);
  const [showFacturacion, setShowFacturacion] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Handler genérico para cambios
  const handleChange = (field: string, value: any) => {
    if (field === 'package_modular_id') {
      // Actualizar el package_modular_id dentro del array modular_reservation
      setForm(prev => ({
        ...prev,
        modular_reservation: prev.modular_reservation?.map((mr: any, index: number) => 
          index === 0 ? { ...mr, package_modular_id: value } : mr
        ) || []
      }));
    } else {
    setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // Función para guardar cambios
  const handleSave = async () => {
    setIsSaving(true);
    
    const saveData = {
      room_id: form.room_id,
      package_modular_id: form.modular_reservation && form.modular_reservation[0]?.package_modular_id,
      comments: form.comments,
      // Campos de descuento
      discount_value: form.discount_value,
      discount_type: form.discount_type,
      discount_amount: form.discount_amount,
      discount_reason: form.discount_reason,
      // Campos de recargo
      surcharge_value: form.surcharge_value,
      surcharge_type: form.surcharge_type,
      surcharge_amount: form.surcharge_amount,
      surcharge_reason: form.surcharge_reason,
    };
    
    console.log('💾 Saving reservation data:', saveData);
    console.log('💰 Surcharge details:', {
      surcharge_value: form.surcharge_value,
      surcharge_type: form.surcharge_type,
      surcharge_amount: form.surcharge_amount,
      surcharge_reason: form.surcharge_reason
    });
    
    try {
      const response = await fetch(`/api/reservations/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Cambios guardados correctamente. La reserva se actualizará en la lista.');
        // Recargar la página para mostrar cambios
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Error al guardar los cambios: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  // Obtener nombre del paquete si no está disponible
  useEffect(() => {
    // modular_reservation es un array, tomar el primer elemento
    const modularRes = form.modular_reservation && form.modular_reservation.length > 0 
      ? form.modular_reservation[0] 
      : null;
    
    if (modularRes?.package_name) {
      setPackageName(modularRes.package_name);
    } else if (modularRes?.package_modular_id) {
      setPackageName(`Cargando... (ID: ${modularRes.package_modular_id})`);
    } else {
      setPackageName('Sin paquete asignado');
    }
  }, [form.modular_reservation, form.room_id]);

  // Cargar habitaciones y paquetes disponibles
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Cargar habitaciones - usando acción existente
        const response = await fetch('/api/reservations/rooms');
        
        if (response.ok) {
          const roomsData = await response.json();
          setRooms(roomsData || []);
        } else {
          console.error('❌ Error loading rooms:', await response.text());
        }

        // Cargar paquetes
        const packagesResponse = await fetch('/api/reservations/packages');
        
        if (packagesResponse.ok) {
          const packagesData = await packagesResponse.json();
          setPackages(packagesData || []);
        } else {
          console.error('❌ Error loading packages:', await packagesResponse.text());
        }
      } catch (error) {
        console.error('💥 Error loading options:', error);
        // Fallback: crear opciones básicas si no funcionan las APIs
        const fallbackRooms = [
          { id: 12, number: '103', type: 'Triple' },
          { id: 11, number: '102', type: 'Doble' },
          { id: 10, number: '101', type: 'Individual' }
        ];
        const fallbackPackages = [
          { id: 12, name: 'Media Pensión', code: 'PKG-MEDIA-PENSIÓM-1751818074581' }
        ];
        
        console.log('🔄 Using fallback data for rooms and packages');
        setRooms(fallbackRooms);
        setPackages(fallbackPackages);
      }
    };

    loadOptions();
  }, []);



  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Editar Reserva #{form.id}</h2>
        <Badge className="uppercase">{form.status}</Badge>
      </div>

      {/* Cliente y Huésped */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Cliente</h3>
          <div className="p-3 bg-blue-50 rounded border border-blue-200 mb-2">
            <div><span className="font-medium">Nombre:</span> {form.client?.nombrePrincipal || form.guest_name}</div>
            <div><span className="font-medium">Email:</span> {form.client?.email || form.email}</div>
            <div><span className="font-medium">RUT:</span> {form.client?.rut || ''}</div>
            <div><span className="font-medium">Teléfono:</span> {form.client?.telefono || form.phone}</div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Huésped</h3>
          <div className="p-3 bg-green-50 rounded border border-green-200 mb-2">
            <div><span className="font-medium">Nombre:</span> <input className="border rounded px-2" value={form.guest_name} onChange={e => handleChange('guest_name', e.target.value)} /></div>
            <div><span className="font-medium">Email:</span> <input className="border rounded px-2" value={form.email} onChange={e => handleChange('email', e.target.value)} /></div>
            <div><span className="font-medium">Teléfono:</span> <input className="border rounded px-2" value={form.phone} onChange={e => handleChange('phone', e.target.value)} /></div>
          </div>
        </div>
      </div>

      {/* Fechas y Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Fechas de Estadia</h3>
          <div className="flex gap-2 items-center">
            <span>Check-in:</span>
            <input type="date" className="border rounded px-2" value={form.check_in?.split('T')[0]} onChange={e => handleChange('check_in', e.target.value)} />
            <span>Check-out:</span>
            <input type="date" className="border rounded px-2" value={form.check_out?.split('T')[0]} onChange={e => handleChange('check_out', e.target.value)} />
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Estado</h3>
          <Select value={form.status} onValueChange={v => handleChange('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre_reserva">Pre-reserva</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="en_curso">En curso</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Habitación y Paquete */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Habitación</h3>
          <Select 
            value={form.room_id?.toString() || ''} 
            onValueChange={value => {
              handleChange('room_id', parseInt(value));
            }}
          >
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue placeholder="Seleccionar habitación" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 shadow-lg">
              {rooms.length > 0 ? (
                rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()} className="bg-white hover:bg-gray-100">
                    {room.number} - {room.type} (Cap: {room.capacity || 'N/A'})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="loading" disabled className="bg-white">
                  Cargando habitaciones...
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            Actual: {form.room?.number || form.room_code || 'No asignada'}
          </p>
          <p className="text-xs text-blue-500 mt-1">
            ID: {form.room_id} | Código: {form.room_code}
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Paquete/Programa</h3>
          <Select 
            value={(form.modular_reservation && form.modular_reservation[0]?.package_modular_id)?.toString() || ''} 
            onValueChange={value => {
              handleChange('package_modular_id', parseInt(value));
            }}
          >
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue placeholder="Seleccionar paquete" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 shadow-lg">
              {packages.length > 0 ? (
                packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id.toString()} className="bg-white hover:bg-gray-100">
                    {pkg.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="loading" disabled className="bg-white">
                  Cargando paquetes...
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            Actual: {packageName || 'Sin paquete asignado'}
          </p>
          <p className="text-xs text-blue-500 mt-1">
            ID: {form.modular_reservation && form.modular_reservation[0]?.package_modular_id}
          </p>
        </div>
      </div>

      {/* Productos/Servicios */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Productos/Servicios</h3>
        <ul className="list-disc ml-6">
          {form.reservation_products?.map((prod: any) => (
            <li key={prod.id} className="mb-1">
              {prod.modular_product_name || prod.product_details?.name || prod.product_name || prod.name} <span className="text-gray-500">(${prod.unit_price || prod.price})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagos - Sección colapsable */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => setShowPagos(v => !v)}>{showPagos ? 'Ocultar' : 'Mostrar'} Pagos</Button>
        {showPagos && (
          <div className="mt-3">
            <h3 className="font-semibold mb-2">Pagos Realizados</h3>
            <ul className="list-disc ml-6">
              {(form.payments?.length || form.reservation_payments?.length) ? (
                <>
                  {form.payments?.map((p: any) => (
                    <li key={`payment-${p.id}`}>
                      ${p.amount} - {p.method} - {p.reference} - {p.processed_by} - {p.notes} - {new Date(p.created_at).toLocaleDateString()}
                    </li>
                  ))}
                  {form.reservation_payments?.map((p: any) => (
                    <li key={`reservation-payment-${p.id}`}>
                      ${p.amount} - {p.payment_method} - {p.reference_number} - {p.processed_by} - {p.notes} - {new Date(p.created_at).toLocaleDateString()}
                </li>
                  ))}
                </>
              ) : <li>No hay pagos registrados</li>}
            </ul>
          </div>
        )}
      </div>

      {/* Facturación - Sección colapsable */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => setShowFacturacion(v => !v)}>{showFacturacion ? 'Ocultar' : 'Mostrar'} Facturación</Button>
        {showFacturacion && (
          <div className="mt-3">
            <h3 className="font-semibold mb-2">Datos de Facturación</h3>
            <div><span className="font-medium">Nombre:</span> <input className="border rounded px-2" value={form.billing_name || ''} onChange={e => handleChange('billing_name', e.target.value)} /></div>
            <div><span className="font-medium">RUT:</span> <input className="border rounded px-2" value={form.billing_rut || ''} onChange={e => handleChange('billing_rut', e.target.value)} /></div>
            <div><span className="font-medium">Dirección:</span> <input className="border rounded px-2" value={form.billing_address || ''} onChange={e => handleChange('billing_address', e.target.value)} /></div>
          </div>
        )}
      </div>

      {/* Historial - Sección colapsable */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => setShowHistorial(v => !v)}>{showHistorial ? 'Ocultar' : 'Mostrar'} Historial</Button>
        {showHistorial && (
          <div className="mt-3">
            <h3 className="font-semibold mb-2">Historial de Cambios</h3>
            <ul className="list-disc ml-6">
              {form.historial?.length ? form.historial.map((h: any, idx: number) => (
                <li key={idx}>{h}</li>
              )) : <li>No hay historial registrado</li>}
            </ul>
          </div>
        )}
      </div>

      {/* Descuentos y Recargos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Descuento</h3>
          <input 
            type="number" 
            className="border rounded px-2 py-1 w-full" 
            value={form.discount_value || 0} 
            onChange={e => handleChange('discount_value', parseFloat(e.target.value) || 0)} 
            placeholder="Valor del descuento"
          />
          <div className="text-xs text-gray-500 mt-1">Tipo: {form.discount_type || 'none'}</div>
          <div className="text-xs text-gray-500">Motivo: {form.discount_reason || 'Sin motivo'}</div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Recargo</h3>
          <input 
            type="number" 
            className="border rounded px-2 py-1 w-full" 
            value={form.surcharge_value || 0} 
            onChange={e => handleChange('surcharge_value', parseFloat(e.target.value) || 0)} 
            placeholder="Valor del recargo"
          />
          <div className="text-xs text-gray-500 mt-1">Tipo: {form.surcharge_type || 'none'}</div>
          <div className="text-xs text-gray-500">Motivo: {form.surcharge_reason || 'Sin motivo'}</div>
        </div>
      </div>

      {/* Comentarios */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Comentarios</h3>
        <textarea className="border rounded px-2 w-full" value={form.comments || ''} onChange={e => handleChange('comments', e.target.value)} />
      </div>

      {/* Acciones */}
      <div className="flex gap-4 mt-8">
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Cancelar
        </Button>
      </div>

      {/* Historial de Auditoría */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">📋 Historial de Cambios</h2>
        <ReservationAuditHistory reservationId={reservation.id} />
      </div>
    </div>
  );
};

export default AdvancedReservationEdit; 