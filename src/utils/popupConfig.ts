// Configuración centralizada para el sistema de popup de bienvenida

export interface PopupConfig {
  timerHours: number;
  checkIntervalHours: number;
  enableNewInfoCheck: boolean;
  enableTimer: boolean;
  debugMode: boolean;
}

// Configuración por defecto
export const DEFAULT_POPUP_CONFIG: PopupConfig = {
  timerHours: 6,           // No mostrar hasta después de 6 horas
  checkIntervalHours: 4,   // Verificar nueva información cada 4 horas
  enableNewInfoCheck: true, // Habilitar verificación de nueva información
  enableTimer: true,       // Habilitar timer
  debugMode: false         // Modo debug para desarrollo
};

// Claves de localStorage
export const STORAGE_KEYS = {
  POPUP_TIMESTAMP: 'email-analysis-popup-last-shown',
  POPUP_SESSION: 'email-analysis-popup-shown',
  LAST_DATA_CHECK: 'email-analysis-last-data-check',
  POPUP_CONFIG: 'email-analysis-popup-config',
  LAST_EMAIL_COUNT: 'email-analysis-last-email-count',
  LAST_RESERVATION_COUNT: 'email-analysis-last-reservation-count'
};

// Función para obtener configuración (con fallback a default)
export function getPopupConfig(): PopupConfig {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEYS.POPUP_CONFIG);
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      return { ...DEFAULT_POPUP_CONFIG, ...parsedConfig };
    }
  } catch (error) {
    console.warn('Error cargando configuración del popup, usando default:', error);
  }
  return DEFAULT_POPUP_CONFIG;
}

// Función para guardar configuración
export function savePopupConfig(config: Partial<PopupConfig>): void {
  try {
    const currentConfig = getPopupConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem(STORAGE_KEYS.POPUP_CONFIG, JSON.stringify(newConfig));
    console.log('✅ Configuración del popup guardada:', newConfig);
  } catch (error) {
    console.error('❌ Error guardando configuración del popup:', error);
  }
}

// Función para resetear configuración a default
export function resetPopupConfig(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POPUP_CONFIG, JSON.stringify(DEFAULT_POPUP_CONFIG));
    console.log('🔄 Configuración del popup reseteada a default');
  } catch (error) {
    console.error('❌ Error reseteando configuración del popup:', error);
  }
}

// Función para limpiar completamente el estado del popup (para testing)
export function clearPopupState(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    console.log('🧹 Estado del popup completamente limpiado');
  } catch (error) {
    console.error('❌ Error limpiando estado del popup:', error);
  }
}

// Función para obtener información de debug
export function getPopupDebugInfo(): any {
  const config = getPopupConfig();
  const lastShownTimestamp = localStorage.getItem(STORAGE_KEYS.POPUP_TIMESTAMP);
  const sessionShown = sessionStorage.getItem(STORAGE_KEYS.POPUP_SESSION);
  const lastDataCheck = localStorage.getItem(STORAGE_KEYS.LAST_DATA_CHECK);
  
  const now = new Date();
  
  let lastShownInfo = null;
  if (lastShownTimestamp) {
    const lastShown = new Date(parseInt(lastShownTimestamp));
    const hoursSince = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
    lastShownInfo = {
      timestamp: lastShown.toLocaleString(),
      hoursAgo: hoursSince.toFixed(1),
      canShowBasedOnTimer: hoursSince >= config.timerHours
    };
  }
  
  let lastDataCheckInfo = null;
  if (lastDataCheck) {
    const lastCheck = new Date(parseInt(lastDataCheck));
    const hoursSince = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
    lastDataCheckInfo = {
      timestamp: lastCheck.toLocaleString(),
      hoursAgo: hoursSince.toFixed(1),
      shouldCheckNewInfo: hoursSince >= config.checkIntervalHours
    };
  }
  
  return {
    config,
    currentTime: now.toLocaleString(),
    sessionShown: sessionShown === 'true',
    lastShown: lastShownInfo,
    lastDataCheck: lastDataCheckInfo,
    storageKeys: STORAGE_KEYS
  };
}

// Función para log de debug
export function logPopupDebug(message: string, data?: any): void {
  const config = getPopupConfig();
  if (config.debugMode) {
    console.log(`🐛 [POPUP DEBUG] ${message}`, data || '');
  }
} 