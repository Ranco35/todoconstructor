import React from 'react';
import { getClient } from '@/actions/clients';
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
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClientType, ClientStatus, Gender } from '@/types/client';

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

  const clientResult = await getClient(clientId);

  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data;

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
        </div>
      </div>
    </div>
  );
} 