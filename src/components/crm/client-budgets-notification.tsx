'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  FileText, 
  Link, 
  Eye, 
  Calendar,
  DollarSign,
  User,
  X,
  CheckCircle
} from 'lucide-react';
import { getClientUnassignedBudgets, associateBudgetToLead } from '@/actions/crm/budgets';
import type { Budget } from '@/types/ventas/budget';
import { useToast } from '@/hooks/use-toast';

interface ClientBudgetsNotificationProps {
  leadId: number;
  clientId: number;
  clientName: string;
  onBudgetAssociated?: () => void;
}

export function ClientBudgetsNotification({ 
  leadId, 
  clientId, 
  clientName, 
  onBudgetAssociated 
}: ClientBudgetsNotificationProps) {
  const [clientBudgets, setClientBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [associating, setAssociating] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadClientBudgets();
  }, [clientId]);

  const loadClientBudgets = async () => {
    try {
      setLoading(true);
      const result = await getClientUnassignedBudgets(clientId);
      
      if (result.success) {
        setClientBudgets(result.data || []);
      }
    } catch (error) {
      console.error('Error loading client budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateBudget = async (budgetId: number) => {
    try {
      setAssociating(budgetId);
      const result = await associateBudgetToLead(leadId, budgetId, `Asociado automáticamente desde notificación de presupuestos del cliente ${clientName}`, false);
      
      if (result.success) {
        toast({
          title: 'Presupuesto Asociado',
          description: 'El presupuesto se ha asociado correctamente al lead.',
        });
        
        // Remover el presupuesto de la lista
        setClientBudgets(prev => prev.filter(budget => budget.id !== budgetId));
        onBudgetAssociated?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo asociar el presupuesto.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error associating budget:', error);
      toast({
        title: 'Error',
        description: 'Error inesperado al asociar presupuesto.',
        variant: 'destructive',
      });
    } finally {
      setAssociating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Borrador' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Enviado' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Aceptado' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rechazado' },
      expired: { color: 'bg-yellow-100 text-yellow-800', label: 'Expirado' },
      converted: { color: 'bg-purple-100 text-purple-800', label: 'Convertido' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // No mostrar si está cargando, no hay presupuestos, o fue descartado
  if (loading || clientBudgets.length === 0 || dismissed) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800 text-lg">
              Presupuestos del Cliente Disponibles
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-amber-700 text-sm">
          Se encontraron <strong>{clientBudgets.length}</strong> presupuesto{clientBudgets.length !== 1 ? 's' : ''} 
          de <strong>{clientName}</strong> que no están asociados a ningún lead.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clientBudgets.slice(0, 3).map((budget) => (
            <div
              key={budget.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-gray-900">{budget.number}</span>
                  {getStatusBadge(budget.status)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium text-green-600">
                      ${budget.total.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(budget.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {budget.summary && (
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                    {budget.summary}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/dashboard/sales/budgets/${budget.id}`, '_blank')}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => handleAssociateBudget(budget.id)}
                  disabled={associating === budget.id}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {associating === budget.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-1" />
                      Asociar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
          
          {clientBudgets.length > 3 && (
            <div className="text-center pt-2">
              <p className="text-sm text-amber-600">
                +{clientBudgets.length - 3} presupuesto{clientBudgets.length - 3 !== 1 ? 's' : ''} más disponibles
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">¿Por qué aparecen estos presupuestos?</p>
              <p className="text-xs mt-1">
                Estos presupuestos pertenecen al mismo cliente pero no están asociados a ningún lead. 
                Puedes asociarlos a este lead para tener un historial completo de la relación comercial.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
