import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { promisify } from 'util';

// Tipos para emails recibidos
export interface ReceivedEmail {
  id: string;
  messageId: string;
  subject: string;
  from: {
    name?: string;
    address: string;
  };
  to: Array<{
    name?: string;
    address: string;
  }>;
  date: Date;
  text?: string;
  html?: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    // content no incluido para evitar problemas de serialización con Next.js
  }>;
  flags: string[];
  isRead: boolean;
  isSpam: boolean;
  spamScore: number;
  spamReasons: string[];
}

export interface EmailFilter {
  folder?: string; // 'INBOX', 'SPAM', etc.
  isRead?: boolean;
  isSpam?: boolean;
  fromAddress?: string;
  subject?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

// Configuración IMAP para Gmail
const createImapConnection = () => {
  try {
    // Verificar que las variables de entorno existan
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Variables de entorno GMAIL faltantes');
      throw new Error('Variables de entorno GMAIL_USER y GMAIL_APP_PASSWORD son requeridas');
    }

    const config = {
      user: process.env.GMAIL_USER,
      password: process.env.GMAIL_APP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
      },
      authTimeout: 3000,
      connTimeout: 10000,
    };

    console.log('📧 Configurando conexión IMAP:', {
      host: config.host,
      port: config.port,
      user: config.user ? '✓ Configurado' : '❌ No configurado',
      password: config.password ? '✓ Configurado' : '❌ No configurado',
    });

    // Verificar que el constructor Imap esté disponible
    if (typeof Imap !== 'function') {
      console.error('❌ Constructor Imap no disponible:', typeof Imap);
      throw new Error('La librería IMAP no está disponible o no se importó correctamente');
    }

    const imapInstance = new Imap(config);
    
    if (!imapInstance) {
      throw new Error('No se pudo crear la instancia IMAP');
    }

    console.log('✅ Instancia IMAP creada exitosamente');
    return imapInstance;
  } catch (error) {
    console.error('❌ Error creando conexión IMAP:', error);
    throw error;
  }
};

// Sistema de detección de spam
export class SpamFilter {
  private static spamKeywords = [
    // Palabras comunes en español
    'oferta especial', 'promoción limitada', 'ganar dinero', 'gratis', 'urgente',
    'felicidades', 'premio', 'sorteo', 'lotería', 'millones', 'dinero fácil',
    'trabajo desde casa', 'ingresos extras', 'oportunidad única', 'por tiempo limitado',
    'haga clic aquí', 'compre ahora', 'descuento masivo', 'oferta irresistible',
    // Palabras en inglés
    'free money', 'get rich quick', 'urgent', 'congratulations', 'winner',
    'claim now', 'limited time', 'act now', 'buy now', 'click here',
    'make money fast', 'work from home', 'no strings attached', 'risk free'
  ];

  private static spamDomains = [
    'tempmail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
    'trash-mail.com', 'throwaway.email', 'yopmail.com', 'emailondeck.com'
  ];

  private static suspiciousPatterns = [
    /\$\d+[\d,]*\s*(millones?|millions?)/i, // Cantidades de dinero grandes
    /\b\d+%\s*(descuento|discount|off)\b/i, // Porcentajes de descuento
    /\b(viagra|casino|poker|lottery|pills)\b/i, // Palabras típicas de spam
    /[A-Z]{5,}/g, // Muchas mayúsculas seguidas
    /!{3,}/g, // Múltiples signos de exclamación
  ];

