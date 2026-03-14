'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
  Filter,
  Plus,
  Eye,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Globe,
  Phone as PhoneIcon,
  MessageSquare,
  AlertCircle,
  Clock
} from 'lucide-react';
import { getCRMLeads, updateCRMLead } from '@/actions/crm/leads';
import { getCRMStages } from '@/actions/crm/stages';
import { NuevoLeadButton } from '@/components/crm/nuevo-lead-button';
import { PipelineInstructions } from '@/components/crm/pipeline-instructions';
import { LossReasonDialog } from '@/components/crm/loss-reason-dialog';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { LossReasonCategory } from '@/types/crm';

type SourceFilter = 'all' | 'web' | 'whatsapp' | 'telefono' | 'referido' | 'manual' | 'email';

// Componente principal del dashboard CRM
export default function CRMPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [tablesExist, setTablesExist] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [lossDialogOpen, setLossDialogOpen] = useState(false);
  const [pendingLossLead, setPendingLossLead] = useState<{ id: number; title: string; previousLeads: any[] } | null>(null);
  const router = useRouter();

  // Cargar datos reales del CRM
  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsResult, stagesResult] = await Promise.all([
          getCRMLeads(),
          getCRMStages()
        ]);

        const leadsData = leadsResult.success ? leadsResult.data : [];
        const stagesData = stagesResult.success ? stagesResult.data : [];

        setLeads(leadsData);
        setStages(stagesData);
        setTablesExist(leadsResult.success && stagesResult.success);
      } catch (error) {
        console.error('Error loading CRM data:', error);
        setLeads([]);
        setStages([]);
        setTablesExist(false);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para alternar expansión de una etapa
  const toggleStageExpansion = (stageId: number) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  // Drag & Drop: mover lead entre etapas
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const leadId = parseInt(draggableId);
    const newStageId = parseInt(destination.droppableId);

    // Guardar estado anterior para rollback
    const previousLeads = [...leads];

    // Optimistic update
    setLeads(prev =>
      prev.map(l => l.id === leadId ? { ...l, stage_id: newStageId } : l)
    );

    // Expandir etapa destino si estaba colapsada
    setExpandedStages(prev => ({ ...prev, [newStageId]: true }));

    // If moving to "Perdido" (stage 8), show loss reason dialog
    if (newStageId === 8) {
      const lead = leads.find(l => l.id === leadId);
      setPendingLossLead({ id: leadId, title: lead?.title || '', previousLeads });
      setLossDialogOpen(true);
      return;
    }

    // Persistir en BD
    const updateResult = await updateCRMLead({ id: leadId, stage_id: newStageId });
    if (!updateResult.success) {
      setLeads(previousLeads);
      console.error('Error moviendo lead:', updateResult.error);
    }
  };

  const handleLossReasonConfirm = async (category: LossReasonCategory, reason: string) => {
    if (!pendingLossLead) return;
    setLossDialogOpen(false);

    const updateResult = await updateCRMLead({
      id: pendingLossLead.id,
      stage_id: 8,
      loss_reason_category: category,
      loss_reason: reason || undefined,
    });

    if (!updateResult.success) {
      setLeads(pendingLossLead.previousLeads);
      console.error('Error moviendo lead a Perdido:', updateResult.error);
    }
    setPendingLossLead(null);
  };

  const handleLossReasonCancel = () => {
    setLossDialogOpen(false);
    if (pendingLossLead) {
      setLeads(pendingLossLead.previousLeads);
      setPendingLossLead(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del CRM...</p>
        </div>
      </div>
    );
  }

  // Leads filtrados por fuente
  const filteredLeads = sourceFilter === 'all'
    ? leads
    : leads.filter(l => l.source === sourceFilter);

  // Leads web nuevos (stage 1 = nuevo_contacto) - para alerta del recepcionista
  const newWebLeads = leads.filter(l => l.source === 'web' && l.stage_id === 1);

  // Calcular estadísticas desde los datos filtrados
  const stats = {
    total_leads: filteredLeads.length,
    pipeline_value: filteredLeads.reduce((sum: number, lead: any) => sum + (lead.estimated_value || 0), 0),
    conversion_rate: filteredLeads.length > 0 ? Math.round((filteredLeads.filter((l: any) => l.stage_id === 7).length / filteredLeads.length) * 100) : 0,
    won_leads: filteredLeads.filter((l: any) => l.stage_id === 7).length,
    lost_leads: filteredLeads.filter((l: any) => l.stage_id === 8).length
  };

  // Contadores por fuente (para chips de filtro)
  const sourceCounts: Record<string, number> = {};
  leads.forEach((l: any) => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  });

  // Agrupar leads filtrados por etapa
  const leadsByStage = stages.map(stage => ({
    ...stage,
    leads: filteredLeads.filter((lead: any) => lead.stage_id === stage.id),
    count: filteredLeads.filter((lead: any) => lead.stage_id === stage.id).length,
    totalValue: filteredLeads.filter((lead: any) => lead.stage_id === stage.id).reduce((sum: number, lead: any) => sum + (lead.estimated_value || 0), 0)
  }));

  // Leads recientes (últimos 5)
  const recentLeads = filteredLeads.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Banner informativo si las tablas no existen */}
      {!tablesExist && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="text-amber-600 text-xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-amber-800">Base de datos CRM no configurada</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Para usar el módulo CRM, necesitas ejecutar el SQL de creación de tablas en Supabase.
                  <br />
                  <strong>Archivo:</strong> docs/modules/crm/sql-crear-tablas-crm-completo.sql
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de leads web nuevos sin gestionar */}
      {newWebLeads.length > 0 && (
        <Card className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded-full animate-pulse">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900">
                    {newWebLeads.length} solicitud{newWebLeads.length > 1 ? 'es' : ''} web sin gestionar
                  </h3>
                  <p className="text-sm text-orange-700">
                    {newWebLeads.map((l: any) => l.title.replace('Cotización Web - ', '')).slice(0, 3).join(', ')}
                    {newWebLeads.length > 3 ? ` y ${newWebLeads.length - 3} más...` : ''}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => setSourceFilter('web')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver leads web
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM - Gestión de Leads</h1>
          <p className="text-muted-foreground">
            Gestiona tu pipeline de ventas y convierte leads en pedidos
          </p>
        </div>
        <div className="flex gap-2">
          <NuevoLeadButton />
        </div>
      </div>

      {/* Filtros por fuente */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={sourceFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSourceFilter('all')}
        >
          Todos ({leads.length})
        </Button>
        {(sourceCounts['web'] || 0) > 0 && (
          <Button
            variant={sourceFilter === 'web' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceFilter('web')}
            className={sourceFilter === 'web' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'}
          >
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Web ({sourceCounts['web']})
          </Button>
        )}
        {(sourceCounts['whatsapp'] || 0) > 0 && (
          <Button
            variant={sourceFilter === 'whatsapp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceFilter('whatsapp')}
            className={sourceFilter === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            WhatsApp ({sourceCounts['whatsapp']})
          </Button>
        )}
        {(sourceCounts['telefono'] || 0) > 0 && (
          <Button
            variant={sourceFilter === 'telefono' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceFilter('telefono')}
            className={sourceFilter === 'telefono' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}
          >
            <PhoneIcon className="h-3.5 w-3.5 mr-1.5" />
            Teléfono ({sourceCounts['telefono']})
          </Button>
        )}
        {(sourceCounts['email'] || 0) > 0 && (
          <Button
            variant={sourceFilter === 'email' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceFilter('email')}
          >
            Email ({sourceCounts['email']})
          </Button>
        )}
        {(sourceCounts['referido'] || 0) > 0 && (
          <Button
            variant={sourceFilter === 'referido' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceFilter('referido')}
          >
            Referido ({sourceCounts['referido']})
          </Button>
        )}
        {(sourceCounts['manual'] || 0) > 0 && (
          <Button
            variant={sourceFilter === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceFilter('manual')}
          >
            Manual ({sourceCounts['manual']})
          </Button>
        )}
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_leads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_leads > 0 ? `${stats.won_leads} ganados, ${stats.lost_leads} perdidos` : 'Sin datos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.pipeline_value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total del pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.conversion_rate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Leads ganados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Etapas Activas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stages.filter(s => s.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              Etapas del pipeline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visual Mejorado */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Pipeline de Ventas
              </CardTitle>
              <CardDescription className="text-blue-700 mt-1">
                Visualiza el progreso de tus leads a través del funnel de conversión
              </CardDescription>
            </div>
            <Link href="/dashboard/crm/reports">
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Reportes
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Estadísticas del Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Leads</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total_leads}</p>
                </div>
                <div className="bg-blue-500 p-2 rounded-full">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Valor Pipeline</p>
                  <p className="text-2xl font-bold text-green-900">${stats.pipeline_value.toLocaleString()}</p>
                </div>
                <div className="bg-green-500 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Tasa Conversión</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.conversion_rate}%</p>
                </div>
                <div className="bg-purple-500 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Kanban con Drag & Drop */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {leadsByStage.map((stageData) => (
                <Droppable droppableId={String(stageData.id)} key={stageData.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-shrink-0 w-72 rounded-xl border-2 transition-colors ${
                        snapshot.isDraggingOver
                          ? 'border-blue-400 bg-blue-50/50 shadow-lg'
                          : 'border-gray-200 bg-white shadow-md'
                      }`}
                    >
                      {/* Header de la etapa */}
                      <div className="p-3 border-b border-gray-100" style={{ borderTopColor: stageData.color, borderTopWidth: '3px', borderRadius: '10px 10px 0 0' }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stageData.color }}></div>
                            <h3 className="font-semibold text-gray-900 text-sm">{stageData.description}</h3>
                            <PipelineInstructions
                              stageId={stageData.id}
                              stageName={stageData.name}
                              stageDescription={stageData.description}
                              stageColor={stageData.color}
                            />
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs font-bold"
                            style={{
                              backgroundColor: stageData.color + '20',
                              color: stageData.color,
                              border: `1px solid ${stageData.color}40`
                            }}
                          >
                            {stageData.count}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400">Valor: <span className="font-semibold text-gray-700">${stageData.totalValue.toLocaleString()}</span></p>
                        </div>
                      </div>

                      {/* Lista de leads (draggable) */}
                      <div className="p-2 space-y-2 min-h-[60px] max-h-[500px] overflow-y-auto">
                        {(expandedStages[stageData.id] ? stageData.leads : stageData.leads.slice(0, 6)).map((lead: any, index: number) => {
                          const isWebLead = lead.source === 'web';
                          const createdDate = new Date(lead.created_at);
                          const now = new Date();
                          const hoursAgo = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
                          const timeLabel = hoursAgo < 1 ? 'hace min' : hoursAgo < 24 ? `${hoursAgo}h` : `${Math.floor(hoursAgo / 24)}d`;

                          return (
                            <Draggable draggableId={String(lead.id)} index={index} key={lead.id}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => router.push(`/dashboard/crm/${lead.id}`)}
                                  className={`p-2.5 rounded-lg border cursor-grab active:cursor-grabbing select-none ${
                                    snapshot.isDragging
                                      ? 'shadow-xl ring-2 ring-blue-400 rotate-1 opacity-90 z-50'
                                      : isWebLead
                                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:border-green-500 hover:shadow-md'
                                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                  }`}
                                  style={provided.draggableProps.style}
                                >
                                  <div className="flex items-center gap-1.5 mb-1">
                                    {isWebLead && <Globe className="h-3 w-3 text-green-600 flex-shrink-0" />}
                                    <p className={`font-medium text-xs truncate ${isWebLead ? 'text-green-900' : 'text-gray-900'}`}>
                                      {lead.title}
                                    </p>
                                  </div>
                                  <div className="space-y-0.5">
                                    {lead.client && (
                                      <p className="text-[11px] font-semibold text-blue-600 truncate">
                                        {lead.client.nombrePrincipal} {lead.client.apellido}
                                      </p>
                                    )}
                                    {lead.client?.email && (
                                      <p className="text-[10px] text-gray-500 truncate">{lead.client.email}</p>
                                    )}
                                    {(lead.client?.telefonoMovil || lead.client?.telefono) && (
                                      <p className="text-[10px] text-gray-500">{lead.client.telefonoMovil || lead.client.telefono}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      {isWebLead ? (
                                        <Badge className="text-[9px] px-1 py-0 h-3.5 bg-green-100 text-green-700 border-green-300">Web</Badge>
                                      ) : (
                                        <span className="text-[9px] text-gray-400 capitalize">{lead.source}</span>
                                      )}
                                      <span className="text-[9px] text-gray-400">{timeLabel}</span>
                                      {lead.estimated_value > 0 && (
                                        <span className="text-[9px] font-medium text-green-600">${lead.estimated_value?.toLocaleString()}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}

                        {stageData.leads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                            <Target className="h-6 w-6 mx-auto text-gray-300 mb-1" />
                            <p className="text-[10px] text-gray-400">Sin leads</p>
                          </div>
                        )}
                      </div>

                      {stageData.leads.length > 6 && !expandedStages[stageData.id] && (
                        <div className="text-center py-1.5 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStageExpansion(stageData.id)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 h-6 px-2"
                          >
                            <ChevronDown className="h-3 w-3 mr-0.5" />
                            +{stageData.leads.length - 6} más
                          </Button>
                        </div>
                      )}
                      {expandedStages[stageData.id] && stageData.leads.length > 6 && (
                        <div className="text-center py-1.5 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStageExpansion(stageData.id)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 h-6 px-2"
                          >
                            <ChevronUp className="h-3 w-3 mr-0.5" />
                            Ver menos
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Leads Recientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leads Recientes</CardTitle>
              <CardDescription>Últimos leads agregados al sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead: any) => {
                const stage = stages.find((s: any) => s.id === lead.stage_id);
                const timeAgo = new Date(lead.created_at).toLocaleDateString('es-CL');
                const isWebLead = lead.source === 'web';

                return (
                  <div key={lead.id} className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                    isWebLead ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isWebLead && <Globe className="h-4 w-4 text-green-600 flex-shrink-0" />}
                        <p className="font-medium truncate">{lead.title}</p>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {lead.client && (
                          <span className="font-semibold text-blue-600">
                            {lead.client.nombrePrincipal} {lead.client.apellido}
                          </span>
                        )}
                        {lead.client?.email && (
                          <span className="ml-2 text-xs text-gray-500">{lead.client.email}</span>
                        )}
                        {(lead.client?.telefonoMovil || lead.client?.telefono) && (
                          <span className="ml-2 text-xs text-gray-500">{lead.client.telefonoMovil || lead.client.telefono}</span>
                        )}
                        <span className="ml-2 text-xs text-gray-400">
                          {isWebLead ? 'Web' : lead.source} - {timeAgo}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" style={{ backgroundColor: stage?.color + '20', color: stage?.color }}>
                        {stage?.description || 'Sin etapa'}
                      </Badge>
                      <Link href={`/dashboard/crm/${lead.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay leads en el sistema</p>
                <p className="text-sm text-muted-foreground mt-2">Crea tu primer lead para comenzar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Presupuestos */}
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

      {/* Loss Reason Dialog */}
      <LossReasonDialog
        open={lossDialogOpen}
        onConfirm={handleLossReasonConfirm}
        onCancel={handleLossReasonCancel}
        leadTitle={pendingLossLead?.title}
      />
    </div>
  );
}