import { notFound } from 'next/navigation';
import { getSupplier } from '@/actions/suppliers/get';
import { getSupplierContacts } from '@/actions/suppliers/contacts';
import { getSupplierPayments, getSupplierPaymentStats } from '@/actions/suppliers/payments';
import SupplierPaymentHistory from '@/components/suppliers/SupplierPaymentHistory';
import { COMPANY_TYPE_LABELS, CompanyType } from '@/constants/supplier';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Star,
  Edit,
  Users,
  Banknote,
  FileText,
  Globe,
  Hash,
  Tag,
  TrendingUp,
  Activity,
  Info,
  Zap,
  Download,
  CreditCard,
  CheckCircle,
  User,
  MoreHorizontal,
  Plus,
  Eye,
  // Iconos para etiquetas - Mapa completo
  Package, Truck, Car, Factory, Building2, Wrench, ChefHat, Coffee, 
  Sparkles, Bed, Users2, Briefcase, DollarSign, Heart, Shield, 
  Award, Target, Leaf, Settings, Home, PaintBucket
} from 'lucide-react';
import Link from 'next/link';

// Mapa completo de iconos para etiquetas
const iconMap: { [key: string]: any } = {
  // Hotel específicos
  'bed': Bed,
  'coffee': Coffee,
  'chef-hat': ChefHat,
  'sparkles': Sparkles,
  // Logística
  'truck': Truck,
  'car': Car,
  // Industria y corporativo
  'factory': Factory,
  'building': Building2,
  'briefcase': Briefcase,
  // Técnicos y servicios
  'wrench': Wrench,
  'zap': Zap,
  'settings': Settings,
  // Otros
  'package': Package,
  'map-pin': MapPin,
  'users': Users2,
  'dollar-sign': DollarSign,
  'star': Star,
  'heart': Heart,
  'shield': Shield,
  'award': Award,
  'target': Target,
  'leaf': Leaf,
  'user': User,
  'home': Home,
  'paint-bucket': PaintBucket
};

