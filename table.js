// ============================================================
// TABLE VIEW - Con filtros
// ============================================================

const TableView = {
  filters: {
    module: '',
    status: '',
    priority: '',
  },

  render() {
    this.populateFilters();
    this.renderTable();
  },

  populateFilters() {
    const modules = [...new Set(STATE.tasks.map(t => t['Módulo']).filter(Boolean))];
    const statuses = [...new Set(STATE.tasks.map(t => t['Estatus']).filter(Boolean))];
    const priorities = [...new Set(STATE.tasks.map(t => t['Prioridad']).filter(Boolean))];

    const moduleSelect = document.getElementById('table-filter-module');
    const statusSelect = document.getElementById('table-filter-status');
    const prioritySelect = document.getElementById('table-filter-priority');

    if (moduleSelect) {
      moduleSelect.innerHTML = '<option value="">Todos</option>' + 
        modules.map(m => `<option value="${m}" ${this.filters.module === m ? 'selected' : ''}>${m}</option>`).join('');
      
      moduleSelect.addEventListener('change', (e) => {
        this.filters.module = e.target.value;
        this.renderTable();
      });
    }

    if (statusSelect) {
      statusSelect.innerHTML = '<option value="">Todos</option>' + 
        statuses.map(s => `<option value="${s}" ${this.filters.status === s ? 'selected' : ''}>${s}</option>`).join('');
      
      statusSelect.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.renderTable();
      });
    }

    if (prioritySelect) {
      prioritySelect.innerHTML = '<option value="">Todas</option>' + 
        priorities.map(p => `<option value="${p}" ${this.filters.priority === p ? 'selected' : ''}>${p}</option>`).join('');
      
      prioritySelect.addEventListener('change', (e) => {
        this.filters.priority = e.target.value;
        this.renderTable();
      });
    }
  },

  renderTable() {
    const container = document.getElementById('data-table-container');
    
    // Aplicar filtros
    let filteredTasks = STATE.tasks;
    if (this.filters.module) {
      filteredTasks = filteredTasks.filter(t => t['Módulo'] === this.filters.module);
    }
    if (this.filters.status) {
      filteredTasks = filteredTasks.filter(t => t['Estatus'] === this.filters.status);
    }
    if (this.filters.priority) {
      filteredTasks = filteredTasks.filter(t => t['Prioridad'] === this.filters.priority);
    }

    if (!filteredTasks.length) {
      Utils.showEmptyState('data-table-container', 'No hay tareas con los filtros aplicados');
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" data-field="ID">ID</th>
                <th class="sortable" data-field="Módulo">Módulo</th>
                <th class="sortable" data-field="Actividad">Actividad</th>
                <th class="sortable" data-field="Responsable">Responsable</th>
                <th class="sortable" data-field="Prioridad">Prioridad</th>
                <th class="sortable" data-field="Estatus">Estatus</th>
                <th class="sortable" data-field="Fecha Inicio">Fecha Inicio</th>
                <th class="sortable" data-field="Fecha Fin">Fecha Fin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasks.map(task => this.createTableRow(task)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Sorting
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.field;
        this.sortTable(field, filteredTasks);
      });
    });
  },

  createTableRow(task) {
    return `
      <tr onclick='TaskModal.open(${JSON.stringify(task).replace(/'/g, "&#39;")})'>
        <td class="table-cell-id">${task.ID}</td>
        <td>${task['Módulo'] || '-'}</td>
        <td class="table-cell-truncate">${task['Actividad']}</td>
        <td>${task['Responsable'] || '-'}</td>
        <td><span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span></td>
        <td><span class="badge badge-${Utils.getStatusClass(task['Estatus'])}">${task['Estatus']}</span></td>
        <td>${Utils.formatDate(task['Fecha Inicio'])}</td>
        <td>${Utils.formatDate(task['Fecha Fin'])}</td>
      </tr>
    `;
  },

  sortTable(field, tasks) {
    const direction = STATE.sortConfig.field === field && STATE.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    STATE.sortConfig = { field, direction };
    
    tasks.sort((a, b) => {
      let aVal = a[field] || '';
      let bVal = b[field] || '';
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    this.renderTable();
    
    // Update headers
    document.querySelectorAll('.data-table th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.field === field) {
        th.classList.add(`sort-${direction}`);
      }
    });
  },
};
