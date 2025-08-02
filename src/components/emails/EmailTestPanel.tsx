'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings, 
  TestTube, 
  User,
  AlertCircle
} from 'lucide-react';

import { 
  checkEmailConfiguration, 
  sendTestEmail, 
  sendReservationConfirmationEmail,
  sendCustomEmail 
} from '@/actions/emails/email-actions';

interface EmailStatus {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export default function EmailTestPanel() {
  // Estados para configuración
  const [configStatus, setConfigStatus] = useState<EmailStatus | null>(null);
  const [checkingConfig, setCheckingConfig] = useState(false);

  // Estados para email de prueba
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<EmailStatus | null>(null);

  // Estados para email personalizado
  const [customEmail, setCustomEmail] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [isHtmlContent, setIsHtmlContent] = useState(true);
  const [sendingCustom, setSendingCustom] = useState(false);
  const [customStatus, setCustomStatus] = useState<EmailStatus | null>(null);

  // Estados para confirmación de reserva
  const [reservationId, setReservationId] = useState('');
  const [reservationEmail, setReservationEmail] = useState('');
  const [sendingReservation, setSendingReservation] = useState(false);
  const [reservationStatus, setReservationStatus] = useState<EmailStatus | null>(null);

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

  // Enviar email de prueba
  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setTestStatus({
        type: 'warning',
        message: 'Ingresa un email para la prueba'
      });
      return;
    }

    setSendingTest(true);
    setTestStatus(null);

