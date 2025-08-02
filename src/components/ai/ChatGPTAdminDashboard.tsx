'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  BarChart3, 
  Key,
  Loader2,
  ExternalLink,
  RefreshCw,
  Activity,
  Database,
  Globe,
  Code,
  Languages,
  FileText,
  Brain,
  Clock,
  Server,
  Monitor,
  DollarSign,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { getChatGPTAdminStats, performDetailedHealthCheck, type ChatGPTAdminStats } from '@/actions/ai/chatgpt-admin-actions';
import { checkOpenAIStatus } from '@/actions/ai/openai-actions';
import TokenUsageTracker from './TokenUsageTracker';

interface ChatGPTAdminDashboardProps {
  currentUser: any;
}

export default function ChatGPTAdminDashboard({ currentUser }: ChatGPTAdminDashboardProps) {
  const [stats, setStats] = useState<ChatGPTAdminStats | null>(null);
  const [healthCheck, setHealthCheck] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailedCheck, setIsDetailedCheck] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Cargar datos iniciales
  useEffect(() => {
    loadAllData();
  }, []);

  // Cargar todos los datos
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Cargando datos del dashboard ChatGPT...');
      
      const adminStats = await getChatGPTAdminStats();
      setStats(adminStats);
      setLastRefresh(new Date());
      
      console.log('✅ Datos del dashboard cargados:', adminStats);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificación detallada
  const performHealthCheckAction = async () => {
    setIsDetailedCheck(true);
    try {
      console.log('🏥 Ejecutando verificación detallada...');
      
      const healthResult = await performDetailedHealthCheck();
      setHealthCheck(healthResult);
      
      // Actualizar stats
      if (stats) {
        setStats({
          ...stats,
          isWorking: healthResult.success,
          lastCheck: new Date(),
          error: healthResult.error
        });
      }
      
      console.log('✅ Verificación de salud completada:', healthResult);
    } catch (error) {
      console.error('❌ Error en verificación de salud:', error);
    } finally {
      setIsDetailedCheck(false);
    }
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="secondary" className="bg-gray-100"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Cargando...</Badge>;
    }
    
    if (!stats) {
      return <Badge variant="secondary" className="bg-gray-100"><AlertCircle className="h-3 w-3 mr-1" />Sin datos</Badge>;
    }
    
    if (!stats.isConfigured) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />No Configurada</Badge>;
    }
    
    if (stats.isWorking) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Operativa</Badge>;
    }
    
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Estado Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Estado API</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats?.isWorking ? 'Funcionando' : 'Desconectada'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Key: {stats?.apiKeyStatus === 'valid' ? '✅ Válida' : stats?.apiKeyStatus === 'missing' ? '❌ Faltante' : '⚠️ Inválida'}
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                {stats?.isWorking ? (
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Modelo Activo</p>
                <p className="text-xl font-bold text-purple-900">
                  {stats?.configuration.defaultModel || 'N/A'}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {stats?.configuration.availableModels.length || 0} modelos disponibles
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Funciones</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats ? Object.values(stats.features).filter(Boolean).length : 0}/5
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Servicios operativos
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Endpoints</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats ? Object.keys(stats.endpoints).length : 0}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  APIs disponibles
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Server className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado General y Última Actualización */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Estado:</span>
            {getStatusBadge()}
          </div>
          <div className="text-sm text-gray-500">
            Última actualización: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={loadAllData}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>
          <Button
            onClick={performHealthCheckAction}
            disabled={isDetailedCheck || isLoading}
            variant="outline"
            size="sm"
          >
            {isDetailedCheck ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Monitor className="h-4 w-4 mr-2" />
            )}
            Test Completo
          </Button>
        </div>
      </div>

      {/* Mensajes de Estado */}
      {stats?.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Error:</strong> {stats.error}
          </AlertDescription>
        </Alert>
      )}

      {stats?.isWorking && !stats.error && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            ✅ La API de ChatGPT está funcionando correctamente. Todas las funciones de IA están disponibles.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="token-usage" className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            Gastos Tokens
          </TabsTrigger>
          <TabsTrigger value="functions">Funciones</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="health">Diagnóstico</TabsTrigger>
          <TabsTrigger value="docs">Documentación</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Estado General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API Key Configurada</span>
                  <Badge variant={stats?.isConfigured ? "default" : "destructive"}>
                    {stats?.isConfigured ? "Sí" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conectividad</span>
                  <Badge variant={stats?.isWorking ? "default" : "destructive"}>
                    {stats?.isWorking ? "Conectada" : "Desconectada"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estado API Key</span>
                  <Badge variant={stats?.apiKeyStatus === 'valid' ? "default" : "destructive"}>
                    {stats?.apiKeyStatus === 'valid' ? "Válida" : 
                     stats?.apiKeyStatus === 'missing' ? "Faltante" : "Inválida"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Última Verificación</span>
                  <span className="text-sm text-gray-900">
                    {stats?.lastCheck ? stats.lastCheck.toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Información de Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Modelo Por Defecto</span>
                  <Badge variant="outline">
                    {stats?.configuration.defaultModel || 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Modelos Disponibles</span>
                  <span className="text-sm text-gray-900">
                    {stats?.configuration.availableModels.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Funciones Activas</span>
                  <span className="text-sm text-gray-900">
                    {stats ? Object.values(stats.features).filter(Boolean).length : 0} de 5
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Endpoints API</span>
                  <span className="text-sm text-gray-900">
                    {stats ? Object.keys(stats.endpoints).length : 0} disponibles
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Button asChild variant="outline">
                  <Link href="/dashboard/ai-assistant">
                    <Zap className="h-4 w-4 mr-2" />
                    Probar IA
                  </Link>
                </Button>

                <Button 
                  onClick={() => setActiveTab('token-usage')}
                  variant="outline"
                  className="bg-green-50 border-green-200 hover:bg-green-100"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ver Gastos
                </Button>

                <Button asChild variant="outline">
                  <Link href="/dashboard/configuration">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Link>
                </Button>

                <Button asChild variant="outline">
                  <Link href="https://platform.openai.com/docs" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Docs OpenAI
                  </Link>
                </Button>

                <Button asChild variant="outline">
                  <Link href="https://platform.openai.com/usage" target="_blank">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Usage OpenAI
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nueva tab de Gastos de Tokens */}
        <TabsContent value="token-usage" className="space-y-6">
          <TokenUsageTracker currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="functions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Estado de Funciones de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats && Object.entries(stats.features).map(([key, isActive]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-sm font-medium capitalize">
                        {key === 'chat' ? '💬 Chat Conversacional' :
                         key === 'analysis' ? '🔍 Análisis de Texto' :
                         key === 'summarization' ? '📝 Resúmenes' :
                         key === 'translation' ? '🌐 Traducción' :
                         key === 'codeAssistance' ? '💻 Asistencia Código' : key}
                      </span>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Endpoints de API Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats && Object.entries(stats.endpoints).map(([key, endpoint]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{key}</p>
                      <p className="text-sm text-gray-600">{endpoint.path}</p>
                    </div>
                    <Badge variant={endpoint.available ? "default" : "secondary"}>
                      {endpoint.available ? "Disponible" : "No Disponible"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Diagnóstico de Salud del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthCheck ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        healthCheck.checks?.apiKey ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {healthCheck.checks?.apiKey ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">API Key</p>
                      <p className="text-sm font-medium">
                        {healthCheck.checks?.apiKey ? 'Válida' : 'Inválida'}
                      </p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        healthCheck.checks?.connection ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {healthCheck.checks?.connection ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">Conexión</p>
                      <p className="text-sm font-medium">
                        {healthCheck.checks?.connection ? 'Conectada' : 'Desconectada'}
                      </p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        healthCheck.checks?.chatCompletion ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {healthCheck.checks?.chatCompletion ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">Chat</p>
                      <p className="text-sm font-medium">
                        {healthCheck.checks?.chatCompletion ? 'Funcional' : 'Error'}
                      </p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center bg-blue-100">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-600">Tiempo</p>
                      <p className="text-sm font-medium">{healthCheck.checks?.responseTime || 'N/A'}ms</p>
                    </div>
                  </div>

                  {healthCheck.error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        <strong>Error en diagnóstico:</strong> {healthCheck.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No hay datos de diagnóstico disponibles</p>
                  <Button onClick={performHealthCheckAction} disabled={isDetailedCheck}>
                    {isDetailedCheck ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Monitor className="h-4 w-4 mr-2" />
                    )}
                    Ejecutar Diagnóstico
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Documentación OpenAI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Documentación completa de la API de OpenAI
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="https://platform.openai.com/docs" target="_blank">
                    Abrir Docs OpenAI
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Usage Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Dashboard oficial de uso y facturación de OpenAI
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="https://platform.openai.com/usage" target="_blank">
                    Ver Usage OpenAI
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Code className="h-4 w-4 mr-2" />
                  Solución de Problemas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Guía para resolver problemas comunes
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Ver Troubleshooting
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 