'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  Calendar, 
  FileText, 
  Receipt, 
  DollarSign, 
  CheckCircle, 
  Clock,
  Users,
  Building,
  CreditCard,
  TrendingUp,
  Star
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'current' | 'upcoming';
  href: string;
  features: string[];
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 'reservation',
    title: 'Reserva del Cliente',
    description: 'El cliente realiza una reserva en el hotel/spa y confirma los servicios deseados.',
    icon: Calendar,
    status: 'completed',
    href: '/dashboard/reservations/nueva',
    features: [
      'Selección de habitaciones',
      'Elección de servicios spa',
      'Configuración de fechas',
      'Registro de datos del cliente'
    ]
  },
  {
    id: 'budget',
    title: 'Generación de Presupuesto',
    description: 'Se crea un presupuesto detallado basado en la reserva y servicios solicitados.',
    icon: FileText,
    status: 'completed',
    href: '/dashboard/sales/budgets/create',
    features: [
      'Productos y servicios detallados',
      'Precios con temporadas aplicadas',
      'Descuentos y promociones',
      'Envío al cliente para aprobación'
    ]
  },
  {
    id: 'invoice',
    title: 'Conversión a Factura',
    description: 'Una vez aprobado el presupuesto, se convierte automáticamente en factura oficial.',
    icon: Receipt,
    status: 'completed',
    href: '/dashboard/sales/invoices',
    features: [
      'Numeración automática',
      'Datos fiscales completos',
      'Términos y condiciones',
      'Estado de seguimiento'
    ]
  },
  {
    id: 'payment',
    title: 'Registro de Pagos',
    description: 'Se registran los pagos recibidos del cliente hasta completar el monto total.',
    icon: DollarSign,
    status: 'completed',
    href: '/dashboard/sales/payments',
    features: [
      'Múltiples métodos de pago',
      'Pagos parciales permitidos',
      'Actualización automática de estados',
      'Historial completo de transacciones'
    ]
  }
];

export default function SalesWorkflowPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'current':
        return <Clock className="h-4 w-4" />;
      case 'upcoming':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Star className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Flujo Completo de Ventas
          </h1>
          <Star className="h-8 w-8 text-yellow-500" />
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Sistema integrado de gestión de ventas: desde la reserva del cliente hasta el pago final.
          Todos los módulos están funcionalmente conectados para un flujo seamless.
        </p>
        
        <Alert className="max-w-4xl mx-auto border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>¡Sistema 100% Funcional!</strong> Todos los módulos están implementados y operativos.
            Puede crear reservas, generar presupuestos, convertir a facturas y registrar pagos.
          </AlertDescription>
        </Alert>
      </div>

      {/* Estadísticas del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Módulos Activos</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">4/4</div>
            <p className="text-xs text-green-700">Completamente funcionales</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Integraciones</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">100%</div>
            <p className="text-xs text-blue-700">Conectadas entre módulos</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Automatización</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">Alta</div>
            <p className="text-xs text-purple-700">Flujo automático</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Estado Sistema</CardTitle>
            <Star className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">Listo</div>
            <p className="text-xs text-orange-700">Para producción</p>
          </CardContent>
        </Card>
      </div>

      {/* Flujo Visual de Pasos */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-center">Proceso Paso a Paso</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === workflowSteps.length - 1;
            
            return (
              <div key={step.id} className="relative">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{step.title}</CardTitle>
                          <Badge variant="outline" className={getStatusColor(step.status)}>
                            {getStatusIcon(step.status)}
                            <span className="ml-1">Implementado</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm">
                      {step.description}
                    </CardDescription>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Características:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {step.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link href={step.href}>
                      <Button className="w-full" size="sm">
                        <Icon className="h-4 w-4 mr-2" />
                        Ir al Módulo
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                
                {/* Flecha conectora */}
                {!isLast && (
                  <div className="hidden xl:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="bg-white border rounded-full p-2 shadow-md">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Beneficios del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Beneficios del Sistema Integrado</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Automatización Completa</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Los datos fluyen automáticamente entre módulos sin duplicación manual.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Experiencia del Cliente</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Proceso fluido desde la reserva hasta el pago final.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Control Financiero</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Seguimiento completo de ingresos y estados de pago.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold">Documentación Completa</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Presupuestos y facturas con numeración automática.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Reportes y Analytics</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Estadísticas en tiempo real para toma de decisiones.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">Escalabilidad</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema preparado para crecimiento del negocio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accesos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Comenzar Ahora</CardTitle>
          <CardDescription>
            Accesos directos a las funciones principales del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/reservations/nueva">
              <Button variant="outline" className="w-full h-16 flex-col space-y-1">
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Nueva Reserva</span>
              </Button>
            </Link>
            
            <Link href="/dashboard/sales/budgets/create">
              <Button variant="outline" className="w-full h-16 flex-col space-y-1">
                <FileText className="h-5 w-5" />
                <span className="text-sm">Crear Presupuesto</span>
              </Button>
            </Link>
            
            <Link href="/dashboard/sales/invoices/create">
              <Button variant="outline" className="w-full h-16 flex-col space-y-1">
                <Receipt className="h-5 w-5" />
                <span className="text-sm">Nueva Factura</span>
              </Button>
            </Link>
            
            <Link href="/dashboard/sales/payments">
              <Button variant="outline" className="w-full h-16 flex-col space-y-1">
                <DollarSign className="h-5 w-5" />
                <span className="text-sm">Registrar Pago</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 