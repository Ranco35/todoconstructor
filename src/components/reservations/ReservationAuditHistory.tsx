'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  getReservationAuditHistory, 
  AuditLogEntry, 
  ReservationAuditInfo 
} from '@/actions/reservations/get-audit-history';
import { 
  User, 
  Calendar, 
  Clock, 
  Activity, 
  UserCheck, 
  UserX, 
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface ReservationAuditHistoryProps {
  reservationId: number;
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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
  
  const fieldNames: Record<string, string> = {
    'guest_name': 'Nombre del huésped',
    'guest_email': 'Email del huésped',
    'guest_phone': 'Teléfono del huésped',
    'check_in': 'Fecha de llegada',
    'check_out': 'Fecha de salida',
    'room_id': 'Habitación',
    'status': 'Estado',
    'total_amount': 'Monto total',
    'paid_amount': 'Monto pagado',
    'payment_status': 'Estado de pago',
    'billing_name': 'Nombre facturación',
    'billing_rut': 'RUT facturación',
    'authorized_by': 'Autorizado por',
  };
  
  return fieldNames[fieldName] || fieldName;
};

const AuditLogEntry: React.FC<{ entry: AuditLogEntry }> = ({ entry }) => {
  return (
    <div className="flex items-start space-x-3 p-3 border-l-4 border-gray-200 bg-gray-50 rounded-r-md">
      <div className="flex-shrink-0 mt-1">
        {getActionIcon(entry.action_type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <Badge className={getActionColor(entry.action_type)}>
            {entry.action_type}
          </Badge>
          <span className="text-sm font-medium text-gray-900">
            {entry.user_name || 'Usuario desconocido'}
          </span>
          <span className="text-xs text-gray-500">
            {entry.user_email}
          </span>
        </div>
        
        <div className="text-sm text-gray-700 mb-1">
          {entry.action_type === 'CREATE' && (
            <span>{entry.new_value}</span>
          )}
          {entry.action_type === 'UPDATE' && entry.field_name && (
            <div>
              <span className="font-medium">{getFieldDisplayName(entry.field_name)}</span>
              {entry.old_value && entry.new_value && (
                <div className="mt-1 text-xs">
                  <span className="text-red-600">Anterior: {entry.old_value}</span>
                  <span className="mx-2">→</span>
                  <span className="text-green-600">Nuevo: {entry.new_value}</span>
                </div>
              )}
            </div>
          )}
          {entry.action_type === 'DELETE' && (
            <span className="text-red-600">{entry.old_value}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatDateTime(entry.created_at)}
          </span>
          {entry.change_reason && (
            <span className="flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {entry.change_reason}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ReservationAuditHistory({ reservationId }: ReservationAuditHistoryProps) {
  const [auditInfo, setAuditInfo] = useState<ReservationAuditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadAuditHistory();
  }, [reservationId]);

  const loadAuditHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReservationAuditHistory(reservationId);
      setAuditInfo(data);
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
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
            Error al cargar historial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={loadAuditHistory} className="mt-3">
            Intentar nuevamente
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
            <Activity className="w-5 h-5 mr-2" />
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No se encontró información de auditoría para esta reserva.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Historial de Cambios
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {isExpanded ? 'Ocultar' : 'Ver'} Historial
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Información de creación y última actualización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Reserva Creada
            </h3>
            <p className="text-sm text-green-700">
              <strong>Por:</strong> {auditInfo.creator_name || 'Usuario desconocido'}
            </p>
            <p className="text-sm text-green-600">
              {auditInfo.creator_email}
            </p>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDateTime(auditInfo.created_at)}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Última Modificación
            </h3>
            <p className="text-sm text-blue-700">
              <strong>Por:</strong> {auditInfo.updater_name || 'Usuario desconocido'}
            </p>
            <p className="text-sm text-blue-600">
              {auditInfo.updater_email}
            </p>
            <p className="text-xs text-blue-600 mt-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDateTime(auditInfo.updated_at)}
            </p>
          </div>
        </div>

        {/* Historial detallado */}
        {isExpanded && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Historial Detallado ({auditInfo.audit_log.length} cambios)
            </h3>
            
            {auditInfo.audit_log.length === 0 ? (
              <p className="text-gray-500">No hay cambios registrados para esta reserva.</p>
            ) : (
              <div className="space-y-3">
                {auditInfo.audit_log.map((entry) => (
                  <AuditLogEntry key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 