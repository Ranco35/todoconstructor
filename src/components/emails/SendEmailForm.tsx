'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Save, AlertCircle, CheckCircle, Mail, User } from 'lucide-react';
import { trackSentEmail, SentEmailData } from '@/actions/emails/sent-email-actions';

interface SendEmailFormProps {
  clientId?: number;
  clientEmail?: string;
  clientName?: string;
  reservationId?: number;
  budgetId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SendEmailForm({
  clientId,
  clientEmail,
  clientName,
  reservationId,
  budgetId,
  onSuccess,
  onCancel
}: SendEmailFormProps) {
  const [formData, setFormData] = useState({
    recipientEmail: clientEmail || '',
    recipientName: clientName || '',
    subject: '',
    body: '',
    emailType: 'custom' as SentEmailData['emailType'],
    templateUsed: '',
    isAutomated: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailTypes = [
    { value: 'confirmation', label: 'Confirmación de Reserva', icon: '✅' },
    { value: 'reminder', label: 'Recordatorio', icon: '⏰' },
    { value: 'payment_request', label: 'Solicitud de Pago', icon: '💰' },
    { value: 'follow_up', label: 'Seguimiento', icon: '📞' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'custom', label: 'Personalizado', icon: '📧' }
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      setError('Se requiere un cliente válido');
      return;
    }

    if (!formData.recipientEmail || !formData.subject) {
      setError('Email y asunto son campos requeridos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const emailData: SentEmailData = {
        clientId,
        recipientEmail: formData.recipientEmail,
        recipientName: formData.recipientName || undefined,
        subject: formData.subject,
        body: formData.body || undefined,
        emailType: formData.emailType,
        reservationId: reservationId || undefined,
        budgetId: budgetId || undefined,
        templateUsed: formData.templateUsed || undefined,
        isAutomated: formData.isAutomated
      };

      const result = await trackSentEmail(emailData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || 'Error registrando el correo');
      }

    } catch (err) {
      console.error('Error enviando formulario:', err);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-900 mb-2">
              Correo Registrado Exitosamente
            </h3>
            <p className="text-green-700 text-sm mb-4">
              El correo enviado ha sido registrado en el historial de comunicaciones del cliente
            </p>
            <Button onClick={onSuccess} className="bg-green-600 hover:bg-green-700">
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Registrar Correo Enviado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del destinatario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipientEmail">Email del Cliente *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="recipientEmail"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                  placeholder="cliente@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="recipientName">Nombre del Cliente</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => handleInputChange('recipientName', e.target.value)}
                  placeholder="Nombre completo"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Tipo de correo */}
          <div>
            <Label htmlFor="emailType">Tipo de Correo</Label>
            <Select
              value={formData.emailType}
              onValueChange={(value) => handleInputChange('emailType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {emailTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asunto */}
          <div>
            <Label htmlFor="subject">Asunto del Correo *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Asunto del correo enviado"
              required
            />
          </div>

          {/* Cuerpo del correo */}
          <div>
            <Label htmlFor="body">Contenido del Correo</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder="Resumen del contenido del correo (opcional)"
              rows={4}
            />
          </div>

          {/* Template usado */}
          <div>
            <Label htmlFor="templateUsed">Template Utilizado</Label>
            <Input
              id="templateUsed"
              value={formData.templateUsed}
              onChange={(e) => handleInputChange('templateUsed', e.target.value)}
              placeholder="Nombre del template o plantilla (opcional)"
            />
          </div>

          {/* Información adicional */}
          {(reservationId || budgetId) && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Asociaciones:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                {reservationId && <div>• Reserva ID: {reservationId}</div>}
                {budgetId && <div>• Presupuesto ID: {budgetId}</div>}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Registrando...' : 'Registrar Correo'}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 