'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Send, Loader2, Eye, EyeOff, Plus, Pencil, Trash2, Save, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendLeadEmail } from '@/actions/crm/emails';
import {
  getCRMEmailTemplates,
  createCRMEmailTemplate,
  updateCRMEmailTemplate,
  deleteCRMEmailTemplate,
  type CRMEmailTemplate,
} from '@/actions/crm/email-templates';

interface QuickEmailReplyProps {
  leadId: number;
  clientEmail: string;
  clientName: string;
  leadTitle: string;
  onEmailSent?: () => void;
}

// Plantillas locales de fallback si la DB no tiene registros
const FALLBACK_TEMPLATES: Omit<CRMEmailTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Disponibilidad confirmada',
    slug: 'disponibilidad_si',
    subject: 'Disponibilidad confirmada - TodoConstructor',
    body: 'Le informamos que tenemos disponibilidad para las fechas solicitadas.\n\nEstamos preparando un presupuesto detallado con las opciones disponibles para su estadía. Se lo enviaremos a la brevedad.\n\nSi tiene alguna consulta adicional, no dude en contactarnos.',
    category: 'ventas',
    is_default: true,
    is_active: true,
  },
  {
    name: 'Sin disponibilidad',
    slug: 'disponibilidad_no',
    subject: 'Consulta de disponibilidad - TodoConstructor',
    body: 'Agradecemos su interés en TodoConstructor.\n\nLamentablemente, para las fechas solicitadas no contamos con disponibilidad. Sin embargo, le sugerimos las siguientes alternativas:\n\n- [Indicar fechas alternativas disponibles]\n\nQuedamos atentos a cualquier consulta.',
    category: 'ventas',
    is_default: true,
    is_active: true,
  },
  {
    name: 'Solicitar más información',
    slug: 'solicitar_info',
    subject: 'Re: Consulta de productos - TodoConstructor',
    body: 'Agradecemos su interés en TodoConstructor.\n\nPara poder preparar una propuesta adecuada a sus necesidades, necesitamos la siguiente información adicional:\n\n- ¿Qué tipo de materiales necesita?\n- ¿Tiene preferencia de marca o especificación?\n- ¿Requiere servicios adicionales (instalación, despacho, etc.)?\n\nQuedamos atentos a su respuesta.',
    category: 'ventas',
    is_default: true,
    is_active: true,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  ventas: 'Ventas',
  seguimiento: 'Seguimiento',
  general: 'General',
};

