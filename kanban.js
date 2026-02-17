// ============================================================
// KANBAN VIEW
// ============================================================

const KanbanView = {
  render() {
    const container = document.getElementById('kanban-board');
    
    if (!STATE.filteredTasks.length) {
      Utils.showEmptyState('kanban-board', 'No hay tareas para mostrar');
      return;
    }

    const columns = {
      'Pendiente': STATE.filteredTasks.filter(t => t['Estatus'] === 'Pendiente'),
      'En Proceso': STATE.filteredTasks.filter(t => t['Estatus'] === 'En Proceso'),
      'Ejecutado': STATE.filteredTasks.filter(t => t['Estatus'] === 'Ejecutado'),
    };

    container.innerHTML = `
      <div class="kanban-container">
        ${Object.entries(columns).map(([status, tasks]) => 
          this.createColumn(status, tasks)
        ).join('')}
      </div>
    `;
  },

  createColumn(status, tasks) {
    const statusClass = Utils.getStatusClass(status);
    
    return `
      <div class="kanban-column">
        <div class="kanban-column-header">
          <div class="kanban-column-title">
            ${status}
          </div>
          <div class="kanban-column-count">${tasks.length}</div>
        </div>
        <div class="kanban-cards">
          ${tasks.map(task => this.createCard(task)).join('')}
        </div>
      </div>
    `;
  },

  createCard(task) {
    return `
      <div class="kanban-card" onclick='TaskModal.open(${JSON.stringify(task).replace(/'/g, "&#39;")})'>
        <div class="kanban-card-header">
          <span class="kanban-card-id">${task.ID}</span>
          <span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span>
        </div>
        <div class="kanban-card-title">${task['Actividad']}</div>
        <div class="kanban-card-description">${task['Descripción']}</div>
        <div class="kanban-card-footer">
          <div class="kanban-card-tags">
            <span style="font-size: 10px; color: var(--color-text-muted);">${task['Módulo'] || '-'}</span>
          </div>
          ${task['Responsable'] ? `<span style="font-size: 10px; color: var(--color-text-muted);">${task['Responsable']}</span>` : ''}
        </div>
      </div>
    `;
  },
};
