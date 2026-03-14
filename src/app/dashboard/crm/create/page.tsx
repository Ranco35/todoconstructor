import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateLeadForm } from '@/components/crm/create-lead-form';

export default async function CreateLeadPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al CRM
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Lead</h1>
          <p className="text-muted-foreground">
            Completa la información del nuevo lead para agregarlo al pipeline de ventas
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Lead</CardTitle>
          <CardDescription>
            Completa todos los campos requeridos para crear el nuevo lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateLeadForm />
        </CardContent>
      </Card>
    </div>
  );
}
