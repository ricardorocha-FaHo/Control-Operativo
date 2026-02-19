// ============================================================
// TABLE VIEW
// ============================================================

const TableView = {
  filters: { module:'', status:'', priority:'', area:'', responsable:'' },
  _sortField: '',
  _sortDir: 'asc',

  render() {
    this._populateFilters();
    this._renderTable();
  },

  _populateFilters() {
    const tasks = STATE.tasks;
    this._fill('table-filter-module',     [...new Set(tasks.map(t=>t['Módulo']).filter(Boolean))],             this.filters.module,      'Todos los módulos');
    this._fill('table-filter-status',     [...new Set(tasks.map(t=>t['Estatus']).filter(Boolean))],            this.filters.status,      'Todos los estatus');
    this._fill('table-filter-priority',   [...new Set(tasks.map(t=>t['Prioridad']).filter(Boolean))],          this.filters.priority,    'Todas las prioridades');
    this._fill('table-filter-area',       [...new Set(tasks.map(t=>(t['Area']||t['Área'])).filter(Boolean))].sort(), this.filters.area,  'Todas las áreas');
    this._fill('table-filter-responsable',[...new Set(tasks.map(t=>t['Responsable']).filter(Boolean))].sort(), this.filters.responsable, 'Todos los responsables');
  },

  _fill(id, items, current, placeholder) {
    const el = document.getElementById(id);
    if (!el) return;
    // Sólo volver a construir si hay cambio real (evita pérdida de listeners duplicados)
    el.innerHTML = `<option value="">${placeholder}</option>` +
      items.map(v=>`<option value="${v}" ${current===v?'selected':''}>${v}</option>`).join('');
  },

  _getFiltered() {
    let tasks = STATE.tasks.slice();
    if (this.filters.module)     tasks = tasks.filter(t=>t['Módulo']===this.filters.module);
    if (this.filters.status)     tasks = tasks.filter(t=>t['Estatus']===this.filters.status);
    if (this.filters.priority)   tasks = tasks.filter(t=>t['Prioridad']===this.filters.priority);
    if (this.filters.area)       tasks = tasks.filter(t=>(t['Area']||t['Área'])===this.filters.area);
    if (this.filters.responsable)tasks = tasks.filter(t=>t['Responsable']===this.filters.responsable);

    if (this._sortField) {
      const f = this._sortField;
      const d = this._sortDir === 'desc' ? -1 : 1;
      tasks.sort((a,b)=>{
        let av = a[f]||'', bv = b[f]||'';
        if (f.includes('Fecha')) { av=av?new Date(av):new Date(0); bv=bv?new Date(bv):new Date(0); return d*(av-bv); }
        return d*String(av).localeCompare(String(bv),'es');
      });
    }
    return tasks;
  },

  clearFilters() {
    this.filters = { module:'', status:'', priority:'', area:'', responsable:'' };
    this._sortField = '';
    this._sortDir = 'asc';
    this._populateFilters();
    this._renderTable();
  },

  _renderTable() {
    const container = document.getElementById('data-table-container');
    const tasks = this._getFiltered();

    if (!tasks.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"></div><p>No hay tareas con los filtros aplicados</p></div>`;
      return;
    }

    const sf = this._sortField;
    const sd = this._sortDir;

    const thStyle = `padding:var(--spacing-md) var(--spacing-lg);text-align:left;font-size:12px;
                     font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-secondary);
                     border-bottom:1px solid var(--color-border);white-space:nowrap;cursor:pointer;
                     user-select:none;transition:background var(--transition-fast);`;

    const th = (field, label) => {
      const arrow = sf===field ? (sd==='asc'?' ↑':' ↓') : ' ↕';
      return `<th style="${thStyle}" onclick="TableView._sort('${field}')"
                  onmouseover="this.style.background='var(--color-bg-hover)'"
                  onmouseout="this.style.background=''">
                ${label}<span style="opacity:${sf===field?1:0.3}">${arrow}</span>
              </th>`;
    };

    container.innerHTML = `
      <div class="table-container">
        <div style="padding:10px 16px;font-size:12px;color:var(--color-text-muted);
                    border-bottom:1px solid var(--color-border);display:flex;
                    align-items:center;justify-content:space-between;">
          <span>${tasks.length} registros</span>
          <button class="btn btn-secondary" onclick="TableView.clearFilters()"
                  style="padding:3px 12px;font-size:12px;">Limpiar filtros</button>
        </div>
        <div class="table-wrapper">
          <table class="data-table" style="width:100%;border-collapse:collapse;">
            <thead style="background:var(--color-bg-main);position:sticky;top:0;z-index:10;">
              <tr>
                ${th('ID','ID')}
                ${th('Módulo','Módulo')}
                ${th('Actividad','Actividad')}
                ${th('Area','Área')}
                ${th('Responsable','Responsable')}
                ${th('Prioridad','Prioridad')}
                ${th('Estatus','Estatus')}
                ${th('Fecha Inicio','F. Inicio')}
                ${th('Fecha Fin','F. Fin')}
                ${th('Progreso %','%')}
              </tr>
            </thead>
            <tbody>
              ${tasks.map(t=>this._row(t)).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  _row(task) {
    const td = `padding:var(--spacing-md) var(--spacing-lg);font-size:13px;border-bottom:1px solid var(--color-border);color:var(--color-text-primary);`;
    const prog = task['Progreso %'];
    const progBar = (prog!==undefined&&prog!=='')
      ? `<div style="display:flex;align-items:center;gap:6px;">
           <div style="flex:1;height:4px;background:var(--color-border);border-radius:2px;overflow:hidden;min-width:40px;">
             <div style="width:${prog}%;height:100%;background:var(--color-accent);border-radius:2px;"></div>
           </div>
           <span style="font-size:11px;font-family:var(--font-mono);">${prog}%</span>
         </div>` : '-';

    const esc = s => String(s||'').replace(/'/g,"&#39;").replace(/"/g,'&quot;');
    const taskJson = JSON.stringify(task).replace(/"/g,'&quot;');

    return `
      <tr style="cursor:pointer;transition:background var(--transition-fast);"
          onmouseover="this.style.background='var(--color-bg-hover)'"
          onmouseout="this.style.background=''"
          onclick='TaskModal.open(${taskJson})'>
        <td style="${td}font-family:var(--font-mono);font-weight:600;color:var(--color-text-muted);">${task.ID}</td>
        <td style="${td}">${task['Módulo']||'-'}</td>
        <td style="${td}max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${task['Actividad']}</td>
        <td style="${td}">${task['Area']||task['Área']||'-'}</td>
        <td style="${td}">${task['Responsable']||'-'}</td>
        <td style="${td}"><span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span></td>
        <td style="${td}"><span class="badge badge-${Utils.getStatusClass(task['Estatus'])}">${task['Estatus']}</span></td>
        <td style="${td}">${Utils.formatDate(task['Fecha Inicio'])}</td>
        <td style="${td}">${Utils.formatDate(task['Fecha Fin'])}</td>
        <td style="${td}min-width:100px;">${progBar}</td>
      </tr>`;
  },

  _sort(field) {
    if (this._sortField === field) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortField = field;
      this._sortDir = 'asc';
    }
    this._renderTable();
  },
};

// Listeners de filtros de tabla — se registran UNA sola vez después del DOM
document.addEventListener('DOMContentLoaded', () => {
  ['module','status','priority','area','responsable'].forEach(f => {
    document.getElementById(`table-filter-${f}`)?.addEventListener('change', e => {
      TableView.filters[f] = e.target.value;
      TableView._renderTable();
    });
  });
});
