'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Send, Mail, User, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendBudgetEmail, type SendBudgetEmailInput } from '@/actions/sales/budgets/email';
import { type BudgetWithDetails } from '@/actions/sales/budgets/get';
import { generateBudgetEmailWithClaude, generateGroupBudgetWithClaude } from '@/actions/ai/anthropic-actions';
import { chatWithOpenAI, generateGroupBudgetWithOpenAI } from '@/actions/ai/openai-actions';

interface EmailBudgetModalProps {
  budget: BudgetWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onEmailSent?: () => void;
}

export default function EmailBudgetModal({ 
  budget, 
  isOpen, 
  onClose, 
  onEmailSent 
}: EmailBudgetModalProps) {
  const [formData, setFormData] = useState({
    recipientEmail: '',
    subject: '',
    customMessage: '',
    includePDF: true, // Por defecto incluir PDF
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic'>('anthropic');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'professional'>('professional');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [budgetType, setBudgetType] = useState<'individual' | 'group'>('individual');
  const [customHTML, setCustomHTML] = useState<string>('');
  const [useCustomHTML, setUseCustomHTML] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        recipientEmail: budget.client?.email || '',
        subject: `Presupuesto ${budget.number} - Termas Llifen`,
        customMessage: '',
        includePDF: true, // Resetear el checkbox
      });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientEmail.trim()) {
      setError('El email del destinatario es obligatorio');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipientEmail)) {
      setError('El formato del email no es válido');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const input: SendBudgetEmailInput = {
        budgetId: budget.id,
        recipientEmail: formData.recipientEmail.trim(),
        subject: formData.subject.trim() || undefined,
        customMessage: formData.customMessage.trim() || undefined,
        includePDF: formData.includePDF, // Incluir o excluir PDF
        useCustomHTML: useCustomHTML && customHTML.length > 0,
        customHTML: useCustomHTML ? customHTML : undefined,
      };

      const result = await sendBudgetEmail(input);

      if (result.success) {
        setSuccess(result.message);
        onEmailSent?.();
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error enviando email:', error);
      setError('Error inesperado al enviar el email');
    } finally {
      setLoading(false);
    }
  };

  // Función para generar email automáticamente con IA
  const handleGenerateWithAI = async () => {
    if (!budget.client) {
      setError('Se necesita un cliente asociado para generar el email');
      return;
    }

    setGeneratingAI(true);
    setError(null);

    try {
      const clientName = budget.client.firstName && budget.client.lastName 
        ? `${budget.client.firstName} ${budget.client.lastName}`.trim()
        : budget.client.firstName || 'Cliente';

      const budgetData = {
        clientName,
        budgetNumber: budget.number,
        total: budget.total,
        items: budget.lines.map(line => ({
          name: line.product_name || line.description || 'Producto',
          quantity: Number(line.quantity) || 0,
          price: Number(line.unit_price) || 0,
        })),
        validUntil: budget.expiration_date ? new Date(budget.expiration_date).toLocaleDateString('es-CL') : '30 días',
      };

      let result;
      
      if (aiProvider === 'anthropic') {
        // Usar Claude (Anthropic)
        if (budgetType === 'group') {
          result = await generateGroupBudgetWithClaude({
            ...budgetData,
            totalGuests: budget.lines.reduce((sum, line) => sum + line.quantity, 0),
          }, tone);
        } else {
          result = await generateBudgetEmailWithClaude(budgetData, tone);
        }
      } else {
        // Usar OpenAI (ChatGPT)
        if (budgetType === 'group') {
          result = await generateGroupBudgetWithOpenAI({
            ...budgetData,
            totalGuests: budget.lines.reduce((sum, line) => sum + line.quantity, 0),
          }, tone);
        } else {
          const systemMessage = `Eres un asistente especializado en generar emails comerciales para Hotel/Spa Termas Llifen. 
          Genera emails ${tone}es, profesionales y persuasivos para envío de presupuestos.
          
          Características del hotel:
          - Hotel & Spa de lujo en Chile
          - Servicios premium de termas y spa
          - Experiencia relajante y de bienestar
          
          El email debe:
          - Ser ${tone} pero cálido
          - Destacar el valor de los servicios
          - Incluir una llamada a la acción clara
          - Generar confianza y profesionalismo
          - Mencionar los beneficios de las termas y spa`;

          const itemsList = budgetData.items.map(item => 
            `- ${item.name} (Cantidad: ${item.quantity}, Precio: $${item.price.toLocaleString('es-CL')})`
          ).join('\n');

          const userMessage = `Genera un email profesional para enviar el presupuesto con los siguientes datos:

Cliente: ${budgetData.clientName}
Número de presupuesto: ${budgetData.budgetNumber}
Total: $${budgetData.total.toLocaleString('es-CL')}
Válido hasta: ${budgetData.validUntil}

Servicios incluidos:
${itemsList}

El email debe incluir:
1. Saludo personalizado
2. Introducción del presupuesto
3. Breve descripción de los beneficios
4. Detalles de contacto y próximos pasos
5. Despedida profesional

Genera solo el contenido del email (sin asunto).`;

          result = await chatWithOpenAI({
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userMessage }
            ],
            taskType: 'email_generation',
          });
        }
      }

      if (result.success && result.data?.message) {
        setFormData(prev => ({ 
          ...prev, 
          customMessage: result.data?.message || ''
        }));
        setSuccess(`Email generado exitosamente con ${aiProvider === 'anthropic' ? 'Claude' : 'ChatGPT'}`);
      } else {
        setError(`Error al generar email con ${aiProvider === 'anthropic' ? 'Claude' : 'ChatGPT'}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generando email con IA:', error);
      setError('Error inesperado al generar el email con IA');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Función para manejar la carga de archivo HTML
  const handleHTMLFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCustomHTML(content);
        setUseCustomHTML(true);
      };
      reader.readAsText(file);
    } else {
      setError('Por favor selecciona un archivo HTML válido');
    }
  };

  // Función para generar previsualización del PDF
  const generatePreview = async () => {
    if (!budget) return;
    
    setGeneratingPreview(true);
    setError(null);
    
    try {
      // Generar HTML de previsualización basado en el presupuesto
      const clientName = budget.client?.firstName && budget.client?.lastName 
        ? `${budget.client.firstName} ${budget.client.lastName}`.trim()
        : budget.client?.firstName || 'Cliente';

      const itemsHTML = budget.lines.map(line => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${line.product_name || line.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${line.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${Number(line.unit_price).toLocaleString('es-CL')}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${Number(line.subtotal).toLocaleString('es-CL')}</td>
        </tr>
      `).join('');

      const subtotal = Math.round((budget.total || 0) / 1.19);
      const iva = (budget.total || 0) - subtotal;

      const defaultHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Presupuesto ${budget.number}</title>
          <style>
            @page { size: A4; margin: 2cm; }
            body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2c5aa0; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #2c5aa0; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; }
            .client-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .budget-info { background: #2c5aa0; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #2c5aa0; color: white; padding: 12px; text-align: left; }
            .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .total { background: #28a745; color: white; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">TERMAS LLIFEN</div>
            <div class="subtitle">Hotel & Spa Premium</div>
            <div style="margin-top: 10px;">
              📞 +56 9 8765 4321 | ✉️ reservas@termasllifen.cl | 🌐 www.termasllifen.cl
            </div>
          </div>

          <h1 style="text-align: center; color: #2c5aa0; margin: 30px 0;">PRESUPUESTO ${budget.number}</h1>

          <div class="client-info">
            <h3 style="margin-top: 0; color: #2c5aa0;">INFORMACIÓN DEL CLIENTE</h3>
            <p><strong>Nombre:</strong> ${clientName}</p>
            ${budget.client?.email ? `<p><strong>Email:</strong> ${budget.client.email}</p>` : ''}
            ${budget.client?.phone ? `<p><strong>Teléfono:</strong> ${budget.client.phone}</p>` : ''}
            ${budget.client?.rut ? `<p><strong>RUT:</strong> ${budget.client.rut}</p>` : ''}
          </div>

          <div class="budget-info">
            <h3 style="margin-top: 0;">INFORMACIÓN DEL PRESUPUESTO</h3>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</p>
            ${budget.expiration_date ? `<p><strong>Válido hasta:</strong> ${new Date(budget.expiration_date).toLocaleDateString('es-CL')}</p>` : ''}
          </div>

          <h3 style="color: #2c5aa0;">DETALLE DE SERVICIOS</h3>
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="width: 100px; text-align: center;">Cantidad</th>
                <th style="width: 120px; text-align: right;">Precio Unit.</th>
                <th style="width: 120px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="summary">
            <h3 style="margin-top: 0; color: #2c5aa0;">RESUMEN FINANCIERO</h3>
            <p><strong>Subtotal:</strong> $${subtotal.toLocaleString('es-CL')}</p>
            <p><strong>IVA (19%):</strong> $${Math.round(iva).toLocaleString('es-CL')}</p>
            <div class="total">TOTAL: $${(budget.total || 0).toLocaleString('es-CL')}</div>
          </div>

          ${budget.notes ? `
            <div style="margin-top: 30px;">
              <h3 style="color: #2c5aa0;">NOTAS ADICIONALES</h3>
              <p>${budget.notes}</p>
            </div>
          ` : ''}

          ${budget.paymentTerms ? `
            <div style="margin-top: 20px;">
              <h3 style="color: #2c5aa0;">TÉRMINOS DE PAGO</h3>
              <p>${budget.paymentTerms}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p><strong>Termas Llifen - Hotel & Spa Premium</strong></p>
            <p>Esperamos confirmar pronto su reserva. ¡Gracias por elegirnos!</p>
          </div>
        </body>
        </html>
      `;

      const htmlToShow = useCustomHTML && customHTML ? customHTML : defaultHTML;
      setPreviewContent(htmlToShow);
      setShowPreview(true);
      
    } catch (error) {
      console.error('Error generando previsualización:', error);
      setError('Error al generar la previsualización');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleClose = () => {
    if (!loading && !generatingAI) {
      onClose();
    }
  };

  // Detectar si es presupuesto de grupo (más de 10 personas o monto alto)
  const totalGuests = budget.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  const isGroupBudget = totalGuests > 10 || budget.total > 1000000; // > 10 personas o > $1M

  // Obtener nombre del cliente para mostrar
  const clientName = budget.client?.firstName && budget.client?.lastName 
    ? `${budget.client.firstName} ${budget.client.lastName}`.trim()
    : budget.client?.firstName || 'Cliente sin nombre';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Enviar Presupuesto por Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Presupuesto */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">📋 Información del Presupuesto</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Número:</span>
                  <p className="font-medium">{budget.number}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cliente:</span>
                  <p className="font-medium">{clientName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <p className="font-medium text-green-600">
                    ${budget.total.toLocaleString('es-CL')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <p className="font-medium capitalize">{budget.status}</p>
                </div>
              </div>
            </div>

            {/* Email del Destinatario */}
            <div className="space-y-2">
              <Label htmlFor="recipientEmail" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Email del Destinatario *
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                placeholder="ejemplo@correo.com"
                disabled={loading || generatingAI}
                className="w-full"
              />
              {budget.client?.email && (
                <p className="text-sm text-gray-500">
                  💡 Se usará el email del cliente: {budget.client.email}
                </p>
              )}
            </div>

            {/* Asunto del Email */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Asunto del Email
              </Label>
              <Input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Presupuesto - Termas Llifen"
                disabled={loading || generatingAI}
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Si se deja vacío, se usará el asunto por defecto
              </p>
            </div>

            {/* Generación Automática con IA - Colapsible */}
            <details className="group border border-purple-200 rounded-lg">
              <summary className="cursor-pointer p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-800 inline">✨ Generación Automática con IA</h4>
                  <span className="text-xs text-purple-600 ml-auto">(Click para expandir)</span>
                </div>
              </summary>
              
              <div className="p-4 space-y-4 border-t border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Selector de Proveedor de IA */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Proveedor de IA</Label>
                    <Select 
                      value={aiProvider} 
                      onValueChange={(value: 'openai' | 'anthropic') => setAiProvider(value)}
                      disabled={loading || generatingAI}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar IA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anthropic">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-orange-500" />
                            <span>Claude (Anthropic)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="openai">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-green-500" />
                            <span>ChatGPT (OpenAI)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selector de Tono */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tono del Email</Label>
                    <Select 
                      value={tone} 
                      onValueChange={(value: 'formal' | 'friendly' | 'professional') => setTone(value)}
                      disabled={loading || generatingAI}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar tono" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">🏢 Profesional</SelectItem>
                        <SelectItem value="friendly">😊 Amigable</SelectItem>
                        <SelectItem value="formal">📝 Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selector de Tipo de Presupuesto */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Presupuesto</Label>
                    <Select 
                      value={budgetType} 
                      onValueChange={(value: 'individual' | 'group') => setBudgetType(value)}
                      disabled={loading || generatingAI}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">👤 Individual</SelectItem>
                        <SelectItem value="group">👥 Grupo/Corporativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isGroupBudget && (
                                     <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                     <p className="text-sm text-amber-700">
                       💡 <strong>Presupuesto de Grupo Detectado:</strong> Este presupuesto parece ser para un grupo ({totalGuests} personas o monto alto $${budget.total.toLocaleString('es-CL')}). Se recomienda usar el tipo "Grupo/Corporativo" para un email más apropiado.
                     </p>
                   </div>
                )}

                {/* Botón de Generación */}
                <Button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={generatingAI || loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                                  {generatingAI ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando {budgetType === 'group' ? 'Presupuesto Grupal' : 'Email'} con {aiProvider === 'anthropic' ? 'Claude' : 'ChatGPT'}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar {budgetType === 'group' ? 'Presupuesto Grupal' : 'Email'} con {aiProvider === 'anthropic' ? 'Claude' : 'ChatGPT'}
                  </>
                )}
                </Button>
                
                <p className="text-sm text-purple-600">
                  💡 La IA generará un {budgetType === 'group' ? 'presupuesto grupal especializado' : 'email personalizado'} y profesional basado en los datos del presupuesto
                  {budgetType === 'group' && (
                    <span className="block mt-1 text-xs">
                      📊 Incluye estadísticas de grupo, servicios colectivos y formato especial para organizaciones
                    </span>
                  )}
                </p>
              </div>
            </details>

            {/* Mensaje Personalizado */}
            <div className="space-y-2">
              <Label htmlFor="customMessage" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Mensaje Personalizado {formData.customMessage ? '(Generado con IA)' : '(Opcional)'}
              </Label>
              <Textarea
                id="customMessage"
                value={formData.customMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                placeholder="Agregue aquí cualquier mensaje adicional para el cliente o use el botón de IA arriba..."
                disabled={loading || generatingAI}
                rows={4}
                className="w-full resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Este mensaje aparecerá destacado al inicio del email
                </p>
                {formData.customMessage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setFormData(prev => ({ ...prev, customMessage: '' }));
                    }}
                    className="text-xs"
                    disabled={loading || generatingAI}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Incluir PDF */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includePDF"
                  checked={formData.includePDF}
                  onChange={(e) => setFormData(prev => ({ ...prev, includePDF: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading || generatingAI}
                />
                <Label htmlFor="includePDF" className="text-sm font-medium text-gray-700">
                  📎 Incluir PDF del presupuesto adjunto
                </Label>
              </div>
              {formData.includePDF && (
                <div className="ml-6 space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      ✅ Se adjuntará un PDF profesional con todos los detalles del presupuesto.
                      <br />
                      📄 Nombre del archivo: <strong>Presupuesto_{budget.number}_Termas_Llifen.pdf</strong>
                    </p>
                  </div>

                  {/* Personalización del PDF */}
                  <details className="border border-gray-200 rounded-lg">
                    <summary className="cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">🎨 Personalizar PDF (Opcional)</span>
                        <span className="text-xs text-gray-500 ml-auto">(Click para expandir)</span>
                      </div>
                    </summary>
                    
                    <div className="p-3 space-y-3 border-t border-gray-200">
                      {/* Opción de HTML personalizado */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="useCustomHTML"
                          checked={useCustomHTML}
                          onChange={(e) => setUseCustomHTML(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={loading || generatingAI}
                        />
                        <Label htmlFor="useCustomHTML" className="text-sm font-medium text-gray-700">
                          📄 Usar plantilla HTML personalizada
                        </Label>
                      </div>

                      {useCustomHTML && (
                        <div className="space-y-3">
                          {/* Subir archivo HTML */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Subir archivo HTML</Label>
                            <input
                              type="file"
                              accept=".html,.htm"
                              onChange={handleHTMLFileUpload}
                              disabled={loading || generatingAI}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="text-xs text-gray-500">
                              Sube un archivo HTML con tu plantilla personalizada para el PDF
                            </p>
                          </div>

                          {/* Editor de HTML */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">O edita el HTML directamente</Label>
                            <textarea
                              value={customHTML}
                              onChange={(e) => setCustomHTML(e.target.value)}
                              placeholder="Pega aquí tu código HTML personalizado..."
                              disabled={loading || generatingAI}
                              rows={6}
                              className="w-full text-xs font-mono border border-gray-300 rounded-md px-3 py-2 resize-none"
                            />
                          </div>

                          {customHTML && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-sm text-blue-700">
                                ✅ HTML personalizado cargado ({customHTML.length} caracteres)
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botón de previsualización */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generatePreview}
                          disabled={generatingPreview || loading || generatingAI}
                          className="flex items-center gap-2"
                        >
                          {generatingPreview ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              Generando...
                            </>
                          ) : (
                            <>
                              <span>👁️</span>
                              Previsualizar PDF
                            </>
                          )}
                        </Button>
                        
                        {useCustomHTML && customHTML && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCustomHTML('');
                              setUseCustomHTML(false);
                            }}
                            disabled={loading || generatingAI}
                            className="text-xs"
                          >
                            Limpiar HTML
                          </Button>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Mensajes de Estado */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <Mail className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  handleClose();
                }}
                disabled={loading || generatingAI}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || generatingAI || !formData.recipientEmail.trim()}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Presupuesto
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Información Adicional */}
          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
            <p className="text-sm text-blue-700">
              <strong>📧 Información:</strong> El presupuesto se enviará como un email profesional 
              con el formato de Termas Llifen, incluyendo todos los detalles de productos y precios.
              {formData.includePDF && (
                <>
                  <br />
                  <strong>📎 PDF Adjunto:</strong> Se incluirá un documento PDF descargable con el presupuesto completo.
                </>
              )}
            </p>
          </div>
        </div>
      </DialogContent>

      {/* Modal de Previsualización */}
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2">
                <span>👁️</span>
                Previsualización del PDF - Formato Carta
                <span className="text-sm font-normal text-gray-500 ml-auto">
                  {useCustomHTML ? 'HTML Personalizado' : 'Plantilla Estándar'}
                </span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Información del formato */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  📄 <strong>Formato:</strong> A4 (210 × 297 mm) con márgenes de 2cm
                  <br />
                  🎨 <strong>Tipo:</strong> {useCustomHTML ? 'Plantilla personalizada cargada' : 'Plantilla estándar de Termas Llifen'}
                </p>
              </div>

              {/* Vista previa con scroll */}
              <div className="border rounded-lg overflow-hidden bg-white shadow-inner">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Vista Previa - Escala 75%</span>
                    <span className="text-xs text-gray-500">El PDF final se verá en tamaño completo</span>
                  </div>
                </div>
                
                <div className="h-96 overflow-auto p-4 bg-gray-50">
                  <div 
                    className="bg-white shadow-lg mx-auto"
                    style={{ 
                      width: '595px', 
                      minHeight: '842px', 
                      transform: 'scale(0.75)', 
                      transformOrigin: 'top left',
                      marginBottom: '50px'
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: previewContent }}
                      className="w-full h-full"
                      style={{ width: '595px', minHeight: '842px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  💡 Esta previsualización muestra cómo se verá el PDF adjunto en el email
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Cerrar
                  </Button>
                  
                  {useCustomHTML && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCustomHTML('');
                        setUseCustomHTML(false);
                        generatePreview();
                      }}
                    >
                      Ver Plantilla Estándar
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => {
                      setShowPreview(false);
                      // Auto-seleccionar incluir PDF si no está activado
                      if (!formData.includePDF) {
                        setFormData(prev => ({ ...prev, includePDF: true }));
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ✅ Usar este Formato
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}