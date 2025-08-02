'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, QrCode, CheckCircle, RefreshCw, Zap, Send, Loader2, Trash2 } from 'lucide-react';

export default function WhatsAppLinkClient() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('¡Hola! Este es un mensaje de prueba desde AdminTermas 🏨');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      console.log('🔄 Verificando estado de WhatsApp...');
      setLoading(true);
      
      const response = await fetch('/api/whatsapp/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Estado obtenido:', data);
        
        // Actualizar estado basado en la respuesta del servidor
        const isConnected = data.connected || data.clientConnected || data.managerConnected || false;
        const connectionStatus = data.status || 'disconnected';
        
        setStatus(isConnected ? 'connected' : 'disconnected');
        
        if (data.qrCode) {
          setQrCode(data.qrCode);
        } else {
          setQrCode(null);
        }
        
        setLoading(false);
      } else {
        console.error('❌ Error obteniendo estado:', response.status, response.statusText);
        setStatus('disconnected');
        setQrCode(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error en fetchStatus:', error);
      setStatus('disconnected');
      setQrCode(null);
      setLoading(false);
      
      // Intentar reconectar después de un breve delay
      setTimeout(() => {
        console.log('🔄 Reintentando conexión...');
        fetchStatus();
      }, 5000);
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      console.log('🚀 Generando QR...');
      const response = await fetch('/api/whatsapp/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Respuesta Generate QR:', data);
        
        if (data.success) {
          console.log('✅ Inicialización exitosa');
          // Actualizar estado inmediatamente
          await fetchStatus();
        } else {
          console.error('❌ Error en generación:', data.error);
          setLoading(false);
        }
      } else {
        console.error('❌ Error HTTP en generación:', response.status, response.statusText);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error generando QR:', error);
      setLoading(false);
    }
  };

  const handleForceInit = async () => {
    setLoading(true);
    try {
      console.log('🔄 Forzando reconexión...');
      const response = await fetch('/api/whatsapp/reconnect', {
        method: 'POST'
      });
      
      const data = await response.json();
      console.log('Respuesta Force Init:', data);
      
      if (data.success) {
        console.log('✅ Reconexión exitosa');
        await fetchStatus();
      } else {
        console.error('❌ Error en reconexión:', data.error);
      }
    } catch (error) {
      console.error('❌ Error en reconexión:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      setTestResult('❌ Por favor ingresa un número y mensaje');
      return;
    }

    setTestLoading(true);
    setTestResult(null);
    try {
      console.log('📤 Enviando mensaje de prueba...');
      const res = await fetch('/api/whatsapp/test-message', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: testPhone,
          message: testMessage
        }),
        cache: 'no-store'
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('📋 Respuesta del servidor:', data);
        
        if (data.success) {
          setTestResult('✅ Mensaje enviado exitosamente!');
          console.log('✅ Mensaje enviado exitosamente');
        } else {
          setTestResult(`❌ Error: ${data.error}`);
          console.error('❌ Error del servidor:', data.error);
        }
      } else {
        const errorText = await res.text();
        setTestResult(`❌ Error HTTP ${res.status}: ${res.statusText}`);
        console.error('❌ Error HTTP:', res.status, res.statusText, errorText);
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje de prueba:', error);
      setTestResult('❌ Error de conectividad al enviar mensaje');
    } finally {
      setTestLoading(false);
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    try {
      console.log('🔴 Limpiando autenticación...');
      const response = await fetch('/api/whatsapp/unlink', {
        method: 'POST'
      });
      
      const data = await response.json();
      console.log('Respuesta Unlink:', data);
      
      if (data.success) {
        console.log('✅ Autenticación limpiada exitosamente');
        // Esperar un momento y actualizar estado
        setTimeout(async () => {
          await fetchStatus();
        }, 3000);
      } else {
        console.error('❌ Error limpiando autenticación:', data.error);
      }
    } catch (error) {
      console.error('❌ Error limpiando autenticación:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = async () => {
    try {
      console.log('🔍 Verificando estado de autenticación...');
      const response = await fetch('/api/whatsapp/debug');
      const data = await response.json();
      
      if (data.success) {
        setDebugInfo(data.debug);
        console.log('📊 Debug info:', data.debug);
      }
    } catch (error) {
      console.error('❌ Error en debug:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Actualizar estado cada 3 segundos
    const interval = setInterval(fetchStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-lg mx-auto mt-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vincular WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <Loader2 className="animate-spin" size={20} />
              Cargando estado...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-500 mb-4">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          {status === 'connected' && (
            <div className="flex flex-col items-center gap-4 mb-4">
              <CheckCircle className="text-green-600" size={48} />
              <div className="text-lg font-semibold text-green-700">¡WhatsApp vinculado correctamente!</div>
              <Button variant="outline" onClick={handleUnlink} disabled={loading}>
                Desvincular WhatsApp
              </Button>
            </div>
          )}
          {status === 'disconnected' && qrCode && (
            <div className="flex flex-col items-center gap-4 mb-4">
              <QrCode className="text-green-600" size={48} />
              <img src={qrCode} alt="QR para vincular WhatsApp" className="w-56 h-56 border rounded" />
              <div className="text-center text-base font-medium">
                1. Abre WhatsApp en tu teléfono<br />
                2. Ve a <b>Configuración &rarr; Dispositivos vinculados</b><br />
                3. Toca <b>Vincular un dispositivo</b><br />
                4. Escanea este código QR<br />
              </div>
            </div>
          )}
          {status === 'disconnected' && !qrCode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="text-lg font-semibold text-yellow-700">WhatsApp no está vinculado</div>
                <div className="text-base text-gray-500 mb-4">No hay QR disponible. Intenta generar uno nuevo.</div>
                
                {/* Información sobre por qué no hay QR */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="font-medium text-blue-800 mb-2">ℹ️ ¿Por qué no aparece el QR?</div>
                  <div className="text-sm text-blue-700">
                    Si WhatsApp ya tiene una sesión guardada, se conectará automáticamente <strong>sin mostrar QR</strong>. 
                    Para generar un nuevo QR, necesitas <strong>"Limpiar Autenticación"</strong> primero.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <Button
                    onClick={handleGenerateQR}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Generar QR
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleForceInit}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reconectando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Forzar Reconexión
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleUnlink}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Limpiando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpiar Autenticación
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleDebug}
                    variant="outline"
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Debug Info
                  </Button>
                </div>

                {/* Mostrar información de debug */}
                {debugInfo && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="font-medium text-purple-800 mb-2">🔍 Estado de Autenticación</div>
                    <div className={`text-sm p-2 rounded ${debugInfo.authExists ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                      <strong>{debugInfo.explanation}</strong>
                    </div>
                    <div className="text-xs text-purple-600 mt-2">
                      <div>• Auth Path: {debugInfo.authExists ? '✅ Existe' : '❌ No existe'}</div>
                      <div>• Session Path: {debugInfo.sessionExists ? '✅ Existe' : '❌ No existe'}</div>
                      {debugInfo.authFiles.length > 0 && (
                        <div>• Archivos: {debugInfo.authFiles.join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
          )}
        </CardContent>
      </Card>

      {/* Formulario de prueba cuando está conectado */}
      {status === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle>Probar Envío de Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número de teléfono (con código país)</label>
              <Input
                type="text"
                placeholder="Ej: +56912345678"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mensaje</label>
              <Textarea
                placeholder="Escribe tu mensaje de prueba..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleTestMessage} 
              disabled={testLoading || !testPhone.trim() || !testMessage.trim()}
              className="w-full"
            >
              <Send className="mr-2" size={16} />
              {testLoading ? 'Enviando...' : 'Enviar Mensaje de Prueba'}
            </Button>
            {testResult && (
              <div className={`p-3 rounded ${testResult.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {testResult}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 