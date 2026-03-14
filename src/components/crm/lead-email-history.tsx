'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Clock,
  ChevronDown,
  ChevronRight,
  Send,
  Eye,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { getLeadEmailHistory, type LeadEmailHistoryItem } from '@/actions/crm/emails';

interface LeadEmailHistoryProps {
  leadId: number;
  clientName?: string;
}

export function LeadEmailHistory({ leadId, clientName }: LeadEmailHistoryProps) {
  const [emails, setEmails] = useState<LeadEmailHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [previewEmail, setPreviewEmail] = useState<LeadEmailHistoryItem | null>(null);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLeadEmailHistory(leadId);
      if (result.success) {
        setEmails(result.data || []);
      } else {
        setError(result.error || 'Error al cargar historial');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [leadId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return formatDate(dateString);
  };

  // Build preview HTML for the email viewer dialog
  const buildPreviewHtml = (email: LeadEmailHistoryItem) => {
    const bodyHtml = email.emailBody
      .split('\n')
      .map(line => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 8px;">${line}</p>`)
      .join('');

    return `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#f3f4f6;padding:16px;border-radius:12px;">
        <div style="background:linear-gradient(135deg,#1a3a2a 0%,#2c5530 100%);padding:20px 24px;border-radius:12px 12px 0 0;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:4px;">TodoConstructor</div>
          <div style="color:#c9a84c;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Materiales & Construcción</div>
        </div>
        <div style="background:#fff;padding:24px 28px;">
          <p style="font-size:15px;color:#2c5530;font-weight:600;margin:0 0 16px;">Estimado/a ${clientName || ''},</p>
          <div style="font-size:13px;color:#374151;line-height:1.7;">${bodyHtml}</div>
          <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
            <div style="border-left:3px solid #c9a84c;padding-left:12px;">
              <div style="font-size:13px;color:#374151;">Saludos cordiales,</div>
              <div style="font-size:14px;color:#2c5530;font-weight:700;margin-top:2px;">Equipo de Ventas</div>
              <div style="font-size:12px;color:#6b7280;">TodoConstructor</div>
            </div>
          </div>
        </div>
        <div style="background:#1a3a2a;padding:16px 24px;border-radius:0 0 12px 12px;text-align:center;">
          <div style="color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Contáctanos</div>
          <div style="font-size:12px;color:#d1d5db;">ventas@todoconstructor.cl</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:8px;">todoconstructor.cl</div>
        </div>
      </div>
    `;
  };

  if (loading) {
    return (
      <Card className="border-2 border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Historial de Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Cargando emails...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Historial de Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadEmails} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Historial de Emails
              {emails.length > 0 && (
                <Badge className="bg-white/20 text-white border-white/30 ml-1">
                  {emails.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadEmails}
              className="h-7 px-2 text-white/80 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {emails.length === 0 ? (
            <div className="text-center py-6">
              <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No se han enviado emails desde este lead</p>
              <p className="text-xs text-gray-400 mt-1">
                Los emails enviados aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => {
                const isExpanded = expandedId === email.id;
                return (
                  <div
                    key={email.id}
                    className="bg-white rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Email header - clickable */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : email.id)}
                      className="w-full text-left p-3 flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Send className="h-4 w-4 text-indigo-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {email.emailSubject || email.subject?.replace('Email enviado: ', '')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Para: {email.recipientEmail}</span>
                          <span className="text-gray-300">|</span>
                          <Clock className="h-3 w-3" />
                          <span title={formatDate(email.created_at)}>
                            {formatRelativeDate(email.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-gray-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-indigo-100 px-3 pb-3">
                        {/* Email body preview */}
                        <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2">Contenido del mensaje:</p>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                            {email.emailBody || '(Sin contenido)'}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewEmail(email);
                            }}
                            className="h-7 text-xs gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver email completo
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email preview dialog */}
      <Dialog open={!!previewEmail} onOpenChange={() => setPreviewEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-100">
                <Mail className="h-5 w-5 text-indigo-600" />
              </div>
              Email Enviado
            </DialogTitle>
          </DialogHeader>
          {previewEmail && (
            <div className="space-y-4">
              {/* Email metadata */}
              <div className="bg-gray-50 rounded-lg p-3 border space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-500 w-16">Para:</span>
                  <span className="text-gray-900">{previewEmail.recipientEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-500 w-16">Asunto:</span>
                  <span className="text-gray-900">{previewEmail.emailSubject}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-500 w-16">Fecha:</span>
                  <span className="text-gray-900">{formatDate(previewEmail.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-500 w-16">Estado:</span>
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enviado
                  </Badge>
                </div>
              </div>

              {/* Email preview with branding */}
              <div
                className="border border-gray-200 rounded-xl overflow-hidden bg-[#f3f4f6] shadow-inner"
                dangerouslySetInnerHTML={{ __html: buildPreviewHtml(previewEmail) }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
