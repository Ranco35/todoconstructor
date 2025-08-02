'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Info,
  Terminal,
  Clock,
  Mail,
  Bot,
  Database,
  Wifi
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemStatus {
  component: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
  lastCheck?: string;
}

export default function EmailAnalysisDebugger() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [checking, setChecking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const checkSystemStatus = async () => {
    setChecking(true);
    const statusChecks: SystemStatus[] = [];

    try {
      // 1. Verificar variables de entorno del servidor
      console.log('🔍 Verificando variables de entorno del servidor...');
      
      let envVars = {
        OPENAI_API_KEY: false,
        GMAIL_USER: false,
        GMAIL_APP_PASSWORD: false,
        SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      };

      // Verificar variables del servidor usando API
      try {
        const envResponse = await fetch('/api/check-env');
        if (envResponse.ok) {
          const envData = await envResponse.json();
          console.log('🔍 Respuesta de API check-env:', envData);
          
          envVars.OPENAI_API_KEY = envData.environment?.openai?.configured || false;
          envVars.GMAIL_USER = envData.environment?.gmail?.configured || false;
          envVars.GMAIL_APP_PASSWORD = envData.environment?.gmail?.configured || false;
        }
      } catch (error) {
        console.error('❌ Error verificando variables del servidor:', error);
      }

      statusChecks.push({
        component: 'Variables de Entorno',
        status: envVars.OPENAI_API_KEY && envVars.GMAIL_USER && envVars.GMAIL_APP_PASSWORD && envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY ? 'ok' : 'error',
        message: envVars.OPENAI_API_KEY && envVars.GMAIL_USER && envVars.GMAIL_APP_PASSWORD ? 'Todas las variables configuradas' : 'Variables faltantes detectadas',
        details: `OpenAI: ${envVars.OPENAI_API_KEY ? '✅' : '❌'}, Gmail: ${envVars.GMAIL_USER && envVars.GMAIL_APP_PASSWORD ? '✅' : '❌'}, Supabase: ${envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY ? '✅' : '❌'}`,
        lastCheck: new Date().toLocaleTimeString()
      });

      // 2. Verificar conexión a APIs
      console.log('🔍 Verificando APIs...');
      
      // Test Supabase
      try {
        const supabaseResponse = await fetch('/api/emails/analyze', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        statusChecks.push({
          component: 'Supabase Database',
          status: supabaseResponse.ok ? 'ok' : 'error',
          message: supabaseResponse.ok ? 'Conexión exitosa' : 'Error de conexión',
          details: `Status: ${supabaseResponse.status}`,
          lastCheck: new Date().toLocaleTimeString()
        });
      } catch (error) {
        statusChecks.push({
          component: 'Supabase Database',
          status: 'error',
          message: 'Error de red',
          details: error instanceof Error ? error.message : 'Error desconocido',
          lastCheck: new Date().toLocaleTimeString()
        });
      }

      // 3. Verificar tabla EmailAnalysis
      console.log('🔍 Verificando tabla EmailAnalysis...');
      try {
        const tableResponse = await fetch('/api/emails/analysis-notification', {
          method: 'GET'
        });
        
        statusChecks.push({
          component: 'Tabla EmailAnalysis',
          status: tableResponse.ok ? 'ok' : 'warning',
          message: tableResponse.ok ? 'Tabla accesible' : 'Problema de acceso',
          details: `Response: ${tableResponse.status}`,
          lastCheck: new Date().toLocaleTimeString()
        });
      } catch (error) {
        statusChecks.push({
          component: 'Tabla EmailAnalysis',
          status: 'error',
          message: 'Error accediendo a tabla',
          details: error instanceof Error ? error.message : 'Error desconocido',
          lastCheck: new Date().toLocaleTimeString()
        });
      }

      // 4. Verificar configuración de análisis
      console.log('🔍 Verificando configuración...');
      const savedSettings = localStorage.getItem('emailAnalysisSettings');
      statusChecks.push({
        component: 'Configuración de Análisis',
        status: savedSettings ? 'ok' : 'warning',
        message: savedSettings ? 'Configuración personalizada cargada' : 'Usando configuración por defecto',
        details: savedSettings ? `${JSON.parse(savedSettings).customPrompt?.length || 0} caracteres en prompt` : 'Configuración estándar',
        lastCheck: new Date().toLocaleTimeString()
      });

      // 5. Verificar último análisis
      console.log('🔍 Verificando último análisis...');
      const lastAnalysisTime = localStorage.getItem('lastEmailAnalysisTime');
      const timeSinceLastAnalysis = lastAnalysisTime ? 
        (Date.now() - parseInt(lastAnalysisTime)) / (1000 * 60 * 60) : 
        null;

      statusChecks.push({
        component: 'Último Análisis',
        status: !timeSinceLastAnalysis ? 'warning' : 
                timeSinceLastAnalysis < 6 ? 'ok' : 'warning',
        message: !timeSinceLastAnalysis ? 'No se ha ejecutado análisis' :
                 timeSinceLastAnalysis < 1 ? 'Ejecutado recientemente' :
                 timeSinceLastAnalysis < 6 ? `Hace ${Math.round(timeSinceLastAnalysis)} horas` :
                 'Análisis desactualizado',
        details: lastAnalysisTime ? new Date(parseInt(lastAnalysisTime)).toLocaleString() : 'Nunca',
        lastCheck: new Date().toLocaleTimeString()
      });

      setSystemStatus(statusChecks);
      
      // Mostrar resumen
      const errors = statusChecks.filter(s => s.status === 'error').length;
      const warnings = statusChecks.filter(s => s.status === 'warning').length;
      
      if (errors > 0) {
        toast.error(`${errors} errores críticos encontrados`);
        setLastError(`Se encontraron ${errors} errores críticos que requieren atención`);
      } else if (warnings > 0) {
        toast.warning(`${warnings} advertencias encontradas`);
        setLastError(`Se encontraron ${warnings} advertencias menores`);
      } else {
        toast.success('Sistema funcionando correctamente');
        setLastError(null);
      }

    } catch (error) {
      console.error('Error en diagnóstico:', error);
      toast.error('Error ejecutando diagnóstico');
      setLastError(error instanceof Error ? error.message : 'Error desconocido en diagnóstico');
    } finally {
      setChecking(false);
    }
  };

  // Ejecutar diagnóstico al montar el componente
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const testEmailAnalysis = async () => {
    toast.loading('Ejecutando test de análisis...');
    try {
      const response = await fetch('/api/emails/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        toast.success('Test de análisis exitoso');
        localStorage.setItem('lastEmailAnalysisTime', Date.now().toString());
        checkSystemStatus(); // Re-verificar estado
      } else {
        const errorText = await response.text();
        toast.error(`Test falló: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      toast.error('Error ejecutando test');
      console.error('Test error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bug className="w-6 h-6" />
            Diagnóstico del Sistema
          </h2>
          <p className="text-gray-600 mt-1">
            Verifica el estado de los componentes del análisis de correos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={checkSystemStatus}
            disabled={checking}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            Verificar Estado
          </Button>
          <Button
            onClick={testEmailAnalysis}
            className="flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" />
            Test de Análisis
          </Button>
        </div>
      </div>

      {/* Resumen de Estado */}
      {systemStatus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">
                    {systemStatus.filter(s => s.status === 'ok').length} OK
                  </div>
                  <div className="text-sm text-green-700">Funcionando</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-900">
                    {systemStatus.filter(s => s.status === 'warning').length} Advertencias
                  </div>
                  <div className="text-sm text-yellow-700">Revisar</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">
                    {systemStatus.filter(s => s.status === 'error').length} Errores
                  </div>
                  <div className="text-sm text-red-700">Críticos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Principal */}
      {lastError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <XCircle className="w-5 h-5" />
              Error Principal Detectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">{lastError}</p>
          </CardContent>
        </Card>
      )}

      {/* Detalles del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Estado Detallado de Componentes
          </CardTitle>
          <CardDescription>
            Información detallada sobre cada componente del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemStatus.map((status, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${getStatusColor(status.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status.status)}
                    <div>
                      <div className="font-medium text-gray-900">{status.component}</div>
                      <div className="text-sm text-gray-600">{status.message}</div>
                      {status.details && (
                        <div className="text-xs text-gray-500 mt-1">{status.details}</div>
                      )}
                    </div>
                  </div>
                  {status.lastCheck && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {status.lastCheck}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guía de Resolución */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Guía de Resolución de Problemas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Error de Conexión Gmail
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Verificar variables GMAIL_USER y GMAIL_APP_PASSWORD</li>
                <li>• Confirmar que Gmail API está habilitada</li>
                <li>• Revisar que la contraseña de aplicación es correcta</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Error de ChatGPT
              </h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Verificar OPENAI_API_KEY configurada</li>
                <li>• Comprobar límites de uso de la API</li>
                <li>• Revisar que el prompt no sea muy largo</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Error de Base de Datos
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Verificar conexión a Supabase</li>
                <li>• Confirmar que tabla EmailAnalysis existe</li>
                <li>• Revisar permisos RLS</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 