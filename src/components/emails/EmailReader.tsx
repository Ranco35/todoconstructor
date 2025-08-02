'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Inbox, 
  Shield, 
  Eye, 
  EyeOff, 
  Trash2, 
  RefreshCw,
  Filter,
  Search,
  AlertTriangle,
  Calendar,
  User,
  Paperclip,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

import { 
  getReceivedEmails,
  getNonSpamEmails,
  getSpamEmails,
  getUnreadEmails,
  markEmailsAsRead,
  moveEmailsToSpam,
  deleteEmails,
  checkEmailReaderConfiguration,
  getEmailStats
} from '@/actions/emails/email-reader-actions';
import { ReceivedEmail } from '@/lib/email-reader-service';

interface EmailReaderProps {
  initialEmails?: ReceivedEmail[];
}

export default function EmailReader({ initialEmails = [] }: EmailReaderProps) {
  const [emails, setEmails] = useState<ReceivedEmail[]>(initialEmails);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'inbox' | 'spam' | 'unread'>('inbox');
  const [configStatus, setConfigStatus] = useState<{
    configured: boolean;
    message: string;
  } | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    unread: number;
    spam: number;
    nonSpam: number;
    lastReceived: string | null;
    spamRate: number;
  } | null>(null);

  // Verificar configuración al montar el componente
  useEffect(() => {
    checkConfiguration();
    loadStats();
  }, []);

  // Cargar emails al cambiar el filtro
  useEffect(() => {
    loadEmails();
  }, [filterType]);

  const checkConfiguration = async () => {
    try {
      const result = await checkEmailReaderConfiguration();
      setConfigStatus(result);
    } catch (error) {
      console.error('Error verificando configuración:', error);
      setConfigStatus({
        configured: false,
        message: 'Error verificando configuración'
      });
    }
  };

  const loadStats = async () => {
    try {
      const result = await getEmailStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const loadEmails = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      
      switch (filterType) {
        case 'inbox':
          result = await getNonSpamEmails(50);
          break;
        case 'spam':
          result = await getSpamEmails(50);
          break;
        case 'unread':
          result = await getUnreadEmails(50);
          break;
        case 'all':
        default:
          result = await getReceivedEmails({ limit: 50 });
          break;
      }

      if (result.success && result.emails) {
        setEmails(result.emails);
      } else {
        setError(result.error || 'Error cargando emails');
      }
    } catch (error) {
      console.error('Error cargando emails:', error);
      setError('Error de conexión cargando emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    const filteredEmails = getFilteredEmails();
    setSelectedEmails(
      selectedEmails.length === filteredEmails.length 
        ? [] 
        : filteredEmails.map(email => email.id)
    );
  };

  const handleMarkAsRead = async () => {
    if (selectedEmails.length === 0) return;

    try {
      setLoading(true);
      const result = await markEmailsAsRead(selectedEmails);
      
      if (result.success) {
        setEmails(prev => prev.map(email => 
          selectedEmails.includes(email.id) 
            ? { ...email, isRead: true }
            : email
        ));
        setSelectedEmails([]);
        loadStats(); // Actualizar estadísticas
      } else {
        setError(result.error || 'Error marcando como leídos');
      }
    } catch (error) {
      console.error('Error marcando como leídos:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToSpam = async () => {
    if (selectedEmails.length === 0) return;

    try {
      setLoading(true);
      const result = await moveEmailsToSpam(selectedEmails);
      
      if (result.success) {
        // Actualizar emails localmente
        setEmails(prev => prev.map(email => 
          selectedEmails.includes(email.id) 
            ? { ...email, isSpam: true }
            : email
        ));
        setSelectedEmails([]);
        loadStats(); // Actualizar estadísticas
        
        // Si estamos en la bandeja de entrada, quitar los emails movidos
        if (filterType === 'inbox') {
          setEmails(prev => prev.filter(email => !selectedEmails.includes(email.id)));
        }
      } else {
        setError(result.error || 'Error moviendo a spam');
      }
    } catch (error) {
      console.error('Error moviendo a spam:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedEmails.length === 0) return;

    if (!confirm('¿Estás seguro de que quieres eliminar estos emails permanentemente?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await deleteEmails(selectedEmails);
      
      if (result.success) {
        setEmails(prev => prev.filter(email => !selectedEmails.includes(email.id)));
        setSelectedEmails([]);
        setSelectedEmail(null);
        loadStats(); // Actualizar estadísticas
      } else {
        setError(result.error || 'Error eliminando emails');
      }
    } catch (error) {
      console.error('Error eliminando emails:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEmails = () => {
    return emails.filter(email => {
      const matchesSearch = !searchTerm || 
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (email.from.name && email.from.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const emailDate = new Date(date);
    const diffInHours = Math.abs(now.getTime() - emailDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return emailDate.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return emailDate.toLocaleDateString('es-CL', { 
        weekday: 'short', 
        day: 'numeric' 
      });
    } else {
      return emailDate.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  const filteredEmails = getFilteredEmails();

  // Si no está configurado, mostrar mensaje
  if (configStatus && !configStatus.configured) {
    return (
      <div className="space-y-6">
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {configStatus.message}
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>📧 Configuración de Lectura de Emails</CardTitle>
            <CardDescription>
              Para leer emails, asegúrate de tener configuradas las variables de entorno para Gmail IMAP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Variables requeridas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• GMAIL_USER: Tu dirección de Gmail</li>
                  <li>• GMAIL_APP_PASSWORD: Contraseña de aplicación de Gmail</li>
                </ul>
              </div>
              <Button onClick={checkConfiguration} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <EyeOff className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">No Leídos</p>
                  <p className="text-2xl font-bold">{stats.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Spam</p>
                  <p className="text-2xl font-bold">{stats.spam}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Legítimos</p>
                  <p className="text-2xl font-bold">{stats.nonSpam}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <CardTitle>📥 Bandeja de Entrada</CardTitle>
            </div>
            <Button 
              onClick={loadEmails} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por asunto, remitente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Tabs 
              value={filterType} 
              onValueChange={(value) => setFilterType(value as any)}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="inbox" className="flex items-center gap-1">
                  <Inbox className="h-3 w-3" />
                  <span className="hidden sm:inline">Bandeja</span>
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  <span className="hidden sm:inline">No Leídos</span>
                </TabsTrigger>
                <TabsTrigger value="spam" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span className="hidden sm:inline">Spam</span>
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="hidden sm:inline">Todos</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Acciones en lote */}
          {selectedEmails.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedEmails.length} email(s) seleccionado(s)
              </span>
              <div className="flex gap-2 ml-auto">
                <Button 
                  onClick={handleMarkAsRead}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Marcar leído
                </Button>
                {filterType !== 'spam' && (
                  <Button 
                    onClick={handleMoveToSpam}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Spam
                  </Button>
                )}
                <Button 
                  onClick={handleDelete}
                  disabled={loading}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de emails */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de emails */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Emails ({filteredEmails.length})
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm">Todos</Label>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Cargando emails...
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No hay emails
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedEmail?.id === email.id ? 'bg-muted' : ''
                        } ${!email.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                        onClick={() => setSelectedEmail(email)}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={selectedEmails.includes(email.id)}
                            onCheckedChange={() => handleSelectEmail(email.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                                {email.from.name || email.from.address}
                              </p>
                              <div className="flex items-center space-x-1">
                                {email.isSpam && (
                                  <Badge variant="destructive" className="text-xs">
                                    Spam
                                  </Badge>
                                )}
                                {email.attachments.length > 0 && (
                                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(email.date)}
                                </span>
                              </div>
                            </div>
                            
                            <p className={`text-sm truncate mt-1 ${!email.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
                              {email.subject}
                            </p>
                            
                            {email.text && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {email.text.substring(0, 100)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Visor de email */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <EmailViewer email={selectedEmail} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Selecciona un email para ver su contenido
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar un email individual
function EmailViewer({ email }: { email: ReceivedEmail }) {
  const formatFullDate = (date: Date) => {
    return new Date(date).toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="text-xl font-semibold leading-tight">
              {email.subject}
            </h3>
            <div className="flex items-center space-x-2">
              {!email.isRead && (
                <Badge variant="secondary">No leído</Badge>
              )}
              {email.isSpam && (
                <Badge variant="destructive">
                  <Shield className="h-3 w-3 mr-1" />
                  Spam (Score: {email.spamScore})
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>
                {email.from.name ? `${email.from.name} <${email.from.address}>` : email.from.address}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{formatFullDate(email.date)}</span>
            </div>
          </div>

          {email.to.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Para: </span>
              {email.to.map((recipient, index) => (
                <span key={index}>
                  {recipient.name ? `${recipient.name} <${recipient.address}>` : recipient.address}
                  {index < email.to.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}

          {email.attachments.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <span>{email.attachments.length} adjunto(s)</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contenido del email */}
        <div className="prose prose-sm max-w-none">
          {email.html ? (
            <div 
              dangerouslySetInnerHTML={{ __html: email.html }}
              className="email-content"
            />
          ) : email.text ? (
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {email.text}
            </pre>
          ) : (
            <p className="text-muted-foreground italic">
              Este email no tiene contenido de texto.
            </p>
          )}
        </div>

        {/* Adjuntos */}
        {email.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Adjuntos ({email.attachments.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {email.attachments.map((attachment, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-2 p-2 border rounded-lg"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.contentType} • {(attachment.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Ver únicamente
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información de spam */}
        {email.isSpam && email.spamReasons.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  Este email fue marcado como spam (Score: {email.spamScore}/100)
                </p>
                <div className="text-sm">
                  <p className="font-medium mb-1">Razones:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {email.spamReasons.map((reason, index) => (
                      <li key={index} className="text-muted-foreground">{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 