import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EditLeadForm } from '@/components/crm/edit-lead-form';
import { getCRMLeadById } from '@/actions/crm/leads';
import { getCRMStages } from '@/actions/crm/stages';
import { notFound } from 'next/navigation';

interface EditLeadPageProps {
  params: {
    id: string;
  };
}

export default async function EditLeadPage({ params }: EditLeadPageProps) {
  const resolvedParams = await params;
  const leadId = parseInt(resolvedParams.id);
  
  if (isNaN(leadId)) {
    notFound();
  }

  // Cargar datos del lead y etapas
  const [leadResult, stagesResult] = await Promise.all([
    getCRMLeadById(leadId),
    getCRMStages()
  ]);

  if (!leadResult.success || !leadResult.data) {
    notFound();
  }

  const lead = leadResult.data;
  const stages = stagesResult.success ? stagesResult.data : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/crm/${leadId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Lead
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Lead</h1>
          <p className="text-muted-foreground">
            Modifica la información del lead: {lead.title}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Lead</CardTitle>
          <CardDescription>
            Actualiza los campos que necesites modificar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditLeadForm lead={lead} stages={stages} />
        </CardContent>
      </Card>
    </div>
  );
}