  static analyzeEmail(email: ParsedMail): { isSpam: boolean; score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Verificar dominio del remitente
    const fromAddress = email.from?.value[0]?.address?.toLowerCase() || '';
    const domain = fromAddress.split('@')[1];
    
    if (domain && this.spamDomains.includes(domain)) {
      score += 50;
      reasons.push(`Dominio temporal/sospechoso: ${domain}`);
    }

    // Verificar palabras clave de spam en asunto
    const subject = (email.subject || '').toLowerCase();
    const subjectSpamWords = this.spamKeywords.filter(keyword => 
      subject.includes(keyword.toLowerCase())
    );
    
    if (subjectSpamWords.length > 0) {
      score += subjectSpamWords.length * 15;
      reasons.push(`Palabras spam en asunto: ${subjectSpamWords.join(', ')}`);
    }

    // Verificar texto del email
    const text = (email.text || '').toLowerCase();
    const textSpamWords = this.spamKeywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    if (textSpamWords.length > 0) {
      score += textSpamWords.length * 10;
      reasons.push(`Palabras spam en contenido: ${textSpamWords.join(', ')}`);
    }

    // Verificar patrones sospechosos
    const htmlContent = email.html || email.text || '';
    this.suspiciousPatterns.forEach(pattern => {
      const matches = htmlContent.match(pattern);
      if (matches && matches.length > 0) {
        score += 20;
        reasons.push(`Patrón sospechoso detectado: ${matches[0]}`);
      }
    });

    // Verificar múltiples enlaces
    const linkMatches = htmlContent.match(/<a\s+[^>]*href/gi);
    if (linkMatches && linkMatches.length > 5) {
      score += 25;
      reasons.push(`Demasiados enlaces: ${linkMatches.length}`);
    }

    // Verificar si el remitente está vacío o es sospechoso
    if (!email.from || !email.from.value || email.from.value.length === 0) {
      score += 30;
      reasons.push('Remitente vacío o inválido');
    }

    // Verificar asunto vacío
    if (!email.subject || email.subject.trim().length === 0) {
      score += 20;
      reasons.push('Asunto vacío');
    }

    // Verificar muchas mayúsculas en el asunto
    if (email.subject && email.subject.length > 0) {
      const uppercaseRatio = (email.subject.match(/[A-Z]/g) || []).length / email.subject.length;
      if (uppercaseRatio > 0.5) {
        score += 15;
        reasons.push('Demasiadas mayúsculas en asunto');
      }
    }

    return {
      isSpam: score >= 50, // Umbral de 50 puntos para considerar spam
      score,
      reasons
    };
  }
}

// Clase principal para leer emails
export class EmailReader {
  private imap: any;
  private openInbox: any;
  private search: any;

  constructor() {
    try {
      this.imap = createImapConnection();
      console.log('📧 Cliente IMAP creado:', !!this.imap);
      
      // Solo promisificar si el objeto existe
      if (this.imap) {
        this.openInbox = promisify(this.imap.openBox.bind(this.imap));
        this.search = promisify(this.imap.search.bind(this.imap));
      } else {
        throw new Error('No se pudo crear el cliente IMAP');
      }
    } catch (error) {
      console.error('❌ Error en constructor EmailReader:', error);
      throw error;
    }
  }

  private parseMessage(msg: any): Promise<ParsedMail> {
    return new Promise((resolve, reject) => {
      let buffer = '';
      
      msg.on('body', (stream: any) => {
        stream.on('data', (chunk: any) => {
          buffer += chunk.toString('utf8');
        });
        
        stream.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            resolve(parsed);
          } catch (error) {
            reject(error);
          }
        });
      });

