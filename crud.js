// ============================================================
// CRUD — Crear / Editar / Eliminar Tareas
// ============================================================

const CrudModal = {
  mode: 'create',
  currentTask: null,

  openCreate() { this.mode='create'; this.currentTask=null; this._render({}); },
  openEdit(task) { this.mode='edit'; this.currentTask=task; this._render(task); },

  _render(task) {
    document.getElementById('crud-modal-overlay')?.remove();

    const modules   = [...new Set(STATE.tasks.map(t=>t['Módulo']).filter(Boolean))];
    const submodulos= [...new Set(STATE.tasks.map(t=>t['SubModulo']).filter(Boolean))].sort();
    const resps     = [...new Set(STATE.tasks.map(t=>t['Responsable']).filter(Boolean))].sort();
    const areas     = [...new Set(STATE.tasks.map(t=>(t['Area']||t['Área'])).filter(Boolean))].sort();

    const autoId = this.mode==='create' ? API.getNextId() : (task['ID']||'');

    const currentDeps = task['Dependencias']
      ? String(task['Dependencias']).split(',').map(s=>s.trim()).filter(Boolean) : [];

    const actStr  = task['Actividades']||task['Campo Reservado 1']||'';
    const chkStr  = task['Check']||task['Campo Reservado 2']||'';
    const actList = actStr ? actStr.split('|').map(s=>s.trim()).filter(Boolean) : [];
    const chkList = chkStr? chkStr.split('|').map(s=>s.trim()) : [];

    const ov = document.createElement('div');
    ov.id = 'crud-modal-overlay';
    ov.className = 'modal-overlay';
    ov.style.cssText = 'z-index:2000;';
    ov.innerHTML = `
      <div class="modal" style="max-width:820px;width:95%;">
        <div class="modal-header">
          <h3 class="modal-title">${this.mode==='create'?'Nueva Tarea':'Editar Tarea'}</h3>
          <button class="modal-close" onclick="CrudModal.close()">&#x2715;</button>
        </div>
        <div class="modal-body" style="padding:var(--spacing-lg);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-md);">

            <!-- ID -->
            <div class="crud-field-group">
              <label class="crud-label">ID</label>
              <input id="crud-id" class="crud-input" type="text" value="${autoId}"
                     readonly style="opacity:.55;cursor:not-allowed;">
            </div>

            <!-- Módulo -->
            <div class="crud-field-group">
              <label class="crud-label">Módulo <span style="color:var(--priority-p1)">*</span></label>
              <select id="crud-modulo" class="crud-input">
                <option value="">-- Seleccionar --</option>
                ${modules.map(m=>`<option value="${m}" ${task['Módulo']===m?'selected':''}>${m}</option>`).join('')}
                <option value="__nuevo__">+ Nuevo módulo...</option>
              </select>
              <input id="crud-modulo-nuevo" class="crud-input" type="text"
                     placeholder="Nombre del nuevo módulo" style="margin-top:6px;display:none;">
            </div>

            <!-- SubMódulo -->
            <div class="crud-field-group">
              <label class="crud-label">SubMódulo</label>
              <input id="crud-submodulo" class="crud-input" type="text"
                     list="dl-submodulo" value="${this._esc(task['SubModulo']||'')}"
                     placeholder="Existente o nuevo">
              <datalist id="dl-submodulo">
                ${submodulos.map(s=>`<option value="${this._esc(s)}">`).join('')}
              </datalist>
            </div>

            <!-- Área -->
            <div class="crud-field-group">
              <label class="crud-label">Área</label>
              <input id="crud-area" class="crud-input" type="text"
                     list="dl-area" value="${this._esc(task['Area']||task['Área']||'')}"
                     placeholder="Existente o nueva">
              <datalist id="dl-area">
                ${areas.map(a=>`<option value="${this._esc(a)}">`).join('')}
              </datalist>
            </div>

            <!-- Responsable -->
            <div class="crud-field-group">
              <label class="crud-label">Responsable</label>
              <input id="crud-responsable" class="crud-input" type="text"
                     list="dl-responsable" value="${this._esc(task['Responsable']||'')}"
                     placeholder="Seleccionar o escribir">
              <datalist id="dl-responsable">
                ${resps.map(r=>`<option value="${this._esc(r)}">`).join('')}
              </datalist>
            </div>

            <!-- Prioridad -->
            <div class="crud-field-group">
              <label class="crud-label">Prioridad <span style="color:var(--priority-p1)">*</span></label>
              <select id="crud-prioridad" class="crud-input">
                ${['P1','P2','P3'].map(p=>`<option value="${p}" ${(task['Prioridad']||'P2')===p?'selected':''}>${p}</option>`).join('')}
              </select>
            </div>

            <!-- Estatus -->
            <div class="crud-field-group">
              <label class="crud-label">Estatus <span style="color:var(--priority-p1)">*</span></label>
              <select id="crud-estatus" class="crud-input">
                ${['Pendiente','En Proceso','Ejecutado'].map(s=>`<option value="${s}" ${(task['Estatus']||'Pendiente')===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>

            <!-- Actividad -->
            <div class="crud-field-group" style="grid-column:1/-1;">
              <label class="crud-label">Actividad <span style="color:var(--priority-p1)">*</span></label>
              <input id="crud-actividad" class="crud-input" type="text"
                     value="${this._esc(task['Actividad']||'')}" placeholder="Nombre de la actividad">
            </div>

            <!-- Descripción -->
            <div class="crud-field-group" style="grid-column:1/-1;">
              <label class="crud-label">Descripción</label>
              <textarea id="crud-descripcion" class="crud-input" rows="3"
                        style="resize:vertical;">${this._esc(task['Descripción']||'')}</textarea>
            </div>

            <!-- Fechas -->
            <div class="crud-field-group">
              <label class="crud-label">Fecha Inicio</label>
              <input id="crud-fecha-inicio" class="crud-input" type="date" value="${task['Fecha Inicio']||''}">
            </div>
            <div class="crud-field-group">
              <label class="crud-label">Fecha Fin</label>
              <input id="crud-fecha-fin" class="crud-input" type="date" value="${task['Fecha Fin']||''}">
            </div>

            <!-- Progreso -->
            <div class="crud-field-group">
              <label class="crud-label">Progreso %
                <span id="crud-prog-lbl" style="color:var(--color-accent);font-weight:700;">
                  ${task['Progreso %']||0}%
                </span>
              </label>
              <input id="crud-progreso" class="crud-input" type="range" min="0" max="100"
                     value="${task['Progreso %']||0}" style="padding:8px 0;"
                     oninput="document.getElementById('crud-prog-lbl').textContent=this.value+'%'">
            </div>

            <!-- Notas -->
            <div class="crud-field-group" style="grid-column:1/-1;">
              <label class="crud-label">Notas</label>
              <textarea id="crud-notas" class="crud-input" rows="2"
                        style="resize:vertical;">${this._esc(task['Notas']||'')}</textarea>
            </div>

            <!-- Dependencias mejoradas -->
            <div class="crud-field-group" style="grid-column:1/-1;position:relative;">
              <label class="crud-label">Dependencias
                <span style="font-size:11px;font-weight:400;color:var(--color-text-muted);margin-left:6px;">
                  Haz clic en el campo y busca por ID, nombre o módulo
                </span>
              </label>
              <div id="crud-deps-box" style="
                display:flex;flex-wrap:wrap;gap:6px;
                border:1px solid var(--color-border);border-radius:var(--radius-md);
                padding:8px;min-height:44px;align-items:center;
                background:var(--color-bg-card);cursor:text;"
                onclick="document.getElementById('crud-deps-inp').focus()">
                ${currentDeps.map(d=>this._depTag(d)).join('')}
                <input id="crud-deps-inp" type="text"
                       placeholder="Clic para buscar tareas..."
                       autocomplete="off"
                       style="border:none;outline:none;font-size:13px;background:transparent;
                              min-width:200px;flex:1;color:var(--color-text-primary);font-family:inherit;">
              </div>
              <div id="crud-deps-dd" style="
                display:none;position:fixed;
                background:var(--color-bg-card);border:1px solid var(--color-border);
                border-radius:var(--radius-md);box-shadow:var(--shadow-lg);
                max-height:240px;overflow-y:auto;z-index:9999;min-width:360px;">
              </div>
            </div>

            <!-- Sub-actividades -->
            <div class="crud-field-group" style="grid-column:1/-1;">
              <label class="crud-label">Sub-actividades
                <span style="font-size:11px;font-weight:400;color:var(--color-text-muted);margin-left:6px;">
                  Lista con estado de completado
                </span>
              </label>
              <div id="crud-acts-list" style="
                display:flex;flex-direction:column;gap:5px;
                border:1px solid var(--color-border);border-radius:var(--radius-md);
                padding:10px;background:var(--color-bg-card);min-height:44px;">
                ${actList.map((a,i)=>{
                  const chk=chkList[i]==='true'||chkList[i]==='1'||(chkList[i]||'').toLowerCase()==='si';
                  return this._actRow(a,chk,i);
                }).join('')}
              </div>
              <div style="display:flex;gap:8px;margin-top:8px;">
                <input id="crud-new-act" class="crud-input" type="text"
                       placeholder="Nueva sub-actividad..."
                       style="flex:1;"
                       onkeydown="if(event.key==='Enter'){event.preventDefault();CrudModal._addAct();}">
                <button class="btn btn-secondary" type="button" onclick="CrudModal._addAct()"
                        style="padding:8px 14px;white-space:nowrap;">+ Agregar</button>
              </div>
            </div>

          </div>
        </div>

        <div class="modal-footer" style="justify-content:space-between;">
          <div>
            ${this.mode==='edit'?`
              <button class="btn" onclick="CrudModal._confirmDelete('${task['ID']}')"
                style="background:rgba(193,48,48,0.1);color:var(--priority-p1);border:1px solid rgba(193,48,48,0.2);">
                Eliminar
              </button>`:''
            }
          </div>
          <div style="display:flex;gap:var(--spacing-sm);">
            <button class="btn btn-secondary" onclick="CrudModal.close()">Cancelar</button>
            <button class="btn btn-primary" onclick="CrudModal.save()">
              ${this.mode==='create'?'Crear Tarea':'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(ov);
    this._setupDeps();
    this._setupModuloNuevo();
    ov.addEventListener('click', e => { if(e.target===ov) this.close(); });
  },

  // ─── Sub-actividades ─────────────────────────────────────────

  _actRow(text, checked, idx) {
    return `
      <div class="crud-act-row" data-idx="${idx}"
           style="display:flex;align-items:center;gap:8px;padding:3px 0;">
        <input type="checkbox" class="act-chk" data-idx="${idx}" ${checked?'checked':''}
               onchange="CrudModal._syncActStyle(${idx},this.checked)"
               style="width:15px;height:15px;accent-color:var(--status-ejecutado);cursor:pointer;flex-shrink:0;">
        <span class="act-txt" style="flex:1;font-size:13px;${checked?'text-decoration:line-through;color:var(--color-text-muted);':'color:var(--color-text-primary);'}">
          ${this._esc(text)}
        </span>
        <button type="button" onclick="CrudModal._removeAct(${idx})"
                style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);font-size:15px;line-height:1;padding:0 3px;">
          &times;
        </button>
      </div>`;
  },

  _syncActStyle(idx, checked) {
    const row = document.querySelector(`.crud-act-row[data-idx="${idx}"] .act-txt`);
    if (row) {
      row.style.textDecoration = checked ? 'line-through' : '';
      row.style.color = checked ? 'var(--color-text-muted)' : 'var(--color-text-primary)';
    }
  },

  _addAct() {
    const inp = document.getElementById('crud-new-act');
    const txt = inp?.value?.trim();
    if (!txt) return;
    const list = document.getElementById('crud-acts-list');
    const idx  = list.querySelectorAll('.crud-act-row').length;
    const div  = document.createElement('div');
    div.innerHTML = this._actRow(txt, false, idx);
    list.appendChild(div.firstElementChild);
    inp.value = ''; inp.focus();
  },

  _removeAct(idx) {
    document.querySelector(`.crud-act-row[data-idx="${idx}"]`)?.remove();
    // Reindexar
    document.querySelectorAll('#crud-acts-list .crud-act-row').forEach((r,i) => {
      r.dataset.idx = i;
      r.querySelector('.act-chk').dataset.idx = i;
      r.querySelector('.act-chk').setAttribute('onchange', `CrudModal._syncActStyle(${i},this.checked)`);
      r.querySelector('button').setAttribute('onclick', `CrudModal._removeAct(${i})`);
    });
  },

  _getActsPayload() {
    const rows = document.querySelectorAll('#crud-acts-list .crud-act-row');
    const acts=[], chks=[];
    rows.forEach(r => {
      const txt = r.querySelector('.act-txt')?.textContent?.trim();
      const chk = r.querySelector('.act-chk')?.checked;
      if (txt) { acts.push(txt); chks.push(chk?'true':'false'); }
    });
    return { actividades: acts.join('|'), check: chks.join('|') };
  },

  // ─── Dependencias ────────────────────────────────────────────

  _depTag(id) {
    const t = STATE.tasks.find(x=>x['ID']===id);
    return `
      <span class="dep-tag" data-dep-id="${id}"
            style="display:inline-flex;align-items:center;gap:6px;background:rgba(44,90,160,0.1);
                   color:var(--color-accent);border-radius:4px;padding:3px 8px;font-size:12px;">
        <span style="font-family:var(--font-mono);font-weight:700;">${id}</span>
        ${t?`<span style="font-weight:400;color:var(--color-text-secondary);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t['Actividad']}</span>`:''}
        <span onclick="CrudModal._removeDep('${id}')" style="cursor:pointer;opacity:.7;font-size:14px;">&times;</span>
      </span>`;
  },

  _removeDep(id) { document.querySelector(`.dep-tag[data-dep-id="${id}"]`)?.remove(); },
  _getCurrentDeps() { return [...document.querySelectorAll('.dep-tag')].map(t=>t.dataset.depId); },

  _setupDeps() {
    const inp  = document.getElementById('crud-deps-inp');
    const dd   = document.getElementById('crud-deps-dd');
    const box  = document.getElementById('crud-deps-box');
    if (!inp) return;

    const show = (q='') => {
      const already = this._getCurrentDeps();
      const ql = q.toLowerCase();
      const matches = STATE.tasks.filter(t => {
        if (!t['ID'] || already.includes(t['ID'])) return false;
        if (!ql) return true;
        return t['ID'].toLowerCase().includes(ql)
            || (t['Actividad']||'').toLowerCase().includes(ql)
            || (t['Módulo']||'').toLowerCase().includes(ql)
            || (t['Responsable']||'').toLowerCase().includes(ql)
            || (t['Estatus']||'').toLowerCase().includes(ql);
      }).slice(0, 25);

      if (!matches.length) { dd.style.display='none'; return; }

      const rect = box.getBoundingClientRect();
      dd.style.top   = `${rect.bottom + 4}px`;
      dd.style.left  = `${rect.left}px`;
      dd.style.width = `${rect.width}px`;
      dd.style.display = 'block';
      dd.innerHTML = matches.map(t => `
        <div onclick="CrudModal._addDep('${t['ID']}')"
             style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--color-border);font-size:13px;"
             onmouseover="this.style.background='var(--color-bg-hover)'"
             onmouseout="this.style.background=''">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
            <span style="font-family:var(--font-mono);font-weight:700;color:var(--color-accent);font-size:12px;">${t['ID']}</span>
            <span class="badge badge-${Utils.getPriorityClass(t['Prioridad'])}" style="font-size:9px;padding:1px 5px;">${t['Prioridad']||''}</span>
            <span class="badge badge-${Utils.getStatusClass(t['Estatus'])}" style="font-size:9px;padding:1px 5px;">${t['Estatus']||''}</span>
          </div>
          <div style="font-size:12px;color:var(--color-text-primary);">${t['Actividad']||''}</div>
          ${t['Módulo']?`<div style="font-size:10px;color:var(--color-text-muted);">${t['Módulo']}</div>`:''}
        </div>`).join('');
    };

    inp.addEventListener('focus', () => show(inp.value.trim()));
    inp.addEventListener('input', () => show(inp.value.trim()));
    inp.addEventListener('keydown', e => { if(e.key==='Escape') dd.style.display='none'; });

    // Cerrar al clic fuera — usar capture en document
    const close = e => {
      if (!dd.contains(e.target) && e.target!==inp && e.target!==box) {
        dd.style.display='none';
      }
    };
    document.addEventListener('click', close);

    // Limpiar listener al cerrar modal
    dd._cleanup = () => document.removeEventListener('click', close);
  },

  _addDep(id) {
    const box = document.getElementById('crud-deps-box');
    const inp = document.getElementById('crud-deps-inp');
    const dd  = document.getElementById('crud-deps-dd');
    if (!box || this._getCurrentDeps().includes(id)) return;
    const sp = document.createElement('span');
    sp.innerHTML = this._depTag(id);
    box.insertBefore(sp.firstElementChild, inp);
    inp.value=''; inp.focus();
    dd.style.display='none';
    // Refresh dropdown (para quitar el elemento ya seleccionado)
    setTimeout(() => this._setupDeps && document.getElementById('crud-deps-inp') && true, 0);
  },

  // ─── Módulo nuevo ──────────────────────────────────────────────

  _setupModuloNuevo() {
    const sel = document.getElementById('crud-modulo');
    const inp = document.getElementById('crud-modulo-nuevo');
    if (!sel || !inp) return;
    sel.addEventListener('change', () => { inp.style.display = sel.value==='__nuevo__'?'block':'none'; });
  },

  // ─── Guardar ───────────────────────────────────────────────────

  async save() {
    const modSel = document.getElementById('crud-modulo');
    let modulo = modSel?.value==='__nuevo__'
      ? document.getElementById('crud-modulo-nuevo')?.value?.trim() : modSel?.value;
    const actividad = document.getElementById('crud-actividad')?.value?.trim();

    if (!modulo || !actividad) { this._toast('Módulo y Actividad son obligatorios','warning'); return; }

    const { actividades, check } = this._getActsPayload();
    const deps = this._getCurrentDeps().join(', ');

    const payload = {
      id:          document.getElementById('crud-id')?.value?.trim()||'',
      modulo, actividad,
      submodulo:   document.getElementById('crud-submodulo')?.value?.trim()||'',
      descripcion: document.getElementById('crud-descripcion')?.value?.trim()||'',
      area:        document.getElementById('crud-area')?.value?.trim()||'',
      responsable: document.getElementById('crud-responsable')?.value?.trim()||'',
      prioridad:   document.getElementById('crud-prioridad')?.value||'P2',
      estatus:     document.getElementById('crud-estatus')?.value||'Pendiente',
      fechaInicio: document.getElementById('crud-fecha-inicio')?.value||'',
      fechaFin:    document.getElementById('crud-fecha-fin')?.value||'',
      progreso:    Number(document.getElementById('crud-progreso')?.value)||0,
      notas:       document.getElementById('crud-notas')?.value?.trim()||'',
      dependencias: deps, actividades, check,
    };

    const btn = document.querySelector('#crud-modal-overlay .btn-primary');
    if (btn) { btn.textContent='Guardando...'; btn.disabled=true; }

    try {
      if (this.mode==='create') { await API.createTask(payload); this._toast('Tarea creada','success'); }
      else                      { await API.updateTask(payload);  this._toast('Tarea actualizada','success'); }
      this.close(); API.clearCache(); await _reloadTasks();
    } catch(err) {
      this._toast('Error: '+err.message,'error');
      if (btn) { btn.textContent=this.mode==='create'?'Crear Tarea':'Guardar Cambios'; btn.disabled=false; }
    }
  },

  // ─── Eliminar ──────────────────────────────────────────────────

  _confirmDelete(id) {
    const ov = document.createElement('div');
    ov.id='crud-confirm-overlay'; ov.className='modal-overlay'; ov.style.cssText='z-index:3000;';
    ov.innerHTML=`
      <div class="modal" style="max-width:420px;">
        <div class="modal-header">
          <h3 class="modal-title" style="color:var(--priority-p1);">Confirmar Eliminación</h3>
          <button class="modal-close" onclick="document.getElementById('crud-confirm-overlay').remove()">&#x2715;</button>
        </div>
        <div class="modal-body">
          <p style="font-size:15px;margin-bottom:12px;">¿Eliminar la tarea <strong>${id}</strong>?</p>
          <p style="font-size:13px;color:var(--color-text-muted);">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('crud-confirm-overlay').remove()">Cancelar</button>
          <button class="btn" id="confirm-del-btn" onclick="CrudModal._execDelete('${id}')"
                  style="background:var(--priority-p1);color:white;">Eliminar</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
  },

  async _execDelete(id) {
    const btn = document.getElementById('confirm-del-btn');
    if (btn) { btn.textContent='Eliminando...'; btn.disabled=true; }
    try {
      await API.deleteTask(id);
      document.getElementById('crud-confirm-overlay')?.remove();
      this.close(); this._toast('Tarea eliminada','success');
      API.clearCache(); await _reloadTasks();
    } catch(err) { this._toast('Error: '+err.message,'error'); }
  },

  close() {
    const dd = document.getElementById('crud-deps-dd');
    dd?._cleanup?.();
    document.getElementById('crud-modal-overlay')?.remove();
    document.getElementById('crud-confirm-overlay')?.remove();
  },

  _toast(msg, type='success') {
    document.getElementById('crud-toast')?.remove();
    const c={success:{bg:'rgba(45,122,62,0.95)',b:'var(--status-ejecutado)'},
              warning:{bg:'rgba(214,137,16,0.95)',b:'var(--status-proceso)'},
              error:{bg:'rgba(193,48,48,0.95)',b:'var(--priority-p1)'}}[type]||{};
    const t=document.createElement('div'); t.id='crud-toast';
    t.style.cssText=`position:fixed;bottom:24px;right:24px;z-index:99999;
      background:${c.bg};color:white;padding:12px 20px;border-radius:var(--radius-md);
      font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.25);
      border-left:4px solid ${c.b};animation:slideUp .25s ease;max-width:360px;`;
    t.textContent=msg; document.body.appendChild(t);
    setTimeout(()=>t.remove(),3500);
  },

  _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },
};

async function _reloadTasks() {
  try {
    const res = await API.fetchTasks();
    if (res.success && res.data) {
      STATE.tasks=res.data; STATE.filteredTasks=res.data;
      Navigation.switchView(STATE.currentView);
    }
  } catch(e) { console.error(e); }
}
