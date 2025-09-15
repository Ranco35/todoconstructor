# Ayuda Inteligente para Cargo/Abono y Detección Automática de Información Bancaria

## Resumen

Se han implementado **dos nuevas funcionalidades importantes** en el módulo de contabilidad:

1. **🤖 Ayuda Inteligente para Cargo/Abono**: Explicación visual de conceptos
2. **🏦 Detección Automática de Información del Banco**: Identificación automática del banco y cuenta

## Funcionalidad 1: Ayuda Inteligente para Cargo/Abono

### 🎯 Propósito
Proporcionar explicación clara de los conceptos de "cargo" y "abono" en cartolas bancarias.

### 📋 Características
- **Panel colapsable**: Se puede mostrar/ocultar
- **Explicación visual**: Colores y iconos
- **Ejemplos prácticos**: Casos reales de uso

#### 💸 **Cargo (Débito)**
- Dinero que SALE de tu cuenta
- Pagos, transferencias enviadas, comisiones

#### 💰 **Abono (Crédito)**
- Dinero que ENTRA a tu cuenta
- Transferencias recibidas, depósitos, reembolsos

## Funcionalidad 2: Detección Automática de Información del Banco

### 🎯 Propósito
Detectar automáticamente información del banco al cargar cartolas.

### 📋 Información Detectada
- **🏦 Nombre del Banco**: Identificación automática
- **📊 Número de Cuenta**: Extracción automática
- **💳 Tipo de Cuenta**: Corriente, vista, ahorro
- **💱 Moneda**: CLP, USD, EUR

### 🏦 Bancos Soportados
- Banco de Chile, Estado, Santander, BCI
- Scotiabank, Falabella, Ripley, Edwards
- Security, Consorcio, Itaú, BBVA, Cooperativo

## Beneficios

### 💡 **Para el Usuario**
- Comprensión mejorada de conceptos
- Menos errores en entrada de datos
- Experiencia mejorada
- Tiempo ahorrado

### 🏢 **Para la Empresa**
- Reducción de errores
- Eficiencia operacional
- Consistencia en datos
- Escalabilidad

## Implementación Técnica

### 🔧 **Interfaz BankInfo**
```typescript
export interface BankInfo {
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  currency?: string;
}
```

### 🎨 **Componentes UI**
- Panel de ayuda colapsable
- Tarjeta de información bancaria
- Iconos y colores diferenciados

---

**Versión**: 1.2.0  
**Estado**: Producción Ready ✅
