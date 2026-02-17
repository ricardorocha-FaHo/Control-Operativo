// ============================================================
// TASK MANAGEMENT SYSTEM - CORE
// ============================================================

// CONFIGURACIÓN
const CONFIG = {
  API_URL: 'https://script.google.com/a/macros/fahorro.com.mx/s/AKfycbwRhg2VAxiXzIxNnu5BsN2bQFyY_ll5X6XdjKQ_coXxeatO7VI6tNJfjlKuQcCOvWtS/exec',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
};

// ESTADO GLOBAL
const STATE = {
  tasks: [],
  filteredTasks: [],
  currentView: 'home',
  currentModule: null,
  isExpanded: false,
  filters: {
    module: '',
    status: '',
    priority: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  },
  sortConfig: {
    field: null,
    direction: 'asc',
  },
  cache: {
    data: null,
    timestamp: null,
  },
};

// ============================================================
// UTILIDADES
// ============================================================

const Utils = {
  formatDate(dateString) {
    if (!dateString || dateString === '-' || dateString === 'TBD' || dateString.includes('Feb') || dateString.includes('Marzo')) {
      return dateString;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-MX', options);
  },

  getStatusClass(status) {
    const statusMap = {
      'Ejecutado': 'ejecutado',
      'En Proceso': 'proceso',
      'Pendiente': 'pendiente',
    };
    return statusMap[status] || 'pendiente';
  },

  getPriorityClass(priority) {
    const priorityMap = {
      'P1': 'p1',
      'P2': 'p2',
      'P3': 'p3',
    };
    return priorityMap[priority] || 'p2';
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <span style="margin-left: 12px;">Cargando datos...</span>
        </div>
      `;
    }
  },

  showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">!</div>
          <p>${message}</p>
          <small style="color: #666; margin-top: 8px; display: block;">
            Si no has iniciado sesión, por favor autoriza la aplicación.
          </small>
        </div>
      `;
    }
  },

  showEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">—</div>
          <p>${message}</p>
        </div>
      `;
    }
  },

  toggleExpand() {
    STATE.isExpanded = !STATE.isExpanded;
    
    if (STATE.isExpanded) {
      document.body.classList.add('view-expanded');
    } else {
      document.body.classList.remove('view-expanded');
    }
    
    Navigation.switchView(STATE.currentView);
  },
};

// ============================================================
// API SERVICE
// ============================================================

const API = {
  async fetchTasks(params = {}) {
    const now = Date.now();
    if (STATE.cache.data && STATE.cache.timestamp && (now - STATE.cache.timestamp < CONFIG.CACHE_DURATION)) {
      console.log('Usando datos en cache');
      return STATE.cache.data;
    }

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${CONFIG.API_URL}?${queryString}` : CONFIG.API_URL;
      
      console.log('Fetching data from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // ⭐ IMPORTANTE: Incluir credenciales para OAuth
        redirect: 'follow'
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
      
      STATE.cache.data = data;
      STATE.cache.timestamp = now;
      
      return data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  clearCache() {
    STATE.cache.data = null;
    STATE.cache.timestamp = null;
  },
};

// ============================================================
// NAVIGATION
// ============================================================

const Navigation = {
  init() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.switchView(view);
      });
    });
  },

  switchView(viewName) {
    STATE.currentView = viewName;

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });

    const activeView = document.getElementById(`${viewName}-view`);
    if (activeView) {
      activeView.classList.add('active');
    }

    switch (viewName) {
      case 'home':
        HomeView.render();
        break;
      case 'tasks':
        TasksView.render();
        break;
      case 'gantt':
        GanttView.render();
        break;
      case 'kanban':
        KanbanView.render();
        break;
      case 'priority':
        PriorityView.render();
        break;
      case 'table':
        TableView.render();
        break;
    }
  },
};

// ============================================================
// TASK MODAL
// ============================================================

const TaskModal = {
  open(task) {
    const modal = document.getElementById('task-modal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
      <div class="detail-row">
        <div class="detail-label">ID</div>
        <div class="detail-value"><strong>${task.ID}</strong></div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Módulo</div>
        <div class="detail-value">${task['Módulo'] || '-'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Actividad</div>
        <div class="detail-value"><strong>${task['Actividad']}</strong></div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Descripción</div>
        <div class="detail-value">${task['Descripción']}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Responsable</div>
        <div class="detail-value">${task['Responsable'] || '-'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Prioridad</div>
        <div class="detail-value">
          <span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Estatus</div>
        <div class="detail-value">
          <span class="badge badge-${Utils.getStatusClass(task['Estatus'])}">${task['Estatus']}</span>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Fecha Inicio</div>
        <div class="detail-value">${Utils.formatDate(task['Fecha Inicio'])}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Fecha Fin</div>
        <div class="detail-value">${Utils.formatDate(task['Fecha Fin'])}</div>
      </div>
      ${task['Notas'] ? `
      <div class="detail-row">
        <div class="detail-label">Notas</div>
        <div class="detail-value">${task['Notas']}</div>
      </div>
      ` : ''}
    `;
    
    modal.classList.remove('hidden');
  },

  close() {
    document.getElementById('task-modal').classList.add('hidden');
  },
};

// ============================================================
// EVENT HANDLERS
// ============================================================

function setupEventHandlers() {
  const searchInput = document.getElementById('search-input');
  
  searchInput.addEventListener('focus', () => {
    if (STATE.currentView !== 'tasks') {
      STATE.filters.module = '';
      STATE.filters.status = '';
      STATE.filters.priority = '';
      Navigation.switchView('tasks');
    }
  });
  
  searchInput.addEventListener('input', Utils.debounce((e) => {
    STATE.filters.search = e.target.value;
    
    if (STATE.currentView !== 'tasks') {
      STATE.filters.module = '';
      STATE.filters.status = '';
      STATE.filters.priority = '';
      Navigation.switchView('tasks');
    } else {
      TasksView.applyFilters();
      TasksView.renderTasks();
    }
  }, 300));

  // Filtros Tasks
  document.getElementById('filter-module')?.addEventListener('change', (e) => {
    STATE.filters.module = e.target.value;
    TasksView.applyFilters();
    TasksView.renderTasks();
  });

  document.getElementById('filter-status')?.addEventListener('change', (e) => {
    STATE.filters.status = e.target.value;
    TasksView.applyFilters();
    TasksView.renderTasks();
  });

  document.getElementById('filter-priority')?.addEventListener('change', (e) => {
    STATE.filters.priority = e.target.value;
    TasksView.applyFilters();
    TasksView.renderTasks();
  });

  // Modal close
  document.getElementById('modal-close')?.addEventListener('click', () => {
    TaskModal.close();
  });

  document.getElementById('task-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'task-modal') {
      TaskModal.close();
    }
  });
}

// ============================================================
// INIT
// ============================================================

async function init() {
  try {
    Utils.showLoading('modules-grid');
    
    const response = await API.fetchTasks();
    
    if (response.success && response.data) {
      STATE.tasks = response.data;
      STATE.filteredTasks = response.data;
      
      Navigation.init();
      setupEventHandlers();
      HomeView.render();
    } else {
      Utils.showError('modules-grid', response.message || 'Error al cargar los datos');
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    
    let errorMessage = 'Error al conectar con la API.';
    
    if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = 'Acceso denegado. Por favor, inicia sesión con tu cuenta @fahorro.com.mx';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'Error de CORS. Verifica la configuración del deployment en Apps Script.';
    }
    
    Utils.showError('modules-grid', errorMessage);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
