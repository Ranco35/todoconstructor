# 🔧 Documentación Técnica: Sistema de Timer Modal de Bienvenida

## 📊 **Resumen Técnico**

**Implementación**: Sistema de control inteligente para modal de bienvenida  
**Tecnologías**: React Context, TypeScript, localStorage/sessionStorage  
**Arquitectura**: Configuración centralizada + Context + Componentes modulares  
**Compatibilidad**: Todos los navegadores modernos

---

## 🏗️ **Arquitectura del Sistema**

```
📁 src/
├── utils/
│   └── popupConfig.ts              # Configuración centralizada
├── contexts/
│   └── EmailAnalysisContext.tsx    # Lógica de control del modal
├── components/emails/
│   ├── EmailAnalysisPopup.tsx      # Modal principal
│   └── PopupConfigModal.tsx        # Modal de configuración
└── docs/modules/emails/
    ├── modal-bienvenida-timer-sistema.md      # Doc completa
    ├── GUIA-USUARIO-MODAL-BIENVENIDA.md       # Guía usuario
    └── DOCUMENTACION-TECNICA-MODAL-TIMER.md   # Este archivo
```

---

## 🔧 **Configuración Centralizada (`utils/popupConfig.ts`)**

### **Interface Principal**
```typescript
interface PopupConfig {
  timerHours: number;           // Horas entre apariciones
  checkIntervalHours: number;   // Intervalo verificación nueva info
  enableNewInfoCheck: boolean;  // Habilitar verificación inteligente
  enableTimer: boolean;         // Habilitar sistema de timer
  debugMode: boolean;          // Logs detallados
}
```

### **Claves de Storage**
```typescript
const STORAGE_KEYS = {
  POPUP_TIMESTAMP: 'email-analysis-popup-last-shown',        // Última aparición
  POPUP_SESSION: 'email-analysis-popup-shown',               // Estado sesión
  LAST_DATA_CHECK: 'email-analysis-last-data-check',         // Última verificación
  POPUP_CONFIG: 'email-analysis-popup-config',               // Configuración
  LAST_EMAIL_COUNT: 'email-analysis-last-email-count',       // Conteo correos
  LAST_RESERVATION_COUNT: 'email-analysis-last-reservation-count' // Conteo reservas
}
```

### **Funciones Públicas**
```typescript
// Gestión de configuración
getPopupConfig(): PopupConfig
savePopupConfig(config: Partial<PopupConfig>): void
resetPopupConfig(): void

// Debug y utilidades
getPopupDebugInfo(): any
clearPopupState(): void
logPopupDebug(message: string, data?: any): void
```

---

## 🧠 **Context de Control (`contexts/EmailAnalysisContext.tsx`)**

### **Interface del Context**
```typescript
interface EmailAnalysisContextType {
  isPopupOpen: boolean;
  popupTrigger: 'login' | 'analysis' | 'manual';
  showPopup: (trigger: 'login' | 'analysis' | 'manual') => void;
  hidePopup: () => void;
  hasShownLoginPopup: boolean;
  markLoginPopupShown: () => void;
  canShowLoginPopup: () => boolean;
  checkForNewInformation: () => Promise<boolean>;
}
```

### **Algoritmo de Control**

#### **1. Verificación de Timer (`canShowLoginPopup`)**
```typescript
const canShowLoginPopup = useCallback(() => {
  const config = getPopupConfig();
  
  // 1. Verificar si timer está habilitado
  if (!config.enableTimer) return true;
  
  // 2. Verificar sesión actual
  if (sessionStorage.getItem(STORAGE_KEYS.POPUP_SESSION) === 'true') return false;
  
  // 3. Verificar tiempo transcurrido
  const lastShown = localStorage.getItem(STORAGE_KEYS.POPUP_TIMESTAMP);
  if (lastShown) {
    const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
    if (hoursSince < config.timerHours) return false;
  }
  
  return true;
}, []);
```

