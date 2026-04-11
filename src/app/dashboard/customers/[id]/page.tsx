import React from 'react';
import { getClient } from '@/actions/clients';
import { getAllLeadsByClientId } from '@/actions/crm/leads';
import { getBudgetsByClientId } from '@/actions/sales/budgets/list';
import { getInvoicesByClientId } from '@/actions/sales/invoices/list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  ArrowLeft,
  Edit,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Star,
  Tag as TagIcon,
  DollarSign,
  FileText,
  Target,
  ExternalLink,
  FileSpreadsheet,
  Receipt
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClientType, ClientStatus, Gender } from '@/types/client';

const BUDGET_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Expirado',
  converted: 'Convertido',
};

const BUDGET_STATUS_COLOR: Record<string, string> = {
  draft: '#6B7280',
  sent: '#3B82F6',
  accepted: '#10B981',
  rejected: '#EF4444',
  expired: '#F59E0B',
  converted: '#059669',
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
};

const INVOICE_STATUS_COLOR: Record<string, string> = {
  draft: '#6B7280',
  sent: '#3B82F6',
  paid: '#10B981',
  overdue: '#EF4444',
  cancelled: '#9CA3AF',
};

interface ClientDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
  const { id } = await params;
  const clientId = parseInt(id);

  if (isNaN(clientId)) {
    notFound();
  }

  const [clientResult, leadsResult, budgetsResult, invoicesResult] = await Promise.all([
    getClient(clientId),
    getAllLeadsByClientId(clientId),
    getBudgetsByClientId(clientId),
    getInvoicesByClientId(clientId),
  ]);

  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data;
  const crmLeads: any[] = leadsResult.success ? (leadsResult.data || []) : [];
  const budgets: any[] = budgetsResult.success ? (budgetsResult.data || []) : [];
  const invoices: any[] = invoicesResult.success ? (invoicesResult.data || []) : [];

  const getClientName = () => {
    if (client.tipoCliente === ClientType.EMPRESA) {
      return client.razonSocial || client.nombrePrincipal;
    }
    return `${client.nombrePrincipal} ${client.apellido || ''}`.trim();
  };

  const getMainContact = () => {
    return client.contactos?.find(c => c.esContactoPrincipal) || null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          {client.imagen && (
            <img
              src={client.imagen}
              alt={getClientName()}
              className="w-24 h-24 rounded-full shadow-lg object-cover border-2 border-gray-200"
              style={{ minWidth: 96, minHeight: 96 }}
            />
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{getClientName()}</h1>
            <p className="text-muted-foreground">
              {client.tipoCliente === ClientType.EMPRESA ? 'Empresa' : 'Persona'}
              {client.rut && ` • ${client.rut}`}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/customers/${client.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {client.tipoCliente === ClientType.EMPRESA ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Cliente</label>
                  <p className="text-sm">
                    {client.tipoCliente === ClientType.EMPRESA ? 'Empresa' : 'Persona'}
                  </p>
                </div>
                
                {client.tipoCliente === ClientType.EMPRESA ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Razón Social</label>
                      <p className="text-sm">{client.razonSocial}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Giro</label>
                      <p className="text-sm">{client.giro || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Número de Empleados</label>
                      <p className="text-sm">{client.numeroEmpleados || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Facturación Anual</label>
                      <p className="text-sm">
                        {client.facturacionAnual ? formatCurrency(client.facturacionAnual) : 'No especificado'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                      <p className="text-sm">{getClientName()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</label>
                      <p className="text-sm">
                        {client.fechaNacimiento ? formatDate(client.fechaNacimiento) : 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Género</label>
                      <p className="text-sm">
                        {client.genero === Gender.MASCULINO ? 'Masculino' : 
                         client.genero === Gender.FEMENINO ? 'Femenino' : 
                         client.genero === Gender.OTRO ? 'Otro' : 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Profesión</label>
                      <p className="text-sm">{client.profesion || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Título</label>
                      <p className="text-sm">{client.titulo || 'No especificado'}</p>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sector Económico</label>
                  <p className="text-sm">{client.sectorEconomico?.nombre || 'No especificado'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sitio Web</label>
                  <p className="text-sm">
                    {client.sitioWeb ? (
                      <a href={client.sitioWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {client.sitioWeb}
                      </a>
                    ) : 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant={client.estado === ClientStatus.ACTIVO ? 'default' : 'secondary'}>
                  {client.estado === ClientStatus.ACTIVO ? 'Activo' : 'Inactivo'}
                </Badge>
                {client.esClienteFrecuente && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Frecuente
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-muted-foreground">Ranking:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= client.rankingCliente
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NUEVO: Mostrar contacto principal si existe */}
              {getMainContact() ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <p className="text-sm flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {getMainContact().nombre} {getMainContact().apellido || ''}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {getMainContact().email || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <p className="text-sm flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {getMainContact().telefono || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono Móvil</label>
                    <p className="text-sm flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {getMainContact().telefonoMovil || 'No especificado'}
                    </p>
                  </div>
                  {getMainContact().cargo && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cargo</label>
                      <p className="text-sm flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {getMainContact().cargo}
                      </p>
                    </div>
                  )}
                  {getMainContact().departamento && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Departamento</label>
                      <p className="text-sm flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {getMainContact().departamento}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {client.email || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <p className="text-sm flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {client.telefono || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono Móvil</label>
                    <p className="text-sm flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {client.telefonoMovil || 'No especificado'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dirección */}
          {(client.calle || client.ciudad || client.region) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Dirección
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.calle && <p className="text-sm">{client.calle}</p>}
                  {client.calle2 && <p className="text-sm">{client.calle2}</p>}
                  <p className="text-sm">
                    {[client.ciudad, client.region, client.codigoPostal].filter(Boolean).join(', ')}
                  </p>
                  {client.pais && <p className="text-sm">{client.pais.nombre}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comentarios */}
          {client.comentarios && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Comentarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.comentarios}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contactos */}
          {client.contactos && client.contactos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contactos ({client.contactos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.contactos.map((contact, index) => (
                  <div key={contact.id} className="p-3 border rounded-lg">
                    <div className="font-medium">
                      {contact.nombre} {contact.apellido}
                      {contact.esContactoPrincipal && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      {contact.email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {contact.email}
                        </div>
                      )}
                      {(contact.telefono || contact.telefonoMovil) && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {contact.telefono || contact.telefonoMovil}
                        </div>
                      )}
                      {contact.cargo && (
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {contact.cargo}
                          {contact.departamento && ` - ${contact.departamento}`}
                        </div>
                      )}
                      {contact.relacion && (
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {contact.relacion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Etiquetas */}
          {client.etiquetas && client.etiquetas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon className="h-5 w-5" />
                  Etiquetas ({client.etiquetas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {client.etiquetas.map((tagAssignment, index) => (
                    <Badge
                      key={tagAssignment.etiqueta?.id || tagAssignment.id || index}
                      variant="outline"
                      style={{ 
                        borderColor: tagAssignment.etiqueta?.color,
                        color: tagAssignment.etiqueta?.color 
                      }}
                    >
                      {tagAssignment.etiqueta?.nombre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total de Compras</label>
                <p className="text-lg font-bold">
                  {client.totalCompras > 0 ? formatCurrency(client.totalCompras) : 'Sin compras'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Última Compra</label>
                <p className="text-sm">
                  {client.ultimaCompra ? formatDate(client.ultimaCompra) : 'Sin compras'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Historial CRM */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Historial CRM ({crmLeads.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {crmLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Target className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Sin leads CRM registrados
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {crmLeads.map((lead) => {
                    const stage = lead.stage;
                    const stageColor = stage?.color || '#6B7280';
                    const stageLabel = stage?.description || stage?.name || 'Sin etapa';
                    const isLost = stage?.name === 'perdido';
                    const isWon = stage?.name === 'ganado';

                    return (
                      <Link
                        key={lead.id}
                        href={`/dashboard/crm/${lead.id}`}
                        className="block p-3 border rounded-lg hover:border-blue-400 hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm flex-1 line-clamp-2">
                            {lead.title}
                          </p>
                          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold"
                            style={{
                              borderColor: stageColor,
                              color: stageColor,
                              backgroundColor: `${stageColor}15`,
                            }}
                          >
                            {stageLabel}
                          </Badge>
                          {lead.estimated_value > 0 && (
                            <span className="text-[11px] font-medium text-green-700">
                              {formatCurrency(lead.estimated_value)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 text-[11px] text-muted-foreground space-y-0.5">
                          <p>Creado: {formatDate(lead.created_at)}</p>
                          {isLost && lead.actual_close_date && (
                            <p>Perdido: {formatDate(lead.actual_close_date)}</p>
                          )}
                          {isWon && lead.actual_close_date && (
                            <p>Ganado: {formatDate(lead.actual_close_date)}</p>
                          )}
                          {isLost && lead.loss_reason && (
                            <p className="italic">Motivo: {lead.loss_reason}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de Presupuestos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Historial de Presupuestos ({budgets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <FileSpreadsheet className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Sin presupuestos registrados
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {budgets.map((budget) => {
                    const statusColor = BUDGET_STATUS_COLOR[budget.status] || '#6B7280';
                    const statusLabel = BUDGET_STATUS_LABEL[budget.status] || budget.status;
                    return (
                      <Link
                        key={budget.id}
                        href={`/dashboard/sales/budgets/${budget.id}`}
                        className="block p-3 border rounded-lg hover:border-blue-400 hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm flex-1 truncate">
                            {budget.number || `Presupuesto #${budget.id}`}
                          </p>
                          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold"
                            style={{
                              borderColor: statusColor,
                              color: statusColor,
                              backgroundColor: `${statusColor}15`,
                            }}
                          >
                            {statusLabel}
                          </Badge>
                          {budget.total > 0 && (
                            <span className="text-[11px] font-medium text-green-700">
                              {formatCurrency(Number(budget.total))}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 text-[11px] text-muted-foreground space-y-0.5">
                          <p>Creado: {formatDate(budget.created_at)}</p>
                          {budget.expiration_date && (
                            <p>Vence: {formatDate(budget.expiration_date)}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de Facturas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Historial de Facturas ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Receipt className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Sin facturas registradas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => {
                    const statusColor = INVOICE_STATUS_COLOR[invoice.status] || '#6B7280';
                    const statusLabel = INVOICE_STATUS_LABEL[invoice.status] || invoice.status;
                    return (
                      <Link
                        key={invoice.id}
                        href={`/dashboard/sales/invoices/${invoice.id}`}
                        className="block p-3 border rounded-lg hover:border-blue-400 hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm flex-1 truncate">
                            {invoice.number || `Factura #${invoice.id}`}
                          </p>
                          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold"
                            style={{
                              borderColor: statusColor,
                              color: statusColor,
                              backgroundColor: `${statusColor}15`,
                            }}
                          >
                            {statusLabel}
                          </Badge>
                          {invoice.total > 0 && (
                            <span className="text-[11px] font-medium text-green-700">
                              {formatCurrency(Number(invoice.total))}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 text-[11px] text-muted-foreground space-y-0.5">
                          <p>Emitida: {formatDate(invoice.created_at)}</p>
                          {invoice.due_date && (
                            <p>Vence: {formatDate(invoice.due_date)}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}