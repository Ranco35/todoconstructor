'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  MessageCircle, 
  Play, 
  Pause,
  Wifi,
  WifiOff,
  Send,
  Users,
  BarChart3,
  Settings,
  QrCode,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BotStatus {
  isConnected: boolean;
  isReady: boolean;
  qrCode?: string;
  lastActivity?: string;
  messagesProcessed: number;
  errors: number;
  businessHours?: {
    current: boolean;
    start: string;
    end: string;
  };
  clientInfo?: {
    pushname?: string;
    phone?: string;
    platform?: string;
  };
}

export default function WhatsAppBotClient() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Estados para envío de mensajes
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'welcome'>('text');
  
  // Estados para broadcast
  const [broadcastNumbers, setBroadcastNumbers] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  
  const { toast } = useToast();

  // Cargar estado del bot al montar
  useEffect(() => {
    checkBotStatus();
    
    // Actualizar estado cada 30 segundos
    const interval = setInterval(checkBotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkBotStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();
      
      if (data.success) {
        setBotStatus(data.data);
      } else {
        console.error('Error obteniendo estado:', data.error);
        toast({
          title: "Error",
          description: `No se pudo obtener el estado del bot: ${data.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking bot status:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const initializeBot = async () => {
    setInitializing(true);
    try {
      const response = await fetch('/api/whatsapp/init', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBotStatus(data.data);
        toast({
          title: "Bot inicializado",
          description: "El bot de WhatsApp se ha inicializado correctamente",
        });
        
        // Actualizar estado después de unos segundos
        setTimeout(checkBotStatus, 3000);
      } else {
        toast({
          title: "Error",
          description: `No se pudo inicializar el bot: ${data.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initializing bot:', error);
      toast({
        title: "Error",
        description: "Error de conexión al inicializar el bot",
        variant: "destructive",
      });
    } finally {
      setInitializing(false);
    }
  };

  const sendSingleMessage = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
          type: messageType,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Mensaje enviado",
          description: `Mensaje enviado exitosamente a ${phoneNumber}`,
        });
        setMessage('');
        setPhoneNumber('');
      } else {
        toast({
          title: "Error",
          description: `No se pudo enviar el mensaje: ${data.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Error de conexión al enviar mensaje",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastNumbers.trim() || !broadcastMessage.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    const phoneNumbers = broadcastNumbers
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (phoneNumbers.length === 0) {
      toast({
        title: "Error",
        description: "No se encontraron números válidos",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumbers: phoneNumbers,
          message: broadcastMessage,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Broadcast enviado",
          description: `Enviado a ${data.data.totalSent} de ${data.data.totalNumbers} números`,
        });
        setBroadcastMessage('');
        setBroadcastNumbers('');
      } else {
        toast({
          title: "Error",
          description: `Error en broadcast: ${data.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: "Error",
        description: "Error de conexión al enviar broadcast",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-green-600" />
            Bot de WhatsApp
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión del bot de WhatsApp con respuestas automáticas powered by ChatGPT
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={checkBotStatus}
            disabled={loadingStatus}
          >
            {loadingStatus ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Actualizar
          </Button>
          
          {!botStatus?.isReady && (
            <Button 
              onClick={initializeBot}
              disabled={initializing}
            >
              {initializing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Inicializar Bot
            </Button>
          )}
        </div>
      </div>

      {/* Estado del Bot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estado</p>
                <p className="text-2xl font-bold">
                  {loadingStatus ? 'Verificando...' : 
                   botStatus?.isReady ? 'Operativo' : 'Desconectado'}
                </p>
              </div>
              {loadingStatus ? (
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              ) : botStatus?.isReady ? (
                <Wifi className="w-8 h-8 text-green-500" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mensajes Procesados</p>
                <p className="text-2xl font-bold">{botStatus?.messagesProcessed || 0}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horario Comercial</p>
                <p className="text-2xl font-bold">
                  {botStatus?.businessHours?.current ? 'Abierto' : 'Cerrado'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errores</p>
                <p className="text-2xl font-bold">{botStatus?.errors || 0}</p>
              </div>
              {(botStatus?.errors || 0) > 0 ? (
                <AlertCircle className="w-8 h-8 text-red-500" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code si está disponible */}
      {botStatus?.qrCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Código QR de WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="max-w-xs mx-auto">
              <img 
                src={botStatus.qrCode} 
                alt="QR Code de WhatsApp"
                className="w-full h-auto border rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-2">
                Escanea este código con tu WhatsApp para conectar el bot
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información del Cliente */}
      {botStatus?.clientInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Información del Cliente WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nombre</label>
                <p className="text-lg">{botStatus.clientInfo.pushname || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Teléfono</label>
                <p className="text-lg">{botStatus.clientInfo.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Plataforma</label>
                <p className="text-lg">{botStatus.clientInfo.platform || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pestañas principales */}
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send">Enviar Mensaje</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        {/* Tab de Envío Individual */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensaje Individual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Número de teléfono</label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+56912345678"
                  disabled={sendingMessage}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de mensaje</label>
                <Select value={messageType} onValueChange={(value: 'text' | 'welcome') => setMessageType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Mensaje personalizado</SelectItem>
                    <SelectItem value="welcome">Mensaje de bienvenida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {messageType === 'text' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensaje</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="min-h-[100px]"
                    disabled={sendingMessage}
                  />
                </div>
              )}

              <Button 
                onClick={sendSingleMessage}
                disabled={sendingMessage || !botStatus?.isReady}
                className="w-full"
              >
                {sendingMessage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Mensaje
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Broadcast */}
        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Envío Masivo (Broadcast)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Números de teléfono (uno por línea)</label>
                <Textarea
                  value={broadcastNumbers}
                  onChange={(e) => setBroadcastNumbers(e.target.value)}
                  placeholder="+56912345678&#10;+56987654321&#10;+56911111111"
                  className="min-h-[120px]"
                  disabled={sendingMessage}
                />
                <p className="text-xs text-gray-500">
                  Máximo 100 números. Un número por línea.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Mensaje para envío masivo..."
                  className="min-h-[100px]"
                  disabled={sendingMessage}
                />
              </div>

              <Button 
                onClick={sendBroadcast}
                disabled={sendingMessage || !botStatus?.isReady}
                className="w-full"
              >
                {sendingMessage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando broadcast...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Enviar Broadcast
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Configuración */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración del Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Horarios de Atención</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Apertura</label>
                      <p className="font-medium">{botStatus?.businessHours?.start || '08:00'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Cierre</label>
                      <p className="font-medium">{botStatus?.businessHours?.end || '22:00'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Estado Actual</h4>
                  <Badge variant={botStatus?.businessHours?.current ? 'default' : 'secondary'}>
                    {botStatus?.businessHours?.current ? 'Horario comercial' : 'Fuera de horario'}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Respuestas Automáticas</h4>
                  <p className="text-sm text-gray-600">
                    El bot está configurado para responder automáticamente usando ChatGPT
                    durante las 24 horas del día. En horario comercial las respuestas son más
                    personalizadas, fuera de horario se indican los horarios de atención.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Estadísticas */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estadísticas del Bot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Actividad General</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mensajes procesados</span>
                      <span className="font-medium">{botStatus?.messagesProcessed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Errores registrados</span>
                      <span className="font-medium">{botStatus?.errors || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Última actividad</span>
                      <span className="font-medium text-xs">
                        {botStatus?.lastActivity 
                          ? new Date(botStatus.lastActivity).toLocaleString('es-CL')
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Estado de Conexión</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Conectado</span>
                      <Badge variant={botStatus?.isConnected ? 'default' : 'destructive'}>
                        {botStatus?.isConnected ? 'Sí' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Listo para recibir</span>
                      <Badge variant={botStatus?.isReady ? 'default' : 'secondary'}>
                        {botStatus?.isReady ? 'Sí' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 