// ============================================================
// TASK MANAGEMENT SYSTEM - CORE
// ============================================================

const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbz44VHD_tSs3AgCM8xrVSWvBNTDqRfNtaJz43YRyfQV9fWnBPgfJBqe-F-0TDIOqLif/exec',
  CACHE_DURATION: 5 * 60 * 1000,
};

const STATE = {
  tasks: [],
  filteredTasks: [],
  currentView: 'home',
  isExpanded: false,
  filters: {
    module: '', status: '', priority: '', search: '',
    area: '', responsable: '', sortBy: '', sortDir: 'asc', upcomingModule: '',
  },
  sortConfig: { field: null, direction: 'asc' },
  cache: { data: null, timestamp: null },
};

// ============================================================
// UTILIDADES
// ============================================================
const Utils = {
  formatDate(s) {
    if (!s || s === '-' || s === 'TBD') return s || '-';
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' });
  },
  getStatusClass(s) {
    return { 'Ejecutado':'ejecutado','En Proceso':'proceso','Pendiente':'pendiente' }[s] || 'pendiente';
  },
  getPriorityClass(p) {
    return { 'P1':'p1','P2':'p2','P3':'p3' }[p] || 'p2';
  },
  debounce(fn, ms) {
    let t; return function(...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this,a), ms); };
  },
  showLoading(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="loading"><div class="spinner"></div><span style="margin-left:12px;">Cargando...</span></div>`;
  },
  showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">!</div><p>${msg}</p></div>`;
  },
  showEmptyState(id, msg) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="empty-state"><div class="empty-state-icon"></div><p>${msg}</p></div>`;
  },
  daysUntil(dateStr) {
    if (!dateStr || dateStr === '-') return null;
    const d = new Date(dateStr);
    return isNaN(d) ? null : Math.ceil((d - new Date()) / 864e5);
  },
  isUpcoming(task, days=7) {
    if (task['Estatus'] === 'Ejecutado') return false;
    const d = this.daysUntil(task['Fecha Fin']);
    return d !== null && d >= 0 && d <= days;
  },
  // Buscar en TODAS las columnas
  matchSearch(task, q) {
    if (!q) return true;
    const ql = q.toLowerCase();
    return Object.values(task).some(v => v != null && String(v).toLowerCase().includes(ql));
  },
};

// ============================================================
// API SERVICE
// ============================================================
const API = {
  async fetchTasks(params={}) {
    const now = Date.now();
    if (STATE.cache.data && STATE.cache.timestamp && now - STATE.cache.timestamp < CONFIG.CACHE_DURATION)
      return STATE.cache.data;
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(qs ? `${CONFIG.API_URL}?${qs}` : CONFIG.API_URL);
    if (!res.ok) throw new Error('Error al cargar datos');
    const data = await res.json();
    STATE.cache.data = data; STATE.cache.timestamp = now;
    return data;
  },
  clearCache() { STATE.cache.data = null; STATE.cache.timestamp = null; },
  async createTask(p) {
    const params = new URLSearchParams({ action:'create',
      modulo:p.modulo||'', submodulo:p.submodulo||'', actividad:p.actividad||'',
      descripcion:p.descripcion||'', area:p.area||'', responsable:p.responsable||'',
      prioridad:p.prioridad||'P2', estatus:p.estatus||'Pendiente',
      fechaInicio:p.fechaInicio||'', fechaFin:p.fechaFin||'',
      progreso:p.progreso||0, notas:p.notas||'', dependencias:p.dependencias||'',
      actividades:p.actividades||'', check:p.check||'',
    });
    const res = await fetch(`${CONFIG.API_URL}?${params}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },
  async updateTask(p) {
    const params = new URLSearchParams({ action:'update', id:p.id||'',
      modulo:p.modulo||'', submodulo:p.submodulo||'', actividad:p.actividad||'',
      descripcion:p.descripcion||'', area:p.area||'', responsable:p.responsable||'',
      prioridad:p.prioridad||'P2', estatus:p.estatus||'Pendiente',
      fechaInicio:p.fechaInicio||'', fechaFin:p.fechaFin||'',
      progreso:p.progreso||0, notas:p.notas||'', dependencias:p.dependencias||'',
      actividades:p.actividades||'', check:p.check||'',
    });
    const res = await fetch(`${CONFIG.API_URL}?${params}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },
  async deleteTask(id) {
    const res = await fetch(`${CONFIG.API_URL}?${new URLSearchParams({action:'delete',id})}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },
  getNextId() {
    const ids = STATE.tasks.map(t=>t['ID']).filter(id=>id&&/^TSK-\d+$/.test(String(id)))
      .map(id=>parseInt(String(id).split('-')[1]));
    return 'TSK-' + String((ids.length ? Math.max(...ids) : 0) + 1).padStart(4,'0');
  },
};

