import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';

// Polyfill para fetch en Node.js
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Configuración del bot de WhatsApp para AdminTermas
export const WHATSAPP_BOT_CONFIG = {
  name: 'AdminTermas Bot',
  welcomeMessage: `¡Hola! 👋 Bienvenido a *AdminTermas Hotel & Spa*

Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?

📱 *Opciones disponibles:*
• 🏨 Información de habitaciones
• 🧘‍♀️ Servicios de spa  
• 🍽️ Restaurante y menús
• 📅 Hacer una reserva
• 💰 Consultar precios
• 📞 Contactar recepción
• ❓ Otras consultas

_Escribe cualquier mensaje y te ayudaré inmediatamente._`,
  
  businessHours: {
    start: '08:00',
    end: '22:00',
    timezone: 'America/Santiago'
  },
  
  autoReplyEnabled: true,
  useAI: true,
  maxRetries: 3,
} as const;

// Comandos específicos del hotel
export const HOTEL_COMMANDS = {
  '/inicio': 'Mostrar menú principal',
  '/habitaciones': 'Ver tipos de habitaciones disponibles',
  '/spa': 'Información sobre servicios de spa',
  '/restaurante': 'Menú y horarios del restaurante',
  '/reserva': 'Hacer una nueva reserva',
  '/precios': 'Consultar tarifas actuales',
  '/ubicacion': 'Dirección y como llegar',
  '/contacto': 'Información de contacto',
  '/estado': 'Estado del servicio del bot',
} as const;

// Tipos TypeScript
export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  isFromMe: boolean;
  contact?: {
    name?: string;
    pushname?: string;
    number: string;
  };
  chat?: {
    name?: string;
    isGroup: boolean;
  };
}

export interface BotStatus {
  isConnected: boolean;
  isReady: boolean;
  qrCode?: string;
  lastActivity?: Date;
  messagesProcessed: number;
  errors: number;
}

export interface WhatsAppResponse {
  success: boolean;
  data?: any;
  error?: string;
  messageId?: string;
}

// Cliente singleton de WhatsApp
class WhatsAppManager {
  private client: Client | null = null;
  private isInitialized = false;
  private isConnected = false;
  private isReady = false;
  private currentQR: string | null = null;
  private initializationPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 5000; // 5 segundos
  private status: BotStatus = {
    isConnected: false,
    isReady: false,
    messagesProcessed: 0,
    errors: 0,
    lastActivity: undefined,
  };
  private messageHandlers: Array<(message: WhatsAppMessage) => void> = [];

  constructor() {
    console.log('🟢 Inicializando cliente de WhatsApp...');
    // Inicializar automáticamente solo en el servidor
    if (typeof window === 'undefined') {
      // Usar setTimeout para evitar bloquear el constructor
      setTimeout(() => {
        this.initialize().catch(error => {
          console.error('❌ Error en inicialización automática:', error);
        });
      }, 1000);
    }
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    if (this.isInitialized && this.client && this.isConnected) {
      console.log('✅ Cliente ya inicializado y conectado');
      return;
    }

    try {
      // Destruir cliente existente si existe
      await this.destroyClient();

      console.log('🔄 Inicializando nuevo cliente...');
      console.log('🔧 Configurando estrategia de autenticación LocalAuth...');
      
      // NUEVA CONFIGURACIÓN PUPPETEER OPTIMIZADA PARA ESTABILIDAD
      const puppeteerConfig = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-gpu',
          '--disable-web-security',
          '--no-first-run',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-zygote',
          '--single-process',
          '--disable-accelerated-2d-canvas',
          '--disable-accelerated-jpeg-decoding',
          '--disable-accelerated-mjpeg-decode',
          '--disable-accelerated-video-decode',
          '--disable-accelerated-video-encode',
          '--disable-gpu-sandbox',
          '--disable-software-rasterizer',
          '--disable-threaded-animation',
          '--disable-threaded-scrolling',
          '--disable-v8-idle-tasks',
          '--disable-video-capture-use-gpu-memory-buffer',
          '--disable-webgl',
          '--disable-webgl2',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ],
        timeout: 120000, // 2 minutos
        protocolTimeout: 120000,
        browserWSEndpoint: undefined,
        ignoreDefaultArgs: ['--disable-extensions'],
        pipe: true
      };

