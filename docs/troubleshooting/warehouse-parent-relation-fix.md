# Troubleshooting: Bodegas no muestran relación padre (Parent) en el dashboard

## Problema

Al listar bodegas en el dashboard, no aparecen (o aparece error en consola/logs) cuando se intenta mostrar la relación de bodega padre (`Parent`).

**Log típico:**
```
Searched for a foreign key relationship between 'Warehouse' and 'Parent' using the hint 'Warehouse_parentId_fkey' in the schema 'public', but no matches were found.
Perhaps you meant 'Warehouse' instead of 'Parent'.
Could not find a relationship between 'Warehouse' and 'Parent' in the schema cache
```

---

## Diagnóstico rápido

1. **Verifica el log del backend:**
   - Si ves el error anterior, la consulta está usando un nombre de relación incorrecto.
2. **Verifica la definición de la relación en Supabase:**
   - Ve a Table Editor > Warehouse > Relationships.
   - La relación padre debe estar definida como `parentId` (camelCase).
3. **Verifica el select en el backend:**
   - Debe ser:
     ```js
     .select(`
       *,
       Parent:parentId (
         id,
         name
       )
     `)
     ```
   - **NO** debe ser `Parent!Warehouse_parentId_fkey`.

---

## Solución

### 1. **Corrige el select en la función getWarehouses:**

```js
.select(`
  *,
  Parent:parentId (
    id,
    name
  )
`)
```

### 2. **Asegúrate de que la relación existe en Supabase:**
- La columna `parentId` debe tener una foreign key a `Warehouse.id`.
- Si no existe, crea la relación en Supabase Table Editor o con SQL:

```sql
ALTER TABLE "Warehouse"
ADD CONSTRAINT "fk_warehouse_parent"
FOREIGN KEY ("parentId") REFERENCES "Warehouse"("id") ON DELETE SET NULL;
```

---

## Checklist de revisión
- [ ] ¿La columna `parentId` existe en la tabla `Warehouse`?
- [ ] ¿La relación foreign key está definida en Supabase?
- [ ] ¿El select usa `Parent:parentId` y no `Parent!Warehouse_parentId_fkey`?
- [ ] ¿El dashboard muestra las bodegas correctamente?

---

## Ejemplo de log exitoso tras el fix

```
🔍 [getWarehouses] warehousesResult: {
  error: null,
  data: [
    {
      id: 7,
      name: 'Comedor',
      parentId: null,
      Parent: null,
      ...
    }
  ],
  ...
}
```

---

**Última actualización: [fecha de hoy]** 