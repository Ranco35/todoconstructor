import React from 'react';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getSupplier } from '@/actions/suppliers/get';
import { getSupplierContacts } from '@/actions/suppliers/contacts/list';
import { getRobustSupplier, getRobustSupplierContacts, ConnectivityError } from '@/lib/supabase-robust';
import ContactTable from '@/components/suppliers/contacts/ContactTable';
import NewContactButton from '@/components/suppliers/contacts/NewContactButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Building, Phone, Mail, MapPin, Calendar, Plus, Users, Star, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Definir el tipo ContactType localmente
type ContactType = 'PHONE' | 'EMAIL' | 'ADDRESS' | 'SOCIAL_MEDIA' | 'OTHER';

// Componente StatCard moderno como en clientes
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

function StatCard({ title, value, icon, color, change }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">{change}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Componente de error de conectividad
function ConnectivityError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Problema de Conectividad
          </h2>
          <p className="text-gray-600 mb-6">
            No se pudo conectar con la base de datos. Esto puede ser un problema temporal de red.
          </p>
          <div className="space-y-3">
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                Reintentar
              </Button>
            )}
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full">
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContactsPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
    active?: string;
  }>;
}

export default async function ContactsPage({ params, searchParams }: ContactsPageProps) {
  const { id } = await params;
  const supplierId = parseInt(id);
  
  if (isNaN(supplierId)) {
    notFound();
  }

  try {
    // Obtener información del proveedor con manejo robusto
    const supplier = await getRobustSupplier(supplierId);
    
    if (!supplier) {
      notFound();
    }

    // Obtener searchParams
    const searchParamsData = await searchParams;

    // Obtener contactos con filtros y timeout
    const page = parseInt(searchParamsData.page || '1');
    const filters = {
      search: searchParamsData.search,
      type: searchParamsData.type as ContactType | undefined,
      active: searchParamsData.active === 'true' ? true : searchParamsData.active === 'false' ? false : undefined,
    };

    // Obtener contactos con manejo robusto
    let contactsData;
    try {
      contactsData = await getRobustSupplierContacts({
        supplierId,
        page,
        limit: 20,
        filters,
        sortBy: 'name',
        sortOrder: 'asc'
      });
    } catch (contactError) {
      console.warn('Error loading contacts, using fallback:', contactError);
      // Fallback cuando falla la carga de contactos
      contactsData = {
        data: [],
        stats: {
          total: 0,
          active: 0,
          inactive: 0,
          primary: 0,
          phone: 0,
          email: 0
        }
      };
    }

    const contacts = contactsData.data || [];
    const stats = contactsData.stats || {
      total: 0,
      active: 0,
      inactive: 0,
      primary: 0,
      phone: 0,
      email: 0
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header Moderno con Gradiente */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <Link href={`/dashboard/suppliers/${supplierId}`}>
                    <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver al proveedor
                    </Button>
                  </Link>
                </div>
                
                <h1 className="text-4xl font-bold mb-2">
                  Contactos del Proveedor
                </h1>
                <p className="text-purple-100 text-lg mb-4">
                  Gestiona las personas y contactos asociados a <span className="font-semibold">{supplier.name}</span>
                </p>
                
                {/* Badge con información del proveedor */}
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                    <Building className="h-3 w-3 mr-1" />
                    {supplier.companyType === 'EMPRESA' ? 'Empresa' : 'Persona Natural'}
                  </Badge>
                  <Badge className={`px-3 py-1 ${supplier.active ? 'bg-green-500/20 text-green-100 border-green-300/30' : 'bg-red-500/20 text-red-100 border-red-300/30'}`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {supplier.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {supplier.supplierRank && (
                    <Badge className="bg-yellow-500/20 text-yellow-100 border-yellow-300/30 px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      {supplier.supplierRank}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-6xl mb-2">👥</div>
                <div className="text-purple-200 font-medium">
                  Gestión de Contactos
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas Modernas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Contactos"
              value={stats.total.toString()}
              icon={<Users className="h-6 w-6 text-blue-600" />}
              color="bg-blue-100"
              change={`${stats.active} activos`}
            />
            <StatCard
              title="Contactos Activos"
              value={stats.active.toString()}
              icon={<CheckCircle className="h-6 w-6 text-green-600" />}
              color="bg-green-100"
              change={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}% del total`}
            />
            <StatCard
              title="Con Teléfono"
              value={stats.phone?.toString() || '0'}
              icon={<Phone className="h-6 w-6 text-purple-600" />}
              color="bg-purple-100"
            />
            <StatCard
              title="Con Email"
              value={stats.email?.toString() || '0'}
              icon={<Mail className="h-6 w-6 text-orange-600" />}
              color="bg-orange-100"
            />
          </div>

          {/* Información del Proveedor Modernizada */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2 text-purple-600" />
                Información del Proveedor
              </h3>
              <Link href={`/dashboard/suppliers/edit/${supplierId}`}>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Editar Proveedor
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Building className="h-4 w-4" />
                  Información Básica
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-lg font-semibold text-gray-900">{supplier.name}</p>
                  {supplier.businessName && (
                    <p className="text-sm text-gray-600 mt-1">{supplier.businessName}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 font-mono">REF: {supplier.reference}</p>
                </div>
              </div>

              {(supplier.email || supplier.phone) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Phone className="h-4 w-4" />
                    Contacto Principal
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{supplier.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900">{supplier.address}</p>
                    {supplier.city && (
                      <p className="text-xs text-gray-500 mt-1">{supplier.city}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Información del Sistema
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Registrado:</span>
                    <span className="text-xs text-gray-900">
                      {new Date(supplier.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Estado:</span>
                    <Badge variant={supplier.active ? "default" : "secondary"} className="text-xs">
                      {supplier.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Contactos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Lista de Contactos
                </h3>
                <NewContactButton supplierId={supplierId} />
              </div>
            </div>
            
            <div className="p-6">
              {contacts.length === 0 && contactsData.data ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No hay contactos registrados</p>
                  <p className="text-gray-400 text-sm">Agrega el primer contacto para este proveedor</p>
                </div>
              ) : (
                <Suspense fallback={
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                }>
                  <ContactTable 
                    supplierId={supplierId} 
                    contacts={contacts}
                  />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading contacts page:', error);
    
    // Si es un error de conectividad específico, mostrar la página de error
    if (error instanceof ConnectivityError || 
        (error instanceof Error && (
          error.message.includes('fetch failed') || 
          error.message.includes('Connect Timeout') ||
          error.message.includes('Timeout') ||
          error.message.includes('No se pudo')
        ))) {
      return <ConnectivityError />;
    }
    
    // Para otros errores, usar notFound
    notFound();
  }
} 