'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  Inbox, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import { 
  getBudgetEmailHistory, 
  getBudgetEmailStats, 
  resendBudgetEmail,
  type BudgetEmailHistoryItem 
} from '@/actions/sales/budgets/email';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BudgetEmailHistoryProps {
  budgetId: number;
  className?: string;
}

interface EmailStats {
  total_emails: number;
  sent_emails: number;
  successful_emails: number;
  failed_emails: number;
  last_email_sent?: string;
}

export default function BudgetEmailHistory({ budgetId, className }: BudgetEmailHistoryProps) {
  const [history, setHistory] = useState<BudgetEmailHistoryItem[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [historyResult, statsResult] = await Promise.all([
        getBudgetEmailHistory(budgetId),
        getBudgetEmailStats(budgetId)
      ]);

      if (historyResult.success) {
        setHistory(historyResult.data || []);
      } else {
        setError(historyResult.error || 'Error al cargar historial');
      }

      if (statsResult.success) {
        setStats(statsResult.data || null);
      }

    } catch (error) {
      console.error('Error cargando datos de email:', error);
      setError('Error inesperado al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [budgetId]);

  const handleResend = async (emailId: number) => {
    try {
      setResendingId(emailId);
      const result = await resendBudgetEmail(emailId);

      if (result.success) {
        // Recargar datos después del reenvío exitoso
        await loadData();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error reenviando email:', error);
      setError('Error inesperado al reenviar email');
    } finally {
      setResendingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        text: 'Pendiente',
        color: 'text-yellow-600'
      },
      sent: { 
        variant: 'default' as const, 
        icon: CheckCircle, 
        text: 'Enviado',
        color: 'text-green-600'
      },
      delivered: { 
        variant: 'default' as const, 
        icon: CheckCircle, 
        text: 'Entregado',
        color: 'text-green-600'
      },
      failed: { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        text: 'Fallido',
        color: 'text-red-600'
      },
      bounced: { 
        variant: 'destructive' as const, 
        icon: AlertTriangle, 
        text: 'Rebotado',
        color: 'text-red-600'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getEmailTypeIcon = (type: string) => {
    return type === 'sent' ? (
      <Send className="h-4 w-4 text-blue-600" />
    ) : (
      <Inbox className="h-4 w-4 text-green-600" />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Historial de Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando historial...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Historial de Emails
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total_emails}</p>
              <p className="text-sm text-gray-600">Total Emails</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.successful_emails}</p>
              <p className="text-sm text-gray-600">Exitosos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failed_emails}</p>
              <p className="text-sm text-gray-600">Fallidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.sent_emails}</p>
              <p className="text-sm text-gray-600">Enviados</p>
            </div>
          </div>
        )}

        {/* Mensajes de Error */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Lista de Emails */}
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Sin historial de emails</p>
            <p className="text-sm">No se han enviado emails para este presupuesto aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((email) => (
              <div 
                key={email.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Header del Email */}
                    <div className="flex items-center gap-2">
                      {getEmailTypeIcon(email.email_type)}
                      <span className="font-medium text-gray-900">
                        {email.email_type === 'sent' ? 'Enviado a:' : 'Recibido de:'} 
                        {email.recipient_email}
                      </span>
                      {getStatusBadge(email.status)}
                    </div>

                    {/* Asunto */}
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{email.subject}</span>
                    </div>

                    {/* Información Adicional */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {email.sent_at ? formatDate(email.sent_at) : formatDate(email.created_at)}
                      </div>
                      {email.sent_by_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {email.sent_by_name}
                        </div>
                      )}
                    </div>

                    {/* Error Message */}
                    {email.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-sm text-red-700">
                          <strong>Error:</strong> {email.error_message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 ml-4">
                    {email.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(email.id)}
                        disabled={resendingId === email.id}
                        className="flex items-center gap-1"
                      >
                        {resendingId === email.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            Reenviando
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3" />
                            Reenviar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Última actualización */}
        {stats?.last_email_sent && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Último email enviado: {formatDate(stats.last_email_sent)}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 