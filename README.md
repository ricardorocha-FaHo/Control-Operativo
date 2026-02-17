# Task Management System

Sistema completo de gestión de tareas con múltiples vistas: Home, Lista, Gantt, Kanban, Prioridades y Tabla.

## 📋 Características

### Vistas Disponibles

1. **🏠 Home (Inicio)**
   - Tarjetas de módulos con estadísticas
   - Total de tareas, completadas, en proceso y pendientes
   - Click en un módulo para ver sus tareas

2. **📋 Tareas**
   - Lista completa de tareas con filtros
   - Filtros por módulo, estatus y prioridad
   - Búsqueda en tiempo real
   - Click en tarea para ver detalles completos

3. **📊 Gantt**
   - Diagrama de Gantt interactivo
   - Visualización temporal de tareas
   - Barras coloreadas por estatus
   - Scroll horizontal para fechas amplias

4. **🎯 Kanban**
   - Tablero estilo Trello
   - Columnas: Pendiente, En Proceso, Ejecutado
   - Tarjetas arrastrables (drag & drop preparado)
   - Vista clara del flujo de trabajo

5. **⚡ Prioridades**
   - Tareas organizadas por P1, P2, P3
   - Ordenadas por fecha de vencimiento
   - Indicadores visuales de prioridad
   - Acceso rápido a tareas críticas

6. **📑 Tabla**
   - Vista tabular completa
   - Ordenamiento por columnas (click en headers)
   - Todas las columnas visibles
   - Exportable a Excel (funcionalidad preparada)

### Funcionalidades Globales

- **Búsqueda Global**: Busca en ID, actividad y descripción desde cualquier vista
- **Filtros Avanzados**: Múltiples filtros combinables
- **Modal de Detalles**: Click en cualquier tarea para ver información completa
- **Cache Inteligente**: Datos cacheados 5 minutos para mejor rendimiento
- **Responsive**: Adaptable a móviles, tablets y desktop
- **Animaciones Ejecutivas**: Transiciones sutiles y profesionales

## 🚀 Instalación

### 1. Configurar Google Apps Script

1. Copia el contenido de `api_plan_trabajo.gs`
2. Ve a tu Google Sheet
3. Extensiones > Apps Script
4. Pega el código
5. Guarda (Ctrl+S)
6. Click en "Implementar" > "Nueva implementación"
7. Tipo: "Aplicación web"
8. Ejecutar como: "Yo"
9. Acceso: "Cualquier persona"
10. Copia la URL generada

### 2. Configurar el Frontend

1. Abre `app.js`
2. En la línea 10, reemplaza:
   ```javascript
   API_URL: 'TU_URL_DE_API_AQUI'
   ```
   con la URL que copiaste de Google Apps Script

3. Guarda el archivo

### 3. Servir los archivos

Opción A - Servidor local simple:
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx http-server
```

Opción B - Abrir directamente:
- Abre `index.html` en tu navegador
- Funciona sin servidor (archivos locales)

## 📁 Estructura de Archivos

```
task-management-system/
│
├── index.html          # HTML principal
├── styles.css          # Estilos base y componentes
├── views.css           # Estilos específicos de vistas (Gantt, Kanban, etc)
├── app.js              # Lógica principal de la aplicación
└── README.md           # Este archivo
```

## 🎨 Paleta de Colores

El sistema usa una paleta ejecutiva minimalista:

- **Primario**: `#1a1a1a` (Negro)
- **Acento**: `#0066cc` (Azul ejecutivo)
- **Fondo**: `#fafafa` (Gris muy claro)
- **Tarjetas**: `#ffffff` (Blanco)
- **Bordes**: `#e0e0e0` (Gris claro)

### Status Colors
- **Ejecutado**: Verde (`#28a745`)
- **En Proceso**: Amarillo (`#ffc107`)
- **Pendiente**: Gris (`#6c757d`)

### Priority Colors
- **P1**: Rojo (`#dc3545`)
- **P2**: Naranja (`#fd7e14`)
- **P3**: Gris (`#6c757d`)

