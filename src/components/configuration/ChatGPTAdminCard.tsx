'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { checkOpenAIStatus } from '@/actions/ai/openai-actions';
import { getChatGPTAdminStats, performDetailedHealthCheck, type ChatGPTAdminStats } from '@/actions/ai/chatgpt-admin-actions';

interface ChatGPTAdminCardProps {
  currentUser: any;
}

export default function ChatGPTAdminCard({ currentUser }: ChatGPTAdminCardProps) {
  const [stats, setStats] = useState<ChatGPTAdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailedCheck, setIsDetailedCheck] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Verificar si el usuario es administrador
  const isAdmin = currentUser?.role === 'SUPER_USER' || currentUser?.role === 'ADMINISTRADOR';

  // Si no es administrador, no mostrar nada
  if (!isAdmin) {
    return null;
  }

  // Verificar el estado de ChatGPT
  const checkStatus = async () => {
    setIsLoading(true);
    try {
      console.log('🤖 Obteniendo estadísticas de ChatGPT...');
      
      const adminStats = await getChatGPTAdminStats();
      setStats(adminStats);
      setLastRefresh(new Date());
      
      console.log('✅ Estadísticas de ChatGPT obtenidas:', adminStats);
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de ChatGPT:', error);
      setStats({
        isConfigured: false,
        isWorking: false,
        apiKeyStatus: 'invalid',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido',
        configuration: {
          hasApiKey: false,
          defaultModel: 'gpt-3.5-turbo',
          availableModels: []
        },
        features: {
          chat: false,
          analysis: false,
          summarization: false,
          translation: false,
          codeAssistance: false
        },
        endpoints: {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verificación detallada de salud
  const performHealthCheck = async () => {
    setIsDetailedCheck(true);
    try {
      console.log('🏥 Realizando verificación detallada...');
      
      const healthResult = await performDetailedHealthCheck();
      
      // Actualizar stats con los resultados de la verificación
      if (stats) {
        setStats({
          ...stats,
          isWorking: healthResult.success,
          lastCheck: new Date(),
          error: healthResult.error
        });
      }
      
      console.log('✅ Verificación detallada completada:', healthResult);
      
    } catch (error) {
      console.error('❌ Error en verificación detallada:', error);
    } finally {
      setIsDetailedCheck(false);
    }
  };

  // Verificar estado al cargar el componente
  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="secondary" className="bg-gray-100"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Verificando...</Badge>;
    }
    
    if (!stats) {
      return <Badge variant="secondary" className="bg-gray-100"><AlertCircle className="h-3 w-3 mr-1" />Cargando...</Badge>;
    }
    
    if (!stats.isConfigured) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />No Configurada</Badge>;
    }
    
    if (stats.isWorking) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Operativa</Badge>;
    }
    
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
  };

  const getStatusIcon = () => {
    if (stats?.isWorking) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    
    if (!stats?.isConfigured) {
      return <Key className="h-5 w-5 text-gray-400" />;
    }
    
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <Link href="/dashboard/chatgpt-admin" className="block">
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  API ChatGPT
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Administración y Monitoreo
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge()}
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Estado Actual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estado de API</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats?.isWorking ? 'Funcionando' : 'Desconectada'}
                </p>
                {stats && (
                  <p className="text-xs text-gray-500 mt-1">
                    Key: {stats.apiKeyStatus === 'valid' ? '✅' : stats.apiKeyStatus === 'missing' ? '❌' : '⚠️'}
                  </p>
                )}
              </div>
              {getStatusIcon()}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Configuración</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats?.isConfigured ? 'Configurada' : 'Pendiente'}
                </p>
                {stats && (
                  <p className="text-xs text-gray-500 mt-1">
                    Modelo: {stats.configuration.defaultModel}
                  </p>
                )}
              </div>
              <Settings className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {stats?.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Error:</strong> {stats.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {stats?.isWorking && !stats.error && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              La API de ChatGPT está funcionando correctamente. Todas las funciones de IA están disponibles.
            </AlertDescription>
          </Alert>
        )}

        {/* Última Verificación */}
        {stats?.lastCheck && (
          <div className="text-xs text-gray-500 flex items-center">
            <RefreshCw className="h-3 w-3 mr-1" />
            Última verificación: {stats.lastCheck.toLocaleTimeString()}
          </div>
        )}

        {/* Indicador de acción */}
        <div className="text-center">
          <div className="inline-flex items-center text-purple-600 text-sm font-medium">
            <span>Clic para ver dashboard completo</span>
            <ExternalLink className="h-4 w-4 ml-2" />
          </div>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Funciones Disponibles
          </h4>
          {stats ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${stats.features.chat ? 'bg-green-400' : 'bg-red-400'}`}></div>
                Chat Conversacional
              </div>
              <div className="flex items-center text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${stats.features.analysis ? 'bg-green-400' : 'bg-red-400'}`}></div>
                Análisis de Texto
              </div>
              <div className="flex items-center text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${stats.features.summarization ? 'bg-green-400' : 'bg-red-400'}`}></div>
                Generación Resúmenes
              </div>
              <div className="flex items-center text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${stats.features.translation ? 'bg-green-400' : 'bg-red-400'}`}></div>
                Traducción Automática
              </div>
              <div className="flex items-center text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${stats.features.codeAssistance ? 'bg-green-400' : 'bg-red-400'}`}></div>
                Asistencia de Código
              </div>
              <div className="flex items-center text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${Object.keys(stats.endpoints).length > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                {Object.keys(stats.endpoints).length} Endpoints
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Cargando información de funciones...</div>
          )}
        </div>


      </CardContent>
    </Card>
    </Link>
  );
} 