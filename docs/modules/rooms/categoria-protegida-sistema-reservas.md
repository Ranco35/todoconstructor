# Categoría Protegida "Sistema Reservas" para Habitaciones

## 📋 Resumen

Todos los productos reales de habitaciones creados por el sistema **deben pertenecer a la categoría protegida** llamada `Sistema Reservas`. Esta categoría es fundamental para la organización, protección y funcionamiento correcto del sistema de reservas.

---

## ⚙️ ¿Cómo se asigna la categoría?

- Al crear una habitación desde la configuración, el sistema intenta asignar automáticamente la categoría `Sistema Reservas` al producto real de la habitación (campo `categoryid`).
- Si la categoría no existe en la base de datos al momento de crear la habitación, el producto se crea **sin categoría** y se muestra una advertencia en consola.

---

## 🛡️ Protección en la interfaz

- En la gestión de categorías, la categoría `Sistema Reservas` aparece como **Protegida** y no se puede eliminar desde la interfaz.
- Esto previene la eliminación accidental y asegura la integridad del sistema de reservas.

---

## 🚨 Auditoría y corrección

### 1. **Verificar productos de habitaciones sin categoría**

Ejecuta en Supabase SQL Editor:
```sql
SELECT id, sku, name, categoryid
FROM "Product"
WHERE sku LIKE 'HAB-%' AND (categoryid IS NULL OR categoryid != (SELECT id FROM "Category" WHERE name = 'Sistema Reservas'));
```

### 2. **Asignar la categoría a todos los productos de habitaciones**

Si encuentras productos sin categoría o con categoría incorrecta, ejecuta:
```sql
UPDATE "Product"
SET categoryid = (SELECT id FROM "Category" WHERE name = 'Sistema Reservas')
WHERE sku LIKE 'HAB-%';
```

### 3. **Verificar que la categoría existe**

Si la categoría no existe, créala con:
```sql
INSERT INTO "Category" (name, description, "createdAt", "updatedAt")
VALUES ('Sistema Reservas', 'Categoría protegida para productos de habitaciones del sistema de reservas', NOW(), NOW());
```

---

## 📝 Recomendaciones

- **Siempre verifica** que la categoría `Sistema Reservas` exista antes de crear habitaciones.
- Realiza auditorías periódicas para asegurar que todos los productos de habitaciones tengan la categoría correcta.
- Si restauras un backup o migras datos, ejecuta el script de asignación para evitar inconsistencias.

---

## ✅ Beneficios

- **Organización clara:** Todos los productos de habitaciones están agrupados y protegidos.
- **Prevención de errores:** No se pueden eliminar habitaciones ni la categoría accidentalmente.
- **Compatibilidad total:** El sistema de reservas y la gestión de productos funcionan de forma robusta y predecible.

---

**Última actualización:** [fecha automática al guardar este archivo] 