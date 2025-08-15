'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Users,
  Calendar,
  Eye,
  ExternalLink,
  Phone,
  MessageSquare
} from 'lucide-react';

interface SentEmailsSummaryProps {
  showRecent?: boolean;
  maxResults?: number;
}

interface SentEmail {
  id: number;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  emailType: string;
  status: string;
  sentAt: string;
  clientName: string;
}

interface EmailStats {
  totalSent: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
}

export default function SentEmailsSummary({ 
  showRecent = true, 
  maxResults = 15 
}: SentEmailsSummaryProps) {
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [maxResults]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar correos enviados recientes y estadísticas en paralelo
      const [emailsResponse, statsResponse] = await Promise.all([
        fetch('/api/emails/sent-emails'),
        fetch('/api/emails/sent-emails-stats')
      ]);

      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        setSentEmails(emailsData.emails || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

    } catch (err) {
      // Manejo silencioso de errores para evitar console errors
      setError('Error cargando información de correos enviados');
    } finally {
      setLoading(false);
    }
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case 'confirmation': return '✅';
      case 'reminder': return '⏰';
      case 'payment_request': return '💰';
      case 'follow_up': return '📞';
      case 'marketing': return '📢';
      default: return '📧';
    }
  };

  const getEmailTypeName = (type: string) => {
    switch (type) {
      case 'confirmation': return 'Confirmación';
      case 'reminder': return 'Recordatorio';
      case 'payment_request': return 'Solicitud de Pago';
      case 'follow_up': return 'Seguimiento';
      case 'marketing': return 'Marketing';
      default: return 'Personalizado';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Enviado</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="text-green-600 border-green-300">Entregado</Badge>;
      case 'opened':
        return <Badge variant="outline" className="text-purple-600 border-purple-300">Leído</Badge>;
      case 'clicked':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">Clicked</Badge>;
      case 'bounced':
        return <Badge variant="destructive">Rebotado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Correos Enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error cargando correos enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={loadData} className="mt-2" variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas de correos enviados */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estadísticas de Correos Enviados
              <Badge variant="outline" className="ml-auto">
                Últimos 30 días
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalSent}</div>
                <div className="text-sm text-gray-500">Total Enviados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.byStatus?.delivered || 0}
                </div>
                <div className="text-sm text-gray-500">Entregados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.byStatus?.opened || 0}
                </div>
                <div className="text-sm text-gray-500">Leídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.byType?.confirmation || 0}
                </div>
                <div className="text-sm text-gray-500">Confirmaciones</div>
              </div>
            </div>

            {/* Breakdown por tipo de correo */}
            {stats.byType && Object.keys(stats.byType).length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Por Tipo de Correo:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm flex items-center gap-1">
                        <span>{getEmailTypeIcon(type)}</span>
                        {getEmailTypeName(type)}
                      </span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de correos enviados recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Correos Enviados Recientes
            <Badge variant="outline" className="ml-auto">
              {sentEmails.length} correos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sentEmails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay correos enviados registrados</p>
              <p className="text-sm text-gray-400 mt-1">
                Los correos enviados aparecerán aquí cuando se registren automáticamente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentEmails.slice(0, maxResults).map((email) => (
                <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getEmailTypeIcon(email.emailType)}</span>
                        <span className="font-semibold text-gray-900">
                          {email.clientName}
                        </span>
                        {getStatusBadge(email.status)}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="font-mono text-xs">{email.recipientEmail}</span>
                        </div>
                        
                        <div className="text-gray-700 font-medium">
                          {email.subject}
                        </div>
                        
                        <div className="flex items-center gap-4 text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(email.sentAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{getEmailTypeIcon(email.emailType)}</span>
                            <span>{getEmailTypeName(email.emailType)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón para registrar nuevo correo enviado */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 mb-2">
              ¿Enviaste un correo a un cliente?
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              Registra los correos enviados para mantener un historial completo de comunicaciones
            </p>
            <div className="flex justify-center gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Registrar Correo Enviado
              </Button>
              <Button variant="outline" className="border-blue-300 text-blue-700">
                <Users className="h-4 w-4 mr-2" />
                Ver Resumen por Cliente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 