# 🧑‍👩‍👧‍👦 Guía de Uso: Distribución de Pasajeros por Habitación

## 📋 **Paso a Paso: Cómo Configurar Pasajeros por Habitación**

### **1. Crear Nueva Reserva con Múltiples Habitaciones**

1. **Ir a crear reserva:**
   ```
   📍 /dashboard/reservations/nueva
   ```

2. **Configurar datos básicos:**
   ```
   ✅ Seleccionar cliente
   ✅ Fechas (check-in / check-out)
   ✅ Total de pasajeros: Ej: 6 personas (4 adultos, 2 niños)
   ✅ Edades de niños: Ej: 5 y 8 años
   ✅ Seleccionar paquete (Ej: Media Pensión)
   ```

### **2. Activar Selección de Múltiples Habitaciones**

3. **Click en botón:**
   ```
   🏨 Múltiples Habitaciones
   ```

4. **Verás el modal con la guía de ayuda azul:**
   ```
   🧑‍🏫 NUEVA FUNCIONALIDAD: Distribución de Pasajeros
   • Selecciona habitaciones → Se distribuyen automáticamente
   • Ajusta manualmente con botones +/- 
   • Configura edades específicas por habitación
   ```

### **3. Seleccionar Habitaciones (Distribución Automática)**

5. **Seleccionar habitaciones deseadas:**
   ```
   ☑️ Habitación 101 → Automáticamente: 2 adultos, 1 niño
   ☑️ Habitación 102 → Automáticamente: 2 adultos, 1 niño
   ```

6. **Verificar distribución automática:**
   ```
   📊 Resumen aparece automáticamente:
   • Total distribuido: 4 adultos, 2 niños ✅
   • Coincide con total esperado ✅
   ```

### **4. Configuración Manual (Si Necesitas Ajustar)**

7. **Ajustar pasajeros por habitación:**
   ```
   🏨 Habitación 101:
   • Adultos: 2 → cambiar a 1 (botón -)
   • Niños: 1 → cambiar a 2 (botón +)
   • Edades: [5, 8] → configurar manualmente
   
   🏨 Habitación 102:
   • Adultos: 2 → cambiar a 3 (botón +)
   • Niños: 1 → cambiar a 0 (botón -)
   • Edades: [] → sin niños
   ```

8. **Verificar totales:**
   ```
   ⚠️ Si no coincide: Alerta roja "Total distribuido no coincide"
   ✅ Si coincide: Badge verde "Distribución correcta"
   ```

### **5. Redistribuir Automáticamente (Si Necesario)**

9. **Usar botón de redistribución:**
   ```
   🔄 Redistribuir Equitativamente
   → Vuelve a distribución automática perfecta
   ```

### **6. Confirmar y Crear Reserva**

10. **Confirmar selección:**
    ```
    ✅ Confirmar Habitaciones
    → Cierra modal y regresa al formulario principal
    ```

11. **Crear reserva:**
    ```
    💾 Crear Reserva
    → Sistema guarda distribución específica por habitación
    ```

---

## 🎯 **Casos de Uso Reales**

### **Caso 1: Familia con Abuelos**
```
📊 Total: 6 personas (4 adultos, 2 niños de 6 y 10 años)
🏨 Habitación 101: 2 adultos (abuelos), 0 niños
🏨 Habitación 102: 2 adultos (padres), 2 niños (6, 10 años)
💰 Precios: Calculados específicamente por habitación
```

### **Caso 2: Grupo de Amigos con Familias**
```
📊 Total: 8 personas (6 adultos, 2 niños de 4 y 7 años)
🏨 Habitación 101: 2 adultos (pareja sin hijos), 0 niños
🏨 Habitación 102: 2 adultos, 1 niño (7 años)
🏨 Habitación 103: 2 adultos, 1 niño (4 años)
💰 Precios: Ajustados por cantidad real de personas por habitación
```

### **Caso 3: Evento Empresarial**
```
📊 Total: 12 personas (12 adultos, 0 niños)
🏨 Habitación 101: 3 adultos (ejecutivos)
🏨 Habitación 102: 4 adultos (equipo marketing)
🏨 Habitación 103: 3 adultos (equipo ventas)
🏨 Habitación 104: 2 adultos (directivos)
💰 Precios: Precisos por ocupación real
```

---

## ⚠️ **Alertas y Validaciones**

### **🔴 Alerta Roja: "Total no coincide"**
```
Problema: Distribuiste 5 personas pero tienes 6 en total
Solución: Ajustar números o usar "🔄 Redistribuir"
```

### **🟡 Alerta Amarilla: "Sobrepasaste capacidad"**
```
Problema: Habitación para 2 personas, asignaste 4
Solución: Revisar capacidad o seleccionar más habitaciones
```

### **🟢 Badge Verde: "Distribución correcta"**
```
Todo perfecto: Totales coinciden, capacidades respetadas
```

---

## 💡 **Tips y Mejores Prácticas**

### **🎯 Estrategias de Distribución**
1. **Empieza con distribución automática** → siempre es perfecta matemáticamente
2. **Ajusta según necesidades reales** → familias juntas, ejecutivos separados
3. **Usa "Redistribuir"** → si te perdiste en los números
4. **Verifica capacidades** → respeta límites por habitación

### **🔧 Solución de Problemas**
- **No aparecen controles:** Asegúrate de haber seleccionado la habitación primero
- **Números no cuadran:** Usa el botón "🔄 Redistribuir Equitativamente"
- **Precios extraños:** Cada habitación calcula según sus pasajeros reales

### **📱 Experiencia de Usuario**
- **Visual claro:** Colores indican estado (seleccionado/no seleccionado)
- **Feedback inmediato:** Totales se actualizan en tiempo real
- **Ayuda integrada:** Sección azul siempre visible con instrucciones

---

## ✅ **Resultado Final**

Una vez confirmada la reserva, el sistema:

1. **Guarda distribución específica** por habitación en la base de datos
2. **Calcula precios precisos** según pasajeros reales por habitación  
3. **Mantiene trazabilidad completa** de quién está en qué habitación
4. **Permite edición posterior** manteniendo la distribución
5. **Genera reportes detallados** con ocupación real por habitación

**🎉 ¡El sistema ahora es 100% flexible para cualquier tipo de distribución de pasajeros!** 