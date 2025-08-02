# Interfaz Plegable para Importar/Exportar Productos

Para mejorar la usabilidad y la limpieza de la interfaz en la sección de "Gestión de Productos", se ha implementado una funcionalidad plegable para el componente de "Importar / Exportar Productos".

## Detalles de la Implementación

- **Componente Modificado:** `src/components/products/ProductImportExport.tsx`
- **Estado por Defecto:** La sección ahora aparece contraída (cerrada) por defecto al cargar la página.
- **Comportamiento:** El usuario puede hacer clic en el encabezado de la sección para expandir o contraer el contenido, mostrando u ocultando los formularios de importación y exportación.

## Lógica

Se utilizó un estado de React (`isOpen`) dentro del componente para gestionar la visibilidad del contenido. Al hacer clic en el botón del encabezado, el estado cambia, lo que provoca que la sección se muestre u oculte. Se ha añadido un ícono de flecha (chevron) que rota para indicar visualmente el estado (abierto/cerrado) de la sección.

## Beneficios

- **Interfaz más Limpia:** Reduce la cantidad de información visible por defecto, permitiendo al usuario enfocarse en la tabla de productos.
- **Mejora de la Experiencia de Usuario (UX):** Ofrece un control más granular sobre la interfaz, permitiendo a los usuarios mostrar solo la información que necesitan en un momento dado. 