// ============================================================
// NAVIGATION
// ============================================================
const Navigation = {
  init() {
    document.querySelectorAll('.nav-item').forEach(item =>
      item.addEventListener('click', () => this.switchView(item.dataset.view))
    );
  },
  switchView(view) {
    STATE.currentView = view;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.view===view));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`)?.classList.add('active');
    ({ home:HomeView, tasks:TasksView, gantt:GanttView, kanban:KanbanView,
       priority:PriorityView, table:TableView })[view]?.render();
  },
};

// ============================================================
// TASK MODAL — subtareas interactivas
// ============================================================
const TaskModal = {
  _task: null,

  open(task) {
    this._task = task;
    const modal = document.getElementById('task-modal');
    const body  = modal.querySelector('.modal-body');

    // Dependencias
    const depIds = task['Dependencias']
      ? String(task['Dependencias']).split(',').map(s=>s.trim()).filter(Boolean) : [];
    const depCards = depIds.length
      ? depIds.map(id => {
          const dt = STATE.tasks.find(t=>t['ID']===id);
          if (!dt) return `<span style="display:inline-flex;align-items:center;background:rgba(90,108,125,0.1);color:var(--status-pendiente);border-radius:4px;padding:3px 10px;font-size:12px;font-family:var(--font-mono);">${id} (no encontrada)</span>`;
          const dj = JSON.stringify(dt).replace(/"/g,'&quot;');
          return `<div onclick="TaskModal.close();setTimeout(()=>TaskModal.open(${dj}),150)"
                       style="display:inline-flex;align-items:center;gap:8px;background:rgba(44,90,160,0.07);border:1px solid rgba(44,90,160,0.2);border-radius:6px;padding:6px 12px;cursor:pointer;"
                       onmouseover="this.style.background='rgba(44,90,160,0.14)'" onmouseout="this.style.background='rgba(44,90,160,0.07)'">
                    <span style="font-family:var(--font-mono);font-weight:700;color:var(--color-accent);font-size:12px;">${id}</span>
                    <span style="font-size:12px;color:var(--color-text-secondary);">${dt['Actividad']}</span>
                    <span class="badge badge-${Utils.getStatusClass(dt['Estatus'])}" style="font-size:10px;padding:2px 6px;">${dt['Estatus']}</span>
                  </div>`;
        }).join('')
      : `<span style="color:var(--color-text-muted);font-size:13px;">Sin dependencias</span>`;

    // Hijos
    const children = STATE.tasks.filter(t =>
      t['Dependencias'] && String(t['Dependencias']).split(',').map(s=>s.trim()).includes(task['ID'])
    );
    const childCards = children.map(c => {
      const cj = JSON.stringify(c).replace(/"/g,'&quot;');
      return `<div onclick="TaskModal.close();setTimeout(()=>TaskModal.open(${cj}),150)"
                   style="display:inline-flex;align-items:center;gap:8px;background:rgba(45,122,62,0.07);border:1px solid rgba(45,122,62,0.2);border-radius:6px;padding:6px 12px;cursor:pointer;"
                   onmouseover="this.style.background='rgba(45,122,62,0.14)'" onmouseout="this.style.background='rgba(45,122,62,0.07)'">
                <span style="font-family:var(--font-mono);font-weight:700;color:var(--status-ejecutado);font-size:12px;">${c['ID']}</span>
                <span style="font-size:12px;color:var(--color-text-secondary);">${c['Actividad']}</span>
                <span class="badge badge-${Utils.getStatusClass(c['Estatus'])}" style="font-size:10px;padding:2px 6px;">${c['Estatus']}</span>
              </div>`;
    }).join('');

    // Progreso — slider interactivo
    const prog = task['Progreso %'] !== undefined && task['Progreso %'] !== '' ? Number(task['Progreso %']) : null;
    const progresoBar = prog !== null ? `
      <div class="detail-row">
        <div class="detail-label">Progreso</div>
        <div class="detail-value">
          <div style="display:flex;align-items:center;gap:10px;">
            <input type="range" id="modal-prog-slider" min="0" max="100" value="${prog}"
                   style="flex:1;accent-color:var(--color-accent);cursor:pointer;"
                   oninput="TaskModal._onProgChange(this.value)">
            <span id="modal-prog-lbl" style="font-size:13px;font-weight:600;color:var(--color-accent);
                  font-family:var(--font-mono);min-width:36px;text-align:right;">${prog}%</span>
          </div>
          <div id="modal-prog-save-row" style="display:none;margin-top:6px;">
            <button class="btn btn-primary" onclick="TaskModal._saveProgress()"
                    style="padding:4px 12px;font-size:12px;">Guardar progreso</button>
            <span id="modal-prog-msg" style="font-size:12px;color:var(--color-text-muted);margin-left:8px;"></span>
          </div>
        </div>
      </div>` : '';

    // Sub-actividades interactivas con check
    const actStr   = task['Actividades'] || task['Campo Reservado 1'] || '';
    const checkStr = task['Check'] || task['Campo Reservado 2'] || '';
    const actList  = actStr ? actStr.split('|').map(s=>s.trim()).filter(Boolean) : [];
    // Helper: normaliza cualquier representación de "true"
    const _chkTrue = v => { const s=(v||'').toString().trim().toLowerCase(); return s==='true'||s==='1'||s==='si'||s==='yes'; };
    const chkList  = checkStr ? checkStr.split('|').map(s=>s.trim()) : [];

    let subtasksHTML = '';
    if (actList.length) {
      subtasksHTML = `
        <div class="detail-row">
          <div class="detail-label" style="padding-top:4px;">Sub-actividades</div>
          <div class="detail-value">
            <div id="modal-subtasks" style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;">
              ${actList.map((act,i) => {
                const chk = _chkTrue(chkList[i]);
                return `<label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:5px 6px;border-radius:4px;"
                               onmouseover="this.style.background='var(--color-bg-hover)'" onmouseout="this.style.background=''">
                          <input type="checkbox" data-si="${i}" ${chk?'checked':''}
                                 onchange="TaskModal._onCheck(${i},this.checked)"
                                 style="width:15px;height:15px;accent-color:var(--status-ejecutado);cursor:pointer;flex-shrink:0;">
                          <span data-st="${i}" style="font-size:13px;${chk?'text-decoration:line-through;color:var(--color-text-muted);':'color:var(--color-text-primary);'}">
                            ${act}
                          </span>
                        </label>`;
              }).join('')}
            </div>
            <div id="modal-save-row" style="display:none;">
              <button class="btn btn-primary" onclick="TaskModal._saveChecks()"
                      style="padding:5px 14px;font-size:12px;">
                Guardar
              </button>
              <span id="modal-save-msg" style="font-size:12px;color:var(--color-text-muted);margin-left:8px;"></span>
            </div>
          </div>
        </div>`;
    }

    body.innerHTML = `
      <div class="detail-row"><div class="detail-label">ID</div>
        <div class="detail-value"><strong style="font-family:var(--font-mono);">${task.ID}</strong></div></div>
      <div class="detail-row"><div class="detail-label">Módulo</div>
        <div class="detail-value">${task['Módulo']||'-'}</div></div>
      <div class="detail-row"><div class="detail-label">Actividad</div>
        <div class="detail-value"><strong>${task['Actividad']}</strong></div></div>
      <div class="detail-row"><div class="detail-label">Descripción</div>
        <div class="detail-value">${task['Descripción']||'-'}</div></div>
      <div class="detail-row"><div class="detail-label">Área</div>
        <div class="detail-value">${task['Area']||task['Área']||'-'}</div></div>
      <div class="detail-row"><div class="detail-label">Responsable</div>
        <div class="detail-value">${task['Responsable']||'-'}</div></div>
      <div class="detail-row"><div class="detail-label">Prioridad</div>
        <div class="detail-value"><span class="badge badge-${Utils.getPriorityClass(task['Prioridad'])}">${task['Prioridad']}</span></div></div>
      <div class="detail-row"><div class="detail-label">Estatus</div>
        <div class="detail-value"><span class="badge badge-${Utils.getStatusClass(task['Estatus'])}">${task['Estatus']}</span></div></div>
      <div class="detail-row"><div class="detail-label">Fecha Inicio</div>
        <div class="detail-value">${Utils.formatDate(task['Fecha Inicio'])}</div></div>
      <div class="detail-row"><div class="detail-label">Fecha Fin</div>
        <div class="detail-value">${Utils.formatDate(task['Fecha Fin'])}</div></div>
      ${progresoBar}
      ${task['Notas']?`<div class="detail-row"><div class="detail-label">Notas</div><div class="detail-value">${task['Notas']}</div></div>`:''}
      ${subtasksHTML}
      <div class="detail-row">
        <div class="detail-label" style="padding-top:6px;">Dependencias</div>
        <div class="detail-value"><div style="display:flex;flex-wrap:wrap;gap:8px;">${depCards}</div></div>
      </div>
      ${childCards?`<div class="detail-row"><div class="detail-label" style="padding-top:6px;">Tareas hijo</div><div class="detail-value"><div style="display:flex;flex-wrap:wrap;gap:8px;">${childCards}</div></div></div>`:''}
    `;

    const footer = modal.querySelector('.modal-footer');
    const tj = JSON.stringify(task).replace(/"/g,'&quot;');
    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="TaskModal.close()">Cerrar</button>
      <button class="btn btn-primary" onclick="TaskModal.close();CrudModal.openEdit(${tj})">Editar</button>
    `;
    modal.classList.remove('hidden');
  },

  _onCheck(idx, checked) {
    const sp = document.querySelector(`[data-st="${idx}"]`);
    if (sp) {
      sp.style.textDecoration = checked ? 'line-through' : '';
      sp.style.color = checked ? 'var(--color-text-muted)' : 'var(--color-text-primary)';
    }
    document.getElementById('modal-save-row').style.display = 'block';
  },

  _onProgChange(val) {
    const lbl = document.getElementById('modal-prog-lbl');
    if (lbl) lbl.textContent = val + '%';
    document.getElementById('modal-prog-save-row').style.display = 'block';
  },

  async _saveProgress() {
    const task = this._task;
    if (!task) return;
    const slider = document.getElementById('modal-prog-slider');
    const newProg = slider ? Number(slider.value) : (task['Progreso %'] || 0);
    const btn = document.querySelector('#modal-prog-save-row .btn-primary');
    const msg = document.getElementById('modal-prog-msg');
    if (btn) { btn.textContent = 'Guardando...'; btn.disabled = true; }
    try {
      await API.updateTask({
        id:task['ID'], modulo:task['Módulo']||'', submodulo:task['SubModulo']||'',
        actividad:task['Actividad']||'', descripcion:task['Descripción']||'',
        area:task['Area']||task['Área']||'', responsable:task['Responsable']||'',
        prioridad:task['Prioridad']||'P2', estatus:task['Estatus']||'Pendiente',
        fechaInicio:task['Fecha Inicio']||'', fechaFin:task['Fecha Fin']||'',
        progreso:newProg, notas:task['Notas']||'', dependencias:task['Dependencias']||'',
        actividades:task['Actividades']||task['Campo Reservado 1']||'',
        check:task['Check']||task['Campo Reservado 2']||'',
      });
      // Update local
      const idx = STATE.tasks.findIndex(t=>t['ID']===task['ID']);
      if (idx>-1) { STATE.tasks[idx]['Progreso %'] = newProg; this._task['Progreso %'] = newProg; }
      if (btn) { btn.textContent = 'Guardar progreso'; btn.disabled = false; }
      if (msg) { msg.textContent = 'Guardado'; setTimeout(()=>{ msg.textContent=''; document.getElementById('modal-prog-save-row').style.display='none'; }, 1500); }
      API.clearCache();
    } catch(e) {
      if (btn) { btn.textContent = 'Error - reintentar'; btn.disabled = false; }
    }
  },

  async _saveChecks() {
    const task = this._task;
    if (!task) return;
    const actStr  = task['Actividades'] || task['Campo Reservado 1'] || '';
    const actList = actStr ? actStr.split('|').map(s=>s.trim()).filter(Boolean) : [];
    const newChks = actList.map((_,i) => {
      const cb = document.querySelector(`[data-si="${i}"]`);
      return cb?.checked ? 'true' : 'false';
    });
    const btn = document.querySelector('#modal-save-row .btn-primary');
    const msg = document.getElementById('modal-save-msg');
    if (btn) { btn.textContent = 'Guardando...'; btn.disabled = true; }
    try {
      await API.updateTask({
        id:task['ID'], modulo:task['Módulo']||'', submodulo:task['SubModulo']||'',
        actividad:task['Actividad']||'', descripcion:task['Descripción']||'',
        area:task['Area']||task['Área']||'', responsable:task['Responsable']||'',
        prioridad:task['Prioridad']||'P2', estatus:task['Estatus']||'Pendiente',
        fechaInicio:task['Fecha Inicio']||'', fechaFin:task['Fecha Fin']||'',
        progreso:task['Progreso %']||0, notas:task['Notas']||'',
        dependencias:task['Dependencias']||'',
        actividades:actList.join('|'), check:newChks.join('|'),
      });
      const idx = STATE.tasks.findIndex(t=>t['ID']===task['ID']);
      if (idx>-1) { STATE.tasks[idx]['Check']=newChks.join('|'); STATE.tasks[idx]['Campo Reservado 2']=newChks.join('|'); }
      if (btn) { btn.textContent = 'Guardar'; btn.disabled = false; }
      if (msg) { msg.textContent='Guardado'; setTimeout(()=>{ msg.textContent=''; document.getElementById('modal-save-row').style.display='none'; },1500); }
      API.clearCache();
    } catch(e) {
      if (btn) { btn.textContent='Error - reintentar'; btn.disabled=false; }
    }
  },

  close() {
    document.getElementById('task-modal').classList.add('hidden');
    this._task = null;
  },
};