interface SupplierDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Función para obtener las iniciales del nombre
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Función para formatear fecha relativa
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
  return `Hace ${Math.floor(days / 365)} años`;
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { id } = await params;
  const supplierId = parseInt(id);
  
  if (isNaN(supplierId)) {
    notFound();
  }

  try {
    // Obtener información del proveedor
    const supplier = await getSupplier(supplierId);
    
    if (!supplier) {
      notFound();
    }

    // Obtener estadísticas de contactos
    const contactsData = await getSupplierContacts({
      supplierId,
      page: 1,
      limit: 1,
      filters: {},
      sortBy: 'name',
      sortOrder: 'asc'
    });

    // Obtener historial de pagos
    const [supplierPayments, paymentStats] = await Promise.all([
      getSupplierPayments(supplierId),
      getSupplierPaymentStats(supplierId)
    ]);

    const initials = getInitials(supplier.name);
    const createdAt = new Date(supplier.createdAt);
    const timeAgo = getTimeAgo(createdAt);

    return (
      <div className="min-h-screen" style={{ 
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: '#f8fafc',
        color: '#1a202c',
        lineHeight: 1.6
      }}>
        <div className="max-w-7xl mx-auto p-5">
          {/* Header Navigation */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg flex items-center gap-4">
            <Link href="/dashboard/suppliers" className="flex items-center gap-2 text-gray-600 hover:text-purple-600 font-medium transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Volver a proveedores
            </Link>
            <span className="text-gray-400 text-sm">/ Proveedores / {supplier.name}</span>
          </div>

          {/* Provider Header */}
          <div 
            className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {/* Decorative circle */}
            <div 
              className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'translate(50%, -50%)'
              }}
            />
            
            <div className="relative z-10 flex justify-between items-start flex-wrap gap-6">
              <div className="flex-1 min-w-80">
                {/* Avatar */}
                <div 
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-bold mb-4 border-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {initials}
                </div>
                
                {/* Provider info */}
                <h1 className="text-4xl font-bold mb-2" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                  {supplier.name}
                </h1>
                <p className="text-lg opacity-90 mb-2">
                  Proveedor {COMPANY_TYPE_LABELS[supplier.companyType as CompanyType]?.label || 'Sin especificar'}
                </p>
                {supplier.supplierRank && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-semibold text-yellow-200">
                      Calidad: {supplier.supplierRank}
                    </span>
                    {supplier.rankPoints && (
                      <span className="text-sm opacity-80">
                        ({supplier.rankPoints} puntos)
                      </span>
                    )}
                  </div>
                )}
                
                                 {/* Badges */}
                 <div className="flex gap-3 mb-4 flex-wrap">
                   <span 
                     className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm"
                     style={{
                       background: supplier.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                       border: `1px solid ${supplier.active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                       color: supplier.active ? '#dcfce7' : '#fecaca'
                     }}
                   >
                     <CheckCircle className="h-3 w-3" />
                     {supplier.active ? 'Activo' : 'Inactivo'}
                   </span>
                   <span 
                     className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm"
                     style={{
                       background: 'rgba(139, 92, 246, 0.2)',
                       border: '1px solid rgba(139, 92, 246, 0.3)',
                       color: '#ede9fe'
                     }}
                   >
                     <User className="h-3 w-3" />
                     {COMPANY_TYPE_LABELS[supplier.companyType as CompanyType]?.label || 'Sin especificar'}
                   </span>
                 </div>

                 {/* Etiquetas con iconos en el header */}
                 {supplier.etiquetas && supplier.etiquetas.length > 0 && (
                   <div className="flex flex-wrap gap-2 mb-4">
                     {supplier.etiquetas.slice(0, 4).map((assignment: any) => {
                       const tag = assignment.etiqueta;
                       if (!tag) return null;
                       const IconComponent = iconMap[tag.icono as keyof typeof iconMap] || Package;
                       return (
                         <span
                           key={assignment.id}
                           className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                           style={{
                             background: 'rgba(255, 255, 255, 0.15)',
                             border: '1px solid rgba(255, 255, 255, 0.2)',
                             color: 'white'
                           }}
                         >
                           <IconComponent className="h-3 w-3" />
                           {tag.nombre}
                         </span>
                       );
                     })}
                     {supplier.etiquetas.length > 4 && (
                       <span
                         className="flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                         style={{
                           background: 'rgba(255, 255, 255, 0.1)',
                           border: '1px solid rgba(255, 255, 255, 0.2)',
                           color: 'rgba(255, 255, 255, 0.8)'
                         }}
                       >
                         +{supplier.etiquetas.length - 4} más
                       </span>
                     )}
                   </div>
                 )}
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-5 mt-6">
                  <div 
                    className="text-center p-4 rounded-xl backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div className="text-2xl font-bold mb-1">0</div>
                    <div className="text-sm opacity-80">Órdenes</div>
                  </div>
                  <div 
                    className="text-center p-4 rounded-xl backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div className="text-2xl font-bold mb-1">$0</div>
                    <div className="text-sm opacity-80">Facturación</div>
                  </div>
                  <div 
                    className="text-center p-4 rounded-xl backdrop-blur-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div className="text-2xl font-bold mb-1">
                      {createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-sm opacity-80">Registrado</div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <Link href={`/dashboard/suppliers/edit/${supplierId}`}>
                  <button 
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      color: 'white'
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                </Link>
                <Link href={`/dashboard/suppliers/${supplierId}/contacts`}>
                  <button 
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                    style={{
                      background: 'white',
                      color: '#667eea'
                    }}
                  >
                    <Users className="h-4 w-4" />
                    Gestionar Contactos
                  </button>
                </Link>
                <button 
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    color: 'white'
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información General */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <Info className="h-5 w-5 text-purple-600" />
                    Información General
                  </h2>
                  <Link href={`/dashboard/suppliers/edit/${supplierId}`}>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</span>
                    <span className="block text-base font-semibold text-gray-900">{supplier.name}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia Interna</span>
                    <span className="block text-base font-semibold text-gray-900">{supplier.reference || 'Sin referencia'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Proveedor</span>
                    <span className="block text-base font-semibold text-gray-900">
                      {supplier.supplierRank || 'Sin clasificar'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</span>
                    <span className="block text-base font-semibold text-gray-900">
                      {supplier.category || 'Sin categoría'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Clasificación</span>
                    <span className="block text-base font-semibold text-gray-900">
                      {COMPANY_TYPE_LABELS[supplier.companyType as CompanyType]?.label || 'Sin especificar'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</span>
                    <Badge 
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        supplier.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <CheckCircle className="h-3 w-3" />
                      {supplier.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</span>
                    <span className="block text-base font-semibold text-gray-900">
                      {supplier.email || 'No registrado'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</span>
                    <span className="block text-base font-semibold text-gray-900">
                      {supplier.phone || 'No registrado'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">RUT/ID</span>
                    <span className="block text-base font-semibold text-gray-900">
                      {supplier.taxId || 'No registrado'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Registro</span>
                    <span className="block text-base font-semibold text-gray-900">
                      {createdAt.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial de Actividad */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Historial de Actividad
                  </h2>
                </div>
                
                <div className="relative">
                  <div className="flex gap-4 mb-5 relative">
                    <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="font-medium text-gray-900 mb-1">Proveedor registrado en el sistema</div>
                      <div className="text-sm text-gray-600">{timeAgo}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Rendimiento */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Rendimiento Mensual
                  </h2>
                </div>
                
                <div className="h-72 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Sin datos de rendimiento</p>
                    <p className="text-sm">Los datos aparecerán cuando se registren transacciones</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contactos */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    Contactos
                  </h2>
                  <Link href={`/dashboard/suppliers/${supplierId}/contacts`}>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </Link>
                </div>
                
                {contactsData.stats.total === 0 ? (
                  <div className="text-center py-10">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 mb-4">No hay contactos registrados</p>
                    <Link href={`/dashboard/suppliers/${supplierId}/contacts`}>
                      <Button className="rounded-xl bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Contacto
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total</span>
                      <span className="font-semibold">{contactsData.stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activos</span>
                      <span className="font-semibold text-green-600">{contactsData.stats.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principales</span>
                      <span className="font-semibold text-yellow-600">{contactsData.stats.primary}</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total</span>
                      <span className="font-semibold">{contactsData.stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activos</span>
                      <span className="font-semibold text-green-600">{contactsData.stats.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principales</span>
                      <span className="font-semibold text-yellow-600">{contactsData.stats.primary}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calificación */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <Star className="h-5 w-5 text-purple-600" />
                    Calificación
                  </h2>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {supplier.ranking || 'Sin tipo'}
                  </div>
                  <div className="flex justify-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className="h-6 w-6 text-gray-300" 
                        fill="none"
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">Sin evaluaciones</div>
                  <Button className="w-full rounded-xl bg-purple-600 hover:bg-purple-700">
                    <Star className="h-4 w-4 mr-2" />
                    Calificar Proveedor
                  </Button>
                </div>
              </div>

              {/* Acciones Rápidas */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Acciones Rápidas
                  </h2>
                </div>
                
                <div className="space-y-3">
                  <Link href={`/dashboard/suppliers/edit/${supplierId}`}>
                    <Button variant="outline" className="w-full justify-start rounded-xl hover:bg-gray-50">
                      <Edit className="h-4 w-4 mr-3" />
                      Editar Proveedor
                    </Button>
                  </Link>
                  <Link href={`/dashboard/suppliers/${supplierId}/contacts`}>
                    <Button variant="outline" className="w-full justify-start rounded-xl hover:bg-gray-50">
                      <Users className="h-4 w-4 mr-3" />
                      Gestionar Contactos
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start rounded-xl hover:bg-gray-50">
                    <FileText className="h-4 w-4 mr-3" />
                    Ver Transacciones
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl hover:bg-gray-50">
                    <CreditCard className="h-4 w-4 mr-3" />
                    Nueva Orden
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-3" />
                    Exportar Datos
                  </Button>
                </div>
              </div>

                             {/* Etiquetas Principales en Sidebar */}
               {supplier.etiquetas && supplier.etiquetas.length > 0 && (
                 <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                   <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                     <h2 className="text-xl font-semibold flex items-center gap-3">
                       <Tag className="h-5 w-5 text-purple-600" />
                       Etiquetas
                     </h2>
                   </div>
                   
                   <div className="space-y-3">
                     {supplier.etiquetas.slice(0, 3).map((assignment: any) => {
                       const tag = assignment.etiqueta;
                       if (!tag) return null;
                       const IconComponent = iconMap[tag.icono as keyof typeof iconMap] || Package;
                       return (
                         <div
                           key={assignment.id}
                           className="flex items-center gap-3 p-2 rounded-lg"
                           style={{ backgroundColor: tag.color + '10' }}
                         >
                           <div 
                             className="w-8 h-8 rounded-lg flex items-center justify-center"
                             style={{ 
                               backgroundColor: tag.color + '20',
                               color: tag.color 
                             }}
                           >
                             <IconComponent className="h-4 w-4" />
                           </div>
                           <div className="flex-1">
                             <div 
                               className="font-medium text-sm"
                               style={{ color: tag.color }}
                             >
                               {tag.nombre}
                             </div>
                           </div>
                         </div>
                       );
                     })}
                     
                     {supplier.etiquetas.length > 3 && (
                       <div className="text-center pt-2">
                         <span className="text-sm text-gray-500">
                           +{supplier.etiquetas.length - 3} etiquetas más
                         </span>
                       </div>
                     )}
                     
                     <div className="pt-3 mt-3 border-t border-gray-100 text-center">
                       <div className="text-sm text-gray-600">
                         Total: <span className="font-semibold text-purple-600">{supplier.etiquetas.length}</span> etiquetas
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {/* Información Adicional */}
               <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                 <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                   <h2 className="text-xl font-semibold flex items-center gap-3">
                     <Info className="h-5 w-5 text-purple-600" />
                     Información Adicional
                   </h2>
                 </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última actualización</span>
                    <span className="font-medium">
                      {new Date(supplier.updatedAt || supplier.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creado por</span>
                    <span className="font-medium">Sistema</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID del proveedor</span>
                    <span className="font-medium text-purple-600">#{supplier.id.toString().padStart(3, '0')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

                     {/* Etiquetas Completas */}
           {supplier.etiquetas && supplier.etiquetas.length > 0 && (
             <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 mt-8">
               <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                 <h2 className="text-xl font-semibold flex items-center gap-3">
                   <Tag className="h-5 w-5 text-purple-600" />
                   Todas las Etiquetas ({supplier.etiquetas.length})
                 </h2>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {supplier.etiquetas.map((assignment: any) => {
                   const tag = assignment.etiqueta;
                   if (!tag) return null;
                   const IconComponent = iconMap[tag.icono as keyof typeof iconMap] || Package;
                   return (
                     <div
                       key={assignment.etiquetaId}
                       className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md"
                       style={{
                         backgroundColor: tag.color + '10',
                         borderColor: tag.color + '30'
                       }}
                     >
                       <div 
                         className="w-10 h-10 rounded-lg flex items-center justify-center"
                         style={{ 
                           backgroundColor: tag.color + '20',
                           color: tag.color 
                         }}
                       >
                         <IconComponent className="h-5 w-5" />
                       </div>
                       <div className="flex-1">
                         <div 
                           className="font-medium text-sm"
                           style={{ color: tag.color }}
                         >
                           {tag.nombre}
                         </div>
                         <div className="text-xs text-gray-500">
                           {tag.descripcion || 'Etiqueta del proveedor'}
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}

          {/* Historial de Pagos */}
          <div className="mt-8">
            <SupplierPaymentHistory 
              payments={supplierPayments}
              totalAmount={paymentStats.totalAmount}
              totalPayments={paymentStats.totalPayments}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading supplier detail:', error);
    notFound();
  }
} 