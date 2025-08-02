'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  FileText, 
  Search, 
  Package, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AIInvoiceProcessorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente después de 3 segundos
    const timer = setTimeout(() => {
      router.push('/dashboard/purchases');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              🤖 Sistema Consolidado de Procesamiento IA
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            El procesador IA ha sido integrado al sistema principal de compras
          </p>
          <Badge variant="secondary" className="mt-2">
            ✨ Sistema Unificado Disponible
          </Badge>
        </div>

        {/* Alert de Redirección */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Sistema Consolidado:</strong> El procesador IA de facturas ha sido integrado al sistema principal de compras. 
            Serás redirigido automáticamente en 3 segundos, o puedes hacer clic en el botón de abajo.
          </AlertDescription>
        </Alert>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-800">Extracción PDF</h3>
              <p className="text-sm text-blue-600 mt-1">
                Extrae texto y datos estructurados de cualquier factura PDF
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <Bot className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-800">Procesamiento IA</h3>
              <p className="text-sm text-purple-600 mt-1">
                IA identifica proveedor, productos, montos y fechas automáticamente
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <Search className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-orange-800">Matching Inteligente</h3>
              <p className="text-sm text-orange-600 mt-1">
                Busca y vincula productos automáticamente por SKU, nombre y similitud
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <Package className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800">Factura Completa</h3>
              <p className="text-sm text-green-600 mt-1">
                Genera factura borrador con productos vinculados y datos completos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button 
            onClick={() => router.push('/dashboard/purchases')}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Ir al Sistema de Compras
          </Button>
          
          <div className="text-sm text-gray-500">
            <p>Redirigiendo automáticamente en 3 segundos...</p>
          </div>
        </div>

        {/* What's New Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              ¿Qué ha cambiado?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Sistema Unificado</h4>
                <p className="text-sm text-gray-600">Ambos procesadores (OCR e IA) ahora están en una sola interfaz</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Matching Inteligente Opcional</h4>
                <p className="text-sm text-gray-600">Puedes habilitar o deshabilitar el matching automático de productos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Mejor Experiencia</h4>
                <p className="text-sm text-gray-600">Una sola URL para todas las funcionalidades de procesamiento de facturas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 