'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getPOSSaleAuditHistory,
  POSSaleAuditLogEntry,
  POSSaleAuditInfo,
} from '@/actions/pos/get-sale-audit-history';
import {
  Receipt,
  Calendar,
  Clock,
  Activity,
  RefreshCw,
  UserX,
  UserCheck,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface POSSaleAuditHistoryProps {
  saleId: number;
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'CREATE':
      return <UserCheck className="w-4 h-4 text-green-500" />;
    case 'UPDATE':
      return <RefreshCw className="w-4 h-4 text-blue-500" />;
    case 'DELETE':
      return <UserX className="w-4 h-4 text-red-500" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case 'CREATE':
      return 'bg-green-100 text-green-800';
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getFieldDisplayName = (fieldName: string | null) => {
  if (!fieldName) return '';
  const names: Record<string, string> = {
    status: 'Estado',
    totals: 'Totales / descuento',
  };
  return names[fieldName] || fieldName;
};

/** Muestra valor de auditoría: si parece JSON, intenta pretty-print; si no, texto plano. */
function formatAuditValue(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const trimmed = String(value).trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  return value;
}

const AuditLogEntryRow = ({ entry }: { entry: POSSaleAuditLogEntry }) => {
  const displayUser = entry.user_name ?? 'Sistema';
  const createLabel = !entry.field_name && (entry.action_type === 'CREATE' || entry.action_type === 'DELETE') ? 'Acción' : null;
  return (
    <div className="flex items-start space-x-3 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-md">
      <div className="flex-shrink-0 mt-1">{getActionIcon(entry.action_type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <Badge className={getActionColor(entry.action_type)}>{entry.action_type}</Badge>
          <span className="text-sm font-medium text-gray-900">{displayUser}</span>
          {entry.user_email && (
            <span className="text-xs text-gray-500">{entry.user_email}</span>
          )}
        </div>
        <div className="text-sm text-gray-700 mb-1">
          {entry.action_type === 'CREATE' && (
            <div>
              {createLabel && <span className="font-medium">{createLabel}: </span>}
              {entry.new_value != null && <span>{formatAuditValue(entry.new_value)}</span>}
            </div>
          )}
          {entry.action_type === 'UPDATE' && (
            <div>
              <span className="font-medium">{entry.field_name ? getFieldDisplayName(entry.field_name) : 'Cambio'}</span>
              {entry.old_value != null && entry.new_value != null && (
                <div className="mt-1 text-xs">
                  <span className="text-red-600">Anterior: {formatAuditValue(entry.old_value)}</span>
                  <span className="mx-2">→</span>
                  <span className="text-green-600">Nuevo: {formatAuditValue(entry.new_value)}</span>
                </div>
              )}
            </div>
          )}
          {entry.action_type === 'DELETE' && (
            <div>
              {createLabel && <span className="font-medium">{createLabel}: </span>}
              {entry.old_value != null && <span className="text-red-600">{formatAuditValue(entry.old_value)}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          {formatDateTime(entry.created_at)}
        </div>
      </div>
    </div>
  );
};

export default function POSSaleAuditHistory({ saleId }: POSSaleAuditHistoryProps) {
  const [auditInfo, setAuditInfo] = useState<POSSaleAuditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadAuditHistory();
  }, [saleId]);

  const loadAuditHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPOSSaleAuditHistory(saleId);
      setAuditInfo(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Auditoría de venta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            Error al cargar auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={loadAuditHistory} className="mt-3">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!auditInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Auditoría de venta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No hay información de auditoría para esta venta.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Auditoría de venta
          </span>
          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            <Eye className="w-4 h-4 mr-2" />
            {isExpanded ? 'Ocultar' : 'Ver'} historial
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Fecha de venta
            </h3>
            <p className="text-sm text-green-700">
              {formatDateTime(auditInfo.created_at)}
            </p>
            <p className="text-xs text-green-600 mt-1">Venta {auditInfo.sale_number}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Última actualización
            </h3>
            <p className="text-sm text-blue-700">
              {formatDateTime(auditInfo.updated_at)}
            </p>
          </div>
        </div>

        {isExpanded && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Historial ({auditInfo.audit_log.length} registros)
            </h3>
            {auditInfo.audit_log.length === 0 ? (
              <p className="text-gray-500">No hay cambios registrados.</p>
            ) : (
              <div className="space-y-3">
                {auditInfo.audit_log.map((entry) => (
                  <AuditLogEntryRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