      msg.once('error', reject);
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('✅ Conexión IMAP establecida');
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        console.error('❌ Error de conexión IMAP:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.imap.once('end', () => {
        console.log('📧 Conexión IMAP cerrada');
        resolve();
      });

      this.imap.end();
    });
  }

  async getEmails(filter: EmailFilter = {}): Promise<ReceivedEmail[]> {
    try {
      console.log('📥 Obteniendo emails con filtro:', filter);

      // Verificar que las funciones promisificadas estén disponibles
      if (!this.openInbox || !this.search) {
        throw new Error('Métodos IMAP no inicializados correctamente');
      }

      // Abrir carpeta (por defecto INBOX)
      const folder = filter.folder || 'INBOX';
      await this.openInbox(folder, true); // true = solo lectura

      // Construir criterios de búsqueda
      const searchCriteria: any[] = ['ALL'];
      
      if (filter.isRead === false) {
        searchCriteria.push('UNSEEN');
      } else if (filter.isRead === true) {
        searchCriteria.push('SEEN');
      }

      if (filter.fromAddress) {
        searchCriteria.push(['FROM', filter.fromAddress]);
      }

      if (filter.subject) {
        searchCriteria.push(['SUBJECT', filter.subject]);
      }

      if (filter.dateFrom) {
        searchCriteria.push(['SINCE', filter.dateFrom]);
      }

      if (filter.dateTo) {
        searchCriteria.push(['BEFORE', filter.dateTo]);
      }

      // Buscar emails
      const results = await this.search(searchCriteria);
      
      if (!results || results.length === 0) {
        console.log('📭 No se encontraron emails con los criterios especificados');
        return [];
      }

      console.log(`📬 Encontrados ${results.length} emails`);

      // Limitar resultados si se especifica
      const limitedResults = filter.limit ? results.slice(-filter.limit) : results;

      // Obtener emails
      const emails: ReceivedEmail[] = [];
      
      return new Promise((resolve, reject) => {
        const fetch = this.imap.fetch(limitedResults, {
          bodies: '',
          struct: true,
          markSeen: false
        });

        fetch.on('message', (msg: any, seqno: number) => {
          let attributes: any;

          msg.on('attributes', (attrs: any) => {
            attributes = attrs;
          });

          this.parseMessage(msg)
            .then((parsed) => {
              // Análisis de spam
              const spamAnalysis = SpamFilter.analyzeEmail(parsed);

              // Filtrar por spam si se especifica
              if (filter.isSpam !== undefined && filter.isSpam !== spamAnalysis.isSpam) {
                return;
              }

              const email: ReceivedEmail = {
                id: `${seqno}`,
                messageId: parsed.messageId || `unknown-${seqno}`,
                subject: parsed.subject || '(Sin asunto)',
                from: {
                  name: parsed.from?.value[0]?.name,
                  address: parsed.from?.value[0]?.address || 'unknown'
                },
                to: parsed.to?.value?.map(addr => ({
                  name: addr.name,
                  address: addr.address
                })) || [],
                date: parsed.date || new Date(),
                text: parsed.text,
                html: parsed.html,
                attachments: parsed.attachments?.map(att => ({
                  filename: att.filename || 'attachment',
                  contentType: att.contentType || 'application/octet-stream',
                  size: att.size || 0
                  // No incluir content para evitar problemas de serialización con Next.js
                })) || [],
                flags: attributes?.flags || [],
                isRead: attributes?.flags?.includes('\\Seen') || false,
                isSpam: spamAnalysis.isSpam,
                spamScore: spamAnalysis.score,
                spamReasons: spamAnalysis.reasons
              };

              emails.push(email);
            })
            .catch((error) => {
              console.error('❌ Error parseando email:', error);
            });
        });

        fetch.once('error', (err: Error) => {
          console.error('❌ Error obteniendo emails:', err);
          reject(err);
        });

        fetch.once('end', () => {
          // Ordenar por fecha (más reciente primero)
          emails.sort((a, b) => b.date.getTime() - a.date.getTime());
          
          console.log(`✅ Obtenidos ${emails.length} emails procesados`);
          resolve(emails);
        });
      });

    } catch (error) {
      console.error('❌ Error en getEmails:', error);
      throw error;
    }
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    try {
      console.log('📖 Marcando como leídos:', messageIds);
      
      // Convertir IDs a números
      const seqnos = messageIds.map(id => parseInt(id));
      
      this.imap.addFlags(seqnos, ['\\Seen'], (err) => {
        if (err) {
          console.error('❌ Error marcando como leído:', err);
          throw err;
        }
        console.log('✅ Emails marcados como leídos');
      });
    } catch (error) {
      console.error('❌ Error en markAsRead:', error);
      throw error;
    }
  }

  async moveToSpam(messageIds: string[]): Promise<void> {
    try {
      console.log('🗑️ Moviendo a spam:', messageIds);
      
      // Convertir IDs a números
      const seqnos = messageIds.map(id => parseInt(id));
      
      this.imap.move(seqnos, '[Gmail]/Spam', (err) => {
        if (err) {
          console.error('❌ Error moviendo a spam:', err);
          throw err;
        }
        console.log('✅ Emails movidos a spam');
      });
    } catch (error) {
      console.error('❌ Error en moveToSpam:', error);
      throw error;
    }
  }

  async deleteEmails(messageIds: string[]): Promise<void> {
    try {
      console.log('🗑️ Eliminando emails:', messageIds);
      
      // Convertir IDs a números
      const seqnos = messageIds.map(id => parseInt(id));
      
      // Marcar como eliminados
      this.imap.addFlags(seqnos, ['\\Deleted'], (err) => {
        if (err) {
          console.error('❌ Error marcando para eliminar:', err);
          throw err;
        }
        
        // Expurgar (eliminar permanentemente)
        this.imap.expunge((expungeErr) => {
          if (expungeErr) {
            console.error('❌ Error expurgando:', expungeErr);
            throw expungeErr;
          }
          console.log('✅ Emails eliminados permanentemente');
        });
      });
    } catch (error) {
      console.error('❌ Error en deleteEmails:', error);
      throw error;
    }
  }

  // Función para obtener el contenido de un adjunto específico (para futuras implementaciones de descarga)
  async getAttachmentContent(messageId: string, attachmentIndex: number): Promise<{ 
    success: boolean; 
    content?: Buffer; 
    error?: string; 
  }> {
    try {
      console.log('📎 Obteniendo contenido de adjunto:', { messageId, attachmentIndex });
      
      // Esta función se puede implementar más adelante para permitir descargas de adjuntos
      // Por ahora retornamos un placeholder
      return {
        success: false,
        error: 'Funcionalidad de descarga de adjuntos pendiente de implementar'
      };
    } catch (error) {
      console.error('❌ Error obteniendo adjunto:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

// Función para probar la configuración de lectura de emails
export async function testEmailReaderConfiguration(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧪 Probando configuración de lectura de emails...');

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return {
        success: false,
        message: 'Variables de entorno de Gmail no configuradas. Revisa GMAIL_USER y GMAIL_APP_PASSWORD.',
      };
    }

    // Verificar que la librería IMAP esté disponible
    if (typeof Imap !== 'function') {
      console.error('❌ Librería IMAP no disponible');
      return {
        success: false,
        message: 'La librería IMAP no está instalada o no se puede importar correctamente.',
      };
    }

    console.log('✅ Librería IMAP disponible');

    // Intentar crear el reader
    let reader;
    try {
      reader = new EmailReader();
      console.log('✅ EmailReader creado exitosamente');
    } catch (readerError) {
      console.error('❌ Error creando EmailReader:', readerError);
      return {
        success: false,
        message: `Error creando EmailReader: ${readerError instanceof Error ? readerError.message : 'Error desconocido'}`,
      };
    }

    // Intentar conectar
    try {
      await reader.connect();
      console.log('✅ Conexión IMAP establecida');
    } catch (connectError) {
      console.error('❌ Error conectando IMAP:', connectError);
      return {
        success: false,
        message: `Error de conexión IMAP: ${connectError instanceof Error ? connectError.message : 'Error desconocido'}`,
      };
    }
    
    // Intentar obtener algunos emails para verificar
    let emails;
    try {
      emails = await reader.getEmails({ limit: 1 });
      console.log(`✅ Emails obtenidos: ${emails.length}`);
    } catch (emailError) {
      console.error('❌ Error obteniendo emails:', emailError);
      await reader.disconnect();
      return {
        success: false,
        message: `Error obteniendo emails: ${emailError instanceof Error ? emailError.message : 'Error desconocido'}`,
      };
    }
    
    await reader.disconnect();

    console.log('✅ Configuración de lectura de emails validada');
    return {
      success: true,
      message: `Configuración correcta. Se puede acceder a la bandeja de entrada. Último email: ${emails.length > 0 ? 'disponible' : 'no hay emails'}`,
    };

  } catch (error) {
    console.error('❌ Error en configuración de lectura de emails:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return {
      success: false,
      message: `Error de configuración IMAP: ${errorMessage}`,
    };
  }
} 