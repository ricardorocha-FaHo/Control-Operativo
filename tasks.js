// ============================================================
// TASKS VIEW
// ============================================================

const TasksView = {
  render() {
    this.populateFilters();
    this.applyFilters();
    this.renderTasks();
  },

  populateFilters() {
    const modules = [...new Set(STATE.tasks.map(t => t['Módulo']).filter(Boolean))];
    const statuses = [...new Set(STATE.tasks.map(t => t['Estatus']).filter(Boolean))];
    const priorities = [...new Set(STATE.tasks.map(t => t['Prioridad']).filter(Boolean))];

    const moduleSelect = document.getElementById('filter-module');
    const statusSelect = document.getElementById('filter-status');
    const prioritySelect = document.getElementById('filter-priority');

    if (moduleSelect) {
      moduleSelect.innerHTML = '<option value="">Todos</option>' + 
        modules.map(m => `<option value="${m}" ${STATE.filters.module === m ? 'selected' : ''}>${m}</option>`).join('');
    }

    if (statusSelect) {
      statusSelect.innerHTML = '<option value="">Todos</option>' + 
        statuses.map(s => `<option value="${s}" ${STATE.filters.status === s ? 'selected' : ''}>${s}</option>`).join('');
    }

    if (prioritySelect) {
      prioritySelect.innerHTML = '<option value="">Todas</option>' + 
        priorities.map(p => `<option value="${p}" ${STATE.filters.priority === p ? 'selected' : ''}>${p}</option>`).join('');
    }
  },

  applyFilters() {
    STATE.filteredTasks = STATE.tasks.filter(task => {
      const matchModule = !STATE.filters.module || task['Módulo'] === STATE.filters.module;
      const matchStatus = !STATE.filters.status || task['Estatus'] === STATE.filters.status;
      const matchPriority = !STATE.filters.priority || task['Prioridad'] === STATE.filters.priority;
      
      const searchLower = STATE.filters.search.toLowerCase();
      const matchSearch = !searchLower || 
        task.ID?.toLowerCase().includes(searchLower) ||
        task['Actividad']?.toLowerCase().includes(searchLower) ||
        task['Descripción']?.toLowerCase().includes(searchLower);

      return matchModule && matchStatus && matchPriority && matchSearch;
    });
  },

  renderTasks() {
    const container = document.getElementById('tasks-list');
    
    if (!STATE.filteredTasks.length) {
      Utils.showEmptyState('tasks-list', 'No se encontraron tareas con los filtros aplicados');
      return;
    }

    container.innerHTML = STATE.filteredTasks
      .map(task => this.createTaskCard(task))
      .join('');
  },

  createTaskCard(task) {
    return `
      <div class="task-item" onclick='TaskModal.open(${JSON.stringify(task).replace(/'/g, "&#39;")})'>
        <div class="task-header">
          <span class="task-id">${task.ID}</span>
          <div style="display: flex; gap: 8px;">
            <span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span>
            <span class="badge badge-${Utils.getStatusClass(task['Estatus'])}">${task['Estatus']}</span>
          </div>
        </div>
        <div class="task-title">${task['Actividad']}</div>
        <div class="task-description">${task['Descripción']}</div>
        <div class="task-meta">
          <span class="task-meta-item">${task['Módulo'] || '-'}</span>
          ${task['Responsable'] ? `<span class="task-meta-item">${task['Responsable']}</span>` : ''}
          ${task['Fecha Fin'] ? `<span class="task-meta-item">${Utils.formatDate(task['Fecha Fin'])}</span>` : ''}
        </div>
      </div>
    `;
  },
};
