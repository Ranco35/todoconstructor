# Manejo de Parámetros de Ruta en Next.js 13+

## 📋 Descripción
Este documento describe la estructura y mejores prácticas para manejar parámetros de ruta en Next.js 13+.

## 🎯 Estructura Básica

### 1. Tipos de Parámetros
```typescript
interface PageProps {
  params: {
    id: string;
    // otros parámetros dinámicos
  };
  searchParams: {
    // parámetros de búsqueda (query params)
  };
}
```

### 2. Estructura de Carpetas
```
app/
├── [id]/           # Ruta dinámica con parámetro id
│   └── page.tsx    # Componente de página
├── [slug]/         # Otra ruta dinámica
│   └── page.tsx
└── page.tsx        # Página principal
```

## 💻 Implementación

### 1. Componente de Página
```typescript
export default function Page({ params, searchParams }: PageProps) {
  const { id } = params;
  // usar el id aquí
}
```

### 2. Ejemplo Completo
```typescript
// app/[id]/page.tsx
interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    filter?: string;
    sort?: string;
  };
}

export default function Page({ params, searchParams }: PageProps) {
  const { id } = params;
  const { filter, sort } = searchParams;
  
  return (
    <div>
      <h1>Página {id}</h1>
      {/* Resto del componente */}
    </div>
  );
}
```

## 🔄 Generación de Rutas

### 1. Rutas Estáticas
```typescript
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    // etc...
  ];
}
```

### 2. Validación de Parámetros
```typescript
export async function generateMetadata({ params }: PageProps) {
  if (!params.id) {
    return {
      title: 'Página no encontrada'
    };
  }
  
  return {
    title: `Página ${params.id}`
  };
}
```

## 📝 Notas Importantes

1. **Parámetros de Ruta**
   - Accesibles a través de `params`
   - Definidos en la estructura de carpetas con `[paramName]`
   - Siempre son strings

2. **Parámetros de Búsqueda**
   - Accesibles a través de `searchParams`
   - Opcionales
   - Pueden ser strings o arrays de strings

3. **Mejores Prácticas**
   - Siempre tipar los parámetros
   - Validar los parámetros antes de usar
   - Usar generateStaticParams para rutas estáticas
   - Implementar manejo de errores

## 🔗 Enlaces Relacionados
- [Documentación Oficial de Next.js](https://nextjs.org/docs)
- [Guía de Enrutamiento](https://nextjs.org/docs/app/building-your-application/routing)

## 📅 Última Actualización
- Fecha: Diciembre 2024
- Versión: 1.0.0 