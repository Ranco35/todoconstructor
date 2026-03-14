'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  User, 
  Calendar, 
  Edit, 
  Plus, 
  Trash2, 
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Clock
} from 'lucide-react';
// Función local para formatear cambios (no es server action)
const formatChangesForDisplay = (changes: { [key: string]: { old: any; new: any } }): string[] => {
  const formattedChanges: string[] = [];
  
  const fieldLabels: { [key: string]: string } = {
    title: 'Título',
    description: 'Descripción',
    source: 'Fuente',
    priority: 'Prioridad',
    estimated_value: 'Valor Estimado',
    probability: 'Probabilidad',
    stage_id: 'Etapa',
    assigned_to: 'Asignado a',
    notes: 'Notas',
    tags: 'Etiquetas'
  };
  
  for (const [field, change] of Object.entries(changes)) {
    const label = fieldLabels[field] || field;
    const oldValue = change.old === null || change.old === undefined ? 'Sin valor' : String(change.old);
    const newValue = change.new === null || change.new === undefined ? 'Sin valor' : String(change.new);
    
    formattedChanges.push(`${label}: "${oldValue}" → "${newValue}"`);
  }
  
  return formattedChanges;
};
import type { LeadAuditEntry } from '@/actions/crm/audit';

interface LeadAuditHistoryProps {
  leadId: number;
}

export default function LeadAuditHistory({ leadId }: LeadAuditHistoryProps) {
  const [auditHistory, setAuditHistory] = useState<LeadAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAuditHistory();
  }, [leadId]);

  const loadAuditHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/crm/leads/${leadId}/audit`);
      const result = await response.json();
      
      if (result.success) {
        setAuditHistory(result.data || []);
      } else {
        setError(result.error || 'Error al cargar el historial');
      }
    } catch (err) {
      setError('Error de conexión al cargar el historial');
      console.error('Error loading audit history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (entryId: number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'status_changed':
        return <ArrowUpDown className="h-4 w-4 text-purple-600" />;
      default:
        return <Edit className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    const configs = {
      created: { color: 'bg-green-100 text-green-800', label: 'Creado' },
      updated: { color: 'bg-blue-100 text-blue-800', label: 'Modificado' },
      deleted: { color: 'bg-red-100 text-red-800', label: 'Eliminado' },
      status_changed: { color: 'bg-purple-100 text-purple-800', label: 'Estado Cambiado' }
    };
    
    const config = configs[action as keyof typeof configs] || configs.updated;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Modificaciones
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Modificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadAuditHistory} variant="outline">
              Reintentar
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
          <History className="h-5 w-5" />
          Historial de Modificaciones
          <Badge variant="secondary" className="ml-2">
            {auditHistory.length} entradas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auditHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay modificaciones registradas</p>
            <p className="text-sm text-gray-500 mt-1">
              Las modificaciones futuras aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditHistory.map((entry) => {
              const isExpanded = expandedEntries.has(entry.id);
              const changes = entry.changes ? formatChangesForDisplay(entry.changes) : [];
              
              return (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getActionIcon(entry.action)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getActionBadge(entry.action)}
                          <span className="text-sm text-gray-500">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="font-medium">
                            {entry.user_name || entry.user_email || 'Usuario del sistema'}
                          </span>
                          {entry.user_email && entry.user_name && (
                            <span className="text-gray-400">({entry.user_email})</span>
                          )}
                        </div>
                        
                        {changes.length > 0 && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(entry.id)}
                              className="h-auto p-0 text-blue-600 hover:text-blue-800"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 mr-1" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-1" />
                              )}
                              {changes.length} cambio{changes.length !== 1 ? 's' : ''}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && changes.length > 0 && (
                    <div className="mt-4 pl-7">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Cambios realizados:</h4>
                        <ul className="space-y-1">
                          {changes.map((change, index) => (
                            <li key={index} className="text-sm text-blue-800">
                              • {change}
                            </li>
                          ))}
                        </ul>
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
  );
}
