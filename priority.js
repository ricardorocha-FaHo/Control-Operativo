// ============================================================
// PRIORITY VIEW — con agrupación y filtros
// ============================================================

const PriorityView = {
  filters: { module:'', status:'', area:'' },
  groupBy: 'none', // 'none' | 'module' | 'area' | 'responsable' | 'estatus'

  render() {
    this._populateFilters();
    this._renderContent();
  },

  _populateFilters() {
    const tasks = STATE.tasks;
    this._fill('priority-filter-module', [...new Set(tasks.map(t=>t['Módulo']).filter(Boolean))], this.filters.module, 'Todos los módulos');
    this._fill('priority-filter-status', [...new Set(tasks.map(t=>t['Estatus']).filter(Boolean))], this.filters.status, 'Todos los estatus');
    this._fill('priority-filter-area',   [...new Set(tasks.map(t=>(t['Area']||t['Área'])).filter(Boolean))].sort(), this.filters.area, 'Todas las áreas');
  },

  _fill(id, items, current, placeholder) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>` +
      items.map(v=>`<option value="${v}" ${current===v?'selected':''}>${v}</option>`).join('');
    el.onchange = e => { this.filters[id.replace('priority-filter-','')] = e.target.value; this._renderContent(); };
  },

  _getFiltered() {
    let tasks = STATE.tasks;
    if (this.filters.module) tasks = tasks.filter(t=>t['Módulo']===this.filters.module);
    if (this.filters.status) tasks = tasks.filter(t=>t['Estatus']===this.filters.status);
    if (this.filters.area)   tasks = tasks.filter(t=>(t['Area']||t['Área'])===this.filters.area);

    // Enriquecer con días hasta vencimiento
    return tasks.map(t => {
      const endDate = t['Fecha Fin'];
      const daysUntil = (endDate&&endDate!=='-') ? Math.ceil((new Date(endDate)-new Date())/864e5) : null;
      return { ...t, daysUntil };
    });
  },

  clearFilters() {
    this.filters = { module:'', status:'', area:'' };
    this._populateFilters();
    this._renderContent();
  },

  setGroupBy(key) {
    this.groupBy = key;
    this._renderContent();
  },

  _renderContent() {
    const container = document.getElementById('priority-list');
    const tasks = this._getFiltered();

    if (!tasks.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"></div><p>No hay tareas con los filtros aplicados</p></div>`;
      return;
    }

    // Toolbar con agrupación
    const groupOpts = [
      { k:'none',        l:'Sin agrupar'  },
      { k:'priority',    l:'Prioridad'    },
      { k:'estatus',     l:'Estatus'      },
      { k:'module',      l:'Módulo'       },
      { k:'area',        l:'Área'         },
      { k:'responsable', l:'Responsable'  },
    ];

    const toolbar = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;
                  background:var(--color-bg-card);padding:12px 16px;
                  border-radius:var(--radius-md);border:1px solid var(--color-border);flex-wrap:wrap;">
        <span style="font-size:13px;font-weight:600;color:var(--color-text-muted);white-space:nowrap;">Agrupar por:</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;flex:1;">
          ${groupOpts.map(o=>`
            <button class="btn ${this.groupBy===o.k?'btn-primary':'btn-secondary'}"
                    onclick="PriorityView.setGroupBy('${o.k}')"
                    style="padding:5px 12px;font-size:13px;">
              ${o.l}
            </button>`).join('')}
        </div>
        <button class="btn btn-secondary" onclick="PriorityView.clearFilters()"
                style="padding:5px 12px;font-size:12px;">Limpiar filtros</button>
      </div>`;

    if (this.groupBy === 'none') {
      // Sin agrupar: mostrar lista plana ordenada por urgencia (primero las más próximas a vencer)
      const sorted = tasks.slice().sort((a,b) => {
        const ae = a['Estatus']==='Ejecutado', be = b['Estatus']==='Ejecutado';
        if (ae!==be) return ae?1:-1;
        if (a.daysUntil===null&&b.daysUntil===null) return 0;
        if (a.daysUntil===null) return 1;
        if (b.daysUntil===null) return -1;
        return a.daysUntil - b.daysUntil;
      });
      container.innerHTML = toolbar + `
        <div class="priority-container">
          <div class="priority-section">
            <div class="priority-header">
              <div class="priority-title">Todas las tareas</div>
              <span class="badge" style="background:var(--color-bg-main);color:var(--color-text-secondary);">
                ${sorted.length} tareas
              </span>
            </div>
            <div class="priority-items">
              ${sorted.map(t=>this._item(t)).join('')}
            </div>
          </div>
        </div>`;
      return;
    }

    // Construir grupos
    const sections = this._buildGroups(tasks);

    container.innerHTML = toolbar + `
      <div class="priority-container">
        ${sections.map(s=>this._renderSection(s)).join('')}
      </div>`;
  },

  _buildGroups(tasks) {
    const sortTasks = arr => arr.sort((a,b) => {
      const ae = a['Estatus']==='Ejecutado', be = b['Estatus']==='Ejecutado';
      if (ae!==be) return ae?1:-1;
      if (a.daysUntil===null&&b.daysUntil===null) return 0;
      if (a.daysUntil===null) return 1;
      if (b.daysUntil===null) return -1;
      return a.daysUntil-b.daysUntil;
    });

    if (this.groupBy === 'priority') {
      return [
        { key:'P1', label:'Prioridad P1 — Alta',  cls:'p1', icon:'p1' },
        { key:'P2', label:'Prioridad P2 — Media', cls:'p2', icon:'p2' },
        { key:'P3', label:'Prioridad P3 — Baja',  cls:'p3', icon:'p3' },
      ].map(g => ({ ...g, tasks: sortTasks(tasks.filter(t=>t['Prioridad']===g.key)) }));
    }

    if (this.groupBy === 'estatus') {
      return ['Pendiente','En Proceso','Ejecutado'].map(s => ({
        key:s, label:s, cls:Utils.getStatusClass(s), icon:null,
        tasks: sortTasks(tasks.filter(t=>t['Estatus']===s)),
      }));
    }

    if (this.groupBy === 'module') {
      const mods = [...new Set(tasks.map(t=>t['Módulo']).filter(Boolean))];
      return mods.map(m => ({ key:m, label:m, cls:'', icon:null, tasks:sortTasks(tasks.filter(t=>t['Módulo']===m)) }));
    }

    if (this.groupBy === 'area') {
      const areas = [...new Set(tasks.map(t=>(t['Area']||t['Área'])).filter(Boolean))].sort();
      return areas.map(a => ({ key:a, label:a, cls:'', icon:null, tasks:sortTasks(tasks.filter(t=>(t['Area']||t['Área'])===a)) }));
    }

    if (this.groupBy === 'responsable') {
      const resps = [...new Set(tasks.map(t=>t['Responsable']).filter(Boolean))].sort();
      return resps.map(r => ({ key:r, label:r, cls:'', icon:null, tasks:sortTasks(tasks.filter(t=>t['Responsable']===r)) }));
    }

    // 'none' handled in _renderContent
    return [];
  },

  _renderSection(section) {
    if (!section.tasks.length) return '';
    return `
      <div class="priority-section">
        <div class="priority-header">
          <div class="priority-title">
            ${section.icon ? `<div class="priority-icon ${section.icon}"></div>` : ''}
            ${section.label}
          </div>
          <span class="badge ${section.cls?'badge-'+section.cls:''}"
                style="${!section.cls?'background:var(--color-bg-main);color:var(--color-text-secondary);':''}">
            ${section.tasks.length} tareas
          </span>
        </div>
        <div class="priority-items">
          ${section.tasks.map(t=>this._item(t)).join('')}
        </div>
      </div>`;
  },

  _item(task) {
    let urgBadge = '';
    if (task['Estatus']!=='Ejecutado' && task.daysUntil!==null) {
      if (task.daysUntil<0)      urgBadge=`<span class="badge" style="background:rgba(193,48,48,0.1);color:var(--priority-p1);">Vencida</span>`;
      else if (task.daysUntil===0)urgBadge=`<span class="badge" style="background:rgba(193,48,48,0.1);color:var(--priority-p1);">Hoy</span>`;
      else if (task.daysUntil<=3) urgBadge=`<span class="badge" style="background:rgba(214,137,16,0.1);color:var(--status-proceso);">${task.daysUntil}d</span>`;
      else if (task.daysUntil<=7) urgBadge=`<span class="badge" style="background:rgba(44,90,160,0.1);color:var(--color-accent);">${task.daysUntil}d</span>`;
      else                        urgBadge=`<span class="badge">${task.daysUntil}d</span>`;
    }
    return `
      <div class="priority-item" onclick='TaskModal.open(${JSON.stringify(task).replace(/'/g,"&#39;")})'>
        <div class="priority-item-header">
          <span class="task-id">${task.ID}</span>
          <span class="priority-item-title">${task['Actividad']}</span>
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
            ${urgBadge}
            <span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span>
            <span class="badge badge-${Utils.getStatusClass(task['Estatus'])}">${task['Estatus']}</span>
          </div>
        </div>
        <div class="priority-item-meta">
          ${task['Módulo']?`<span>${task['Módulo']}</span>`:''}
          ${task['Area']||task['Área']?`<span>${task['Area']||task['Área']}</span>`:''}
          ${task['Responsable']?`<span>${task['Responsable']}</span>`:''}
          ${task['Fecha Fin']?`<span>${Utils.formatDate(task['Fecha Fin'])}</span>`:''}
        </div>
      </div>`;
  },
};