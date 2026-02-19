// ============================================================
// GANTT VIEW — Timeline Ejecutivo
// Mes actual por defecto · Escala semanal predeterminada
// Header: fila de mes encima + fila de números de día
// ============================================================

const GanttView = {
  currentFilters: { module: '', search: '', status: '' },
  viewMode: 'current',        // 'current' | 'full' | 'custom'
  monthRange: { from: '', to: '' },
  tickMode: 'weeks',          // ★ Predeterminado: semanas
  _expanded: false,

  _moduleColors: [
    { bg:'#F59E0B', text:'#fff', barBg:'#FDE68A', barText:'#78350F', dot:'#78350F' },
    { bg:'#6366F1', text:'#fff', barBg:'#C7D2FE', barText:'#3730A3', dot:'#3730A3' },
    { bg:'#3B82F6', text:'#fff', barBg:'#BFDBFE', barText:'#1E3A8A', dot:'#1E3A8A' },
    { bg:'#EC4899', text:'#fff', barBg:'#FBCFE8', barText:'#9D174D', dot:'#9D174D' },
    { bg:'#10B981', text:'#fff', barBg:'#A7F3D0', barText:'#064E3B', dot:'#064E3B' },
    { bg:'#8B5CF6', text:'#fff', barBg:'#DDD6FE', barText:'#4C1D95', dot:'#4C1D95' },
    { bg:'#EF4444', text:'#fff', barBg:'#FECACA', barText:'#7F1D1D', dot:'#7F1D1D' },
  ],
  _moduleColorsDark: [
    { bg:'#D97706', text:'#fff', barBg:'#92400E', barText:'#FDE68A', dot:'#FDE68A' },
    { bg:'#4F46E5', text:'#fff', barBg:'#312E81', barText:'#C7D2FE', dot:'#C7D2FE' },
    { bg:'#2563EB', text:'#fff', barBg:'#1E3A8A', barText:'#BFDBFE', dot:'#BFDBFE' },
    { bg:'#DB2777', text:'#fff', barBg:'#831843', barText:'#FBCFE8', dot:'#FBCFE8' },
    { bg:'#059669', text:'#fff', barBg:'#064E3B', barText:'#A7F3D0', dot:'#A7F3D0' },
    { bg:'#7C3AED', text:'#fff', barBg:'#4C1D95', barText:'#DDD6FE', dot:'#DDD6FE' },
    { bg:'#DC2626', text:'#fff', barBg:'#7F1D1D', barText:'#FECACA', dot:'#FECACA' },
  ],

  _parseDate(str) {
    if (!str) return null;
    const d = new Date(str);
    if (isNaN(d) || d.getFullYear() < 2024 || d.getFullYear() > 2030) return null;
    return d;
  },

  _buildMonthOptions() {
    const today = new Date();
    const opts = [];
    for (let i = -6; i <= 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      opts.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return opts;
  },

  _calcRange() {
    const today = new Date();

    if (this.viewMode === 'custom' && (this.monthRange.from || this.monthRange.to)) {
      let minDate, maxDate;
      if (this.monthRange.from) {
        const [y, m] = this.monthRange.from.split('-').map(Number);
        minDate = new Date(y, m - 1, 1);
      } else {
        minDate = new Date(today.getFullYear(), today.getMonth(), 1);
      }
      if (this.monthRange.to) {
        const [y, m] = this.monthRange.to.split('-').map(Number);
        maxDate = new Date(y, m, 0);
      } else {
        maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
      return { minDate, maxDate };
    }

    if (this.viewMode === 'full') {
      const dates = [];
      STATE.tasks.forEach(t => {
        const fi = this._parseDate(t['Fecha Inicio']);
        const ff = this._parseDate(t['Fecha Fin']);
        if (fi) dates.push(fi);
        if (ff) dates.push(ff);
      });
      if (dates.length) {
        let minDate = new Date(Math.min(...dates));
        let maxDate = new Date(Math.max(...dates));
        minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
        return { minDate, maxDate };
      }
    }

    // ★ 'current' = solo el MES ACTUAL (primer día → último día)
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { minDate, maxDate };
  },

  // ★ _buildTicks: para 'weeks' genera lunes de cada semana dentro del rango
  _buildTicks(minDate, maxDate) {
    const ticks = [];
    const totalDays = Math.round((maxDate - minDate) / 864e5) + 1;

    if (this.tickMode === 'days') {
      const cur = new Date(minDate);
      while (cur <= maxDate) { ticks.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    } else if (this.tickMode === 'weeks') {
      // Arrancar desde el lunes de la semana que contiene minDate
      const cur = new Date(minDate);
      const dow = cur.getDay(); // 0=dom,1=lun,...
      cur.setDate(cur.getDate() - (dow === 0 ? 6 : dow - 1)); // retroceder al lunes
      while (cur <= maxDate) { ticks.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
    } else {
      // months
      const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      while (cur <= maxDate) { ticks.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }
    }

    return { ticks, totalDays };
  },

  // ★ Para días: solo devuelve el número; para semanas: número del día inicio semana
  // El mes se renderiza en una fila separada encima
  _fmtTickDay(d) {
    return String(d.getDate()); // solo número
  },

  _fmtTickWeek(d) {
    // "Sem N · DD"
    return String(d.getDate());
  },

  _fmtTick(d) {
    if (this.tickMode === 'months') {
      const s = d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    return this._fmtTickDay(d);
  },

  toggleExpand() {
    this._expanded = !this._expanded;
    STATE.isExpanded = this._expanded;
    document.body.classList.toggle('view-expanded', this._expanded);
    this.render();
  },

  _isDark() {
    return document.body.classList.contains('dark-theme')
        || document.body.classList.contains('dark')
        || document.documentElement.getAttribute('data-theme') === 'dark';
  },

  _injectStyles() {
    const existing = document.getElementById('gantt-exec-styles');
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = 'gantt-exec-styles';
    style.textContent = `
      .gtl-wrap { font-size: 13px; user-select: none; }

      /* ── DOBLE HEADER: fila de mes + fila de días/semanas ── */
      .gtl-header {
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid var(--color-border, #E5E7EB);
        position: sticky;
        top: 0;
        z-index: 20;
        background: var(--color-bg-main, #fff);
      }
      .gtl-header-row {
        display: flex;
        align-items: stretch;
      }
      .gtl-header-label {
        min-width: 240px;
        width: 240px;
        padding: 0 16px;
        font-size: 12px;
        font-weight: 700;
        color: var(--color-text-muted);
        display: flex;
        align-items: center;
        flex-shrink: 0;
        border-right: 1px solid var(--color-border);
      }
      /* Fila de MES (encima) */
      .gtl-month-row-ticks {
        flex: 1;
        position: relative;
        height: 22px;
        border-bottom: 1px solid var(--color-border, #E5E7EB);
        overflow: hidden;
      }
      .gtl-month-lbl {
        position: absolute;
        top: 0; bottom: 0;
        display: flex;
        align-items: center;
        padding-left: 6px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .04em;
        color: var(--color-text-muted);
        white-space: nowrap;
        pointer-events: none;
        border-left: 1px solid var(--color-border);
      }
      /* Fila de DÍA/SEMANA (abajo) */
      .gtl-header-ticks {
        flex: 1;
        position: relative;
        height: 30px;
        overflow: hidden;
      }
      .gtl-tick-lbl {
        position: absolute;
        top: 0; bottom: 0;
        display: flex;
        align-items: center;
        padding-left: 5px;
      }
      .gtl-tick-lbl span {
        font-size: 11px;
        font-weight: 500;
        color: var(--color-text-muted);
        white-space: nowrap;
      }
      .gtl-tick-lbl.is-today span { font-weight: 700; }
      .gtl-tick-sep {
        position: absolute;
        top: 0; bottom: 0;
        width: 1px;
        background: var(--color-border);
        opacity: .5;
        pointer-events: none;
      }

      /* ── Línea de hoy ── */
      .gtl-today-line {
        position: absolute;
        top: 0; bottom: 0;
        width: 2px;
        border-radius: 1px;
        z-index: 10;
        pointer-events: none;
      }

      /* ── Grupo ── */
      .gtl-group-header {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid var(--color-border, #E5E7EB);
        min-height: 38px;
      }
      .gtl-group-label-cell {
        min-width: 240px;
        width: 240px;
        padding: 6px 16px;
        display: flex;
        align-items: center;
        flex-shrink: 0;
        border-right: 1px solid var(--color-border);
      }
      .gtl-group-pill {
        display: inline-block;
        padding: 4px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }
      .gtl-group-timeline {
        flex: 1;
        position: relative;
        min-height: 38px;
      }

      /* ── Fila de tarea ── */
      .gtl-task-row {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid var(--color-border, #E5E7EB);
        min-height: 42px;
        transition: background 0.1s;
      }
      .gtl-task-row:hover { background: var(--color-bg-hover, rgba(0,0,0,0.03)); }
      .gtl-task-label-cell {
        min-width: 240px;
        width: 240px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        font-size: 12px;
        color: var(--color-text-primary);
        font-weight: 400;
        flex-shrink: 0;
        line-height: 1.35;
        border-right: 1px solid var(--color-border);
      }
      .gtl-task-timeline {
        flex: 1;
        position: relative;
        overflow: visible;
      }

      /* ── Barra ── */
      .gtl-bar-wrap {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        height: 24px;
        cursor: pointer;
        z-index: 2;
        padding-right: 10px;
      }
      .gtl-bar {
        height: 100%;
        border-radius: 5px;
        display: flex;
        align-items: center;
        padding: 0 10px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: opacity 0.15s;
        position: relative;
        width: 100%;
      }
      .gtl-bar-wrap:hover .gtl-bar { opacity: 0.82; }
      .gtl-dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        position: absolute; right: -5px; top: 50%;
        transform: translateY(-50%);
        z-index: 3;
        border: 2px solid var(--color-bg-main, #fff);
        flex-shrink: 0;
      }

      /* ── Tooltip ── */
      .gtl-tooltip {
        position: fixed; z-index: 9999;
        pointer-events: none;
        opacity: 0; transform: translateY(4px);
        transition: opacity 0.15s, transform 0.15s;
        width: 260px;
      }
      .gtl-tooltip.visible { opacity: 1; transform: translateY(0); }
      .gtl-tooltip-inner {
        background: var(--color-bg-card, #fff);
        border: 1px solid var(--color-border, #E5E7EB);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.18);
        overflow: hidden;
        font-size: 12px;
      }
      .gtl-tt-head { padding: 10px 14px 8px; border-bottom: 1px solid var(--color-border); border-left-width: 3px; border-left-style: solid; }
      .gtl-tt-title { font-size: 13px; font-weight: 600; color: var(--color-text-primary); line-height: 1.3; margin-bottom: 2px; }
      .gtl-tt-id { font-size: 10px; color: var(--color-text-muted); }
      .gtl-tt-body { padding: 9px 14px; display: flex; flex-direction: column; gap: 5px; }
      .gtl-tt-row { display: flex; align-items: baseline; gap: 8px; }
      .gtl-tt-lbl { min-width: 74px; font-size: 10.5px; color: var(--color-text-muted); flex-shrink: 0; }
      .gtl-tt-val { font-size: 12px; font-weight: 500; color: var(--color-text-primary); line-height: 1.3; }
      .gtl-tt-desc { font-size: 11px; color: var(--color-text-muted); line-height: 1.5; padding-top: 6px; margin-top: 2px; border-top: 1px solid var(--color-border); }

      /* ── Sidebar ── */
      .gtl-sidebar-section { padding-top: 12px; border-top: 1px solid var(--color-border); margin-top: 12px; }
      .gtl-sidebar-section-title { font-size: 10px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 8px; }
      .gtl-btn-group { display: flex; gap: 4px; flex-wrap: wrap; }

      /* ── Layout ── */
      .gantt-layout { display: flex; gap: 0; height: 100%; }
      .gantt-sidebar { width: 220px; min-width: 220px; padding: 20px 16px; border-right: 1px solid var(--color-border); overflow-y: auto; flex-shrink: 0; }
      .gantt-main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; padding: 0 0 0 16px; }
      .gantt-container { overflow: auto; flex: 1; }
    `;
    document.head.appendChild(style);
  },

  render() {
    const container = document.getElementById('gantt-chart');
    if (!container) return;

    this._injectStyles();

    if (!document.getElementById('gtl-tooltip')) {
      const tip = document.createElement('div');
      tip.id = 'gtl-tooltip';
      tip.className = 'gtl-tooltip';
      tip.innerHTML = '<div class="gtl-tooltip-inner"></div>';
      document.body.appendChild(tip);
    }

    let filteredTasks = STATE.tasks.filter(task => {
      if (!this._parseDate(task['Fecha Inicio'])) return false;
      if (!this._parseDate(task['Fecha Fin']))    return false;
      if (this.currentFilters.module && task['Módulo'] !== this.currentFilters.module) return false;
      if (this.currentFilters.status && task['Estatus'] !== this.currentFilters.status) return false;
      if (this.currentFilters.search) {
        const q = this.currentFilters.search.toLowerCase();
        if (!Object.values(task).some(v => v && String(v).toLowerCase().includes(q))) return false;
      }
      return true;
    });

    filteredTasks.sort((a, b) =>
      this._parseDate(a['Fecha Inicio']) - this._parseDate(b['Fecha Inicio'])
    );

    const { minDate, maxDate } = this._calcRange();
    const { ticks, totalDays } = this._buildTicks(minDate, maxDate);
    const moduleList = [...new Set(STATE.tasks.map(t => t['Módulo']).filter(Boolean))];
    const statusSet  = new Set(STATE.tasks.map(t => t['Estatus']).filter(s => s && s !== '-'));
    const monthOpts  = this._buildMonthOptions();
    const isExp      = this._expanded;
    const dark       = this._isDark();
    const palette    = dark ? this._moduleColorsDark : this._moduleColors;
    const todayColor = dark ? '#34D399' : '#10B981';

    const moduleColorMap = {};
    moduleList.forEach((m, i) => { moduleColorMap[m] = palette[i % palette.length]; });

    const grouped = {};
    filteredTasks.forEach(t => {
      const mod = t['Módulo'] || '(Sin módulo)';
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(t);
    });

    const tickBtn = (mode, label) =>
      `<button class="btn ${this.tickMode===mode?'btn-primary':'btn-secondary'}"
               onclick="GanttView.setTickMode('${mode}')"
               style="padding:4px 10px;font-size:11px;flex:1;">${label}</button>`;

    container.innerHTML = `
      <div class="gantt-layout ${isExp ? 'gantt-expanded' : ''}">

        ${!isExp ? `
        <div class="gantt-sidebar">
          <h3 style="margin:0 0 var(--spacing-lg) 0;font-size:11px;font-weight:700;
                     letter-spacing:.07em;text-transform:uppercase;color:var(--color-text-muted);">
            Filtros
          </h3>

          <div class="filter-group" style="margin-bottom:var(--spacing-md);">
            <label class="filter-label">Módulo</label>
            <select id="gtl-filter-module" class="filter-select">
              <option value="">Todos los módulos</option>
              ${moduleList.map(m =>
                `<option value="${m}" ${this.currentFilters.module===m?'selected':''}>${m}</option>`
              ).join('')}
            </select>
          </div>

          <div class="filter-group" style="margin-bottom:var(--spacing-md);">
            <label class="filter-label">Estatus</label>
            <select id="gtl-filter-status" class="filter-select">
              <option value="">Todos los estatus</option>
              ${[...statusSet].map(s =>
                `<option value="${s}" ${this.currentFilters.status===s?'selected':''}>${s}</option>`
              ).join('')}
            </select>
          </div>

          <div class="filter-group" style="margin-bottom:var(--spacing-md);">
            <label class="filter-label">Buscar</label>
            <input type="text" id="gtl-search" class="filter-select"
                   placeholder="Buscar..." value="${this.currentFilters.search}"
                   style="color:var(--color-text-primary)!important;background:var(--color-bg-card)!important;">
          </div>

          <button class="btn btn-secondary" onclick="GanttView.clearFilters()"
                  style="width:100%;margin-bottom:var(--spacing-md);">
            Limpiar Filtros
          </button>

          <!-- Vista -->
          <div class="gtl-sidebar-section">
            <div class="gtl-sidebar-section-title">Vista</div>
            <div class="gtl-btn-group">
              <button class="btn ${this.viewMode==='current'?'btn-primary':'btn-secondary'}"
                      onclick="GanttView.setViewMode('current')"
                      style="padding:4px 10px;font-size:11px;flex:1;">Mes actual</button>
              <button class="btn ${this.viewMode==='full'?'btn-primary':'btn-secondary'}"
                      onclick="GanttView.setViewMode('full')"
                      style="padding:4px 10px;font-size:11px;flex:1;">Completa</button>
            </div>
          </div>

          <!-- Escala -->
          <div class="gtl-sidebar-section">
            <div class="gtl-sidebar-section-title">Escala</div>
            <div class="gtl-btn-group">
              ${tickBtn('days',   'Días')}
              ${tickBtn('weeks',  'Semanas')}
              ${tickBtn('months', 'Meses')}
            </div>
          </div>

          <!-- Rango personalizado -->
          <div class="gtl-sidebar-section">
            <div class="gtl-sidebar-section-title">Rango personalizado</div>
            <div class="filter-group" style="margin-bottom:8px;">
              <label class="filter-label">Desde</label>
              <select id="gtl-month-from" class="filter-select" style="font-size:12px;">
                <option value="">-- mes --</option>
                ${monthOpts.map(o =>
                  `<option value="${o.value}" ${this.monthRange.from===o.value?'selected':''}>${o.label}</option>`
                ).join('')}
              </select>
            </div>
            <div class="filter-group" style="margin-bottom:8px;">
              <label class="filter-label">Hasta</label>
              <select id="gtl-month-to" class="filter-select" style="font-size:12px;">
                <option value="">-- mes --</option>
                ${monthOpts.map(o =>
                  `<option value="${o.value}" ${this.monthRange.to===o.value?'selected':''}>${o.label}</option>`
                ).join('')}
              </select>
            </div>
            <button class="btn btn-secondary" onclick="GanttView.clearMonthRange()"
                    style="width:100%;padding:4px 10px;font-size:11px;">
              Limpiar rango
            </button>
          </div>

          <div style="padding-top:var(--spacing-md);margin-top:var(--spacing-md);
                      border-top:1px solid var(--color-border);">
            <div style="font-size:11px;color:var(--color-text-muted);">
              ${filteredTasks.length} tareas mostradas
            </div>
          </div>
        </div>
        ` : ''}

        <!-- ÁREA PRINCIPAL -->
        <div class="gantt-main-area">
          <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-secondary" onclick="GanttView.toggleExpand()"
                    style="display:flex;align-items:center;gap:6px;padding:5px 12px;font-size:12px;">
              ${isExp
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                     <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                     <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                   </svg> Salir`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                     <path d="M3 7V3h4"/><path d="M21 7V3h-4"/>
                     <path d="M3 17v4h4"/><path d="M21 17v4h-4"/>
                   </svg> Expandir`}
            </button>
          </div>

          <div class="gantt-container">
            <div style="min-width:600px;">
              ${filteredTasks.length
                ? this._renderTimeline(grouped, moduleColorMap, minDate, maxDate, totalDays, ticks, todayColor)
                : `<div style="padding:48px;text-align:center;color:var(--color-text-muted);font-size:13px;">
                     No hay tareas con fechas válidas para el rango seleccionado.
                   </div>`}
            </div>
          </div>
        </div>

      </div>`;

    // Listeners
    document.getElementById('gtl-filter-module')?.addEventListener('change', e => {
      this.currentFilters.module = e.target.value; this.render();
    });
    document.getElementById('gtl-filter-status')?.addEventListener('change', e => {
      this.currentFilters.status = e.target.value; this.render();
    });
    document.getElementById('gtl-search')?.addEventListener('input',
      Utils.debounce(e => { this.currentFilters.search = e.target.value; this.render(); }, 300)
    );
    document.getElementById('gtl-month-from')?.addEventListener('change', e => {
      this.monthRange.from = e.target.value; this.viewMode = 'custom'; this.render();
    });
    document.getElementById('gtl-month-to')?.addEventListener('change', e => {
      this.monthRange.to = e.target.value; this.viewMode = 'custom'; this.render();
    });
  },

  _pct(date, minDate, totalDays) {
    return Math.max(0, Math.min(100, ((date - minDate) / 864e5) / totalDays * 100));
  },

  // Construye segmentos de mes para la fila superior del header
  // Basado en los límites reales del rango (no en los ticks de semana)
  _buildMonthSegments(minDate, maxDate, totalDays) {
    const segments = [];
    // Iterar mes a mes dentro del rango
    let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cur <= maxDate) {
      const monthStart = new Date(Math.max(cur, minDate));
      const monthEnd   = new Date(cur.getFullYear(), cur.getMonth() + 1, 0); // último día del mes
      const leftPct    = this._pct(monthStart, minDate, totalDays);
      const rightPct   = Math.min(100, this._pct(new Date(Math.min(monthEnd, maxDate)), minDate, totalDays));
      const width      = Math.max(0, rightPct - leftPct);
      const rawLabel   = cur.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      const label      = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
      if (width > 0) segments.push({ leftPct, width, label });
      cur.setMonth(cur.getMonth() + 1);
    }
    return segments;
  },

  _renderTimeline(grouped, moduleColorMap, minDate, maxDate, totalDays, ticks, todayColor) {
    const today    = new Date();
    const todayPct = this._pct(today, minDate, totalDays);
    const showToday = todayPct >= 0 && todayPct <= 100;

    // ── Construir header de dos filas ──
    let headerHTML;
    if (this.tickMode === 'months') {
      // Para meses: header de una sola fila (label = mes/año)
      headerHTML = `
        <div class="gtl-header">
          <div class="gtl-header-row">
            <div class="gtl-header-label">Actividad</div>
            <div class="gtl-header-ticks" style="height:44px;">
              ${ticks.map(t => {
                const left = this._pct(t, minDate, totalDays);
                const isToday = false;
                const s = t.toLocaleDateString('es-MX', { month:'short', year:'numeric' });
                return `<div class="gtl-tick-lbl" style="left:${left}%;">
                          <span>${s.charAt(0).toUpperCase()+s.slice(1)}</span>
                        </div>`;
              }).join('')}
              ${showToday ? `<div class="gtl-today-line" style="left:${todayPct}%;background:${todayColor};"></div>` : ''}
            </div>
          </div>
        </div>`;
    } else {
      // ★ Para días y semanas: fila de MES encima + fila de NÚMERO DE DÍA abajo
      const monthSegs = this._buildMonthSegments(minDate, maxDate, totalDays);

      headerHTML = `
        <div class="gtl-header">
          <!-- Fila 1: Meses -->
          <div class="gtl-header-row" style="border-bottom:1px solid var(--color-border);">
            <div class="gtl-header-label" style="height:22px;font-size:10px;color:var(--color-text-muted);">
              Mes
            </div>
            <div class="gtl-month-row-ticks">
              ${monthSegs.map(seg => `
                <div class="gtl-month-lbl" style="left:${seg.leftPct}%;width:${seg.width}%;">
                  ${seg.label}
                </div>`).join('')}
              ${showToday ? `<div class="gtl-today-line" style="left:${todayPct}%;background:${todayColor};opacity:.4;"></div>` : ''}
            </div>
          </div>
          <!-- Fila 2: Números de día / inicio de semana -->
          <div class="gtl-header-row">
            <div class="gtl-header-label" style="height:30px;font-size:10px;color:var(--color-text-muted);">
              ${this.tickMode === 'days' ? 'Día' : 'Semana'}
            </div>
            <div class="gtl-header-ticks">
              ${ticks.map(t => {
                const left = this._pct(t, minDate, totalDays);
                if (left < 0 || left > 100) return '';
                const isToday = this.tickMode === 'days' && t.toDateString() === today.toDateString();
                return `
                  <div class="gtl-tick-lbl ${isToday?'is-today':''}" style="left:${left}%;">
                    <span style="${isToday?`color:${todayColor};font-weight:700;`:''}">${this._fmtTick(t)}</span>
                  </div>
                  <div class="gtl-tick-sep" style="left:${left}%;"></div>`;
              }).join('')}
              ${showToday ? `<div class="gtl-today-line" style="left:${todayPct}%;background:${todayColor};"></div>` : ''}
            </div>
          </div>
        </div>`;
    }

    const groupsHTML = Object.entries(grouped).map(([modName, tasks]) => {
      const color = moduleColorMap[modName] || this._moduleColors[0];

      const groupRow = `
        <div class="gtl-group-header">
          <div class="gtl-group-label-cell">
            <span class="gtl-group-pill" style="background:${color.bg};color:${color.text};">${modName}</span>
          </div>
          <div class="gtl-group-timeline">
            ${showToday ? `<div class="gtl-today-line" style="left:${todayPct}%;background:${todayColor};opacity:.35;"></div>` : ''}
          </div>
        </div>`;

      const taskRows = tasks.map(task => {
        const fi = this._parseDate(task['Fecha Inicio']);
        const ff = this._parseDate(task['Fecha Fin']);
        const lp = this._pct(fi, minDate, totalDays);
        const rp = this._pct(ff, minDate, totalDays);
        const wp = Math.max(0.5, rp - lp);
        const tip = encodeURIComponent(this._buildTooltip(task, color));
        const barLabel = task['Actividad'] || task['Estatus'] || '';

        return `
          <div class="gtl-task-row">
            <div class="gtl-task-label-cell">${task['Actividad']}</div>
            <div class="gtl-task-timeline">
              ${showToday ? `<div class="gtl-today-line" style="left:${todayPct}%;background:${todayColor};opacity:.2;"></div>` : ''}
              <div class="gtl-bar-wrap" style="left:${lp}%;width:${wp}%;"
                   data-tip="${tip}"
                   onmouseenter="GanttView._showTip(event,this)"
                   onmouseleave="GanttView._hideTip()"
                   onclick="TaskModal.open(${JSON.stringify(task).replace(/"/g,'&quot;')})">
                <div class="gtl-bar" style="background:${color.barBg};color:${color.barText};">
                  ${barLabel}
                  <span class="gtl-dot" style="background:${color.dot};"></span>
                </div>
              </div>
            </div>
          </div>`;
      }).join('');

      return `<div class="gtl-group">${groupRow}${taskRows}</div>`;
    }).join('');

    return `<div class="gtl-wrap">${headerHTML}${groupsHTML}</div>`;
  },

  _buildTooltip(task, color) {
    const fi  = this._parseDate(task['Fecha Inicio']);
    const ff  = this._parseDate(task['Fecha Fin']);
    const dur = fi && ff ? Math.round((ff - fi) / 864e5) + 1 : null;
    const fmt = d => d ? d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }) : '—';
    return `
      <div class="gtl-tt-head" style="border-left-color:${color?.bg||'#6366F1'};">
        <div class="gtl-tt-title">${task['Actividad']||'—'}</div>
        ${task['ID']?`<div class="gtl-tt-id">${task['ID']}</div>`:''}
      </div>
      <div class="gtl-tt-body">
        <div class="gtl-tt-row"><span class="gtl-tt-lbl">Estatus</span><span class="gtl-tt-val">${task['Estatus']||'—'}</span></div>
        ${task['Módulo']?`<div class="gtl-tt-row"><span class="gtl-tt-lbl">Módulo</span><span class="gtl-tt-val">${task['Módulo']}</span></div>`:''}
        ${task['Responsable']?`<div class="gtl-tt-row"><span class="gtl-tt-lbl">Responsable</span><span class="gtl-tt-val">${task['Responsable']}</span></div>`:''}
        <div class="gtl-tt-row"><span class="gtl-tt-lbl">Inicio</span><span class="gtl-tt-val">${fmt(fi)}</span></div>
        <div class="gtl-tt-row"><span class="gtl-tt-lbl">Fin</span><span class="gtl-tt-val">${fmt(ff)}</span></div>
        ${dur?`<div class="gtl-tt-row"><span class="gtl-tt-lbl">Duración</span><span class="gtl-tt-val">${dur} día${dur!==1?'s':''}</span></div>`:''}
        ${task['Prioridad']?`<div class="gtl-tt-row"><span class="gtl-tt-lbl">Prioridad</span><span class="gtl-tt-val">${task['Prioridad']}</span></div>`:''}
        ${task['Descripción']?`<div class="gtl-tt-desc">${task['Descripción']}</div>`:''}
      </div>`;
  },

  _showTip(event, el) {
    const tip = document.getElementById('gtl-tooltip');
    if (!tip) return;
    tip.querySelector('.gtl-tooltip-inner').innerHTML = decodeURIComponent(el.dataset.tip || '');
    const pad = 10, tw = 260, tipH = 210;
    const rect = el.getBoundingClientRect();
    let x = rect.left + rect.width / 2 - tw / 2;
    x = Math.max(pad, Math.min(x, window.innerWidth - tw - pad));
    tip.style.left = x + 'px';
    tip.style.top  = (rect.top - tipH - 6 < 0 ? rect.bottom + 6 : rect.top - tipH - 6) + 'px';
    tip.style.width = tw + 'px';
    tip.classList.add('visible');
  },
  _hideTip() { document.getElementById('gtl-tooltip')?.classList.remove('visible'); },

  setViewMode(mode) { this.viewMode=mode; if(mode!=='custom'){this.monthRange.from='';this.monthRange.to='';} this.render(); },
  setTickMode(mode) { this.tickMode=mode; this.render(); },
  clearMonthRange() { this.monthRange.from=''; this.monthRange.to=''; this.viewMode='current'; this.render(); },
  clearFilters() { this.currentFilters.module=''; this.currentFilters.search=''; this.currentFilters.status=''; this.render(); },
};