#### **2. Verificación de Nueva Información (`checkForNewInformation`)**
```typescript
const checkForNewInformation = useCallback(async (): Promise<boolean> => {
  const config = getPopupConfig();
  
  // 1. Verificar si está habilitado
  if (!config.enableNewInfoCheck) return true;
  
  // 2. Verificar intervalo de verificación
  const lastCheck = localStorage.getItem(STORAGE_KEYS.LAST_DATA_CHECK);
  if (lastCheck) {
    const hoursSince = (Date.now() - parseInt(lastCheck)) / (1000 * 60 * 60);
    if (hoursSince < config.checkIntervalHours) return false;
  }
  
  // 3. Verificar datos reales
  let hasNewInfo = false;
  
  // 3a. Verificar nuevos correos
  const analysisResult = await getTodayAnalysis();
  if (analysisResult.success) {
    const currentCount = analysisResult.data.length;
    const lastCount = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_EMAIL_COUNT) || '0');
    if (currentCount > lastCount) {
      hasNewInfo = true;
      localStorage.setItem(STORAGE_KEYS.LAST_EMAIL_COUNT, currentCount.toString());
    }
  }
  
  // 3b. Verificar nuevas reservas
  const [arrivals, departures] = await Promise.all([
    getTodayArrivals(),
    getTodayDepartures()
  ]);
  
  if (arrivals.success && departures.success) {
    const currentCount = (arrivals.data?.length || 0) + (departures.data?.length || 0);
    const lastCount = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_RESERVATION_COUNT) || '0');
    if (currentCount > lastCount) {
      hasNewInfo = true;
      localStorage.setItem(STORAGE_KEYS.LAST_RESERVATION_COUNT, currentCount.toString());
    }
  }
  
  // 3c. Fallback por tiempo extendido
  if (!hasNewInfo && lastCheck) {
    const hoursSince = (Date.now() - parseInt(lastCheck)) / (1000 * 60 * 60);
    if (hoursSince >= config.checkIntervalHours * 2) {
      hasNewInfo = true;
    }
  }
  
  return hasNewInfo;
}, []);
```

#### **3. Función Principal (`showPopup`)**
```typescript
const showPopup = useCallback(async (trigger: 'login' | 'analysis' | 'manual') => {
  // Solo aplicar validaciones para trigger 'login'
  if (trigger === 'login') {
    // Verificar estado de sesión
    if (hasShownLoginPopup) return;
    
    // Verificar timer
    if (!canShowLoginPopup()) return;
    
    // Verificar nueva información
    const hasNewInfo = await checkForNewInformation();
    if (!hasNewInfo) return;
    
    // Marcar como mostrado
    setHasShownLoginPopup(true);
    sessionStorage.setItem(STORAGE_KEYS.POPUP_SESSION, 'true');
    localStorage.setItem(STORAGE_KEYS.POPUP_TIMESTAMP, Date.now().toString());
  }
  
  // Mostrar modal
  setPopupTrigger(trigger);
  setIsPopupOpen(true);
}, [hasShownLoginPopup, canShowLoginPopup, checkForNewInformation]);
```

---

## 🎨 **Componente Modal de Configuración (`PopupConfigModal.tsx`)**

### **Props Interface**
```typescript
interface PopupConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### **Estado Local**
```typescript
const [config, setConfig] = useState<PopupConfig>(DEFAULT_POPUP_CONFIG);
const [debugInfo, setDebugInfo] = useState<any>(null);
const [showDebug, setShowDebug] = useState(false);
```

### **Funciones Principales**
```typescript
// Carga configuración actual
const loadConfig = () => {
  const currentConfig = getPopupConfig();
  setConfig(currentConfig);
};

// Guarda configuración
const handleSave = () => {
  savePopupConfig(config);
  onClose();
};

// Resetea a defaults
const handleReset = () => {
  resetPopupConfig();
  setConfig(DEFAULT_POPUP_CONFIG);
};

// Limpia estado completo
const handleClearState = () => {
  clearPopupState();
  loadDebugInfo();
};
```

---

## 🚀 **Integración en la Aplicación**

### **1. Provider en Layout (`app/dashboard/layout.tsx`)**
```typescript
// Wrapper principal
<EmailAnalysisProvider>
  <DashboardContent>
    {children}
  </DashboardContent>
</EmailAnalysisProvider>

// Uso dentro del componente
const { showPopup } = useEmailAnalysisPopup();

useEffect(() => {
  // Mostrar popup después de cargar usuario
  setTimeout(() => {
    showPopup('login');
  }, 2000);
}, [showPopup]);
```

### **2. Modal Principal (`EmailAnalysisPopup.tsx`)**
```typescript
// Import del modal de configuración
import PopupConfigModal from './PopupConfigModal';

// Estado para controlar modal de config
const [showConfigModal, setShowConfigModal] = useState(false);

// Botón de configuración en header
<button
  onClick={() => setShowConfigModal(true)}
  className="text-white hover:text-yellow-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
  title="Configurar modal de bienvenida"
>
  ⚙️
