// ============================================================
// KANBAN VIEW
// ============================================================

const KanbanView = {
  groupBy: 'status', // 'status' | 'module' | 'priority' | 'responsable'

  render() {
    const container = document.getElementById('kanban-board');

    if (!STATE.filteredTasks.length) {
      Utils.showEmptyState('kanban-board', 'No hay tareas para mostrar');
      return;
    }

    const columns = this._buildColumns();

    container.innerHTML = `
      <!-- Selector de agrupación -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;
                  background:var(--color-bg-card);padding:12px 16px;
                  border-radius:var(--radius-md);border:1px solid var(--color-border);">
        <span style="font-size:13px;font-weight:600;color:var(--color-text-muted);white-space:nowrap;">
          Agrupar por:
        </span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${[
            { key: 'status',      label: 'Estatus'     },
            { key: 'module',      label: 'Módulo'       },
            { key: 'priority',    label: 'Prioridad'    },
            { key: 'responsable', label: 'Responsable'  },
          ].map(opt => `
            <button class="btn ${this.groupBy === opt.key ? 'btn-primary' : 'btn-secondary'}"
                    onclick="KanbanView.setGroupBy('${opt.key}')"
                    style="padding:5px 14px;font-size:13px;">
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Tablero -->
      <div class="kanban-container">
        ${columns.map(col => this._createColumn(col)).join('')}
      </div>
    `;
  },

  // ── Construye las columnas según la agrupación activa ─────────
  _buildColumns() {
    const tasks = STATE.filteredTasks;

    if (this.groupBy === 'status') {
      return [
        { key: 'Pendiente',  label: 'Pendiente',  color: 'var(--status-pendiente)', tasks: tasks.filter(t => t['Estatus'] === 'Pendiente')  },
        { key: 'En Proceso', label: 'En Proceso', color: 'var(--status-proceso)',    tasks: tasks.filter(t => t['Estatus'] === 'En Proceso') },
        { key: 'Ejecutado',  label: 'Ejecutado',  color: 'var(--status-ejecutado)', tasks: tasks.filter(t => t['Estatus'] === 'Ejecutado')  },
      ];
    }

    if (this.groupBy === 'priority') {
      return [
        { key: 'P1', label: 'P1 — Alta',   color: 'var(--priority-p1)', tasks: tasks.filter(t => t['Prioridad'] === 'P1') },
        { key: 'P2', label: 'P2 — Media',  color: 'var(--priority-p2)', tasks: tasks.filter(t => t['Prioridad'] === 'P2') },
        { key: 'P3', label: 'P3 — Baja',   color: 'var(--priority-p3)', tasks: tasks.filter(t => t['Prioridad'] === 'P3') },
      ];
    }

    if (this.groupBy === 'module') {
      const moduleColors = {
        'Trabajo':      '#5AB2D9',
        'Soporte':      '#F4C542',
        'Analitica':    '#7B9FE8',
        'Comunicación': '#B087D4',
        'Pendientes':   '#E88C8C',
      };
      const modules = [...new Set(tasks.map(t => t['Módulo']).filter(Boolean))];
      return modules.map(mod => ({
        key:   mod,
        label: mod,
        color: moduleColors[mod] || '#999',
        tasks: tasks.filter(t => t['Módulo'] === mod),
      }));
    }

    if (this.groupBy === 'responsable') {
      const responsables = [...new Set(tasks.map(t => t['Responsable']).filter(Boolean))].sort();
      return responsables.map(resp => ({
        key:   resp,
        label: resp,
        color: 'var(--color-accent)',
        tasks: tasks.filter(t => t['Responsable'] === resp),
      }));
    }

    return [];
  },

  // ── Columna ───────────────────────────────────────────────────
  _createColumn(col) {
    return `
      <div class="kanban-column" style="border-top:3px solid ${col.color};">
        <div class="kanban-column-header">
          <div class="kanban-column-title" style="color:${col.color};">${col.label}</div>
          <div class="kanban-column-count">${col.tasks.length}</div>
        </div>
        <div class="kanban-cards">
          ${col.tasks.length
            ? col.tasks.map(t => this._createCard(t)).join('')
            : `<div style="padding:20px;text-align:center;font-size:12px;
                           color:var(--color-text-muted);border:1px dashed var(--color-border);
                           border-radius:8px;">Sin tareas</div>`
          }
        </div>
      </div>`;
  },

  // ── Tarjeta ───────────────────────────────────────────────────
  _createCard(task) {
    const moduleColors = {
      'Trabajo':      '#5AB2D9',
      'Soporte':      '#F4C542',
      'Analitica':    '#7B9FE8',
      'Comunicación': '#B087D4',
      'Pendientes':   '#E88C8C',
    };
    const modColor = moduleColors[task['Módulo']] || '#999';

    return `
      <div class="kanban-card"
           onclick='TaskModal.open(${JSON.stringify(task).replace(/'/g, "&#39;")})'>
        <div class="kanban-card-header">
          <span class="kanban-card-id">${task.ID}</span>
          <span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span>
        </div>
        <div class="kanban-card-title">${task['Actividad']}</div>
        <div class="kanban-card-description">${task['Descripción']}</div>
        <div class="kanban-card-footer">
          <div class="kanban-card-tags">
            <span class="badge badge-${Utils.getStatusClass(task['Estatus'])}"
                  style="font-size:9px;padding:2px 6px;">${task['Estatus']}</span>
            <span style="font-size:10px;padding:2px 7px;border-radius:4px;
                         background:${modColor}22;color:${modColor};font-weight:600;">
              ${task['Módulo'] || '-'}
            </span>
          </div>
          ${task['Responsable']
            ? `<span style="font-size:10px;color:var(--color-text-muted);">${task['Responsable']}</span>`
            : ''}
        </div>
      </div>`;
  },

  setGroupBy(key) {
    this.groupBy = key;
    this.render();
  },

  // Mantener compatibilidad con el código original
  createColumn: function(status, tasks) { return ''; },
  createCard:   function(task)          { return ''; },
};