export function QuickEmailReply({ leadId, clientEmail, clientName, leadTitle, onEmailSent }: QuickEmailReplyProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Template management state
  const [templates, setTemplates] = useState<CRMEmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Template editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CRMEmailTemplate | null>(null);
  const [editorName, setEditorName] = useState('');
  const [editorSubject, setEditorSubject] = useState('');
  const [editorBody, setEditorBody] = useState('');
  const [editorCategory, setEditorCategory] = useState('ventas');
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const result = await getCRMEmailTemplates();
      if (result.success && result.templates.length > 0) {
        setTemplates(result.templates);
      } else {
        // Use fallback templates with fake IDs
        setTemplates(FALLBACK_TEMPLATES.map((t, i) => ({
          ...t,
          id: -(i + 1),
          created_at: '',
          updated_at: '',
        })));
      }
    } catch {
      setTemplates(FALLBACK_TEMPLATES.map((t, i) => ({
        ...t,
        id: -(i + 1),
        created_at: '',
        updated_at: '',
      })));
    }
    setLoadingTemplates(false);
  }, []);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, loadTemplates]);

  const handleTemplateChange = (value: string) => {
    setSelectedTemplateId(value);
    if (value === 'custom') {
      setSubject(`Re: ${leadTitle} - TodoConstructor`);
      setMessage('');
      return;
    }
    const tmpl = templates.find(t => String(t.id) === value);
    if (tmpl) {
      setSubject(tmpl.subject);
      setMessage(tmpl.body);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Error', description: 'El asunto y mensaje son obligatorios', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const result = await sendLeadEmail({
        leadId,
        recipientEmail: clientEmail,
        subject: subject.trim(),
        message: message.trim(),
        clientName,
      });

      if (result.success) {
        toast({ title: 'Email enviado', description: result.message });
        setOpen(false);
        setSubject('');
        setMessage('');
        setSelectedTemplateId('');
        onEmailSent?.();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error al enviar email', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Template editor handlers
  const openNewTemplate = () => {
    setEditingTemplate(null);
    setEditorName('');
    setEditorSubject('');
    setEditorBody('');
    setEditorCategory('ventas');
    setShowEditor(true);
  };

  const openEditTemplate = (tmpl: CRMEmailTemplate) => {
    setEditingTemplate(tmpl);
    setEditorName(tmpl.name);
    setEditorSubject(tmpl.subject);
    setEditorBody(tmpl.body);
    setEditorCategory(tmpl.category);
    setShowEditor(true);
  };

  const handleSaveTemplate = async () => {
    if (!editorName.trim() || !editorSubject.trim() || !editorBody.trim()) {
      toast({ title: 'Error', description: 'Nombre, asunto y cuerpo son obligatorios', variant: 'destructive' });
      return;
    }
    setSavingTemplate(true);
    try {
      if (editingTemplate && editingTemplate.id > 0) {
        const result = await updateCRMEmailTemplate({
          id: editingTemplate.id,
          name: editorName.trim(),
          subject: editorSubject.trim(),
          body: editorBody.trim(),
          category: editorCategory,
        });
        if (!result.success) throw new Error(result.error);
        toast({ title: 'Plantilla actualizada' });
      } else {
        const result = await createCRMEmailTemplate({
          name: editorName.trim(),
          subject: editorSubject.trim(),
          body: editorBody.trim(),
          category: editorCategory,
        });
        if (!result.success) throw new Error(result.error);
        toast({ title: 'Plantilla creada' });
      }
      setShowEditor(false);
      await loadTemplates();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
    setSavingTemplate(false);
  };

  const handleDeleteTemplate = async (tmpl: CRMEmailTemplate) => {
    if (tmpl.id < 0) return; // Can't delete fallback templates
    try {
      const result = await deleteCRMEmailTemplate(tmpl.id);
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Plantilla eliminada' });
      await loadTemplates();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  // Build preview HTML (simplified version of what the server will generate)
  const previewHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#f3f4f6;padding:16px;border-radius:12px;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a3a2a 0%,#2c5530 100%);padding:20px 24px;border-radius:12px 12px 0 0;text-align:center;">
        <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:4px;">TodoConstructor</div>
        <div style="color:#c9a84c;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Materiales & Construcción</div>
      </div>
      <!-- Body -->
      <div style="background:#fff;padding:24px 28px;">
        <p style="font-size:15px;color:#2c5530;font-weight:600;margin:0 0 16px;">Estimado/a ${clientName},</p>
        <div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message || '<span style="color:#9ca3af;font-style:italic;">El contenido del mensaje aparecerá aquí...</span>'}</div>
        <!-- Firma -->
        <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
          <div style="border-left:3px solid #c9a84c;padding-left:12px;">
            <div style="font-size:13px;color:#374151;">Saludos cordiales,</div>
            <div style="font-size:14px;color:#2c5530;font-weight:700;margin-top:2px;">Equipo de Ventas</div>
            <div style="font-size:12px;color:#6b7280;">TodoConstructor</div>
          </div>
        </div>
      </div>
      <!-- Footer -->
      <div style="background:#1a3a2a;padding:16px 24px;border-radius:0 0 12px 12px;text-align:center;">
        <div style="color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Contáctanos</div>
        <div style="font-size:12px;color:#d1d5db;">ventas@todoconstructor.cl</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:8px;">todoconstructor.cl</div>
      </div>
    </div>
  `;

  // Group templates by category
  const groupedTemplates: Record<string, CRMEmailTemplate[]> = {};
  templates.forEach(t => {
    if (!groupedTemplates[t.category]) groupedTemplates[t.category] = [];
    groupedTemplates[t.category].push(t);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-2 w-full cursor-pointer bg-transparent border-0 p-0">
          <Mail className="h-6 w-6" />
          <span className="text-sm font-semibold">Email</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            Responder al Cliente
          </DialogTitle>
        </DialogHeader>

        {/* Template editor dialog */}
        {showEditor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </h3>
                <button onClick={() => setShowEditor(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Nombre</Label>
                  <Input value={editorName} onChange={e => setEditorName(e.target.value)} placeholder="Ej: Confirmación de disponibilidad" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Categoría</Label>
                  <Select value={editorCategory} onValueChange={setEditorCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ventas">Ventas</SelectItem>
                      <SelectItem value="seguimiento">Seguimiento</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Asunto del email</Label>
                  <Input value={editorSubject} onChange={e => setEditorSubject(e.target.value)} placeholder="Asunto..." />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Cuerpo del mensaje</Label>
                  <Textarea value={editorBody} onChange={e => setEditorBody(e.target.value)} rows={6} placeholder="Escriba el contenido de la plantilla..." className="resize-y" />
                  <p className="text-xs text-gray-400 mt-1">El saludo y firma se agregan automáticamente al enviar.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowEditor(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleSaveTemplate} disabled={savingTemplate} className="gap-1.5 bg-green-600 hover:bg-green-700">
                  {savingTemplate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
          {/* LEFT: Compose */}
          <div className="space-y-4">
            {/* Destinatario */}
            <div className="p-3 bg-gray-50 rounded-lg border">
              <Label className="text-xs text-gray-500 mb-1 block">Para</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm flex-shrink-0">
                  {clientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{clientName}</p>
                  <p className="text-xs text-gray-500">{clientEmail}</p>
                </div>
              </div>
            </div>

            {/* Plantilla selector + management */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-gray-500">Plantilla</Label>
                <Button variant="ghost" size="sm" onClick={openNewTemplate} className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 gap-1">
                  <Plus className="h-3 w-3" />
                  Nueva
                </Button>
              </div>
              <div className="flex gap-2">
                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={loadingTemplates ? 'Cargando...' : 'Seleccionar plantilla...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedTemplates).map(([cat, tmpls]) => (
                      <div key={cat}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {CATEGORY_LABELS[cat] || cat}
                        </div>
                        {tmpls.map(t => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-gray-400" />
                              {t.name}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Otro
                    </div>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        Respuesta personalizada
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {selectedTemplateId && selectedTemplateId !== 'custom' && (() => {
                  const tmpl = templates.find(t => String(t.id) === selectedTemplateId);
                  if (!tmpl || tmpl.id < 0) return null;
                  return (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-blue-600" onClick={() => openEditTemplate(tmpl)} title="Editar plantilla">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-600" onClick={() => handleDeleteTemplate(tmpl)} title="Eliminar plantilla">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Asunto */}
            <div>
              <Label className="text-xs text-gray-500">Asunto</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email"
                className="mt-1"
              />
            </div>

            {/* Mensaje */}
            <div>
              <Label className="text-xs text-gray-500">Mensaje</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escriba su mensaje..."
                rows={10}
                className="mt-1 resize-y font-[13px] leading-relaxed"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Se incluirá automáticamente saludo, firma y pie con datos de TodoConstructor.
              </p>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-gray-500">Vista previa del email</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-6 px-2 text-xs gap-1 text-gray-500 hover:text-gray-700 lg:hidden"
              >
                {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPreview ? 'Ocultar' : 'Ver'}
              </Button>
            </div>
            <div className={`${showPreview ? 'block' : 'hidden'} lg:block`}>
              <div
                className="border border-gray-200 rounded-xl overflow-hidden bg-[#f3f4f6] max-h-[500px] overflow-y-auto shadow-inner"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Enviando...' : 'Enviar Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
