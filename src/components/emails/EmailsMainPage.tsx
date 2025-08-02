'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Bot, 
  FileText, 
  BarChart3,
  Brain,
  MessageSquare,
  Zap,
  Settings,
  Sliders,
  Bug
} from 'lucide-react';
import EmailDashboard from '@/components/emails/EmailDashboard';
import TemplateManager from '@/components/emails/TemplateManager';
import EmailAnalysisSettings from '@/components/emails/EmailAnalysisSettings';
import EmailAnalysisDebugger from '@/components/emails/EmailAnalysisDebugger';

export default function EmailsMainPage() {
  const [activeTab, setActiveTab] = useState('analysis');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Principal */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              📧 Sistema de Correos Electrónicos
            </h1>
            <p className="text-gray-600 mt-1">
              Análisis automático con IA y gestión de plantillas profesionales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              IA Integrada
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Plantillas Dinámicas
            </Badge>
          </div>
        </div>

        {/* Sistema de Pestañas */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-6 w-6 text-blue-600" />
              Centro de Control de Emails
            </CardTitle>
            <CardDescription>
              Gestiona el análisis automático de correos y las plantillas personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger 
                  value="analysis" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                >
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">Análisis Automático</span>
                  <span className="sm:hidden">Análisis</span>
                  <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-700">
                    IA
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="templates" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Plantillas de Email</span>
                  <span className="sm:hidden">Plantillas</span>
                  <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-700">
                    PRO
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Configuración</span>
                  <span className="sm:hidden">Config</span>
                  <Badge variant="secondary" className="ml-1 text-xs bg-purple-100 text-purple-700">
                    NEW
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="debug" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-600 data-[state=active]:text-white"
                >
                  <Bug className="h-4 w-4" />
                  <span className="hidden sm:inline">Diagnóstico</span>
                  <span className="sm:hidden">Debug</span>
                  <Badge variant="secondary" className="ml-1 text-xs bg-red-100 text-red-700">
                    FIX
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Contenido de Análisis Automático */}
              <TabsContent value="analysis" className="mt-6 space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Brain className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Análisis Inteligente con ChatGPT
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Sistema automatizado que analiza correos 4 veces al día y genera reportes profesionales
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      Análisis de Sentimientos
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      Detección de Urgencias
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Recomendaciones IA
                    </div>
                  </div>
                </div>
                
                {/* Componente de Análisis */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <EmailDashboard />
                </div>
              </TabsContent>

              {/* Contenido de Plantillas */}
              <TabsContent value="templates" className="mt-6 space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Plantillas Profesionales
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Crea y personaliza plantillas de email con variables dinámicas para clientes y proveedores
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="h-4 w-4 text-green-500" />
                      Variables Dinámicas
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FileText className="h-4 w-4 text-green-500" />
                      Editor Visual
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Zap className="h-4 w-4 text-green-500" />
                      Vista Previa en Tiempo Real
                    </div>
                  </div>
                </div>

                {/* Componente de Plantillas */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <TemplateManager />
                </div>
              </TabsContent>

              {/* Contenido de Configuración */}
              <TabsContent value="settings" className="mt-6 space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Configuración del Análisis
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Personaliza los parámetros del análisis automático y configura el prompt de ChatGPT
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Sliders className="h-4 w-4 text-purple-500" />
                      Parámetros Personalizables
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Brain className="h-4 w-4 text-purple-500" />
                      Prompt Personalizado
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Zap className="h-4 w-4 text-purple-500" />
                      Configuración Avanzada
                    </div>
                  </div>
                </div>

                {/* Componente de Configuración */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <EmailAnalysisSettings />
                </div>
              </TabsContent>

              {/* Contenido de Diagnóstico */}
              <TabsContent value="debug" className="mt-6 space-y-4">
                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-xl border border-red-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Bug className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Diagnóstico del Sistema
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Herramientas para identificar y resolver problemas en el análisis de correos
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Settings className="h-4 w-4 text-red-500" />
                      Estado del Sistema
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MessageSquare className="h-4 w-4 text-red-500" />
                      Test de Conexiones
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Zap className="h-4 w-4 text-red-500" />
                      Guía de Resolución
                    </div>
                  </div>
                </div>

                {/* Componente de Diagnóstico */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <EmailAnalysisDebugger />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 