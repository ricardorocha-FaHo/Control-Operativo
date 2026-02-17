// ============================================================
// GANTT VIEW - Con filtros de fecha y tooltips
// ============================================================

const GanttView = {
  dateFilters: {
    from: null,
    to: null,
  },

  render() {
    const container = document.getElementById('gantt-chart');
    
    const tasksWithDates = STATE.filteredTasks.filter(task => {
      const start = task['Fecha Inicio'];
      const end = task['Fecha Fin'];
      return start && end && start !== '-' && end !== '-' && 
             !start.includes('TBD') && !end.includes('TBD');
    });

    if (!tasksWithDates.length) {
      Utils.showEmptyState('gantt-chart', 'No hay tareas con fechas válidas para mostrar en el diagrama');
      return;
    }

    const { startDate, endDate, periods } = this.calculateTimeline(tasksWithDates);
    
    container.innerHTML = `
      <div class="gantt-layout ${STATE.isExpanded ? 'gantt-expanded' : ''}">
        ${!STATE.isExpanded ? this.renderSidebar(tasksWithDates) : ''}
        <div class="gantt-main-area">
          ${this.renderControls()}
          ${this.renderGanttChart(tasksWithDates, periods, startDate)}
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.initializeTooltips();
  },

  renderControls() {
    return `
      <div class="gantt-controls-bar">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div class="filter-group">
            <label class="filter-label">Desde:</label>
            <input type="date" id="gantt-date-from" class="filter-select" style="min-width: 160px;" 
                   value="${this.dateFilters.from || ''}">
          </div>
          <div class="filter-group">
            <label class="filter-label">Hasta:</label>
            <input type="date" id="gantt-date-to" class="filter-select" style="min-width: 160px;"
                   value="${this.dateFilters.to || ''}">
          </div>
          <button class="btn btn-secondary" onclick="GanttView.clearDateFilters()">
            Limpiar
          </button>
        </div>
        <button class="btn btn-secondary" onclick="Utils.toggleExpand()">
          ${STATE.isExpanded ? 'Vista Normal' : 'Expandir'}
        </button>
      </div>
    `;
  },

  renderSidebar(tasks) {
    const stats = {
      total: tasks.length,
      ejecutado: tasks.filter(t => t['Estatus'] === 'Ejecutado').length,
      proceso: tasks.filter(t => t['Estatus'] === 'En Proceso').length,
      pendiente: tasks.filter(t => t['Estatus'] === 'Pendiente').length,
    };

    return `
      <div class="gantt-sidebar">
        <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 16px; color: var(--color-text-primary);">
          Estadísticas
        </h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="padding: 12px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 8px;">
            <div style="font-size: 11px; color: var(--color-text-muted); margin-bottom: 4px;">TOTAL</div>
            <div style="font-size: 24px; font-weight: 700; font-family: var(--font-mono);">${stats.total}</div>
          </div>
          <div style="padding: 12px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 8px;">
            <div style="font-size: 11px; color: var(--color-text-muted); margin-bottom: 4px;">COMPLETADO</div>
            <div style="font-size: 20px; font-weight: 600; color: var(--status-ejecutado); font-family: var(--font-mono);">${stats.ejecutado}</div>
          </div>
          <div style="padding: 12px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 8px;">
            <div style="font-size: 11px; color: var(--color-text-muted); margin-bottom: 4px;">EN PROCESO</div>
            <div style="font-size: 20px; font-weight: 600; color: var(--status-proceso); font-family: var(--font-mono);">${stats.proceso}</div>
          </div>
          <div style="padding: 12px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 8px;">
            <div style="font-size: 11px; color: var(--color-text-muted); margin-bottom: 4px;">PENDIENTE</div>
            <div style="font-size: 20px; font-weight: 600; color: var(--status-pendiente); font-family: var(--font-mono);">${stats.pendiente}</div>
          </div>
        </div>
      </div>
    `;
  },

  renderGanttChart(tasks, periods, startDate) {
    return `
      <div class="gantt-container">
        <div class="gantt-scroll-wrapper">
          <div class="gantt-grid-new">
            ${this.renderHeader(periods)}
            ${tasks.map(task => this.renderTaskRow(task, periods, startDate)).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderHeader(periods) {
    return `
      <div class="gantt-header-row">
        <div class="gantt-tasks-header">Tareas</div>
        <div class="gantt-timeline-header">
          ${periods.map(period => `
            <div class="gantt-period-header" style="width: 100px;">
              <span style="font-weight: 600;">${period.label}</span>
              <span style="font-size: 9px; opacity: 0.8;">${period.year}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderTaskRow(task, periods, startDate) {
    const taskStart = new Date(task['Fecha Inicio']);
    const taskEnd = new Date(task['Fecha Fin']);
    
    const daysDiff = Math.floor((taskStart - startDate) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) + 1;
    
    const cellWidth = 100;
    const left = (daysDiff / 7) * cellWidth;
    const width = (duration / 7) * cellWidth;

    const statusClass = Utils.getStatusClass(task['Estatus']);
    const statusColors = {
      'ejecutado': 'var(--status-ejecutado)',
      'proceso': 'var(--status-proceso)',
      'pendiente': 'var(--status-pendiente)',
    };

    return `
      <div class="gantt-data-row">
        <div class="gantt-task-info">
          <div class="gantt-task-title">${task['Actividad']}</div>
          <div class="gantt-task-meta-inline">
            <span class="badge badge-${statusClass}">${task['Estatus']}</span>
            <span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span>
          </div>
        </div>
        <div class="gantt-task-timeline-container">
          <div class="gantt-task-bar-wrapper" 
               style="left: ${left}px; width: ${width}px;"
               data-task='${JSON.stringify(task).replace(/'/g, "&#39;")}'>
            <div class="gantt-task-bar-new" 
                 style="background: ${statusColors[statusClass]};">
              <span class="gantt-bar-text">${task['Estatus']}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  calculateTimeline(tasks) {
    // Aplicar filtros de fecha
    let filteredTasks = tasks;
    if (this.dateFilters.from) {
      const fromDate = new Date(this.dateFilters.from);
      filteredTasks = filteredTasks.filter(t => new Date(t['Fecha Fin']) >= fromDate);
    }
    if (this.dateFilters.to) {
      const toDate = new Date(this.dateFilters.to);
      filteredTasks = filteredTasks.filter(t => new Date(t['Fecha Inicio']) <= toDate);
    }

    if (!filteredTasks.length) {
      return { startDate: new Date(), endDate: new Date(), periods: [] };
    }

    const dates = filteredTasks.flatMap(task => [
      new Date(task['Fecha Inicio']),
      new Date(task['Fecha Fin'])
    ]);
    
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1);
    
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
    
    const periods = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      periods.push({
        label: `${weekStart.getDate()} ${weekStart.toLocaleDateString('es-MX', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('es-MX', { month: 'short' })}`,
        year: weekStart.getFullYear(),
      });
      
      current.setDate(current.getDate() + 7);
    }
    
    return { startDate, endDate, periods };
  },

  attachEventListeners() {
    document.getElementById('gantt-date-from')?.addEventListener('change', (e) => {
      this.dateFilters.from = e.target.value;
      this.render();
    });

    document.getElementById('gantt-date-to')?.addEventListener('change', (e) => {
      this.dateFilters.to = e.target.value;
      this.render();
    });
  },

  clearDateFilters() {
    this.dateFilters.from = null;
    this.dateFilters.to = null;
    document.getElementById('gantt-date-from').value = '';
    document.getElementById('gantt-date-to').value = '';
    this.render();
  },

  initializeTooltips() {
    const bars = document.querySelectorAll('.gantt-task-bar-wrapper');
    
    bars.forEach(bar => {
      bar.addEventListener('mouseenter', (e) => {
        const task = JSON.parse(e.currentTarget.dataset.task);
        this.showTooltip(e, task);
      });
      
      bar.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  },

  showTooltip(e, task) {
    const existing = document.getElementById('gantt-tooltip');
    if (existing) existing.remove();

    const tooltip = document.createElement('div');
    tooltip.id = 'gantt-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      background: var(--color-primary);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      pointer-events: none;
      max-width: 300px;
      line-height: 1.5;
    `;

    tooltip.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 8px; font-size: 13px;">${task['Actividad']}</div>
      <div style="margin-bottom: 4px;"><strong>ID:</strong> ${task.ID}</div>
      <div style="margin-bottom: 4px;"><strong>Módulo:</strong> ${task['Módulo'] || '-'}</div>
      <div style="margin-bottom: 4px;"><strong>Responsable:</strong> ${task['Responsable'] || '-'}</div>
      <div style="margin-bottom: 4px;"><strong>Estatus:</strong> ${task['Estatus']}</div>
      <div style="margin-bottom: 4px;"><strong>Prioridad:</strong> ${task['Prioridad']}</div>
      <div style="margin-bottom: 4px;"><strong>Inicio:</strong> ${Utils.formatDate(task['Fecha Inicio'])}</div>
      <div><strong>Fin:</strong> ${Utils.formatDate(task['Fecha Fin'])}</div>
    `;

    document.body.appendChild(tooltip);

    const rect = e.currentTarget.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
  },

  hideTooltip() {
    const tooltip = document.getElementById('gantt-tooltip');
    if (tooltip) tooltip.remove();
  },
};
