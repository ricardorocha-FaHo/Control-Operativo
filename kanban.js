// ============================================================
// KANBAN VIEW
// ============================================================

const KanbanView = {
  groupBy: 'status',
  statusFilter: 'pending', // 'pending' = excluir ejecutados | 'all' = todos

  render() {
    const container = document.getElementById('kanban-board');

    // Aplicar filtro de estatus: por defecto excluir Ejecutado
    let baseTasks = this.statusFilter === 'pending'
      ? STATE.filteredTasks.filter(t => t['Estatus'] !== 'Ejecutado')
      : STATE.filteredTasks;

    if (!STATE.filteredTasks.length) {
      Utils.showEmptyState('kanban-board', 'No hay tareas para mostrar');
      return;
    }

    const columns = this._buildColumns(baseTasks);

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;
                  background:var(--color-bg-card);padding:12px 16px;
                  border-radius:var(--radius-md);border:1px solid var(--color-border);
                  flex-wrap:wrap;">

        <!-- Filtro estatus -->
        <div style="display:flex;align-items:center;gap:8px;margin-right:8px;">
          <span style="font-size:13px;font-weight:600;color:var(--color-text-muted);white-space:nowrap;">
            Estatus:
          </span>
          <button class="btn ${this.statusFilter==='pending'?'btn-primary':'btn-secondary'}"
                  onclick="KanbanView.setStatusFilter('pending')"
                  style="padding:5px 14px;font-size:13px;">
            Pendientes
          </button>
          <button class="btn ${this.statusFilter==='all'?'btn-primary':'btn-secondary'}"
                  onclick="KanbanView.setStatusFilter('all')"
                  style="padding:5px 14px;font-size:13px;">
            Todos
          </button>
        </div>

        <div style="width:1px;height:24px;background:var(--color-border);margin:0 4px;"></div>

        <!-- Agrupar por -->
        <span style="font-size:13px;font-weight:600;color:var(--color-text-muted);white-space:nowrap;">
          Agrupar por:
        </span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${[
            { key: 'status',      label: 'Estatus'    },
            { key: 'module',      label: 'Módulo'      },
            { key: 'priority',    label: 'Prioridad'  },
            { key: 'responsable', label: 'Responsable' },
          ].map(opt => `
            <button class="btn ${this.groupBy===opt.key?'btn-primary':'btn-secondary'}"
                    onclick="KanbanView.setGroupBy('${opt.key}')"
                    style="padding:5px 14px;font-size:13px;">
              ${opt.label}
            </button>`).join('')}
        </div>
      </div>

      <div style="margin-bottom:12px;font-size:12px;color:var(--color-text-muted);">
        ${baseTasks.length} tarea${baseTasks.length!==1?'s':''} mostrada${baseTasks.length!==1?'s':''}
      </div>

      <div class="kanban-container">
        ${columns.map(col => this._createColumn(col)).join('')}
      </div>
    `;
  },

  _buildColumns(tasks) {
    if (this.groupBy === 'status') {
      const cols = this.statusFilter === 'pending'
        ? [
            { key: 'Pendiente',  label: 'Pendiente',  color: 'var(--status-pendiente)' },
            { key: 'En Proceso', label: 'En Proceso', color: 'var(--status-proceso)'   },
          ]
        : [
            { key: 'Pendiente',  label: 'Pendiente',  color: 'var(--status-pendiente)' },
            { key: 'En Proceso', label: 'En Proceso', color: 'var(--status-proceso)'   },
            { key: 'Ejecutado',  label: 'Ejecutado',  color: 'var(--status-ejecutado)' },
          ];
      return cols.map(c => ({ ...c, tasks: tasks.filter(t => t['Estatus'] === c.key) }));
    }

    if (this.groupBy === 'priority') {
      return [
        { key: 'P1', label: 'P1 - Alta',  color: 'var(--priority-p1)', tasks: tasks.filter(t => t['Prioridad']==='P1') },
        { key: 'P2', label: 'P2 - Media', color: 'var(--priority-p2)', tasks: tasks.filter(t => t['Prioridad']==='P2') },
        { key: 'P3', label: 'P3 - Baja',  color: 'var(--priority-p3)', tasks: tasks.filter(t => t['Prioridad']==='P3') },
      ];
    }

    if (this.groupBy === 'module') {
      const moduleColors = {
        'Trabajo':      '#2c5aa0',
        'Soporte':      '#d68910',
        'Analitica':    '#5b7aa8',
        'Comunicación': '#7a5ba8',
        'Pendientes':   '#c75050',
      };
      const modules = [...new Set(tasks.map(t => t['Módulo']).filter(Boolean))];
      return modules.map(mod => ({
        key: mod, label: mod,
        color: moduleColors[mod] || '#8a8a8a',
        tasks: tasks.filter(t => t['Módulo'] === mod),
      }));
    }

    if (this.groupBy === 'responsable') {
      const responsables = [...new Set(tasks.map(t => t['Responsable']).filter(Boolean))].sort();
      return responsables.map(resp => ({
        key: resp, label: resp,
        color: 'var(--color-accent)',
        tasks: tasks.filter(t => t['Responsable'] === resp),
      }));
    }

    return [];
  },

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

  _createCard(task) {
    const moduleColors = {
      'Trabajo':      '#2c5aa0',
      'Soporte':      '#d68910',
      'Analitica':    '#5b7aa8',
      'Comunicación': '#7a5ba8',
      'Pendientes':   '#c75050',
    };
    const modColor = moduleColors[task['Módulo']] || '#8a8a8a';
    const upcoming = Utils.isUpcoming(task, 7);

    return `
      <div class="kanban-card ${upcoming ? 'kanban-card-urgent' : ''}"
           style="${upcoming ? 'border-color:rgba(193,48,48,0.3);' : ''}"
           onclick='TaskModal.open(${JSON.stringify(task).replace(/'/g, "&#39;")})'>
        <div class="kanban-card-header">
          <span class="kanban-card-id">${task.ID}</span>
          <div style="display:flex;gap:4px;align-items:center;">
            ${upcoming ? `<span class="badge" style="font-size:9px;padding:1px 5px;background:rgba(193,48,48,0.1);color:var(--priority-p1);">Prox.</span>` : ''}
            <span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span>
          </div>
        </div>
        <div class="kanban-card-title">${task['Actividad']}</div>
        <div class="kanban-card-description">${task['Descripción'] || ''}</div>
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

  setStatusFilter(value) {
    this.statusFilter = value;
    this.render();
  },
};
