# 🚀 Guía Rápida: Activar Anthropic Claude para Emails de Presupuestos

## ✅ ¿Qué se implementó?

**¡Tu sistema ahora tiene Anthropic Claude integrado!** 🎉

- ✅ **Selector de IA**: Elige entre Claude y ChatGPT
- ✅ **Generación automática**: Emails profesionales con un clic
- ✅ **Múltiples tonos**: Formal, Profesional, Amigable
- ✅ **Interfaz mejorada**: Modal de emails renovado
- ✅ **Logging completo**: Seguimiento de uso y costos

---

## 🔧 Para activar Claude (5 minutos):

### **Paso 1: Obtener API Key de Anthropic**
1. Ve a: https://console.anthropic.com/
2. Crea cuenta o inicia sesión
3. Ve a "API Keys" y genera una nueva
4. Copia la key (formato: `sk-ant-api03-...`)

### **Paso 2: Agregar a tu .env.local**
```bash
# Abre tu archivo .env.local y agrega:
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Paso 3: Reiniciar el servidor**
```bash
npm run dev
```

### **Paso 4: Verificar que funciona**
1. Ve a: `http://localhost:3000/api/check-env`
2. Debe mostrar: `Anthropic: ✅`
3. Prueba: `http://localhost:3000/api/ai/test-anthropic`

---

## 🎯 Cómo usar en presupuestos:

1. **Ir a Presupuestos** → Abrir cualquier presupuesto → Botón "Enviar por Email"

2. **Nueva sección "✨ Generación Automática con IA":**
   ```
   Proveedor de IA: [Claude (Anthropic) ▼]
   Tono del Email:  [🏢 Profesional ▼]
   [✨ Generar Email con Claude]
   ```

3. **Hacer clic en "Generar"** → Claude escribirá un email profesional automáticamente

4. **Editar si quieres** → Enviar como siempre

---

## 🌟 Ventajas de Claude vs ChatGPT:

| Característica | Claude | ChatGPT |
|---|---|---|
| **Emails comerciales** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Español natural** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Contexto largo** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Velocidad** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**💡 Recomendación**: Usa Claude para emails importantes y formales.

---

## 📱 ¿Cómo se ve?

El modal ahora tiene esta sección nueva arriba:

```
┌─────────────────────────────────────────────────┐
│ ✨ Generación Automática con IA                │
│                                                 │
│ Proveedor: [Claude ▼]  Tono: [Profesional ▼]  │
│                                                 │
│ [✨ Generar Email con Claude]                   │
│                                                 │
│ 💡 La IA generará un email personalizado...    │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Ejemplo de email generado por Claude:

```
Estimado/a [Cliente],

Esperamos que se encuentre muy bien. Nos complace presentarle 
el presupuesto para su estadía en Hotel & Spa Termas Llifen.

Hemos preparado una propuesta personalizada que incluye nuestros 
servicios premium de termas y spa, diseñados para brindarle una 
experiencia de relajación y bienestar incomparable.

**Detalles del Presupuesto #P0123:**
- Total: $250.000
- Válido hasta: 30 días

Le invitamos a revisar los detalles adjuntos y no dude en 
contactarnos para cualquier consulta. Estaremos encantados 
de hacer realidad su experiencia de descanso.

Cordialmente,
Equipo Comercial Termas Llifen
```

---

## 🆘 Si algo no funciona:

1. **Verificar API Key**: Ve a `/api/check-env`
2. **Logs del servidor**: Busca errores en la consola
3. **Prueba individual**: Ve a `/api/ai/test-anthropic`
4. **Fallback**: Siempre puedes usar ChatGPT como alternativa

---

## 📊 Qué se registra automáticamente:

- ✅ Tokens usados por cada IA
- ✅ Costos estimados
- ✅ Tiempos de respuesta
- ✅ Éxitos y errores
- ✅ Qué usuario generó cada email

---

## 🎉 ¡Listo para usar!

**Tu sistema ahora es más poderoso:**
- 🤖 **Dos IAs** trabajando para ti
- 📧 **Emails profesionales** automáticos
- ⚡ **Más rápido** que escribir manualmente
- 🎯 **Mejor conversión** de presupuestos

**Solo necesitas configurar la `ANTHROPIC_API_KEY` y ¡a usar!**

---

*Para documentación completa ver: `docs/modules/sales/sistema-emails-presupuestos-anthropic-claude.md`* 