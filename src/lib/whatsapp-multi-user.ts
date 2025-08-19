import type { Message } from 'whatsapp-web.js';
import qrcode from 'qrcode';

// Configuración del sistema multi-usuario
export const MULTI_USER_CONFIG = {
  maxConcurrentUsers: 5,
  sessionTimeout: 30 * 60 * 1000, // 30 minutos
  autoReassign: true,
  loadBalancing: 'round-robin', // 'round-robin' | 'least-busy' | 'random'
} as const;

// Tipos para el sistema multi-usuario
export interface WhatsAppUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RECEPTION' | 'SALES' | 'SUPPORT';
  isActive: boolean;
  lastActivity: Date;
  assignedClients: string[]; // Números de teléfono asignados
  status: 'online' | 'busy' | 'offline';
  sessionId?: string;
}

export interface ClientAssignment {
  clientPhone: string;
  assignedTo: string; // User ID
  assignedAt: Date;
  lastMessageAt: Date;
  conversationHistory: WhatsAppMessage[];
  status: 'active' | 'waiting' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface MultiUserStatus {
  totalUsers: number;
  activeUsers: number;
  totalClients: number;
  activeConversations: number;
  systemStatus: 'operational' | 'degraded' | 'down';
  loadBalancing: string;
}

// Cliente singleton compartido
class WhatsAppMultiUserManager {
  private client: Client | null = null;
  private isInitialized = false;
  private users: Map<string, WhatsAppUser> = new Map();
  private clientAssignments: Map<string, ClientAssignment> = new Map();
  private messageQueue: WhatsAppMessage[] = [];
  private isProcessingQueue = false;

  constructor() {
    // No inicializar automáticamente; el llamador debe invocar initialize() explícitamente
  }