    try {
      const result = await sendTestEmail(testEmail);
      
      setTestStatus({
        type: result.success ? 'success' : 'error',
        message: result.message,
        details: result.messageId ? `ID del mensaje: ${result.messageId}` : undefined
      });

      if (result.success) {
        setTestEmail(''); // Limpiar campo tras envío exitoso
      }
    } catch (error) {
      setTestStatus({
        type: 'error',
        message: 'Error enviando email de prueba',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Enviar email personalizado
  const handleSendCustomEmail = async () => {
    if (!customEmail.trim() || !customSubject.trim() || !customContent.trim()) {
      setCustomStatus({
        type: 'warning',
        message: 'Completa todos los campos requeridos'
      });
      return;
    }

    setSendingCustom(true);
    setCustomStatus(null);

    try {
      const result = await sendCustomEmail(
        customEmail,
        customSubject,
        customContent,
        isHtmlContent
      );
      
      setCustomStatus({
        type: result.success ? 'success' : 'error',
        message: result.message,
        details: result.messageId ? `ID del mensaje: ${result.messageId}` : undefined
      });

      if (result.success) {
        // Limpiar campos tras envío exitoso
        setCustomEmail('');
        setCustomSubject('');
        setCustomContent('');
      }
    } catch (error) {
      setCustomStatus({
        type: 'error',
        message: 'Error enviando email personalizado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setSendingCustom(false);
    }
  };

  // Enviar confirmación de reserva
  const handleSendReservationEmail = async () => {
    if (!reservationId.trim()) {
      setReservationStatus({
        type: 'warning',
        message: 'Ingresa el ID de la reserva'
      });
      return;
    }

    setSendingReservation(true);
    setReservationStatus(null);

    try {
      const result = await sendReservationConfirmationEmail(
        parseInt(reservationId),
        reservationEmail.trim() || undefined
      );
      
      setReservationStatus({
        type: result.success ? 'success' : 'error',
        message: result.message,
        details: result.messageId ? `ID del mensaje: ${result.messageId}` : undefined
      });

      if (result.success) {
        setReservationId('');
        setReservationEmail('');
      }
    } catch (error) {
      setReservationStatus({
        type: 'error',
        message: 'Error enviando confirmación de reserva',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setSendingReservation(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Mail className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Pruebas de Email</h1>
          <p className="text-gray-600">Configuración y pruebas de Gmail SMTP</p>
        </div>
      </div>

      {/* Verificación de Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración de Gmail</span>
          </CardTitle>
          <CardDescription>
            Verifica que las credenciales de Gmail estén configuradas correctamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleCheckConfiguration}
              disabled={checkingConfig}
              className="w-full"
            >
              {checkingConfig ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Verificar Configuración
                </>
              )}
            </Button>

            {configStatus && <StatusAlert status={configStatus} />}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Variables de Entorno Requeridas:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>GMAIL_USER</code>: reservas@termasllifen.cl</li>
                <li>• <code>GMAIL_APP_PASSWORD</code>: App Password de Gmail</li>
                <li>• <code>GMAIL_HOST</code>: smtp.gmail.com</li>
                <li>• <code>GMAIL_PORT</code>: 587</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para diferentes tipos de pruebas */}
      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="test" className="flex items-center space-x-2">
            <TestTube className="h-4 w-4" />
            <span>Prueba</span>
          </TabsTrigger>
          <TabsTrigger value="reservation" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Reserva</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Personalizado</span>
          </TabsTrigger>
        </TabsList>

        {/* Pestaña de Email de Prueba */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Email de Prueba</CardTitle>
              <CardDescription>
                Envía un email de prueba para verificar que todo funciona correctamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-email">Email de Destinatario</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    disabled={sendingTest}
                  />
                </div>

                <Button 
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !testEmail.trim()}
                  className="w-full"
                >
                  {sendingTest ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Email de Prueba
                    </>
                  )}
                </Button>

                {testStatus && <StatusAlert status={testStatus} />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Confirmación de Reserva */}
        <TabsContent value="reservation">
          <Card>
            <CardHeader>
              <CardTitle>Confirmación de Reserva</CardTitle>
              <CardDescription>
                Envía un email de confirmación de reserva a un cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reservation-id">ID de Reserva</Label>
                  <Input
                    id="reservation-id"
                    type="number"
                    placeholder="Ej: 123"
                    value={reservationId}
                    onChange={(e) => setReservationId(e.target.value)}
                    disabled={sendingReservation}
                  />
                </div>

                <div>
                  <Label htmlFor="reservation-email">Email Alternativo (Opcional)</Label>
                  <Input
                    id="reservation-email"
                    type="email"
                    placeholder="Si no se especifica, se usa el email del cliente"
                    value={reservationEmail}
                    onChange={(e) => setReservationEmail(e.target.value)}
                    disabled={sendingReservation}
                  />
                </div>

                <Button 
                  onClick={handleSendReservationEmail}
                  disabled={sendingReservation || !reservationId.trim()}
                  className="w-full"
                >
                  {sendingReservation ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Confirmación
                    </>
                  )}
                </Button>

                {reservationStatus && <StatusAlert status={reservationStatus} />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Email Personalizado */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Email Personalizado</CardTitle>
              <CardDescription>
                Envía un email personalizado con contenido específico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-email">Email de Destinatario</Label>
                  <Input
                    id="custom-email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    disabled={sendingCustom}
                  />
                </div>

                <div>
                  <Label htmlFor="custom-subject">Asunto</Label>
                  <Input
                    id="custom-subject"
                    placeholder="Asunto del email"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    disabled={sendingCustom}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isHtmlContent}
                    onCheckedChange={setIsHtmlContent}
                    disabled={sendingCustom}
                  />
                  <Label>Contenido HTML</Label>
                  <Badge variant={isHtmlContent ? 'default' : 'secondary'}>
                    {isHtmlContent ? 'HTML' : 'Texto'}
                  </Badge>
                </div>

                <div>
                  <Label htmlFor="custom-content">Contenido</Label>
                  <Textarea
                    id="custom-content"
                    placeholder={isHtmlContent 
                      ? "<h1>Hola!</h1><p>Este es un mensaje HTML.</p>" 
                      : "Este es un mensaje de texto plano."
                    }
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    disabled={sendingCustom}
                    rows={6}
                  />
                </div>

                <Button 
                  onClick={handleSendCustomEmail}
                  disabled={sendingCustom || !customEmail.trim() || !customSubject.trim() || !customContent.trim()}
                  className="w-full"
                >
                  {sendingCustom ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Email Personalizado
                    </>
                  )}
                </Button>

                {customStatus && <StatusAlert status={customStatus} />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 