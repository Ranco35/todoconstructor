'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

import { checkEmailConfiguration } from '@/actions/emails/email-actions';

interface EmailStatus {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export default function EmailConfiguration() {
  const [configStatus, setConfigStatus] = useState<EmailStatus | null>(null);
  const [checkingConfig, setCheckingConfig] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  // Verificar configuración
  const handleCheckConfiguration = async () => {
    setCheckingConfig(true);
    setConfigStatus(null);

    try {
      const result = await checkEmailConfiguration();
      
      setConfigStatus({
        type: result.success ? 'success' : 'error',
        message: result.message,
        details: result.success 
          ? 'Gmail SMTP está configurado correctamente' 
          : 'Revisa las variables de entorno GMAIL_USER y GMAIL_APP_PASSWORD'
      });
    } catch (error) {
      setConfigStatus({
        type: 'error',
        message: 'Error verificando configuración',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setCheckingConfig(false);
    }
  };

  // Componente para mostrar alertas
  const StatusAlert = ({ status }: { status: EmailStatus }) => (
    <Alert className={`mt-4 ${
      status.type === 'success' ? 'border-green-200 bg-green-50' :
      status.type === 'error' ? 'border-red-200 bg-red-50' :
      status.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
      'border-blue-200 bg-blue-50'
    }`}>
      <div className="flex items-start space-x-2">
        {status.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
        {status.type === 'error' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
        {status.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />}
        {status.type === 'info' && <Mail className="h-4 w-4 text-blue-600 mt-0.5" />}
        
        <div className="flex-1">
          <AlertDescription className="font-medium">
            {status.message}
          </AlertDescription>
          {status.details && (
            <AlertDescription className="text-sm text-gray-600 mt-1">
              {status.details}
            </AlertDescription>
          )}
        </div>
      </div>
    </Alert>
  );

  // Verificar si las variables están configuradas
  const hasEmailUser = process.env.NEXT_PUBLIC_GMAIL_USER || process.env.GMAIL_USER;
  const hasEmailPassword = process.env.NEXT_PUBLIC_GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <span>Configuración de Email</span>
        </CardTitle>
        <CardDescription>
          Gestión del sistema de envío de correos electrónicos con Gmail SMTP
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estado de configuración */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${configStatus?.type === 'success' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>
                <p className="font-medium text-gray-900">Estado del Sistema</p>
                <p className="text-sm text-gray-600">
                  {configStatus?.type === 'success' ? 'Configurado y funcionando' : 'Pendiente de verificación'}
                </p>
              </div>
            </div>
            <Badge variant={configStatus?.type === 'success' ? 'default' : 'secondary'}>
              {configStatus?.type === 'success' ? '✅ Activo' : '⚠️ Sin verificar'}
            </Badge>
          </div>

          {/* Información de configuración */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Variables de Entorno
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${hasEmailUser ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium text-sm">GMAIL_USER</p>
                    <p className="text-xs text-gray-500">reservas@termasllifen.cl</p>
                  </div>
                </div>
                <Badge variant={hasEmailUser ? 'default' : 'destructive'}>
                  {hasEmailUser ? 'Configurado' : 'Faltante'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${hasEmailPassword ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium text-sm">GMAIL_APP_PASSWORD</p>
                    <p className="text-xs text-gray-500">App Password de Gmail</p>
                  </div>
                </div>
                <Badge variant={hasEmailPassword ? 'default' : 'destructive'}>
                  {hasEmailPassword ? 'Configurado' : 'Faltante'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-sm">GMAIL_HOST</p>
                    <p className="text-xs text-gray-500">smtp.gmail.com</p>
                  </div>
                </div>
                <Badge variant="default">smtp.gmail.com</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-sm">GMAIL_PORT</p>
                    <p className="text-xs text-gray-500">Puerto SMTP</p>
                  </div>
                </div>
                <Badge variant="default">587</Badge>
              </div>
            </div>
          </div>

          {/* Instrucciones rápidas */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">📋 Instrucciones de Configuración</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Crear archivo <code className="bg-blue-100 px-1 rounded">.env.local</code> en la raíz del proyecto</p>
              <p>2. Generar App Password en Gmail para reservas@termasllifen.cl</p>
              <p>3. Agregar las variables de entorno</p>
              <p>4. Reiniciar el servidor Next.js</p>
            </div>
          </div>

          {/* Botón de verificación */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleCheckConfiguration}
              disabled={checkingConfig}
              className="w-full"
              size="lg"
            >
              {checkingConfig ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Verificando Configuración...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Verificar Configuración de Email
                </>
              )}
            </Button>
          </div>

          {/* Resultado de verificación */}
          {configStatus && <StatusAlert status={configStatus} />}
        </div>
      </CardContent>
    </Card>
  );
} 