  private async initializeClient() {
    if (this.isInitialized) return;

    console.log('🟢 Inicializando cliente WhatsApp multi-usuario...');

    const { Client, LocalAuth } = await import('whatsapp-web.js');
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'admintermas-multi-user',
        dataPath: './whatsapp-multi-session',
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      },
    });

    this.setupEventHandlers();
    this.isInitialized = true;
  }

  private setupEventHandlers() {
    if (!this.client) return;

    // QR Code
    this.client.on('qr', async (qr: string) => {
      console.log('📱 Código QR generado para WhatsApp Multi-Usuario');
      try {
        const qrDataUrl = await qrcode.toDataURL(qr);
        this.broadcastToUsers('qr', { qrCode: qrDataUrl });
      } catch (error) {
        console.error('❌ Error generando QR code:', error);
      }
    });

    // Cliente listo
    this.client.on('ready', () => {
      console.log('✅ Cliente WhatsApp Multi-Usuario listo!');
      this.broadcastToUsers('ready', { status: 'connected' });
    });

    // Cliente autenticado
    this.client.on('authenticated', () => {
      console.log('🔐 Cliente WhatsApp Multi-Usuario autenticado');
      this.broadcastToUsers('authenticated', { status: 'authenticated' });
    });

    // Error de autenticación
    this.client.on('auth_failure', (msg: string) => {
      console.error('❌ Error de autenticación:', msg);
      this.broadcastToUsers('auth_failure', { error: msg });
    });

    // Cliente desconectado
    this.client.on('disconnected', (reason: string) => {
      console.log('🔴 Cliente desconectado:', reason);
      this.broadcastToUsers('disconnected', { reason });
    });

    // Mensaje recibido
    this.client.on('message', async (message: Message) => {
      try {
        if (message.fromMe) return;

        const chat = await message.getChat();
        if (chat.isGroup) return;

        const whatsappMessage: WhatsAppMessage = {
          id: message.id.id,
          from: message.from,
          to: message.to || '',
          body: message.body,
          timestamp: message.timestamp * 1000,
          isFromMe: message.fromMe,
          contact: {
            name: message._data.notifyName,
            pushname: message._data.notifyName,
            number: message.from.replace('@c.us', ''),
          },
          chat: {
            name: chat.name,
            isGroup: chat.isGroup,
          },
        };

        console.log('📩 Mensaje recibido (Multi-Usuario):', {
          from: whatsappMessage.contact?.number,
          body: whatsappMessage.body.substring(0, 50) + '...',
        });

        // Procesar mensaje con asignación de usuario
        await this.processIncomingMessage(whatsappMessage);

      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
      }
    });
  }

  private async processIncomingMessage(message: WhatsAppMessage) {
    const clientPhone = message.from.replace('@c.us', '');
    
    // Verificar si el cliente ya está asignado
    let assignment = this.clientAssignments.get(clientPhone);
    
    if (!assignment) {
      // Asignar a un usuario disponible
      const assignedUser = this.assignClientToUser(clientPhone);
      if (!assignedUser) {
        // No hay usuarios disponibles, poner en cola
        this.messageQueue.push(message);
        console.log('⏳ Cliente en cola de espera:', clientPhone);
        return;
      }

      // Crear nueva asignación
      assignment = {
        clientPhone,
        assignedTo: assignedUser.id,
        assignedAt: new Date(),
        lastMessageAt: new Date(),
        conversationHistory: [message],
        status: 'active',
        priority: this.calculatePriority(message.body),
      };

      this.clientAssignments.set(clientPhone, assignment);
      console.log(`👤 Cliente ${clientPhone} asignado a ${assignedUser.name}`);
    } else {
      // Actualizar asignación existente
      assignment.lastMessageAt = new Date();
      assignment.conversationHistory.push(message);
      assignment.priority = this.calculatePriority(message.body);
    }

    // Notificar al usuario asignado
    this.notifyUser(assignment.assignedTo, 'new_message', {
      message,
      assignment,
    });
  }

  private assignClientToUser(clientPhone: string): WhatsAppUser | null {
    const availableUsers = Array.from(this.users.values()).filter(
      user => user.isActive && user.status === 'online' && user.assignedClients.length < 10
    );

    if (availableUsers.length === 0) {
      return null;
    }

    // Algoritmo de balanceo de carga
    switch (MULTI_USER_CONFIG.loadBalancing) {
      case 'least-busy':
        return availableUsers.reduce((least, current) => 
          current.assignedClients.length < least.assignedClients.length ? current : least
        );

      case 'random':
        return availableUsers[Math.floor(Math.random() * availableUsers.length)];

      case 'round-robin':
      default:
        // Implementar round-robin simple
        return availableUsers[0];
    }
  }

  private calculatePriority(message: string): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentKeywords = ['emergencia', 'urgente', 'ayuda', 'problema', 'error'];
    const highKeywords = ['reserva', 'cancelar', 'cambiar', 'problema'];
    const mediumKeywords = ['precio', 'disponibilidad', 'información'];

    const lowerMessage = message.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'urgent';
    }
    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  // Métodos públicos para gestión de usuarios

  async registerUser(userData: Omit<WhatsAppUser, 'lastActivity' | 'assignedClients' | 'status'>): Promise<boolean> {
    if (this.users.size >= MULTI_USER_CONFIG.maxConcurrentUsers) {
      console.log('❌ Máximo número de usuarios alcanzado');
      return false;
    }

    const user: WhatsAppUser = {
      ...userData,
      lastActivity: new Date(),
      assignedClients: [],
      status: 'online',
    };

    this.users.set(user.id, user);
    console.log(`✅ Usuario registrado: ${user.name} (${user.id})`);
    
    // Procesar cola de mensajes si hay usuarios disponibles
    if (this.messageQueue.length > 0 && !this.isProcessingQueue) {
      this.processMessageQueue();
    }

    return true;
  }

  async unregisterUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    // Reasignar clientes del usuario
    const userAssignments = Array.from(this.clientAssignments.values())
      .filter(assignment => assignment.assignedTo === userId);

    for (const assignment of userAssignments) {
      const newUser = this.assignClientToUser(assignment.clientPhone);
      if (newUser) {
        assignment.assignedTo = newUser.id;
        console.log(`🔄 Cliente ${assignment.clientPhone} reasignado a ${newUser.name}`);
      } else {
        // Poner en cola si no hay usuarios disponibles
        this.messageQueue.push({
          id: `reassign-${Date.now()}`,
          from: assignment.clientPhone + '@c.us',
          to: '',
          body: 'Mensaje de reasignación',
          timestamp: Date.now(),
          isFromMe: false,
        });
      }
    }

    this.users.delete(userId);
    console.log(`❌ Usuario desregistrado: ${user.name} (${userId})`);
    return true;
  }

  async updateUserStatus(userId: string, status: WhatsAppUser['status']): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    user.status = status;
    user.lastActivity = new Date();
    console.log(`🔄 Usuario ${user.name} cambió a estado: ${status}`);
    return true;
  }

  async sendMessageAsUser(userId: string, to: string, message: string): Promise<boolean> {
    if (!this.client || !this.client.info) {
      console.log('❌ Cliente WhatsApp no está conectado');
      return false;
    }

    const user = this.users.get(userId);
    if (!user || user.status !== 'online') {
      console.log('❌ Usuario no disponible para enviar mensaje');
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      await this.client.sendMessage(formattedNumber + '@c.us', message);
      
      // Actualizar actividad del usuario
      user.lastActivity = new Date();
      
      console.log(`✅ Mensaje enviado por ${user.name} a ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      return false;
    }
  }

  // Métodos de consulta

  getUsers(): WhatsAppUser[] {
    return Array.from(this.users.values());
  }

  getUser(userId: string): WhatsAppUser | null {
    return this.users.get(userId) || null;
  }

  getClientAssignments(): ClientAssignment[] {
    return Array.from(this.clientAssignments.values());
  }

  getUserAssignments(userId: string): ClientAssignment[] {
    return Array.from(this.clientAssignments.values())
      .filter(assignment => assignment.assignedTo === userId);
  }

  getSystemStatus(): MultiUserStatus {
    const activeUsers = Array.from(this.users.values()).filter(u => u.status === 'online');
    const activeConversations = Array.from(this.clientAssignments.values())
      .filter(a => a.status === 'active').length;

    return {
      totalUsers: this.users.size,
      activeUsers: activeUsers.length,
      totalClients: this.clientAssignments.size,
      activeConversations,
      systemStatus: this.client?.info ? 'operational' : 'down',
      loadBalancing: MULTI_USER_CONFIG.loadBalancing,
    };
  }

  // Métodos privados de utilidad

  private broadcastToUsers(event: string, data: any) {
    // Implementar notificación a todos los usuarios conectados
    console.log(`📢 Broadcast: ${event}`, data);
  }

  private notifyUser(userId: string, event: string, data: any) {
    // Implementar notificación específica a un usuario
    console.log(`📨 Notificación a ${userId}: ${event}`, data);
  }

  private async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;

    this.isProcessingQueue = true;
    console.log(`🔄 Procesando cola de ${this.messageQueue.length} mensajes...`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.processIncomingMessage(message);
      }
    }

    this.isProcessingQueue = false;
    console.log('✅ Cola de mensajes procesada');
  }

  private formatPhoneNumber(phone: string): string {
    // Eliminar caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Agregar código de país si no está presente
    if (!cleaned.startsWith('56')) {
      cleaned = '56' + cleaned;
    }
    
    return cleaned;
  }

  // Métodos de inicialización y limpieza

  async initialize(): Promise<void> {
    if (!this.client) {
      await this.initializeClient();
    }

    try {
      await this.client!.initialize();
      console.log('✅ Cliente WhatsApp Multi-Usuario inicializado');
    } catch (error) {
      console.error('❌ Error inicializando cliente:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }
    this.users.clear();
    this.clientAssignments.clear();
    this.messageQueue = [];
    this.isInitialized = false;
    console.log('🔄 Cliente WhatsApp Multi-Usuario destruido');
  }
}

// Singleton perezoso
let multiUserSingleton: WhatsAppMultiUserManager | null = null;
export async function getWhatsAppMultiUser(): Promise<WhatsAppMultiUserManager> {
  if (!multiUserSingleton) {
    multiUserSingleton = new WhatsAppMultiUserManager();
  }
  return multiUserSingleton;
}

// Funciones de utilidad
export function isBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 8 && hour < 22; // 8:00 - 22:00
}

export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('56')) {
    cleaned = '56' + cleaned;
  }
  return cleaned;
}

export function isCommand(message: string): boolean {
  return message.startsWith('/');
}

export function extractCommand(message: string): string {
  return message.split(' ')[0].toLowerCase();
} 