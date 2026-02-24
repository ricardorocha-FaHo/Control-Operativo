// ============================================================
// TASKS VIEW
// ============================================================

const TasksView = {
  columns: 2,

  render() {
    this.populateFilters();
    this.applyFilters();
    this.renderTasks();
  },

  populateFilters() {
    const modules    = [...new Set(STATE.tasks.map(t=>t['Módulo']).filter(Boolean))];
    const statuses   = [...new Set(STATE.tasks.map(t=>t['Estatus']).filter(Boolean))];
    const priorities = [...new Set(STATE.tasks.map(t=>t['Prioridad']).filter(Boolean))];
    const areas      = [...new Set(STATE.tasks.map(t=>(t['Area']||t['Área'])).filter(Boolean))].sort();
    const resps      = [...new Set(STATE.tasks.map(t=>t['Responsable']).filter(Boolean))].sort();

    this._fill('filter-module',     modules,    STATE.filters.module,     'Todos los módulos');
    this._fill('filter-status',     statuses,   STATE.filters.status,     'Todos los estatus');
    this._fill('filter-priority',   priorities, STATE.filters.priority,   'Todas las prioridades');
    this._fill('filter-area',       areas,      STATE.filters.area,       'Todas las áreas');
    this._fill('filter-responsable',resps,      STATE.filters.responsable,'Todos los responsables');
  },

  _fill(id, items, current, placeholder) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>` +
      items.map(v => `<option value="${v}" ${current===v?'selected':''}>${v}</option>`).join('');
  },

  applyFilters() {
    STATE.filteredTasks = STATE.tasks.filter(task => {
      if (STATE.filters.module     && task['Módulo']      !== STATE.filters.module)     return false;
      if (STATE.filters.status     && task['Estatus']     !== STATE.filters.status)     return false;
      if (STATE.filters.priority   && task['Prioridad']   !== STATE.filters.priority)   return false;
      if (STATE.filters.area       && (task['Area']||task['Área']) !== STATE.filters.area) return false;
      if (STATE.filters.responsable&& task['Responsable'] !== STATE.filters.responsable) return false;
      if (STATE.filters.upcomingModule &&
          !(task['Módulo']===STATE.filters.upcomingModule && Utils.isUpcoming(task,7))) return false;
      if (!Utils.matchSearch(task, STATE.filters.search)) return false;
      return true;
    });

    // Ordenamiento
    if (STATE.filters.sortBy) {
      const field = STATE.filters.sortBy;
      const dir   = STATE.filters.sortDir === 'desc' ? -1 : 1;
      STATE.filteredTasks.sort((a,b) => {
        let va = a[field] || '';
        let vb = b[field] || '';
        if (field.includes('Fecha') || field === 'Progreso %') {
          va = va ? (field==='Progreso %' ? Number(va) : new Date(va)) : (dir>0 ? new Date('9999-12-31') : new Date(0));
          vb = vb ? (field==='Progreso %' ? Number(vb) : new Date(vb)) : (dir>0 ? new Date('9999-12-31') : new Date(0));
          return dir * (va - vb);
        }
        return dir * (String(va).localeCompare(String(vb), 'es'));
      });
    }
  },

  clearAllFilters() {
    STATE.filters.module = '';
    STATE.filters.status = '';
    STATE.filters.priority = '';
    STATE.filters.area = '';
    STATE.filters.responsable = '';
    STATE.filters.search = '';
    STATE.filters.sortBy = '';
    STATE.filters.sortDir = 'asc';
    STATE.filters.upcomingModule = '';
    const si = document.getElementById('search-input');
    if (si) si.value = '';
    this.render();
  },

  renderTasks() {
    const container = document.getElementById('tasks-list');

    const upcomingBanner = STATE.filters.upcomingModule
      ? `<div style="padding:10px 16px;background:rgba(193,48,48,0.06);border:1px solid rgba(193,48,48,0.2);
                    border-radius:var(--radius-md);margin-bottom:16px;display:flex;align-items:center;
                    justify-content:space-between;gap:8px;">
           <span style="font-size:13px;color:var(--priority-p1);font-weight:600;">
             Proximas a vencer — ${STATE.filters.upcomingModule}
           </span>
           <button class="btn btn-secondary" style="padding:4px 12px;font-size:12px;"
                   onclick="STATE.filters.upcomingModule='';TasksView.applyFilters();TasksView.renderTasks();">
             Quitar filtro
           </button>
         </div>`
      : '';

    if (!STATE.filteredTasks.length) {
      container.innerHTML = upcomingBanner +
        `<div class="empty-state"><div class="empty-state-icon"></div><p>No se encontraron tareas</p></div>`;
      return;
    }

    // Opciones de ordenamiento completas
    const sortOptions = [
      { v:'',                     l:'Sin orden'              },
      { v:'Fecha Fin|asc',        l:'Fecha Fin — más próxima'},
      { v:'Fecha Fin|desc',       l:'Fecha Fin — más lejana' },
      { v:'Fecha Inicio|asc',     l:'Fecha Inicio — más antigua'},
      { v:'Fecha Inicio|desc',    l:'Fecha Inicio — más reciente'},
      { v:'Prioridad|asc',        l:'Prioridad P1 → P3'     },
      { v:'Prioridad|desc',       l:'Prioridad P3 → P1'     },
      { v:'Estatus|asc',          l:'Estatus A→Z'            },
      { v:'Módulo|asc',           l:'Módulo A→Z'             },
      { v:'Responsable|asc',      l:'Responsable A→Z'        },
      { v:'Area|asc',             l:'Área A→Z'               },
      { v:'Progreso %|desc',      l:'Progreso mayor → menor' },
      { v:'Progreso %|asc',       l:'Progreso menor → mayor' },
      { v:'ID|asc',               l:'ID ascendente'          },
      { v:'ID|desc',              l:'ID descendente'         },
    ];

    const currentSort = STATE.filters.sortBy ? `${STATE.filters.sortBy}|${STATE.filters.sortDir}` : '';

    const toolbar = `
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <span style="font-size:13px;color:var(--color-text-muted);">
          ${STATE.filteredTasks.length} tarea${STATE.filteredTasks.length!==1?'s':''}
        </span>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:6px;">
            <label style="font-size:12px;color:var(--color-text-muted);white-space:nowrap;">Ordenar:</label>
            <select class="filter-select" style="font-size:12px;padding:5px 10px;min-width:190px;"
                    onchange="TasksView._applySort(this.value)">
              ${sortOptions.map(o=>`<option value="${o.v}" ${currentSort===o.v?'selected':''}>${o.l}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:5px;">
            <label style="font-size:12px;color:var(--color-text-muted);">Col:</label>
            ${[1,2,3].map(n=>`<button onclick="TasksView.setColumns(${n})"
                class="btn ${this.columns===n?'btn-primary':'btn-secondary'}"
                style="padding:4px 10px;font-size:12px;">${n}</button>`).join('')}
          </div>
          <button class="btn btn-secondary" onclick="TasksView.clearAllFilters()"
                  style="padding:4px 12px;font-size:12px;">
            Limpiar filtros
          </button>
        </div>
      </div>`;

    container.innerHTML = upcomingBanner + toolbar + `
      <div style="display:grid;grid-template-columns:repeat(${this.columns},minmax(0,1fr));gap:16px;">
        ${STATE.filteredTasks.map(t=>this._card(t)).join('')}
      </div>`;
  },

  _applySort(val) {
    if (!val) { STATE.filters.sortBy=''; STATE.filters.sortDir='asc'; }
    else { const [f,d]=val.split('|'); STATE.filters.sortBy=f; STATE.filters.sortDir=d||'asc'; }
    this.applyFilters(); this.renderTasks();
  },

  setColumns(n) { this.columns=n; this.renderTasks(); },

  _card(task) {
    const modColors = {
      'Trabajo':'#2c5aa0','Soporte':'#d68910','Analitica':'#5b7aa8',
      'Comunicación':'#7a5ba8','Pendientes':'#c75050',
    };
    const col = modColors[task['Módulo']] || '#8a8a8a';
    const up  = Utils.isUpcoming(task,7);
    const actStr = String(task['Actividades'] || task['Campo Reservado 1'] || '');
    const chkStr = String(task['Check'] || task['Campo Reservado 2'] || '');
    const acts = actStr ? actStr.split('|').map(s=>s.trim()).filter(Boolean) : [];
    const chks = chkStr ? chkStr.split('|').map(s=>s.trim()) : [];
    const doneCount = chks.filter((c,i) => i<acts.length && (c==='true'||c==='1')).length;
    const progressBar = acts.length
      ? `<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
           <div style="flex:1;height:3px;background:var(--color-border);border-radius:2px;overflow:hidden;">
             <div style="width:${Math.round(doneCount/acts.length*100)}%;height:100%;background:var(--status-ejecutado);border-radius:2px;"></div>
           </div>
           <span style="font-size:10px;color:var(--color-text-muted);">${doneCount}/${acts.length}</span>
         </div>` : '';

    return `
      <div class="task-item"
           style="border-left:4px solid ${col};display:flex;flex-direction:column;gap:8px;${up?'outline:1px solid rgba(193,48,48,0.25);':''}"
           onclick='TaskModal.open(${JSON.stringify(task).replace(/'/g,"&#39;")})'>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
          <span class="task-id">${task.ID}</span>
          <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;">
            ${up?`<span class="badge" style="background:rgba(193,48,48,0.1);color:var(--priority-p1);">Prox.</span>`:''}
            <span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span>
            <span class="badge badge-${Utils.getStatusClass(task['Estatus'])}">${task['Estatus']}</span>
          </div>
        </div>
        <span style="font-size:11px;font-weight:600;color:${col};background:${col}18;padding:2px 8px;border-radius:4px;align-self:flex-start;">
          ${task['Módulo']||'-'}
        </span>
        <div class="task-title" style="font-size:14px;font-weight:600;line-height:1.3;">${task['Actividad']}</div>
        <div style="font-size:12px;color:var(--color-text-muted);line-height:1.4;
                    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          ${task['Descripción']||''}
        </div>
        ${progressBar}
        <div style="margin-top:auto;display:flex;flex-wrap:wrap;gap:8px;padding-top:8px;border-top:1px solid var(--color-border);">
          ${task['Area']||task['Área']?`<span class="task-meta-item" style="color:var(--color-text-muted);">${task['Area']||task['Área']}</span>`:''}
          ${task['Responsable']?`<span class="task-meta-item">${task['Responsable']}</span>`:''}
          ${task['Fecha Fin']?`<span class="task-meta-item">${Utils.formatDate(task['Fecha Fin'])}</span>`:''}
        </div>
      </div>`;
  },
};
