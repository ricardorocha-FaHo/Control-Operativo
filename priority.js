// ============================================================
// PRIORITY VIEW - Con filtros
// ============================================================

const PriorityView = {
  filters: {
    module: '',
    status: '',
  },

  render() {
    this.populateFilters();
    this.renderPriorities();
  },

  populateFilters() {
    const modules = [...new Set(STATE.tasks.map(t => t['Módulo']).filter(Boolean))];
    const statuses = [...new Set(STATE.tasks.map(t => t['Estatus']).filter(Boolean))];

    const moduleSelect = document.getElementById('priority-filter-module');
    const statusSelect = document.getElementById('priority-filter-status');

    if (moduleSelect) {
      moduleSelect.innerHTML = '<option value="">Todos</option>' + 
        modules.map(m => `<option value="${m}" ${this.filters.module === m ? 'selected' : ''}>${m}</option>`).join('');
      
      moduleSelect.addEventListener('change', (e) => {
        this.filters.module = e.target.value;
        this.renderPriorities();
      });
    }

    if (statusSelect) {
      statusSelect.innerHTML = '<option value="">Todos</option>' + 
        statuses.map(s => `<option value="${s}" ${this.filters.status === s ? 'selected' : ''}>${s}</option>`).join('');
      
      statusSelect.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.renderPriorities();
      });
    }
  },

  renderPriorities() {
    const container = document.getElementById('priority-list');
    
    // Aplicar filtros
    let filteredTasks = STATE.tasks;
    if (this.filters.module) {
      filteredTasks = filteredTasks.filter(t => t['Módulo'] === this.filters.module);
    }
    if (this.filters.status) {
      filteredTasks = filteredTasks.filter(t => t['Estatus'] === this.filters.status);
    }

    if (!filteredTasks.length) {
      Utils.showEmptyState('priority-list', 'No hay tareas con los filtros aplicados');
      return;
    }

    const priorities = {
      'P1': filteredTasks.filter(t => t['Prioridad'] === 'P1'),
      'P2': filteredTasks.filter(t => t['Prioridad'] === 'P2'),
      'P3': filteredTasks.filter(t => t['Prioridad'] === 'P3'),
    };

    // Ordenar por fecha de vencimiento
    Object.keys(priorities).forEach(p => {
      priorities[p] = priorities[p]
        .map(task => {
          const endDate = task['Fecha Fin'];
          const daysUntil = endDate && endDate !== '-' ? 
            Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
          return { ...task, daysUntil };
        })
        .sort((a, b) => {
          if (a.daysUntil === null) return 1;
          if (b.daysUntil === null) return -1;
          return a.daysUntil - b.daysUntil;
        });
    });

    container.innerHTML = `
      <div class="priority-container">
        ${Object.entries(priorities).map(([priority, tasks]) => 
          this.createPrioritySection(priority, tasks)
        ).join('')}
      </div>
    `;
  },

  createPrioritySection(priority, tasks) {
    if (!tasks.length) return '';

    const priorityClass = Utils.getPriorityClass(priority);
    
    return `
      <div class="priority-section">
        <div class="priority-header">
          <div class="priority-title">
            <div class="priority-icon ${priorityClass}"></div>
            Prioridad ${priority}
          </div>
          <span class="badge badge-${priorityClass}">${tasks.length} tareas</span>
        </div>
        <div class="priority-items">
          ${tasks.map(task => this.createPriorityItem(task)).join('')}
        </div>
      </div>
    `;
  },

  createPriorityItem(task) {
    let urgencyBadge = '';
    if (task.daysUntil !== null) {
      if (task.daysUntil < 0) {
        urgencyBadge = `<span class="badge" style="background: rgba(193, 48, 48, 0.1); color: var(--priority-p1);">Vencida</span>`;
      } else if (task.daysUntil === 0) {
        urgencyBadge = `<span class="badge" style="background: rgba(193, 48, 48, 0.1); color: var(--priority-p1);">Hoy</span>`;
      } else if (task.daysUntil <= 3) {
        urgencyBadge = `<span class="badge" style="background: rgba(214, 137, 16, 0.1); color: var(--status-proceso);">${task.daysUntil} días</span>`;
      } else if (task.daysUntil <= 7) {
        urgencyBadge = `<span class="badge" style="background: rgba(44, 90, 160, 0.1); color: var(--color-accent);">${task.daysUntil} días</span>`;
      } else {
        urgencyBadge = `<span class="badge">${task.daysUntil} días</span>`;
      }
    }

    return `
      <div class="priority-item" onclick='TaskModal.open(${JSON.stringify(task).replace(/'/g, "&#39;")})'>
        <div class="priority-item-header">
          <span class="task-id">${task.ID}</span>
          <span class="priority-item-title">${task['Actividad']}</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${urgencyBadge}
            <span class="badge badge-${Utils.getStatusClass(task['Estatus'])}">${task['Estatus']}</span>
          </div>
        </div>
        <div class="priority-item-meta">
          <span>${task['Módulo']}</span>
          ${task['Responsable'] ? `<span>${task['Responsable']}</span>` : ''}
          ${task['Fecha Fin'] ? `<span>${Utils.formatDate(task['Fecha Fin'])}</span>` : ''}
        </div>
      </div>
    `;
  },
};
