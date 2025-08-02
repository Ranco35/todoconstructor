'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, DollarSign, Calendar, Phone, User, ChevronDown, ChevronUp } from 'lucide-react';

interface ClientAssociation {
  id: number;
  senderEmail: string;
  subject: string;
  clientId: number;
  clientName: string;
  clientPhone?: string;
  isPaymentRelated: boolean;
  paymentAmount?: number;
  paymentMethod?: string;
  reservationId?: number;
  notes?: string;
  createdAt: string;
}

interface ClientEmailAssociationsProps {
  analysisId?: number;
  showRecent?: boolean;
  maxResults?: number;
}

export default function ClientEmailAssociations({ 
  analysisId, 
  showRecent = false, 
  maxResults = 10 
}: ClientEmailAssociationsProps) {
  const [associations, setAssociations] = useState<ClientAssociation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssociations();
  }, [analysisId, showRecent]);

  const loadAssociations = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/emails/client-associations';
      const params = new URLSearchParams();
      
      if (analysisId) params.append('analysisId', analysisId.toString());
      if (showRecent) params.append('recent', 'true');
      if (maxResults) params.append('limit', maxResults.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error cargando asociaciones');
      }

      const data = await response.json();
      setAssociations(data.associations || []);
    } catch (err) {
      console.error('Error cargando asociaciones:', err);
      setError('Error cargando información de clientes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
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

  const paymentAssociations = associations.filter(a => a.isPaymentRelated);
  const generalAssociations = associations.filter(a => !a.isPaymentRelated);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Identificados
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
            <Users className="h-5 w-5" />
            Error cargando clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={loadAssociations} className="mt-2" variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (associations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Identificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No se encontraron correos de clientes registrados en este análisis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen de estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Identificados
            <Badge variant="outline" className="ml-auto">
              {associations.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{associations.length}</div>
              <div className="text-sm text-gray-500">Correos de clientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{paymentAssociations.length}</div>
              <div className="text-sm text-gray-500">Pagos detectados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(associations.map(a => a.clientId)).size}
              </div>
              <div className="text-sm text-gray-500">Clientes únicos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(paymentAssociations.reduce((sum, a) => sum + (a.paymentAmount || 0), 0))}
              </div>
              <div className="text-sm text-gray-500">Total pagos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Correos de pagos (prioritarios) */}
      {paymentAssociations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Correos de Pagos - Alta Prioridad
              <Badge variant="destructive" className="ml-auto">
                {paymentAssociations.length} pagos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentAssociations.map((association) => (
                <div key={association.id} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-semibold">{association.clientName}</span>
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          PAGO
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="font-mono text-xs">{association.senderEmail}</span>
                        </div>
                        <div className="text-gray-600">{association.subject}</div>
                        {association.paymentAmount && (
                          <div className="flex items-center gap-2 text-green-700 font-semibold">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(association.paymentAmount)}
                            {association.paymentMethod && (
                              <span className="text-sm">({association.paymentMethod})</span>
                            )}
                          </div>
                        )}
                        {association.clientPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{association.clientPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {formatDate(association.createdAt)}
                    </div>
                  </div>
                  {association.notes && (
                    <div className="mt-2 p-2 bg-white rounded text-sm">
                      <strong>Notas:</strong> {association.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Otros correos de clientes */}
      {generalAssociations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Otros Correos de Clientes
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="ml-auto"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {expanded ? 'Ocultar' : 'Mostrar'} ({generalAssociations.length})
              </Button>
            </CardTitle>
          </CardHeader>
          {expanded && (
            <CardContent>
              <div className="space-y-3">
                {generalAssociations.map((association) => (
                  <div key={association.id} className="border rounded-lg p-3 bg-blue-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4" />
                          <span className="font-semibold">{association.clientName}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span className="font-mono text-xs">{association.senderEmail}</span>
                          </div>
                          <div className="text-gray-600">{association.subject}</div>
                          {association.clientPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{association.clientPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {formatDate(association.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
} 