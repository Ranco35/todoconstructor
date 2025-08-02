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
  Users, 
  MessageCircle, 
  UserPlus,
  UserMinus,
  Send,
  Activity,
  Settings,
  QrCode,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  User,
  MessageSquare,
  BarChart3,
  Shield,
  Headphones,
  ShoppingCart,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  registerWhatsAppUser, 
  unregisterWhatsAppUser, 
  updateWhatsAppUserStatus,
  sendWhatsAppMessageAsUser,
  getCurrentWhatsAppUser,
  getCurrentUserAssignments,
  getMultiUserStatus,
  initializeMultiUserSystem,
  isUserRegistered,
  getCurrentUserStats
} from '@/actions/whatsapp/multi-user-actions';

interface WhatsAppUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RECEPTION' | 'SALES' | 'SUPPORT';
  isActive: boolean;
  lastActivity: Date;
  assignedClients: string[];
  status: 'online' | 'busy' | 'offline';
}

interface ClientAssignment {
  clientPhone: string;
  assignedTo: string;
  assignedAt: Date;
  lastMessageAt: Date;
  conversationHistory: any[];
  status: 'active' | 'waiting' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface MultiUserStatus {
  totalUsers: number;
  activeUsers: number;
  totalClients: number;
  activeConversations: number;
  systemStatus: 'operational' | 'degraded' | 'down';
  loadBalancing: string;
  qrCode?: string; // Added qrCode to the interface
}

export default function WhatsAppMultiUserClient() {
  const [currentUser, setCurrentUser] = useState<WhatsAppUser | null>(null);
  const [userAssignments, setUserAssignments] = useState<ClientAssignment[]>([]);
  const [systemStatus, setSystemStatus] = useState<MultiUserStatus | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  // Estados para registro de usuario
  const [userRole, setUserRole] = useState<'ADMIN' | 'RECEPTION' | 'SALES' | 'SUPPORT'>('RECEPTION');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Estados para envío de mensajes
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  
  // Estados para cambio de estado
  const [newStatus, setNewStatus] = useState<'online' | 'busy' | 'offline'>('online');
  
  const { toast } = useToast();

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadInitialData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Verificar si el usuario está registrado
      const registeredResult = await isUserRegistered();
      setIsRegistered(registeredResult.success && registeredResult.data);

      if (registeredResult.success && registeredResult.data) {
        // Cargar datos del usuario
        const userResult = await getCurrentWhatsAppUser();
        if (userResult.success && userResult.data) {
          setCurrentUser(userResult.data);
        }

        // Cargar asignaciones del usuario
        const assignmentsResult = await getCurrentUserAssignments();
        if (assignmentsResult.success && assignmentsResult.data) {
          setUserAssignments(assignmentsResult.data);
        }
      }

      // Cargar estado del sistema
      const statusResult = await getMultiUserStatus();
      if (statusResult.success && statusResult.data) {
        setSystemStatus(statusResult.data);
        // Buscar QR en el backend (simulación: statusResult.data.qrCode)
        if (statusResult.data.qrCode) {
          setQrCode(statusResult.data.qrCode);
        } else {
          setQrCode(null);
        }
      }

    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterUser = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setRegistering(true);
    try {
      const result = await registerWhatsAppUser({
        name: userName,
        email: userEmail,
        role: userRole,
      });

      if (result.success) {
        toast({
          title: "Usuario registrado",
          description: "Te has registrado exitosamente en el sistema multi-usuario",
        });
        setIsRegistered(true);
        await loadInitialData();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo registrar el usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error registrando usuario:', error);
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregisterUser = async () => {
    try {
      const result = await unregisterWhatsAppUser();

      if (result.success) {
        toast({
          title: "Usuario desregistrado",
          description: "Te has desregistrado del sistema multi-usuario",
        });
        setIsRegistered(false);
        setCurrentUser(null);
        setUserAssignments([]);
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo desregistrar el usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error desregistrando usuario:', error);
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const result = await updateWhatsAppUserStatus(newStatus);

      if (result.success) {
        toast({
          title: "Estado actualizado",
          description: `Tu estado ha cambiado a: ${newStatus}`,
        });
        await loadInitialData();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el estado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
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
      const result = await sendWhatsAppMessageAsUser(phoneNumber, message);

      if (result.success) {
        toast({
          title: "Mensaje enviado",
          description: `Mensaje enviado exitosamente a ${phoneNumber}`,
        });
        setMessage('');
        setPhoneNumber('');
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar el mensaje",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-4 h-4" />;
      case 'RECEPTION': return <Headphones className="w-4 h-4" />;
      case 'SALES': return <ShoppingCart className="w-4 h-4" />;
      case 'SUPPORT': return <HelpCircle className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando sistema multi-usuario...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Mostrar QR si está disponible */}
      {qrCode && (
        <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-green-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-green-700 mb-2 flex items-center">
            <span className="text-2xl mr-2">🟢</span>
            Escanea este código QR para conectar WhatsApp
          </h2>
          <img src={qrCode} alt="Código QR WhatsApp" className="w-64 h-64 my-4 border-4 border-green-400 rounded-lg shadow-lg" />
          <p className="text-gray-700 text-center max-w-md">
            Abre WhatsApp en tu teléfono {'>'} Configuración {'>'} Dispositivos vinculados {'>'} Vincular un dispositivo y escanea este código QR.<br/>
            <span className="font-semibold text-green-700">El QR solo aparece si el sistema no está conectado.</span>
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Multi-Usuario</h1>
          <p className="text-gray-600">Sistema de atención distribuida para clientes</p>
        </div>
        <Button onClick={loadInitialData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Estado del Sistema */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemStatus.totalUsers}</div>
                <div className="text-sm text-gray-600">Usuarios Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemStatus.activeUsers}</div>
                <div className="text-sm text-gray-600">Usuarios Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemStatus.totalClients}</div>
                <div className="text-sm text-gray-600">Clientes Asignados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{systemStatus.activeConversations}</div>
                <div className="text-sm text-gray-600">Conversaciones Activas</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge variant={systemStatus.systemStatus === 'operational' ? 'default' : 'destructive'}>
                {systemStatus.systemStatus === 'operational' ? 'Operativo' : 'Problemas'}
              </Badge>
              <span className="text-sm text-gray-600">
                Balanceo: {systemStatus.loadBalancing}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="register" className="space-y-4">
        <TabsList>
          <TabsTrigger value="register">Registro</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
        </TabsList>

        {/* Registro de Usuario */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                {isRegistered ? 'Usuario Registrado' : 'Registrarse en WhatsApp'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isRegistered ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre</label>
                      <Input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="tu@email.com"
                        type="email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rol</label>
                    <Select value={userRole} onValueChange={(value: any) => setUserRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECEPTION">
                          <div className="flex items-center">
                            <Headphones className="w-4 h-4 mr-2" />
                            Recepción
                          </div>
                        </SelectItem>
                        <SelectItem value="SALES">
                          <div className="flex items-center">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Ventas
                          </div>
                        </SelectItem>
                        <SelectItem value="SUPPORT">
                          <div className="flex items-center">
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Soporte
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Administrador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleRegisterUser} 
                    disabled={registering}
                    className="w-full"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Registrarse
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Usuario registrado exitosamente</span>
                    </div>
                    {currentUser && (
                      <div className="mt-2 text-sm text-green-700">
                        <p>Nombre: {currentUser.name}</p>
                        <p>Rol: {currentUser.role}</p>
                        <p>Estado: {currentUser.status}</p>
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={handleUnregisterUser} 
                    variant="destructive"
                    className="w-full"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Desregistrarse
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard del Usuario */}
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Dashboard Personal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentUser ? (
                <div className="space-y-6">
                  {/* Información del Usuario */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getRoleIcon(currentUser.role)}
                        <div className="ml-3">
                          <h3 className="font-semibold">{currentUser.name}</h3>
                          <p className="text-sm text-gray-600">{currentUser.email}</p>
                          <p className="text-sm text-gray-600">Rol: {currentUser.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(currentUser.status)}`}></div>
                        <span className="text-sm font-medium">{currentUser.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{userAssignments.length}</div>
                      <div className="text-sm text-gray-600">Clientes Asignados</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {userAssignments.filter(a => a.status === 'active').length}
                      </div>
                      <div className="text-sm text-gray-600">Conversaciones Activas</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {userAssignments.filter(a => a.priority === 'urgent').length}
                      </div>
                      <div className="text-sm text-gray-600">Urgentes</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {userAssignments.filter(a => a.priority === 'high').length}
                      </div>
                      <div className="text-sm text-gray-600">Alta Prioridad</div>
                    </div>
                  </div>

                  {/* Cambio de Estado */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Cambiar Estado</h4>
                    <div className="flex items-center space-x-4">
                      <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="busy">Ocupado</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleUpdateStatus} size="sm">
                        Actualizar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserMinus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No estás registrado en el sistema</p>
                  <p className="text-sm text-gray-500">Regístrate en la pestaña "Registro" para comenzar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Envío de Mensajes */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Enviar Mensaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isRegistered ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Número de Teléfono</label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+56912345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mensaje</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe tu mensaje aquí..."
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={sendingMessage}
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
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Debes registrarte para enviar mensajes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asignaciones de Clientes */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Mis Clientes Asignados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isRegistered && userAssignments.length > 0 ? (
                <div className="space-y-4">
                  {userAssignments.map((assignment, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{assignment.clientPhone}</span>
                          <Badge variant="outline">{assignment.status}</Badge>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(assignment.priority)}`}></div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(assignment.lastMessageAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Asignado: {new Date(assignment.assignedAt).toLocaleString()}</p>
                        <p>Mensajes: {assignment.conversationHistory.length}</p>
                        <p>Prioridad: {assignment.priority}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {isRegistered ? 'No tienes clientes asignados' : 'Debes registrarte para ver asignaciones'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 