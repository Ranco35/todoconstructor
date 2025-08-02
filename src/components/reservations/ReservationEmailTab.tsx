'use client';

import { useState, useEffect } from 'react';
import { Send, Mail, CheckCircle, Edit, Eye, Calendar } from 'lucide-react';
import { Reservation } from '@/types/reservation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { replaceTemplateVariables } from '@/lib/template-engine';
import { getTemplateById } from '@/lib/templates';
import { toast } from 'sonner';

interface ReservationEmailTabProps {
  reservation: Reservation;
}

export default function ReservationEmailTab({ reservation }: ReservationEmailTabProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [emailData, setEmailData] = useState({
    to: reservation.guest_email || '',
    subject: '',
    message: '',
    includeReservationDetails: true,
    includePaymentDetails: false,
  });
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Actualizar email cuando cambie la reserva
  useEffect(() => {
    setEmailData(prev => ({
      ...prev,
      to: reservation.guest_email || ''
    }));
  }, [reservation.guest_email]);

  // Plantillas disponibles específicas para reservas
  const reservationTemplates = [
    {
      id: 'reservation_confirmation',
      name: 'Confirmación de Reserva',
      description: 'Envía los detalles de la reserva al cliente',
      icon: Mail,
      color: 'blue',
      available: true
    },
    {
      id: 'payment_confirmation',
      name: 'Confirmación de Pago',
      description: 'Envía el comprobante de pago al cliente',
      icon: CheckCircle,
      color: 'green',
      available: reservation.paid_amount && reservation.paid_amount > 0
    },
    {
      id: 'reservation_reminder',
      name: 'Recordatorio de Reserva',
      description: 'Envía recordatorio antes del check-in',
      icon: Calendar,
      color: 'orange',
      available: true
    }
  ];

  // Datos para las plantillas usando el sistema centralizado
  const getTemplateData = () => {
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    
    const formatDate = (date: string | Date) => 
      new Date(date).toLocaleDateString('es-CL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

    return {
      // Variables de cliente
      nombre_cliente: reservation.guest_name || 'Estimado/a Cliente',
      email_cliente: reservation.guest_email || '',
      empresa: 'Termas Llifen',
      
      // Variables de reserva
      numero_reserva: reservation.id?.toString() || 'No especificado',
      fecha_checkin: reservation.check_in ? formatDate(reservation.check_in) : 'No especificada',
      fecha_checkout: reservation.check_out ? formatDate(reservation.check_out) : 'No especificada',
      habitacion: reservation.room_code || reservation.room?.number || 'No especificada',
      paquete: reservation.package_modular_name || 'Paquete no especificado',
      total_reserva: formatCurrency(reservation.total_amount || 0),
      numero_huespedes: reservation.guests || 1,
      tipo_habitacion: reservation.room?.type || 'No especificado',
      estado_reserva: reservation.status || 'Confirmada',
      
      // Variables de pago
      monto_pagado: formatCurrency(reservation.paid_amount || 0),
      total_pagado: formatCurrency(reservation.paid_amount || 0),
      saldo_restante: formatCurrency((reservation.total_amount || 0) - (reservation.paid_amount || 0)),
      metodo_pago: reservation.payment_method || 'Transferencia',
      fecha_pago: new Date().toLocaleDateString('es-CL'),
      referencia_pago: 'Ver comprobante adjunto',
      
      // Variables de fecha
      fecha_actual: new Date().toLocaleDateString('es-CL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      
      // Variables adicionales de contacto
      telefono_empresa: '+56 9 6645 7193',
      email_empresa: 'reservas@termasllifen.cl',
      direccion_empresa: 'Llifen, Futrono, Región de Los Ríos',
      website_empresa: 'www.termasllifen.cl'
    };
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    const template = getTemplateById(templateId);
    if (!template) {
      toast.error('Plantilla no encontrada');
      return;
    }

    const templateData = getTemplateData();
    
    // Reemplazar variables en el asunto y mensaje
    const processedSubject = replaceTemplateVariables(template.subject, templateData);
    const processedMessage = replaceTemplateVariables(template.htmlBody, templateData);
        
        setEmailData(prev => ({
          ...prev,
      subject: processedSubject,
      message: processedMessage
    }));
  };

  const handleSendEmail = async () => {
    if (!emailData.to) {
      toast.error('El correo electrónico del destinatario es requerido');
      return;
    }

    if (!selectedTemplateId) {
      toast.error('Selecciona una plantilla antes de enviar');
      return;
    }

    setIsSending(true);
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.message,
          templateId: selectedTemplateId,
          reservationId: reservation.id
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Correo enviado exitosamente');
        // Limpiar selección después del envío exitoso
        setSelectedTemplateId('');
        setEmailData(prev => ({ ...prev, subject: '', message: '' }));
      } else {
        toast.error(`Error al enviar el correo: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      toast.error('No se pudo conectar con el servidor de correos');
    } finally {
      setIsSending(false);
    }
  };

  const refreshTemplate = () => {
    if (selectedTemplateId) {
      handleTemplateSelect(selectedTemplateId);
    }
  };

  // Inicializar plantilla por defecto después de definir las funciones
  useEffect(() => {
    console.log('🔄 useEffect inicialización:', { 
      reservationId: reservation?.id, 
      isInitialized,
      guestEmail: reservation.guest_email,
      guestName: reservation.guest_name 
    });
    
    if (reservation?.id && !isInitialized) {
      console.log('✅ Inicializando plantilla por defecto...');
      setIsInitialized(true);
      
      // Cargar plantilla de confirmación por defecto después de un pequeño delay
      setTimeout(() => {
        console.log('🎯 Cargando plantilla reservation_confirmation...');
        const template = getTemplateById('reservation_confirmation');
        if (template) {
          console.log('📄 Plantilla encontrada:', template.id);
          const templateData = getTemplateData();
          console.log('📊 Datos de plantilla:', templateData);
          const processedSubject = replaceTemplateVariables(template.subject, templateData);
          const processedMessage = replaceTemplateVariables(template.htmlBody, templateData);
          
          setSelectedTemplateId('reservation_confirmation');
          setEmailData(prev => ({
            ...prev,
            to: reservation.guest_email || '',
            subject: processedSubject,
            message: processedMessage
          }));
          console.log('✅ Plantilla cargada exitosamente');
        } else {
          console.error('❌ No se encontró la plantilla reservation_confirmation');
        }
      }, 100);
    }
  }, [reservation?.id, isInitialized]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel de plantillas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Plantillas de Reservas</h3>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Sistema Centralizado
            </div>
          </div>
          
          <div className="space-y-3">
            {reservationTemplates.map((template) => {
              const IconComponent = template.icon;
              const isSelected = selectedTemplateId === template.id;
              const colorClasses = {
                blue: isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-blue-25',
                green: isSelected ? 'border-green-500 bg-green-50' : 'hover:bg-green-25',
                orange: isSelected ? 'border-orange-500 bg-orange-50' : 'hover:bg-orange-25'
              };

              return (
            <button
                  key={template.id}
                  onClick={() => template.available ? handleTemplateSelect(template.id) : null}
                  disabled={!template.available}
                  className={`w-full text-left p-4 border rounded-lg transition-colors ${
                    colorClasses[template.color as keyof typeof colorClasses]
                  } ${!template.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      template.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      template.color === 'green' ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                </div>
                    <div className="flex-1">
                      <div className="font-medium">{template.name}</div>
                      <p className="text-sm text-gray-500">{template.description}</p>
                      {!template.available && template.id === 'payment_confirmation' && (
                    <p className="text-xs text-red-500 mt-1">No hay pagos registrados</p>
                  )}
                </div>
                    {isSelected && (
                      <div className="text-green-600">
                        <CheckCircle className="w-5 h-5" />
              </div>
                    )}
              </div>
            </button>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t">
            <h4 className="font-medium text-gray-700 mb-3">Opciones Avanzadas</h4>
            
            <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label htmlFor="include-details">Incluir detalles de la reserva</Label>
                  <p className="text-xs text-gray-500">Información completa de la reserva</p>
              </div>
              <Switch 
                id="include-details" 
                checked={emailData.includeReservationDetails}
                onCheckedChange={(checked) => {
                  setEmailData(prev => ({ ...prev, includeReservationDetails: checked }));
                    refreshTemplate();
                }}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label htmlFor="include-payment">Incluir detalles de pago</Label>
                  <p className="text-xs text-gray-500">Montos pagados y saldo pendiente</p>
              </div>
              <Switch 
                id="include-payment" 
                checked={emailData.includePaymentDetails}
                onCheckedChange={(checked) => {
                  setEmailData(prev => ({ ...prev, includePaymentDetails: checked }));
                    refreshTemplate();
                  }}
                />
              </div>
              
              {selectedTemplateId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshTemplate}
                  className="w-full gap-2 mt-2"
                >
                  <Edit className="w-4 h-4" />
                  Actualizar Plantilla
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Panel de edición y vista previa */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">
              {previewMode ? 'Vista Previa' : 'Editar Mensaje'}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="gap-2"
            >
              {previewMode ? (
                <>
                  <Edit className="w-4 h-4" />
                  Editar
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Vista Previa
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-to">Para</Label>
            <Input
              id="email-to"
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Asunto</Label>
            <Input
              id="email-subject"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Asunto del correo"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="email-message">Mensaje</Label>
              <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {previewMode ? 'Vista previa' : 'Modo edición'}
              </span>
                {selectedTemplateId && (
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Plantilla: {reservationTemplates.find(t => t.id === selectedTemplateId)?.name}
                  </div>
                )}
              </div>
            </div>
            
            {previewMode ? (
              <div className="border rounded-md bg-white min-h-[300px] overflow-auto">
                {emailData.message ? (
                  <div 
                    className="p-4"
                    dangerouslySetInnerHTML={{ __html: emailData.message }}
                  />
                ) : (
                  <div className="p-4 text-center text-gray-400 flex flex-col items-center gap-3">
                    <Mail className="w-12 h-12 text-gray-300" />
                    <div>
                      <p className="font-medium">Selecciona una plantilla</p>
                      <p className="text-sm">Elige una de las plantillas de arriba para ver la vista previa</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                id="email-message"
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Selecciona una plantilla o escribe tu mensaje personalizado aquí..."
                className="min-h-[300px] font-mono text-sm"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-600">
          {selectedTemplateId ? (
            <span className="text-green-600">✅ Plantilla seleccionada: {reservationTemplates.find(t => t.id === selectedTemplateId)?.name}</span>
          ) : (
            <span className="text-amber-600">⚠️ Selecciona una plantilla para continuar</span>
          )}
        </div>
        
        <Button 
          onClick={handleSendEmail}
          disabled={isSending || !selectedTemplateId || !emailData.to}
          className="gap-2"
        >
          {isSending ? (
            'Enviando...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar Correo
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
