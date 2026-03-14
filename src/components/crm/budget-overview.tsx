'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, DollarSign, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';
import { getUnassignedBudgets } from '@/actions/crm/budgets';
import type { Budget } from '@/types/ventas/budget';

export function BudgetOverview() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const result = await getUnassignedBudgets();
      if (result.success) {
        setBudgets(result.data || []);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
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

  const getTotalValue = () => {
    return budgets.reduce((sum, budget) => sum + Number(budget.total), 0);
  };

  const getPendingCount = () => {
    return budgets.filter(budget => ['draft', 'sent'].includes(budget.status)).length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Presupuestos Sin Asociar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando presupuestos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Presupuestos Sin Asociar
            </CardTitle>
            <CardDescription>
              Presupuestos que no están vinculados a ningún lead del CRM
            </CardDescription>
          </div>
          <Link href="/dashboard/sales/budgets">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver Todos
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{budgets.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{getPendingCount()}</div>
            <div className="text-sm text-muted-foreground">Pendientes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              ${getTotalValue().toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Valor Total</div>
          </div>
        </div>

        {/* Lista de presupuestos */}
        {budgets.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin presupuestos sin asociar</h3>
            <p className="text-muted-foreground mb-4">
              Todos los presupuestos están correctamente asociados a leads.
            </p>
            <Link href="/dashboard/sales/budgets/create">
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Crear Presupuesto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.slice(0, 5).map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{budget.number}</p>
                    {getStatusBadge(budget.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {budget.client?.nombrePrincipal} {budget.client?.apellido} • 
                    {new Date(budget.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-sm">${budget.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{budget.currency}</p>
                  </div>
                  <Link href={`/dashboard/sales/budgets/${budget.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {budgets.length > 5 && (
              <div className="text-center pt-2">
                <Link href="/dashboard/sales/budgets">
                  <Button variant="outline" size="sm">
                    Ver {budgets.length - 5} más...
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