</button>

// Renderizado del modal de configuración
<PopupConfigModal
  isOpen={showConfigModal}
  onClose={() => setShowConfigModal(false)}
/>
```

---

## 🐛 **Sistema de Debug**

### **Logs Automáticos (con debugMode habilitado)**
```typescript
// Función de logging
export function logPopupDebug(message: string, data?: any): void {
  const config = getPopupConfig();
  if (config.debugMode) {
    console.log(`🐛 [POPUP DEBUG] ${message}`, data || '');
  }
}

// Ejemplos de logs
logPopupDebug('Verificando si puede mostrar popup', { config });
logPopupDebug('Última vez mostrado hace 2.3 horas');
logPopupDebug('Nuevos análisis de correos: 5 vs 3');
```

### **Información de Debug**
```typescript
export function getPopupDebugInfo(): any {
  return {
    config: getPopupConfig(),
    currentTime: new Date().toLocaleString(),
    sessionShown: sessionStorage.getItem(STORAGE_KEYS.POPUP_SESSION) === 'true',
    lastShown: {
      timestamp: lastShown?.toLocaleString(),
      hoursAgo: hoursSince.toFixed(1),
      canShowBasedOnTimer: hoursSince >= config.timerHours
    },
    lastDataCheck: {
      timestamp: lastCheck?.toLocaleString(),
      hoursAgo: hoursSince.toFixed(1),
      shouldCheckNewInfo: hoursSince >= config.checkIntervalHours
    },
    storageKeys: STORAGE_KEYS
  };
}
```

---

## 🔒 **Persistencia de Datos**

### **localStorage (Persistente entre sesiones)**
- `popup-config`: Configuración del usuario
- `popup-last-shown`: Timestamp última aparición
- `last-data-check`: Timestamp última verificación
- `last-email-count`: Último conteo de correos
- `last-reservation-count`: Último conteo de reservas

### **sessionStorage (Solo sesión actual)**
- `popup-shown`: Si ya se mostró en esta sesión

---

## ⚡ **Optimizaciones de Rendimiento**

### **1. Lazy Loading**
- Modal de configuración solo se carga cuando se necesita
- APIs se llaman solo cuando es necesario verificar

### **2. Memoización**
```typescript
const canShowLoginPopup = useCallback(() => {
  // Lógica memoizada
}, []);

const checkForNewInformation = useCallback(async () => {
  // Lógica memoizada
}, []);
```

### **3. Debouncing**
- Verificaciones de nueva información tienen intervalos mínimos
- Evita llamadas excesivas a APIs

---

## 🧪 **Testing**

### **Comandos de Consola para Testing**
```javascript
// Habilitar debug
savePopupConfig({ debugMode: true })

// Deshabilitar timer para testing
savePopupConfig({ enableTimer: false })

// Limpiar estado para forzar aparición
clearPopupState()

// Ver información completa
getPopupDebugInfo()

// Configuración rápida para testing
savePopupConfig({ 
  timerHours: 0.1,           // 6 minutos
  enableNewInfoCheck: false,  // Siempre mostrar
  debugMode: true            // Ver logs
})
```

### **Casos de Prueba**
1. **Primera carga**: Modal debe aparecer después de 2 segundos
2. **Segunda carga (misma sesión)**: No debe aparecer
3. **Nueva sesión (antes de timer)**: No debe aparecer
4. **Nueva sesión (después de timer)**: Debe aparecer si hay nueva info
5. **Nueva información**: Debe aparecer independiente del timer

---

## 📊 **Métricas y Monitoreo**

### **Datos Rastreados**
- Frecuencia de aparición del modal
- Configuraciones más comunes de usuarios
- Errores en verificación de nueva información

### **Logs de Producción**
```typescript
// Solo errores críticos en producción
console.error('❌ Error verificando nueva información:', error);
```

---

## 🔧 **Mantenimiento**

### **Tareas Regulares**
1. **Revisar logs de error** en verificación de APIs
2. **Ajustar valores por defecto** basado en feedback
3. **Optimizar consultas** a APIs si es necesario

### **Actualizaciones Futuras**
- Soporte para notificaciones push
- Integración con más fuentes de datos
- Personalización visual por usuario

---

## 📝 **Changelog**

### **v1.0.0 (Enero 2025)**
- ✅ Sistema de timer configurable
- ✅ Verificación inteligente de nueva información
- ✅ Modal de configuración visual
- ✅ Sistema de debug completo
- ✅ Documentación completa 