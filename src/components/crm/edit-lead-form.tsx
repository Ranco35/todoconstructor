'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { updateCRMLead } from '@/actions/crm/leads';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import ClientSelector from '@/components/clients/ClientSelector';
import type { CRMLead, CRMStage, LossReasonCategory } from '@/types/crm';

interface EditLeadFormProps {
  lead: CRMLead;
  stages: CRMStage[];
}

export function EditLeadForm({ lead, stages }: EditLeadFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: lead.title || '',
    description: lead.description || '',
    estimated_value: lead.estimated_value || 0,
    probability: lead.probability || 50,
    priority: lead.priority || 'medium',
    source: lead.source || 'manual',
    stage_id: lead.stage_id || 1,
    expected_close_date: lead.expected_close_date || '',
    tags: lead.tags || [],
    notes: lead.notes || '',
    client_id: lead.client_id || undefined,
    loss_reason_category: lead.loss_reason_category || '',
    loss_reason: lead.loss_reason || '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Obtener información del usuario actual
      const userResult = await getCurrentUser();
      const userId = userResult.success ? userResult.data?.id : undefined;
      const userName = userResult.success ? userResult.data?.name : undefined;
      const userEmail = userResult.success ? userResult.data?.email : undefined;

      const result = await updateCRMLead(
        {
          id: lead.id,
          ...formData,
          expected_close_date: formData.expected_close_date || null,
          loss_reason_category: formData.loss_reason_category || undefined,
          loss_reason: formData.loss_reason || undefined,
        } as any,
        userId,
        userName,
        userEmail
      );

      if (result.success) {
        toast({
          title: 'Lead Actualizado',
          description: 'El lead se ha actualizado correctamente.',
        });
        
        // Redirigir al detalle del lead
        router.push(`/dashboard/crm/${lead.id}`);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo actualizar el lead.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'Error inesperado al actualizar el lead.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Baja' },
      medium: { color: 'bg-blue-100 text-blue-800', label: 'Media' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      web: { color: 'bg-green-100 text-green-800', label: 'Web' },
      whatsapp: { color: 'bg-green-100 text-green-800', label: 'WhatsApp' },
      telefono: { color: 'bg-blue-100 text-blue-800', label: 'Teléfono' },
      referido: { color: 'bg-purple-100 text-purple-800', label: 'Referido' },
      manual: { color: 'bg-gray-100 text-gray-800', label: 'Manual' }
    };

    const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.manual;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cliente Asociado</CardTitle>
          <CardDescription>
            Selecciona o cambia el cliente vinculado a este lead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente</Label>
            <ClientSelector
              value={formData.client_id}
              onValueChange={(value) => handleInputChange('client_id', value)}
              placeholder="Seleccionar cliente..."
              showClientInfo={true}
            />
          </div>
          
          {/* Información del cliente actual si existe */}
          {lead.client && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Cliente Actual:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Nombre:</span>
                  <p className="text-blue-900">{lead.client.nombrePrincipal} {lead.client.apellido}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Email:</span>
                  <p className="text-blue-900">{lead.client.email || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Teléfono:</span>
                  <p className="text-blue-900">{lead.client.telefonoMovil || lead.client.telefono || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">RUT:</span>
                  <p className="text-blue-900">{lead.client.rut || 'No especificado'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>
            Datos principales del lead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Lead *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ej: Cliente interesado en paquete familiar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage_id">Etapa Actual</Label>
              <Select
                value={formData.stage_id.toString()}
                onValueChange={(value) => handleInputChange('stage_id', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe los detalles del lead..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Información Comercial */}
      <Card>
        <CardHeader>
          <CardTitle>Información Comercial</CardTitle>
          <CardDescription>
            Datos de valor y probabilidad de cierre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_value">Valor Estimado (CLP)</Label>
              <Input
                id="estimated_value"
                type="number"
                value={formData.estimated_value}
                onChange={(e) => handleInputChange('estimated_value', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Probabilidad (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => handleInputChange('probability', parseInt(e.target.value) || 0)}
                placeholder="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Fecha de Cierre Esperada</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clasificación */}
      <Card>
        <CardHeader>
          <CardTitle>Clasificación</CardTitle>
          <CardDescription>
            Prioridad y origen del lead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Actual:</span>
                {getPriorityBadge(formData.priority)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Origen</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => handleInputChange('source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telefono">Teléfono</SelectItem>
                  <SelectItem value="referido">Referido</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Actual:</span>
                {getSourceBadge(formData.source)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Razón de Pérdida - Solo visible cuando stage = 8 (Perdido) */}
      {formData.stage_id === 8 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-900">Razón de Pérdida</CardTitle>
            <CardDescription>
              Indica por qué se perdió este lead
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loss_reason_category">Categoría</Label>
              <Select
                value={formData.loss_reason_category}
                onValueChange={(value) => handleInputChange('loss_reason_category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Precio</SelectItem>
                  <SelectItem value="competitor">Competencia</SelectItem>
                  <SelectItem value="timing">Timing</SelectItem>
                  <SelectItem value="no_response">Sin Respuesta</SelectItem>
                  <SelectItem value="requirements">Requisitos No Cumplidos</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loss_reason">Detalle (opcional)</Label>
              <Textarea
                id="loss_reason"
                value={formData.loss_reason}
                onChange={(e) => handleInputChange('loss_reason', e.target.value)}
                placeholder="Agrega detalles sobre la razón de pérdida..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notas Adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Adicionales</CardTitle>
          <CardDescription>
            Información adicional sobre el lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Agrega notas adicionales sobre el lead..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/crm/${lead.id}`)}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
