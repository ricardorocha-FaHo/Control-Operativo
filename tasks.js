// ============================================================
// TASKS VIEW
// ============================================================

const TasksView = {
  columns: 2, // 1 | 2 | 3

  render() {
    this.populateFilters();
    this.applyFilters();
    this.renderTasks();
  },

  populateFilters() {
    const modules    = [...new Set(STATE.tasks.map(t => t['Módulo']).filter(Boolean))];
    const statuses   = [...new Set(STATE.tasks.map(t => t['Estatus']).filter(Boolean))];
    const priorities = [...new Set(STATE.tasks.map(t => t['Prioridad']).filter(Boolean))];

    const moduleSelect   = document.getElementById('filter-module');
    const statusSelect   = document.getElementById('filter-status');
    const prioritySelect = document.getElementById('filter-priority');

    if (moduleSelect) {
      moduleSelect.innerHTML = '<option value="">Todos</option>' +
        modules.map(m =>
          `<option value="${m}" ${STATE.filters.module===m?'selected':''}>${m}</option>`
        ).join('');
    }
    if (statusSelect) {
      statusSelect.innerHTML = '<option value="">Todos</option>' +
        statuses.map(s =>
          `<option value="${s}" ${STATE.filters.status===s?'selected':''}>${s}</option>`
        ).join('');
    }
    if (prioritySelect) {
      prioritySelect.innerHTML = '<option value="">Todas</option>' +
        priorities.map(p =>
          `<option value="${p}" ${STATE.filters.priority===p?'selected':''}>${p}</option>`
        ).join('');
    }
  },

  applyFilters() {
    STATE.filteredTasks = STATE.tasks.filter(task => {
      const matchModule   = !STATE.filters.module   || task['Módulo']    === STATE.filters.module;
      const matchStatus   = !STATE.filters.status   || task['Estatus']   === STATE.filters.status;
      const matchPriority = !STATE.filters.priority || task['Prioridad'] === STATE.filters.priority;
      const q = STATE.filters.search?.toLowerCase();
      const matchSearch = !q
        || task.ID?.toLowerCase().includes(q)
        || task['Actividad']?.toLowerCase().includes(q)
        || task['Descripción']?.toLowerCase().includes(q);
      return matchModule && matchStatus && matchPriority && matchSearch;
    });
  },

  renderTasks() {
    const container = document.getElementById('tasks-list');

    if (!STATE.filteredTasks.length) {
      Utils.showEmptyState('tasks-list', 'No se encontraron tareas con los filtros aplicados');
      return;
    }

    // Selector de columnas + contador
    const colBar = `
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <span style="font-size:13px;color:var(--color-text-muted);">
          ${STATE.filteredTasks.length} tareas
        </span>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;color:var(--color-text-muted);margin-right:4px;">Columnas:</span>
          ${[1, 2, 3].map(n => `
            <button onclick="TasksView.setColumns(${n})"
                    class="btn ${this.columns===n ? 'btn-primary' : 'btn-secondary'}"
                    style="padding:4px 12px;font-size:13px;min-width:36px;">
              ${n}
            </button>`).join('')}
        </div>
      </div>`;

    // Grid responsivo según columnas elegidas
    const gridStyle = `
      display: grid;
      grid-template-columns: repeat(${this.columns}, minmax(0, 1fr));
      gap: 16px;
    `;

    container.innerHTML = colBar + `
      <div style="${gridStyle}">
        ${STATE.filteredTasks.map(task => this.createTaskCard(task)).join('')}
      </div>`;
  },

  setColumns(n) {
    this.columns = n;
    this.renderTasks();
  },

  createTaskCard(task) {
    const moduleColors = {
      'Trabajo':      '#5AB2D9',
      'Soporte':      '#F4C542',
      'Analitica':    '#7B9FE8',
      'Comunicación': '#B087D4',
      'Pendientes':   '#E88C8C',
    };
    const modColor = moduleColors[task['Módulo']] || '#999';

    return `
      <div class="task-item"
           style="border-left:4px solid ${modColor};display:flex;flex-direction:column;gap:8px;"
           onclick='TaskModal.open(${JSON.stringify(task).replace(/'/g, "&#39;")})'>

        <!-- Cabecera: ID + badges -->
        <div class="task-header" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <span class="task-id">${task.ID}</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
            <span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span>
            <span class="badge badge-${Utils.getStatusClass(task['Estatus'])}">${task['Estatus']}</span>
          </div>
        </div>

        <!-- Módulo -->
        <span style="font-size:11px;font-weight:600;color:${modColor};
                     background:${modColor}18;padding:2px 8px;border-radius:4px;
                     align-self:flex-start;">
          ${task['Módulo'] || '-'}
        </span>

        <!-- Título -->
        <div class="task-title" style="font-size:14px;font-weight:600;line-height:1.3;">
          ${task['Actividad']}
        </div>

        <!-- Descripción -->
        <div class="task-description"
             style="font-size:12px;color:var(--color-text-muted);line-height:1.4;
                    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          ${task['Descripción'] || ''}
        </div>

        <!-- Meta -->
        <div class="task-meta" style="margin-top:auto;display:flex;flex-wrap:wrap;gap:8px;padding-top:8px;
                                       border-top:1px solid var(--color-border);">
          ${task['Responsable']
            ? `<span class="task-meta-item">${task['Responsable']}</span>`
            : ''}
          ${task['Fecha Fin']
            ? `<span class="task-meta-item">${Utils.formatDate(task['Fecha Fin'])}</span>`
            : ''}
        </div>

      </div>`;
  },
};