## 🔧 Personalización

### Cambiar Duración del Cache

En `app.js`, línea 11:
```javascript
CACHE_DURATION: 5 * 60 * 1000, // Cambiar 5 por los minutos deseados
```

### Agregar Nuevas Vistas

1. Agregar botón de navegación en `index.html`:
```html
<div class="nav-item" data-view="mivista">📌 Mi Vista</div>
```

2. Agregar contenedor de vista:
```html
<div id="mivista-view" class="view">
  <!-- Contenido -->
</div>
```

3. Crear función de renderizado en `app.js`:
```javascript
const MiVistaView = {
  render() {
    // Tu código aquí
  }
};
```

4. Agregar caso en `Navigation.switchView`:
```javascript
case 'mivista':
  MiVistaView.render();
  break;
```

### Modificar Filtros

Los filtros se generan dinámicamente de los datos. Para agregar un nuevo filtro:

1. En `index.html`, agregar el select:
```html
<div class="filter-group">
  <label class="filter-label">Mi Filtro:</label>
  <select id="filter-mifiltro" class="filter-select">
    <option value="">Todos</option>
  </select>
</div>
```

2. En `app.js`, actualizar `STATE.filters`:
```javascript
filters: {
  module: '',
  status: '',
  priority: '',
  search: '',
  mifiltro: '', // Agregar aquí
}
```

3. Agregar lógica de filtrado en `TasksView.applyFilters()`

## 📊 Columnas del Excel/Google Sheets

El sistema espera estas columnas:

- ID
- Módulo
- SubModulo (opcional)
- Actividad
- Descripción
- Responsable
- Prioridad (P1, P2, P3)
- Estatus (Pendiente, En Proceso, Ejecutado)
- Fecha Inicio
- Fecha Fin
- Progreso %
- Etiquetas
- Dependencias
- Notas
- Fecha Creación
- Última Actualización
- Campo Reservado 1, 2, 3

## 🐛 Solución de Problemas

### No se cargan los datos

1. Verifica que la URL de la API esté correcta en `app.js`
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que la API de Google Apps Script esté desplegada correctamente
4. Prueba la URL de la API directamente en el navegador

### Los filtros no funcionan

1. Verifica que los nombres de las columnas coincidan exactamente
2. Revisa la consola para errores de JavaScript
3. Limpia el cache del navegador

### El Gantt no muestra tareas

El Gantt solo muestra tareas con fechas válidas. Verifica:
- Que las fechas estén en formato ISO (YYYY-MM-DD)
- Que no haya fechas con texto como "TBD" o "Pendiente"

### Problemas de rendimiento

1. Ajusta `CACHE_DURATION` para cachear por más tiempo
2. Limita el número de tareas mostradas con filtros
3. Para grandes volúmenes de datos (1000+ tareas), considera implementar paginación

## 🔐 Seguridad

- La API es de solo lectura por defecto
- No se almacenan datos sensibles en el frontend
- El cache se limpia al cerrar el navegador
- Para producción, considera agregar autenticación en Google Apps Script

## 📱 Compatibilidad

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Responsive: Mobile, Tablet, Desktop

## 🚀 Mejoras Futuras Sugeridas

1. **Drag & Drop en Kanban**: Mover tareas entre columnas
2. **Exportar a Excel/PDF**: Desde cualquier vista
3. **Crear/Editar Tareas**: Formularios modal
4. **Notificaciones**: Alertas de fechas próximas
5. **Dashboard de Analytics**: Gráficos y métricas
6. **Modo Oscuro**: Toggle de tema
7. **Compartir Vistas**: URLs con filtros incluidos
8. **Sincronización en Tiempo Real**: WebSockets
9. **PWA**: Instalable como app móvil
10. **Multi-idioma**: i18n

## 📞 Soporte

Para reportar bugs o solicitar funcionalidades:
- Abre un issue en el repositorio
- Contacta al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Licencia**: Uso interno
