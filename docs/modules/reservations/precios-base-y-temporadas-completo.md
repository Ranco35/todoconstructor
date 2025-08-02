# Sistema de Precios Base y Temporadas - Guía Completa

## 📋 Resumen del Sistema

El sistema de reservas de **Hotel/Spa Admintermas** maneja precios con un sistema de **precios base** que se ajustan automáticamente según las **temporadas configuradas**. El precio base es el punto de partida que se multiplica por el porcentaje de temporada.

---

## 💰 **PRECIOS BASE CONFIGURADOS**

### 🏨 **Habitaciones**
Todas las habitaciones tienen un precio base que se ajusta por temporada:

```
📌 Habitación Doble:
   💰 Precio base: $50.000/noche
   🟢 Temporada baja: $50.000 (0% ajuste)
   🟡 Temporada media: $65.000 (+30% ajuste)
   🔴 Temporada alta: $80.000 (+60% ajuste)
```

**Habitaciones disponibles:**
- Habitación 101, 102, 103, 104, 105, 107: $50.000 - $55.000
- Cabañas 1 y 2: $50.000
- Precio máximo por noche: $55.000

### 🎯 **Programas de Alojamiento**
Los programas reemplazan completamente el precio de habitación:

```
📌 Programas Configurados:
   💰 Solo programas con precios válidos aparecen en reservas
   📦 Actualmente: Sin programas con precios configurados
   🏷️ Se requiere configurar precios para usar esta funcionalidad
```

**Programas disponibles:**
- Programa Ejecutivo: Sin precio definido
- Programa Familiar: Sin precio definido  
- Programa Luna de Miel: Sin precio definido
- Paquete Romántico: Sin precio definido

### 📦 **Productos Modulares (Paquetes)**
Los paquetes suman servicios al precio base de habitación:

```
📂 ALOJAMIENTO:
   💰 Habitación Doble: $50.000 (precio fijo)

📂 COMIDAS (precio por persona):
   💰 Desayuno Buffet: $17.850
   💰 Almuerzo Programa: $29.750
   💰 Cena Alojados: $30.000

📂 SPA (precio por persona):
   💰 Piscina Termal: $22.000
```

---

## 🗓️ **TEMPORADAS CONFIGURADAS**

### 🟢 **Temporada Baja (Descuentos)**
- **Invierno Laboral**: Abril 21 - Julio 14 (-20%)
- **Post Verano**: Abril 1 - Abril 12 (-15%)

### 🟡 **Temporada Media (Sin cambio)**
- **Primavera 2025**: Septiembre 22 - Diciembre 19 (0%)
- **Otoño 2025**: Abril 1 - Julio 14 (0%)

### 🔴 **Temporada Alta (Incrementos)**
- **Verano 2025**: Enero 1 - Marzo 31 (+30%)
- **Semana Santa 2025**: Abril 13 - Abril 20 (+35%)
- **Vacaciones de Invierno**: Julio 15 - Agosto 15 (+25%)
- **Fiestas Patrias**: Septiembre 17 - Septiembre 21 (+40%)
- **Navidad y Año Nuevo**: Diciembre 20 - Enero 10 (+45%) ⭐ **MAYOR INCREMENTO**

---

## 🧮 **CÁLCULO DE PRECIOS**

### **Fórmula Principal:**
```
Precio Final = Precio Base × (1 + % Temporada/100)
```

### **Ejemplos Prácticos:**

#### 📋 **Ejemplo 1: Habitación sin temporada**
```
Fecha: 15 de Abril, 2025
Huéspedes: 2 adultos, 1 noche
💰 Precio base habitación: $50.000
✅ Sin temporada especial
💎 Total: $50.000
```

#### 📋 **Ejemplo 2: Habitación en Navidad**
```
Fecha: 25 de Diciembre, 2025
Huéspedes: 2 adultos, 1 noche
💰 Precio base habitación: $50.000
🔴 Temporada: Navidad y Año Nuevo (+45%)
💎 Total con temporada: $72.500
💸 Diferencia: +$22.500
```