      console.log('🔧 Configuración Puppeteer optimizada aplicada');

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'admintermas-bot',
          dataPath: './.wwebjs_auth'
        }),
        puppeteer: puppeteerConfig,
        webVersion: '2.2402.5',
        webVersionCache: {
          type: 'local'
        }
      });

      console.log('📡 Configurando event listeners...');
      this.setupEventListeners();

      try {
        console.log('🚀 Iniciando cliente de WhatsApp...');
        console.log('⏳ Esperando eventos de autenticación o QR...');
        
        // Agregar timeout para la inicialización
        const initializationTimeout = setTimeout(() => {
          console.error('❌ Timeout en inicialización - tomó más de 90 segundos');
          this.client?.destroy();
        }, 90000);

        await this.client.initialize();
        
        clearTimeout(initializationTimeout);
        console.log('✅ Cliente de WhatsApp inicializado correctamente');
        this.isInitialized = true;
        this.reconnectAttempts = 0; // Reset contador de reconexiones
      } catch (error) {
        console.error('❌ Error inicializando cliente de WhatsApp:', error);
        console.error('❌ Tipo de error:', error?.constructor?.name);
        console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
        await this.handleInitializationError(error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error en inicialización:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  private async destroyClient(): Promise<void> {
    if (this.client) {
      console.log('🗑️ Destruyendo cliente existente...');
      try {
        await this.client.destroy();
      } catch (error) {
        console.warn('⚠️ Error destruyendo cliente existente:', error);
      }
      this.client = null;
      this.isInitialized = false;
      this.isConnected = false;
      this.isReady = false;
      this.currentQR = null;
    }
  }

  private async handleInitializationError(error: any): Promise<void> {
    this.isInitialized = false;
    this.isConnected = false;
    this.isReady = false;
    this.currentQR = null;

    // Si es un error de navegador desconectado, intentar reconexión
    if (error.message?.includes('disconnected') || error.message?.includes('Target closed')) {
      console.log(`🔄 Intento de reconexión ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`⏳ Esperando ${this.reconnectDelay}ms antes de reconectar...`);
        
        setTimeout(async () => {
          try {
            this.initializationPromise = null;
            await this.initialize();
          } catch (reconnectError) {
            console.error('❌ Error en reconexión automática:', reconnectError);
          }
        }, this.reconnectDelay);
      } else {
        console.error('❌ Máximo número de intentos de reconexión alcanzado');
        this.reconnectAttempts = 0;
      }
    }
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    console.log('🎯 Configurando event listener para QR...');
    this.client.on('qr', async (qr) => {
      console.log('📱 ¡EVENTO QR DISPARADO! Código QR generado para WhatsApp');
      console.log('📱 QR String length:', qr.length);
      try {
        this.currentQR = await qrcode.toDataURL(qr);
        console.log('✅ QR Code convertido a base64 exitosamente');
        console.log('✅ QR Data URL length:', this.currentQR.length);
      } catch (error) {
        console.error('❌ Error generando QR code:', error);
        this.currentQR = qr; // Fallback al QR raw
        console.log('⚠️ Usando QR raw como fallback');
      }
      this.isConnected = false;
      this.isReady = false;
      console.log('📱 Estado actualizado: hasQR=true, connected=false, ready=false');
    });

    console.log('🎯 Configurando event listener para loading_screen...');
    this.client.on('loading_screen', (percent, message) => {
      console.log(`🔄 Loading: ${percent}% - ${message}`);
    });

    console.log('🎯 Configurando event listener para authenticated...');
    this.client.on('authenticated', () => {
      console.log('🔐 ¡EVENTO AUTHENTICATED! Cliente de WhatsApp autenticado');
      this.isConnected = true;
      this.currentQR = null;
    });

    console.log('🎯 Configurando event listener para ready...');
    this.client.on('ready', () => {
      console.log('✅ ¡EVENTO READY! Cliente de WhatsApp listo!');
      this.isConnected = true;
      this.isReady = true;
      this.currentQR = null;
      this.reconnectAttempts = 0; // Reset contador al conectar exitosamente
    });

    console.log('🎯 Configurando event listener para auth_failure...');
    this.client.on('auth_failure', (msg) => {
      console.error('❌ ¡EVENTO AUTH_FAILURE! Falló la autenticación:', msg);
      this.isConnected = false;
      this.isReady = false;
      this.currentQR = null;
    });

    console.log('🎯 Configurando event listener para disconnected...');
    this.client.on('disconnected', async (reason) => {
      console.log('🔌 ¡EVENTO DISCONNECTED! Cliente desconectado:', reason);
      this.isConnected = false;
      this.isReady = false;
      this.currentQR = null;
      
      // Intentar reconexión automática
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('🔄 Iniciando reconexión automática...');
        setTimeout(async () => {
          try {
            this.initializationPromise = null;
            await this.initialize();
          } catch (error) {
            console.error('❌ Error en reconexión automática:', error);
          }
        }, this.reconnectDelay);
      }
    });

    console.log('🎯 Configurando event listener para message...');
    this.client.on('message', async (message) => {
      console.log('📨 ¡EVENTO MESSAGE! Mensaje recibido:', message.body);
      await this.handleIncomingMessage(message);
    });

    console.log('✅ Todos los event listeners configurados correctamente');
  }

  private async handleIncomingMessage(message: Message): Promise<void> {
    try {
      // Evitar responder a mensajes propios
      if (message.fromMe) {
        return;
      }

      console.log(`📨 Mensaje de ${message.from}: ${message.body}`);
      this.status.messagesProcessed++;
      this.status.lastActivity = new Date();

      // Aquí se puede agregar lógica de respuesta automática
      // Por ahora solo registramos el mensaje
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      this.status.errors++;
    }
  }

  // Enviar mensaje de texto
  async sendMessage(to: string, message: string): Promise<WhatsAppResponse> {
    try {
      console.log('🔍 Estado inicial antes de enviar:', {
        clientExists: !!this.client,
        isReady: this.isReady,
        isConnected: this.isConnected,
        to,
        messagePreview: message.substring(0, 50) + '...'
      });

      // Verificar estado actual antes de enviar
      if (!this.client || !this.isReady || !this.isConnected) {
        console.log('🔄 Cliente no está listo, intentando reconectar...');
        console.log('📊 Estado detallado:', {
          client: !!this.client,
          isReady: this.isReady,
          isConnected: this.isConnected,
          isInitialized: this.isInitialized
        });
        
        // Intentar reconexión rápida
        try {
          await this.initialize();
          // Esperar un momento para que se establezca la conexión
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('✅ Reconexión completada');
        } catch (initError) {
          console.error('❌ Error en reconexión:', initError);
          return {
            success: false,
            error: 'Cliente WhatsApp no está disponible y falló la reconexión: ' + (initError instanceof Error ? initError.message : 'Error desconocido')
          };
        }
        
        // Verificar nuevamente después de la reconexión
        if (!this.client || !this.isReady || !this.isConnected) {
          console.log('❌ Estado después de reconexión:', {
            client: !!this.client,
            isReady: this.isReady,
            isConnected: this.isConnected
          });
          return {
            success: false,
            error: 'Cliente WhatsApp no está listo después de la reconexión'
          };
        }
      }

      console.log(`📤 Enviando mensaje a ${to}: ${message.substring(0, 50)}...`);
      
      // Validar formato del número
      const chatId = to.includes('@c.us') ? to : `${to.replace(/\D/g, '')}@c.us`;
      console.log('📱 ChatId final:', chatId);
      
      try {
        console.log('🚀 Ejecutando client.sendMessage...');
        const sentMessage = await this.client.sendMessage(chatId, message);
        console.log('📨 Respuesta del cliente:', {
          messageId: sentMessage?.id || 'N/A',
          ack: sentMessage?.ack || 'N/A',
          timestamp: sentMessage?.timestamp || 'N/A'
        });
        
        this.status.messagesProcessed++;
        this.status.lastActivity = new Date();

        console.log('✅ Mensaje enviado exitosamente');
        return {
          success: true,
          messageId: sentMessage?.id?.toString(),
          data: sentMessage
        };
      } catch (sendError) {
        console.error('❌ Error específico enviando mensaje:', {
          error: sendError,
          errorMessage: sendError instanceof Error ? sendError.message : 'Error desconocido',
          errorType: sendError?.constructor?.name,
          chatId,
          clientState: {
            exists: !!this.client,
            isReady: this.isReady,
            isConnected: this.isConnected
          }
        });
        
        // Si el error es de conexión, marcar como desconectado
        if (sendError instanceof Error && sendError.message.includes('disconnected')) {
          console.log('🔌 Marcando cliente como desconectado por error');
          this.isConnected = false;
          this.isReady = false;
        }
        
        throw sendError;
      }
    } catch (error) {
      this.status.errors++;
      console.error('❌ Error enviando mensaje (catch principal):', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        errorType: error?.constructor?.name
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Registrar handler para mensajes entrantes
  onMessage(handler: (message: WhatsAppMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  // Obtener estado actual del bot
  getStatus(): { connected: boolean; status: string; hasQR: boolean; clientConnected: boolean; managerConnected: boolean; managerReady: boolean } {
    return {
      connected: this.isConnected && this.isReady,
      status: this.isConnected && this.isReady ? 'connected' : 'disconnected',
      hasQR: !!this.currentQR,
      clientConnected: this.isConnected,
      managerConnected: this.isConnected,
      managerReady: this.isReady
    };
  }

  // Método para obtener el cliente (para el endpoint de status)
  getClient(): Client | null {
    return this.client;
  }

  // Método para obtener el QR code actual
  getQRCode(): string | null {
    return this.currentQR || null;
  }

  // Obtener información del cliente
  async getClientInfo() {
    if (!this.client || !this.isReady) {
      return null;
    }
    
    try {
      const info = this.client.info;
      return {
        wid: info.wid,
        phone: info.wid.user,
        pushname: info.pushname,
        platform: info.platform
      };
    } catch (error) {
      console.error('❌ Error obteniendo info del cliente:', error);
      return null;
    }
  }

  // Cerrar cliente
  async destroy(): Promise<void> {
    console.log('🔴 Destruyendo cliente de WhatsApp...');
    
    if (this.client) {
      try {
        await this.client.destroy();
        console.log('✅ Cliente destruido exitosamente');
      } catch (error) {
        console.warn('⚠️ Error destruyendo cliente (continuando):', error);
      }
    }
    
    // Limpiar estado completo
    this.client = null;
    this.isInitialized = false;
    this.isConnected = false;
    this.isReady = false;
    this.currentQR = null;
    this.initializationPromise = null;
    this.reconnectAttempts = 0;
    
    console.log('🧹 Estado del manager limpiado completamente');
  }
}

// Instancia singleton
export const whatsappManager = new WhatsAppManager();

// Funciones utilitarias
export function isBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 8 && hour <= 22;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('56')) {
    return `${cleaned}@c.us`;
  }
  
  if (cleaned.length === 9) {
    return `56${cleaned}@c.us`;
  }
  
  return `${cleaned}@c.us`;
}

export function isCommand(message: string): boolean {
  return message.trim().startsWith('/');
}

export function extractCommand(message: string): string {
  return message.trim().toLowerCase().split(' ')[0];
} 