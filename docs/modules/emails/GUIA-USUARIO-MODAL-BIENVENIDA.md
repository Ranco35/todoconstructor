# 📋 Guía del Usuario: Modal de Bienvenida

## 🎯 **¿Qué es el Modal de Bienvenida?**

Es la ventana que aparece cuando entras al sistema mostrando:
- 🌟 Saludo personalizado según la hora
- 📧 Resumen de correos analizados
- 🏨 Llegadas y salidas del día
- 📊 Información importante actualizada

## ⚙️ **Cómo Configurarlo**

### **Paso 1: Acceder a Configuración**
1. Espera a que aparezca el modal de bienvenida
2. Busca el botón **⚙️** en la esquina superior derecha
3. Haz clic en él

### **Paso 2: Configurar Timer**
- ✅ **Habilitar timer**: El modal respeta el tiempo entre apariciones
- 🕐 **Horas entre apariciones**: Cuánto tiempo esperar (recomendado: 6-12 horas)

### **Paso 3: Configurar Nueva Información**
- ✅ **Solo mostrar con nueva información**: Solo aparece cuando hay datos nuevos
- 🔄 **Intervalo de verificación**: Cada cuánto revisa (recomendado: 4 horas)

---

## 🎛️ **Configuraciones Recomendadas**

### **👤 Para Usuarios Regulares**
```
Timer: 6 horas
Nueva información: ✅ Habilitado
Debug: ❌ Deshabilitado
```
*El modal aparece cuando hay nueva información, máximo cada 6 horas*

### **👨‍💼 Para Gerentes**
```
Timer: 12 horas  
Nueva información: ✅ Habilitado
Debug: ❌ Deshabilitado
```
*Aparece con nueva información, máximo 2 veces al día*

### **🔧 Para IT/Desarrollo**
```
Timer: ❌ Deshabilitado
Nueva información: ❌ Deshabilitado  
Debug: ✅ Habilitado
```
*Aparece siempre con información detallada para debugging*

---

## 🔧 **Acciones Rápidas**

### **🔄 Resetear Configuración**
- Vuelve a valores por defecto
- Útil si algo no funciona bien

### **🧹 Limpiar Estado**
- **⚠️ CUIDADO**: Hace que el modal aparezca inmediatamente
- Usar solo para testing

### **🔄 Actualizar Debug**
- Refresca la información técnica
- Solo útil si tienes debug habilitado

---

## ❓ **Preguntas Frecuentes**

### **P: ¿Por qué no aparece el modal?**
**R**: Posibles razones:
- ⏰ No ha pasado suficiente tiempo (revisa timer configurado)
- 📊 No hay nueva información disponible
- 🔒 Ya apareció en esta sesión del navegador

### **P: ¿Aparece demasiado seguido?**
**R**: Solución:
1. Abrir configuración (⚙️)
2. Aumentar "Horas entre apariciones" (ej: 12 o 24 horas)
3. Guardar configuración

### **P: ¿No aparece nunca?**
**R**: Solución:
1. Abrir configuración (⚙️)
2. Desmarcar "Solo mostrar con nueva información"
3. O usar "🧹 Limpiar Estado" para forzar aparición

### **P: ¿Quiero que aparezca solo con información importante?**
**R**: Configuración ideal:
- ✅ Timer habilitado (6-12h)
- ✅ Solo nueva información
- Intervalo: 4 horas

---

## 💡 **Consejos de Uso**

### **🎯 Para Máxima Productividad**
- Configura timer a **6 horas**
- Habilita **"solo nueva información"**
- Así solo te interrumpe cuando realmente hay algo nuevo

### **🔕 Para Menos Interrupciones**
- Configura timer a **24 horas**
- El modal aparece máximo 1 vez por día

### **🚨 Para No Perderte Nada**
- Configura timer a **2 horas**
- Mantén habilitada verificación de nueva información
- Recibirás actualizaciones más frecuentes

---

## 🎨 **¿Qué Información Muestra?**

### **📧 Correos Electrónicos**
- Cantidad de correos analizados hoy
- Correos urgentes detectados
- Sentimiento general (positivo/negativo/neutral)

### **🏨 Reservas del Día**
- **Llegadas**: Clientes que llegan hoy
- **Salidas**: Clientes que se van hoy
- Estados de reservas (confirmada, en curso, etc.)

### **⏰ Información de Sincronización**
- Última vez que se revisaron los correos
- Próxima sincronización programada
- Total de análisis realizados hoy

---

## ✅ **Lista de Verificación**

Después de configurar, verifica:
- [ ] Timer configurado según tus necesidades
- [ ] Nueva información habilitada si quieres solo datos relevantes
- [ ] Debug deshabilitado (a menos que seas IT)
- [ ] Configuración guardada correctamente

**¡Listo! Tu modal de bienvenida está configurado según tus preferencias.** 🎉 