#### 📋 **Ejemplo 3: Programa en Navidad**
```
Fecha: 25 de Diciembre, 2025
Huéspedes: 2 adultos, 2 noches
💰 Precio base programa: [Sin programas configurados]
🔴 Temporada: Navidad y Año Nuevo (+45%)
💎 Total con temporada: [Requiere configurar precio base]
💸 Diferencia: [Depende del precio configurado]
```

#### 📋 **Ejemplo 4: Paquete Modular**
```
Fecha: 15 de Mayo, 2025 (temporada baja)
Huéspedes: 2 adultos, 1 noche
🏨 Componentes del paquete:
   💰 Habitación: $50.000
   🍽️ Desayuno (2 personas): $35.700
   🏊 Piscina (2 personas): $44.000
💎 Total paquete: $129.700
✅ Precios incluyen IVA 19%
```

---

## 📊 **COMPARACIÓN DE OPCIONES**

### **Escenario: 2 adultos, 1 noche en Navidad**

```
🏨 Solo Habitación:
   💰 Precio: $72.500
   📦 Incluye: Solo alojamiento

🎯 Programa Completo:
   💰 Precio: [Sin programas configurados]
   📦 Incluye: Alojamiento + servicios premium

📦 Paquete Modular:
   💰 Precio: $129.700
   📦 Incluye: Habitación + desayuno + piscina
```

---

## 🔧 **FUNCIONAMIENTO TÉCNICO**

### **Sistema Automático de Temporadas**
1. **Detección automática**: Al seleccionar fecha, el sistema detecta automáticamente la temporada
2. **Cálculo dinámico**: Los precios se ajustan en tiempo real
3. **Prioridad de temporadas**: Si hay solapamientos, se usa la temporada de mayor prioridad
4. **Aplicación selectiva**: Cada temporada puede aplicar a habitaciones y/o programas

### **Funciones SQL Principales**
- `get_season_for_date(fecha)`: Obtiene temporada activa para una fecha
- `calculate_seasonal_price(precio_base, fecha, tipo)`: Calcula precio con temporada
- `calculate_package_price_modular(...)`: Calcula precio completo de paquetes

### **Componentes Frontend**
- **ReservationModal.tsx**: Cálculo automático al seleccionar fecha
- **Indicadores visuales**: Colores por tipo de temporada
- **Desglose transparente**: Muestra precio base + ajuste + total

---

## 💡 **REGLAS DE NEGOCIO**

### **Jerarquía de Precios**
1. **Programas de Alojamiento**: Reemplazan completamente el precio de habitación
2. **Habitaciones**: Usan precio base + ajuste de temporada
3. **Paquetes Modulares**: Suman servicios al precio base de habitación
4. **Productos Spa**: Se agregan como adicionales

### **Aplicación de Temporadas**
- **Habitaciones**: Todas las temporadas aplican
- **Programas**: Todas las temporadas aplican
- **Productos Modulares**: No se ajustan por temporada (ya incluyen IVA)

### **Descuentos Adicionales**
- **Operarios**: Pueden aplicar descuentos adicionales manuales
- **Porcentaje**: 1% a 100%
- **Monto fijo**: $1.000 a $∞
- **Se aplica después del cálculo de temporada**

---

## 🎯 **CONCLUSIONES CLAVE**

### **El Precio Base es:**
- **Punto de partida**: Todos los cálculos parten del precio base
- **Referencia fija**: No cambia, solo se ajusta por temporada
- **Habitaciones**: $50.000 - $55.000 por noche
- **Programas**: Sin precios configurados
- **Productos**: $17.850 - $30.000 por persona

### **Las Temporadas:**
- **Ajustan automáticamente**: El precio base se multiplica por el porcentaje
- **Rango de ajuste**: -20% (baja) a +45% (Navidad)
- **Aplicación selectiva**: Pueden aplicar solo a habitaciones o programas
- **Detección automática**: Por fecha, sin intervención manual

### **Tipos de Reserva:**
- **Solo Habitación**: Precio base + temporada
- **Programa Completo**: Precio programa + temporada
- **Paquete Modular**: Habitación + servicios (con IVA incluido)

---

**Fecha de Documentación:** 4 de Julio 2025  
**Sistema:** Hotel/Spa Admintermas  
**Estado:** Completamente Operativo  
**Precios:** Incluyen IVA 19% 