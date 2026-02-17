// ============================================================
// CRUD - Crear, Editar y Eliminar Tareas
// ============================================================

const CrudModal = {
  mode: 'create',  // 'create' | 'edit'
  currentTask: null,

  // ─── Abrir modal de CREAR ───────────────────────────────────────
  openCreate() {
    this.mode = 'create';
    this.currentTask = null;
    this._renderModal({});
  },

  // ─── Abrir modal de EDITAR ─────────────────────────────────────
  openEdit(task) {
    this.mode = 'edit';
    this.currentTask = task;
    this._renderModal(task);
  },

  // ─── Renderizar modal ──────────────────────────────────────────
  _renderModal(task) {
    // Eliminar modal previo si existe
    document.getElementById('crud-modal-overlay')?.remove();

    const modules    = [...new Set(STATE.tasks.map(t => t['Módulo']).filter(Boolean))];
    const allTaskIds = STATE.tasks.map(t => t['ID']).filter(Boolean);

    // Dependencias actuales (puede ser string separado por comas o vacío)
    const currentDeps = task['Dependencias']
      ? String(task['Dependencias']).split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const overlay = document.createElement('div');
    overlay.id = 'crud-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'z-index:2000;';
    overlay.innerHTML = `
      <div class="modal" style="max-width:780px;width:95%;">
        <div class="modal-header">
          <h3 class="modal-title">
            ${this.mode === 'create' ? '+ Nueva Tarea' : '✎ Editar Tarea'}
          </h3>
          <button class="modal-close" onclick="CrudModal.close()">✕</button>
        </div>

        <div class="modal-body" style="padding:var(--spacing-lg);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-md);">

            <!-- ID (solo lectura en edit) -->
            <div class="crud-field-group">
              <label class="crud-label">ID</label>
              <input id="crud-id" class="crud-input" type="text"
                     value="${task['ID'] || ''}"
                     ${this.mode === 'edit' ? 'readonly style="opacity:.5;cursor:not-allowed;"' : ''}
                     placeholder="Ej: TSK-0001">
            </div>

            <!-- Módulo -->
            <div class="crud-field-group">
              <label class="crud-label">Módulo <span style="color:var(--priority-p1)">*</span></label>
              <select id="crud-modulo" class="crud-input">
                <option value="">-- Seleccionar --</option>
                ${modules.map(m => `<option value="${m}" ${task['Módulo']===m?'selected':''}>${m}</option>`).join('')}
                <option value="__nuevo__">+ Nuevo módulo...</option>
              </select>
              <input id="crud-modulo-nuevo" class="crud-input" type="text"
                     placeholder="Nombre del nuevo módulo"
                     style="margin-top:6px;display:none;">
            </div>

            <!-- Actividad - ancho completo -->
            <div class="crud-field-group" style="grid-column:1/-1;">
              <label class="crud-label">Actividad <span style="color:var(--priority-p1)">*</span></label>
              <input id="crud-actividad" class="crud-input" type="text"
                     value="${this._esc(task['Actividad'] || '')}"
                     placeholder="Nombre de la actividad">
            </div>

            <!-- Descripción - ancho completo -->
            <div class="crud-field-group" style="grid-column:1/-1;">
              <label class="crud-label">Descripción</label>
              <textarea id="crud-descripcion" class="crud-input"
                        rows="3" placeholder="Descripción detallada..."
                        style="resize:vertical;">${this._esc(task['Descripción'] || '')}</textarea>
            </div>

            <!-- Responsable -->
            <div class="crud-field-group">
              <label class="crud-label">Responsable</label>
              <input id="crud-responsable" class="crud-input" type="text"
                     value="${this._esc(task['Responsable'] || '')}"
                     placeholder="Nombre del responsable">
            </div>

            <!-- Prioridad -->
            <div class="crud-field-group">
              <label class="crud-label">Prioridad <span style="color:var(--priority-p1)">*</span></label>
              <select id="crud-prioridad" class="crud-input">
                ${['P1','P2','P3'].map(p =>
                  `<option value="${p}" ${(task['Prioridad']||'P2')===p?'selected':''}>${p}</option>`
                ).join('')}
              </select>
            </div>

            <!-- Estatus -->
            <div class="crud-field-group">
              <label class="crud-label">Estatus <span style="color:var(--priority-p1)">*</span></label>
              <select id="crud-estatus" class="crud-input">
                ${['Pendiente','En Proceso','Ejecutado'].map(s =>
                  `<option value="${s}" ${(task['Estatus']||'Pendiente')===s?'selected':''}>${s}</option>`
                ).join('')}
              </select>
            </div>

            <!-- SubMódulo -->
            <div class="crud-field-group">
              <label class="crud-label">SubMódulo</label>
              <input id="crud-submodulo" class="crud-input" type="text"
                     value="${this._esc(task['SubModulo'] || '')}"
                     placeholder="SubMódulo opcional">
            </div>

            <!-- Fecha Inicio -->
            <div class="crud-field-group">
              <label class="crud-label">Fecha Inicio</label>
              <input id="crud-fecha-inicio" class="crud-input" type="date"
                     value="${task['Fecha Inicio'] || ''}">
            </div>

            <!-- Fecha Fin -->
            <div class="crud-field-group">
              <label class="crud-label">Fecha Fin</label>
              <input id="crud-fecha-fin" class="crud-input" type="date"
                     value="${task['Fecha Fin'] || ''}">
            </div>

            <!-- Progreso -->
            <div class="crud-field-group">
              <label class="crud-label">Progreso % <span id="crud-progreso-display"
                style="color:var(--color-accent);font-weight:700;">${task['Progreso %'] || 0}%</span></label>
              <input id="crud-progreso" class="crud-input" type="range"
                     min="0" max="100" value="${task['Progreso %'] || 0}"
                     style="padding:8px 0;"
                     oninput="document.getElementById('crud-progreso-display').textContent=this.value+'%'">
            </div>

            <!-- Notas - ancho completo -->
            <div class="crud-field-group" style="grid-column:1/-1;">
              <label class="crud-label">Notas</label>
              <textarea id="crud-notas" class="crud-input"
                        rows="2" placeholder="Notas adicionales..."
                        style="resize:vertical;">${this._esc(task['Notas'] || '')}</textarea>
            </div>

            <!-- Dependencias - ancho completo -->
            <div class="crud-field-group" style="grid-column:1/-1;">
              <label class="crud-label">Dependencias
                <span style="font-size:11px;font-weight:400;color:var(--color-text-muted);margin-left:6px;">
                  (Relacionar con otras tareas por ID)
                </span>
              </label>
              <div id="crud-deps-tags" style="
                display:flex;flex-wrap:wrap;gap:6px;
                border:1px solid var(--color-border);border-radius:var(--radius-md);
                padding:8px;min-height:42px;align-items:center;
                background:var(--color-bg-card);cursor:text;"
                onclick="document.getElementById('crud-deps-input').focus()">
                ${currentDeps.map(dep => this._depTag(dep)).join('')}
                <input id="crud-deps-input" type="text"
                       placeholder="${currentDeps.length ? '' : 'Buscar ID de tarea...'}"
                       autocomplete="off"
                       style="border:none;outline:none;font-size:13px;
                              background:transparent;min-width:150px;flex:1;
                              color:var(--color-text-primary);font-family:inherit;">
              </div>
              <!-- Dropdown sugerencias -->
              <div id="crud-deps-dropdown" style="
                display:none;position:absolute;
                background:var(--color-bg-card);
                border:1px solid var(--color-border);
                border-radius:var(--radius-md);
                box-shadow:var(--shadow-lg);
                max-height:200px;overflow-y:auto;
                z-index:3000;min-width:300px;">
              </div>
            </div>

          </div>
        </div>

        <div class="modal-footer" style="justify-content:space-between;">
          <div>
            ${this.mode === 'edit' ? `
              <button class="btn" onclick="CrudModal._confirmDelete('${task['ID']}')"
                style="background:rgba(193,48,48,0.1);color:var(--priority-p1);
                       border:1px solid rgba(193,48,48,0.2);">
                🗑 Eliminar
              </button>
            ` : ''}
          </div>
          <div style="display:flex;gap:var(--spacing-sm);">
            <button class="btn btn-secondary" onclick="CrudModal.close()">Cancelar</button>
            <button class="btn btn-primary" onclick="CrudModal.save()">
              ${this.mode === 'create' ? '+ Crear Tarea' : '✔ Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this._setupDepsInput(allTaskIds, currentDeps);
    this._setupModuloNuevo();

    // Cerrar al click fuera
    overlay.addEventListener('click', e => {
      if (e.target === overlay) this.close();
    });
  },

  // ─── Tag visual de dependencia ─────────────────────────────────
  _depTag(id) {
    return `
      <span class="dep-tag" data-dep-id="${id}"
            style="display:inline-flex;align-items:center;gap:4px;
                   background:rgba(44,90,160,0.12);color:var(--color-accent);
                   border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600;
                   font-family:var(--font-mono);">
        ${id}
        <span onclick="CrudModal._removeDep('${id}')"
              style="cursor:pointer;opacity:.7;font-size:14px;line-height:1;
                     margin-left:2px;">&times;</span>
      </span>`;
  },

  _removeDep(id) {
    document.querySelector(`.dep-tag[data-dep-id="${id}"]`)?.remove();
  },

  _getCurrentDeps() {
    return [...document.querySelectorAll('.dep-tag')].map(t => t.dataset.depId);
  },

  // ─── Dropdown de búsqueda de dependencias ──────────────────────
  _setupDepsInput(allIds, currentDeps) {
    const input    = document.getElementById('crud-deps-input');
    const dropdown = document.getElementById('crud-deps-dropdown');
    const tagsBox  = document.getElementById('crud-deps-tags');

    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const already = this._getCurrentDeps();
      const matches = allIds.filter(id =>
        id.toLowerCase().includes(q) && !already.includes(id)
      );
      if (!q || !matches.length) { dropdown.style.display = 'none'; return; }

      // Posicionar dropdown justo debajo del tag box
      const rect = tagsBox.getBoundingClientRect();
      dropdown.style.top  = `${rect.bottom + window.scrollY + 4}px`;
      dropdown.style.left = `${rect.left + window.scrollX}px`;
      dropdown.style.width = `${rect.width}px`;
      dropdown.style.display = 'block';
      dropdown.innerHTML = matches.slice(0, 20).map(id => {
        const t = STATE.tasks.find(x => x['ID'] === id);
        return `
          <div onclick="CrudModal._addDep('${id}')"
               style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--color-border);
                      font-size:13px;display:flex;flex-direction:column;gap:2px;
                      transition:background var(--transition-fast);"
               onmouseover="this.style.background='var(--color-bg-hover)'"
               onmouseout="this.style.background=''">
            <span style="font-family:var(--font-mono);font-weight:700;color:var(--color-accent);">${id}</span>
            ${t ? `<span style="font-size:11px;color:var(--color-text-muted);">${t['Actividad']}</span>` : ''}
          </div>`;
      }).join('');
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = input.value.trim().replace(',','');
        if (val && allIds.includes(val) && !this._getCurrentDeps().includes(val)) {
          this._addDep(val);
        }
      }
    });

    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
      }
    }, { once: false });
  },

  _addDep(id) {
    const tagsBox = document.getElementById('crud-deps-tags');
    const input   = document.getElementById('crud-deps-input');
    const dropdown = document.getElementById('crud-deps-dropdown');
    if (!tagsBox || this._getCurrentDeps().includes(id)) return;

    const tag = document.createElement('span');
    tag.innerHTML = this._depTag(id);
    tagsBox.insertBefore(tag.firstElementChild, input);
    if (input) { input.value = ''; }
    if (dropdown) { dropdown.style.display = 'none'; }
  },

  // ─── Módulo nuevo ──────────────────────────────────────────────
  _setupModuloNuevo() {
    const sel   = document.getElementById('crud-modulo');
    const input = document.getElementById('crud-modulo-nuevo');
    if (!sel || !input) return;
    sel.addEventListener('change', () => {
      input.style.display = sel.value === '__nuevo__' ? 'block' : 'none';
    });
  },

  // ─── Guardar (crear o editar) ──────────────────────────────────
  async save() {
    const modSelect = document.getElementById('crud-modulo');
    let modulo = modSelect?.value === '__nuevo__'
      ? document.getElementById('crud-modulo-nuevo')?.value?.trim()
      : modSelect?.value;

    const actividad = document.getElementById('crud-actividad')?.value?.trim();

    if (!modulo || !actividad) {
      this._toast('⚠ Módulo y Actividad son obligatorios', 'warning');
      return;
    }

    const deps = this._getCurrentDeps().join(', ');

    const payload = {
      id:           document.getElementById('crud-id')?.value?.trim() || '',
      modulo,
      submodulo:    document.getElementById('crud-submodulo')?.value?.trim() || '',
      actividad,
      descripcion:  document.getElementById('crud-descripcion')?.value?.trim() || '',
      responsable:  document.getElementById('crud-responsable')?.value?.trim() || '',
      prioridad:    document.getElementById('crud-prioridad')?.value || 'P2',
      estatus:      document.getElementById('crud-estatus')?.value   || 'Pendiente',
      fechaInicio:  document.getElementById('crud-fecha-inicio')?.value || '',
      fechaFin:     document.getElementById('crud-fecha-fin')?.value   || '',
      progreso:     Number(document.getElementById('crud-progreso')?.value) || 0,
      notas:        document.getElementById('crud-notas')?.value?.trim() || '',
      dependencias: deps,
    };

    const saveBtn = document.querySelector('#crud-modal-overlay .btn-primary');
    if (saveBtn) { saveBtn.textContent = 'Guardando...'; saveBtn.disabled = true; }

    try {
      if (this.mode === 'create') {
        await API.createTask(payload);
        this._toast('✔ Tarea creada correctamente', 'success');
      } else {
        await API.updateTask(payload);
        this._toast('✔ Tarea actualizada correctamente', 'success');
      }
      this.close();
      API.clearCache();
      await _reloadTasks();
    } catch (err) {
      this._toast('✖ Error al guardar: ' + err.message, 'error');
      if (saveBtn) { saveBtn.textContent = this.mode === 'create' ? '+ Crear Tarea' : '✔ Guardar Cambios'; saveBtn.disabled = false; }
    }
  },

  // ─── Confirmar eliminación ─────────────────────────────────────
  _confirmDelete(id) {
    const overlay = document.createElement('div');
    overlay.id = 'crud-confirm-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'z-index:3000;';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="modal-header">
          <h3 class="modal-title" style="color:var(--priority-p1);">⚠ Confirmar Eliminación</h3>
          <button class="modal-close" onclick="document.getElementById('crud-confirm-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size:15px;margin-bottom:var(--spacing-md);">
            ¿Estás seguro de que quieres eliminar la tarea <strong>${id}</strong>?
          </p>
          <p style="font-size:13px;color:var(--color-text-muted);">
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary"
                  onclick="document.getElementById('crud-confirm-overlay').remove()">
            Cancelar
          </button>
          <button class="btn" id="confirm-delete-btn"
                  onclick="CrudModal._executeDelete('${id}')"
                  style="background:var(--priority-p1);color:white;">
            Sí, eliminar
          </button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  },

  async _executeDelete(id) {
    const btn = document.getElementById('confirm-delete-btn');
    if (btn) { btn.textContent = 'Eliminando...'; btn.disabled = true; }
    try {
      await API.deleteTask(id);
      document.getElementById('crud-confirm-overlay')?.remove();
      this.close();
      this._toast('🗑 Tarea eliminada', 'success');
      API.clearCache();
      await _reloadTasks();
    } catch (err) {
      this._toast('✖ Error al eliminar: ' + err.message, 'error');
    }
  },

  // ─── Cerrar ────────────────────────────────────────────────────
  close() {
    document.getElementById('crud-modal-overlay')?.remove();
    document.getElementById('crud-confirm-overlay')?.remove();
  },

  // ─── Toast ─────────────────────────────────────────────────────
  _toast(msg, type = 'success') {
    document.getElementById('crud-toast')?.remove();
    const colors = {
      success: { bg: 'rgba(45,122,62,0.95)', border: 'var(--status-ejecutado)' },
      warning: { bg: 'rgba(214,137,16,0.95)', border: 'var(--status-proceso)'  },
      error:   { bg: 'rgba(193,48,48,0.95)',  border: 'var(--priority-p1)'     },
    };
    const c = colors[type] || colors.success;
    const toast = document.createElement('div');
    toast.id = 'crud-toast';
    toast.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:99999;
      background:${c.bg};color:white;
      padding:12px 20px;border-radius:var(--radius-md);
      font-size:14px;font-weight:600;
      box-shadow:0 4px 20px rgba(0,0,0,0.25);
      border-left:4px solid ${c.border};
      animation:slideUp .25s ease;
      max-width:360px;`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },

  // ─── Escape HTML ───────────────────────────────────────────────
  _esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
};

// ============================================================
// Recargar tareas y refrescar la vista actual
// ============================================================
async function _reloadTasks() {
  try {
    const response = await API.fetchTasks();
    if (response.success && response.data) {
      STATE.tasks = response.data;
      STATE.filteredTasks = response.data;
      Navigation.switchView(STATE.currentView);
    }
  } catch (e) {
    console.error('Error recargando tareas:', e);
  }
}