// ============================================================
// EVENT HANDLERS
// ============================================================
function setupEventHandlers() {
  const si = document.getElementById('search-input');

  si.addEventListener('focus', () => {
    if (STATE.currentView !== 'tasks') {
      STATE.filters.module=''; STATE.filters.status=''; STATE.filters.priority='';
      Navigation.switchView('tasks');
    }
  });

  si.addEventListener('input', Utils.debounce(e => {
    STATE.filters.search = e.target.value;
    if (STATE.currentView !== 'tasks') {
      STATE.filters.module=''; STATE.filters.status=''; STATE.filters.priority='';
      Navigation.switchView('tasks');
    } else {
      TasksView.applyFilters(); TasksView.renderTasks();
    }
  }, 300));

  ['module','status','priority','area','responsable'].forEach(f => {
    document.getElementById(`filter-${f}`)?.addEventListener('change', e => {
      STATE.filters[f] = e.target.value;
      TasksView.applyFilters(); TasksView.renderTasks();
    });
  });

  document.getElementById('modal-close')?.addEventListener('click', () => TaskModal.close());
  document.getElementById('task-modal')?.addEventListener('click', e => {
    if (e.target.id === 'task-modal') TaskModal.close();
  });

}

async function init() {
  try {
    Utils.showLoading('modules-grid');
    const res = await API.fetchTasks();
    if (res.success && res.data) {
      STATE.tasks = res.data;
      STATE.filteredTasks = res.data;
      Navigation.init();
      setupEventHandlers();
      HomeView.render();
    } else {
      Utils.showError('modules-grid', 'Error al cargar los datos');
    }
  } catch(e) {
    Utils.showError('modules-grid', 'Error al conectar con la API.');
  }
}

// ── Boot: Firebase onAuthStateChanged (en index.html) es quien llama a init()
// Registramos _authResolve para que el módulo ESM lo invoque al confirmar sesión.
// Si por algún motivo app.js carga antes que Firebase confirme, queda en espera.
window._appInited   = false;
window._authResolve = function() {
  if (!window._appInited) {
    window._appInited = true;
    init();
  }
};