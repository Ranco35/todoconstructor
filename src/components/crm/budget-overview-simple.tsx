'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye } from 'lucide-react';
import Link from 'next/link';

export function BudgetOverviewSimple() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Presupuestos
            </CardTitle>
            <CardDescription>
              Gestiona presupuestos y asócialos con leads del CRM
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
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Gestión de Presupuestos</h3>
          <p className="text-muted-foreground mb-4">
            Los presupuestos se pueden asociar a leads desde la página de detalle de cada lead.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/dashboard/sales/budgets">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Ver Presupuestos
              </Button>
            </Link>
            <Link href="/dashboard/sales/budgets/create">
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Crear Presupuesto
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
