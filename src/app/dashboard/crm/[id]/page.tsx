'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, DollarSign, User, Target, FileText, Phone, Mail, MapPin, Plus, CheckCircle2, Clock, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { getCRMLeadById, deleteCRMLead, getCRMUsers, reassignLead } from '@/actions/crm/leads';
import { getCRMStages } from '@/actions/crm/stages';
import { getLeadActivities, completeActivity } from '@/actions/crm/activities';
import { isAdminUser } from '@/actions/configuration/auth-actions';
import { BudgetManagement } from '@/components/crm/budget-management';
import LeadAuditHistory from '@/components/crm/lead-audit-history';
import { ClientBudgetsNotification } from '@/components/crm/client-budgets-notification';
import { LeadNotes } from '@/components/crm/lead-notes';
import { QuickEmailReply } from '@/components/crm/quick-email-reply';
import LeadClientPurchases from '@/components/crm/lead-client-purchases';
import { LeadEmailHistory } from '@/components/crm/lead-email-history';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface LeadDetailPageProps {
  params: {
    id: string;
  };
}

export default function LeadDetailPage({ params }: LeadDetailPageProps) {
  const [lead, setLead] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailRefreshKey, setEmailRefreshKey] = useState(0);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showReassign, setShowReassign] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        // En Client Components, params es un objeto Promise
  const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
  
        if (isNaN(id)) {
    notFound();
          return;
        }

        setLeadId(id);

        // Cargar datos del lead, etapas, actividades y verificar permisos
        const [leadResult, stagesResult, activitiesResult, adminResult, usersResult] = await Promise.all([
          getCRMLeadById(id),
          getCRMStages(),
          getLeadActivities(id),
          isAdminUser(),
          getCRMUsers()
        ]);

        if (!leadResult.success || !leadResult.data) {
          notFound();
          return;
        }

        setLead(leadResult.data);
        setStages(stagesResult.success ? stagesResult.data : []);
        setActivities(activitiesResult.success ? activitiesResult.data || [] : []);
        setIsAdmin(adminResult);
        setUsers(usersResult.success ? usersResult.data || [] : []);
      } catch (error) {
        console.error('Error loading lead data:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando lead...</div>
        </div>
      </div>
    );
  }

  if (!lead) {
    notFound();
  }

  const currentStage = stages.find(stage => stage.id === lead.stage_id);

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Baja' },
      medium: { color: 'bg-blue-100 text-blue-800', label: 'Media' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      web: { color: 'bg-green-100 text-green-800', label: 'Web' },
      whatsapp: { color: 'bg-green-100 text-green-800', label: 'WhatsApp' },
      telefono: { color: 'bg-blue-100 text-blue-800', label: 'Teléfono' },
      referido: { color: 'bg-purple-100 text-purple-800', label: 'Referido' },
      manual: { color: 'bg-gray-100 text-gray-800', label: 'Manual' }
    };

    const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.manual;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleDeleteLead = async () => {
    if (!leadId) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteCRMLead(leadId);
      if (result.success) {
        toast({
          title: 'Lead Eliminado',
          description: 'El lead ha sido eliminado correctamente.',
        });
        router.push('/dashboard/crm');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo eliminar el lead.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: 'Error inesperado al eliminar el lead.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{lead.title}</h1>
            {getPriorityBadge(lead.priority)}
            {getSourceBadge(lead.source)}
          </div>
              <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            Lead creado el {new Date(lead.created_at).toLocaleDateString('es-ES')}
          </p>
                {/* Cliente destacado en header */}
                {lead.client && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 rounded-full border border-blue-200">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">
                      Cliente: {lead.client.nombrePrincipal} {lead.client.apellido}
                    </span>
                    <Badge variant="secondary" className="text-xs bg-blue-200 text-blue-800">
                      ID: {lead.client_id}
                    </Badge>
                  </div>
                )}
              </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/crm/edit/${leadId}`}>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Editar
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => {
            // Scroll hacia la sección de notas
            const notesSection = document.getElementById('notes-section');
            if (notesSection) {
              notesSection.scrollIntoView({ behavior: 'smooth' });
              // Enfocar el botón de agregar nota después de un pequeño delay
              setTimeout(() => {
                const addNoteButton = document.querySelector('[data-add-note-button]') as HTMLButtonElement;
                if (addNoteButton) {
                  addNoteButton.click();
                }
              }, 500);
            }
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Nota
          </Button>
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? 'Eliminando...' : <><Trash2 className="h-4 w-4 mr-2" /> Eliminar Lead</>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el lead y todos sus datos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteLead} className="bg-red-600 hover:bg-red-700">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Acciones Rápidas - Barra superior destacada */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* WhatsApp */}
        {lead.client?.telefonoMovil || lead.client?.telefono ? (
          <a
            href={`https://api.whatsapp.com/send?phone=${(lead.client.telefonoMovil || lead.client.telefono).replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all cursor-pointer"
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-sm font-semibold">WhatsApp</span>
          </a>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed">
            <MessageSquare className="h-6 w-6" />
            <span className="text-sm font-semibold">WhatsApp</span>
            <span className="text-[10px]">Sin teléfono</span>
          </div>
        )}

        {/* Llamar */}
        {lead.client?.telefonoMovil || lead.client?.telefono ? (
          <a
            href={`tel:${lead.client.telefonoMovil || lead.client.telefono}`}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer"
          >
            <Phone className="h-6 w-6" />
            <span className="text-sm font-semibold">Llamar</span>
          </a>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed">
            <Phone className="h-6 w-6" />
            <span className="text-sm font-semibold">Llamar</span>
            <span className="text-[10px]">Sin teléfono</span>
          </div>
        )}

        {/* Email */}
        {lead.client?.email ? (
          <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all">
            <QuickEmailReply
              leadId={lead.id}
              clientEmail={lead.client.email}
              clientName={`${lead.client.nombrePrincipal || ''} ${lead.client.apellido || ''}`.trim()}
              leadTitle={lead.title}
              onEmailSent={async () => {
                const [activitiesResult, leadResult] = await Promise.all([
                  getLeadActivities(lead.id),
                  getCRMLeadById(lead.id),
                ]);
                if (activitiesResult.success) setActivities(activitiesResult.data || []);
                if (leadResult.success && leadResult.data) setLead(leadResult.data);
                setEmailRefreshKey(prev => prev + 1);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed">
            <Mail className="h-6 w-6" />
            <span className="text-sm font-semibold">Email</span>
            <span className="text-[10px]">Sin email</span>
          </div>
        )}

        {/* Presupuesto */}
        <Link href={`/dashboard/sales/budgets/create?lead_id=${lead.id}${lead.client_id ? `&client_id=${lead.client_id}` : ''}${(() => {
          if (!lead.description) return '';
          const checkInMatch = lead.description.match(/Check-in:\s*(\d{2})\/(\d{2})\/(\d{4})/);
          const checkOutMatch = lead.description.match(/Check-out:\s*(\d{2})\/(\d{2})\/(\d{4})/);
          let params = '';
          if (checkInMatch) params += `&check_in=${checkInMatch[3]}-${checkInMatch[2]}-${checkInMatch[1]}`;
          if (checkOutMatch) params += `&check_out=${checkOutMatch[3]}-${checkOutMatch[2]}-${checkOutMatch[1]}`;
          return params;
        })()}`}
          className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
        >
          <DollarSign className="h-6 w-6" />
          <span className="text-sm font-semibold">Presupuesto</span>
        </Link>

      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Lead */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Información del Lead
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Etapa Actual</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: currentStage?.color }}
                    ></div>
                    <span className="font-medium">{currentStage?.description || 'Sin etapa'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Valor Estimado</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${lead.estimated_value?.toLocaleString() || '0'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Probabilidad</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{lead.probability}%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha de Cierre Esperada</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </span>
                  </div>
                </div>
              </div>

              {lead.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                  <p className="mt-1 text-sm">{lead.description}</p>
                </div>
              )}

              {lead.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notas</Label>
                  <p className="mt-1 text-sm">{lead.notes}</p>
                </div>
              )}

              {lead.tags && lead.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Etiquetas</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {lead.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas del Lead - DESTACADAS */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                📝 Notas del Lead
              </CardTitle>
              <CardDescription className="text-blue-100 text-sm">
                Información adicional y seguimiento del lead
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div id="notes-section">
                <LeadNotes leadId={lead.id} leadTitle={lead.title} />
              </div>
            </CardContent>
          </Card>

          {/* Historial de Emails */}
          <LeadEmailHistory
            key={emailRefreshKey}
            leadId={lead.id}
            clientName={lead.client ? `${lead.client.nombrePrincipal || ''} ${lead.client.apellido || ''}`.trim() : undefined}
          />

          {/* Gestión de Presupuestos */}
          <BudgetManagement
            leadId={lead.id}
            leadTitle={lead.title}
            clientId={lead.client_id}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información del Cliente - DESTACADA */}
          {lead.client_id && lead.client ? (
            <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-6 w-6" />
                  👤 Cliente Asociado al Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Nombre completo SÚPER DESTACADO */}
                  <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <Label className="text-sm font-medium text-blue-600 uppercase tracking-wide">Nombre Completo del Cliente</Label>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 leading-tight">
                      {lead.client.nombrePrincipal} {lead.client.apellido}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        ID: {lead.client_id}
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        ✅ Asociado
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Información adicional */}
                  <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ID Cliente</Label>
                    <p className="font-medium">#{lead.client_id}</p>
                    </div>
                    
                    {lead.client.rut && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">RUT</Label>
                        <p className="font-medium">{lead.client.rut}</p>
                      </div>
                    )}
                    
                    {lead.client.email && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="font-medium text-blue-600">{lead.client.email}</p>
                      </div>
                    )}
                    
                    {(lead.client.telefono || lead.client.telefonoMovil) && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                        <p className="font-medium">
                          {lead.client.telefonoMovil || lead.client.telefono}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100">
                      <User className="h-4 w-4 mr-2" />
                      Ver Cliente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Cliente NO asociado - ALERTA VISUAL */}
              <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-6 w-6" />
                  ⚠️ Cliente NO Asociado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <Label className="text-sm font-medium text-red-600 uppercase tracking-wide">Estado del Cliente</Label>
                  </div>
                  <p className="text-lg font-bold text-red-900 mb-3">
                    Este lead no tiene cliente asociado
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Sin Cliente
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      ❌ No Asociado
                    </Badge>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Recomendación:</strong> Asocia un cliente a este lead para poder gestionar presupuestos y seguimiento.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/dashboard/crm/edit/${lead.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                        <User className="h-4 w-4 mr-2" />
                        Asociar Cliente
                      </Button>
                    </Link>
                    <Link href={`/dashboard/crm/edit/${leadId}`}>
                      <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
                        <FileText className="h-4 w-4 mr-2" />
                        Editar Lead
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
            </>
          )}

          {/* Información de Asignación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Asignación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Asignado a</Label>
                  <p className="font-medium">
                    {lead.assigned_user?.name || 'Sin asignar'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Creado por</Label>
                  <p className="font-medium">
                    {lead.created_user?.name || 'Sistema'}
                  </p>
                </div>

                {showReassign ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Seleccionar usuario</Label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      defaultValue={lead.assigned_to || ''}
                      onChange={async (e) => {
                        const userId = e.target.value;
                        if (!userId || !leadId) return;
                        setReassigning(true);
                        try {
                          const result = await reassignLead(leadId, userId);
                          if (result.success) {
                            const user = users.find(u => u.id === userId);
                            setLead((prev: any) => ({
                              ...prev,
                              assigned_to: userId,
                              assigned_user: user ? { id: user.id, name: user.name, email: user.email } : prev.assigned_user
                            }));
                            toast({ title: 'Lead reasignado', description: `Asignado a ${user?.name || 'usuario'}` });
                            setShowReassign(false);
                          } else {
                            toast({ title: 'Error', description: result.error || 'Error al reasignar', variant: 'destructive' });
                          }
                        } catch {
                          toast({ title: 'Error', description: 'Error al reasignar', variant: 'destructive' });
                        } finally {
                          setReassigning(false);
                        }
                      }}
                      disabled={reassigning}
                    >
                      <option value="">Seleccionar...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => setShowReassign(false)} className="w-full text-xs">
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setShowReassign(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Reasignar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notificación de Presupuestos del Cliente */}
          {lead.client_id && lead.client && (
            <ClientBudgetsNotification 
              leadId={lead.id}
              clientId={lead.client_id}
              clientName={`${lead.client.nombrePrincipal} ${lead.client.apellido}`}
              onBudgetAssociated={() => {
                // Recargar la página para mostrar el nuevo presupuesto asociado
                window.location.reload();
              }}
            />
          )}

          {/* Compras del Cliente */}
          {lead.client_id && (
            <LeadClientPurchases
              clientId={lead.client_id}
              leadCreatedAt={lead.created_at}
            />
          )}

          {/* Historial de Modificaciones */}
          <LeadAuditHistory leadId={lead.id} />

          {/* Actividades / Tareas */}
          <Card className={activities.filter(a => a.status === 'pending').length > 0 ? 'border-2 border-amber-300' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Actividades
                {activities.filter(a => a.status === 'pending').length > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    {activities.filter(a => a.status === 'pending').length} pendiente{activities.filter(a => a.status === 'pending').length > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity: any) => {
                    const isPending = activity.status === 'pending';
                    const isOverdue = isPending && activity.due_date && new Date(activity.due_date) < new Date();
                    return (
                      <div
                        key={activity.id}
                        className={`p-3 rounded-lg border text-sm ${
                          isOverdue
                            ? 'bg-red-50 border-red-200'
                            : isPending
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${!isPending ? 'line-through text-gray-400' : ''}`}>
                              {activity.subject}
                            </p>
                            {activity.due_date && (
                              <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                {isOverdue ? 'Vencida: ' : 'Vence: '}
                                {new Date(activity.due_date).toLocaleDateString('es-CL')}
                              </p>
                            )}
                          </div>
                          {isPending && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-green-600 hover:bg-green-100"
                              onClick={async () => {
                                const result = await completeActivity(activity.id);
                                if (result.success) {
                                  setActivities(prev =>
                                    prev.map(a =>
                                      a.id === activity.id
                                        ? { ...a, status: 'completed', completed_at: new Date().toISOString() }
                                        : a
                                    )
                                  );
                                  toast({ title: 'Actividad completada' });
                                }
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin actividades registradas</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
