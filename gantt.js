// ============================================================
// GANTT VIEW — Timeline Ejecutivo (final)
// ============================================================

const GanttView = {
  currentFilters: { module: '', search: '', status: '' },
  viewMode: 'current',
  monthRange: { from: '', to: '' },
  tickMode: 'weeks',   // 'days' | 'weeks' | 'months'
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
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      opts.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return opts;
  },

  _calcRange() {
    const today = new Date();
    let minDate, maxDate;

    if (this.viewMode === 'custom' && (this.monthRange.from || this.monthRange.to)) {
      if (this.monthRange.from) {
        const [y, m] = this.monthRange.from.split('-').map(Number);
        minDate = new Date(y, m - 1, 1);
      } else {
        minDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      }
      if (this.monthRange.to) {
        const [y, m] = this.monthRange.to.split('-').map(Number);
        maxDate = new Date(y, m, 0);
      } else {
        maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
      }
    } else if (this.viewMode === 'full') {
      const dates = [];
      STATE.tasks.forEach(t => {
        const fi = this._parseDate(t['Fecha Inicio']);
        const ff = this._parseDate(t['Fecha Fin']);
        if (fi) dates.push(fi);
        if (ff) dates.push(ff);
      });
      if (dates.length) {
        minDate = new Date(Math.min(...dates));
        maxDate = new Date(Math.max(...dates));
        minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
      } else {
        minDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
      }
    } else {
      minDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    }

    return { minDate, maxDate };
  },

  _buildTicks(minDate, maxDate) {
    const ticks = [];
    const totalDays = Math.round((maxDate - minDate) / 864e5) + 1;

    if (this.tickMode === 'days') {
      // Cada día
      const cur = new Date(minDate);
      while (cur <= maxDate) {
        ticks.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
    } else if (this.tickMode === 'weeks') {
      // Cada 7 días desde minDate
      const cur = new Date(minDate);
      while (cur <= maxDate) {
        ticks.push(new Date(cur));
        cur.setDate(cur.getDate() + 7);
      }
    } else {
      // months — primer día de cada mes
      const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      while (cur <= maxDate) {
        ticks.push(new Date(cur));
        cur.setMonth(cur.getMonth() + 1);
      }
    }

    return { ticks, totalDays };
  },

  _fmtTick(d) {
    if (this.tickMode === 'days') {
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    } else if (this.tickMode === 'weeks') {
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    } else {
      const s = d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
  },

  toggleExpand() {
    this._expanded = !this._expanded;
    STATE.isExpanded = this._expanded;
    document.body.classList.toggle('view-expanded', this._expanded);
    document.getElementById('gantt-fab-exit')?.remove();
    this.render();
  },

  _isDark() {
    return document.documentElement.classList.contains('dark')
        || document.body.classList.contains('dark')
        || document.documentElement.getAttribute('data-theme') === 'dark'
        || document.body.getAttribute('data-theme') === 'dark'
        || document.documentElement.classList.contains('theme-dark')
        || window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  },

  _injectStyles() {
    const existing = document.getElementById('gantt-exec-styles');
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = 'gantt-exec-styles';
    style.textContent = `
      .gtl-wrap { font-size: 13px; user-select: none; }

      /* ── Header ── */
      .gtl-header {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid var(--color-border, #E5E7EB);
        position: sticky;
        top: 0;
        z-index: 20;
        /* Hereda exactamente el fondo del tema */
        background: var(--color-bg-primary, #fff);
      }
      .gtl-header-label {
        min-width: 260px;
        width: 260px;
        padding: 0 16px;
        font-size: 17px;
        font-weight: 700;
        /* Usa el color de texto principal del tema */
        color: var(--color-text-primary, #111827);
        display: flex;
        align-items: center;
        flex-shrink: 0;
        border-right: none;
      }
      .gtl-header-ticks {
        flex: 1;
        position: relative;
        height: 44px;
        overflow: hidden;
      }

      /* ── Tick label ── */
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
        color: var(--color-text-muted, #6B7280);
        white-space: nowrap;
      }
      .gtl-tick-lbl.is-today span {
        font-weight: 700;
      }

      /* ── Línea verde de hoy ── */
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
        min-width: 260px;
        width: 260px;
        padding: 6px 16px;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      .gtl-group-pill {
        display: inline-block;
        padding: 4px 14px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 210px;
      }
      .gtl-group-timeline {
        flex: 1;
        position: relative;
        min-height: 38px;
      }

      /* ── Tarea ── */
      .gtl-task-row {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid var(--color-border, #E5E7EB);
        min-height: 44px;
        transition: background 0.1s;
      }
      .gtl-task-row:hover {
        background: var(--color-bg-hover, rgba(0,0,0,0.02));
      }
      .gtl-task-label-cell {
        min-width: 260px;
        width: 260px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        font-size: 13px;
        color: var(--color-text-primary, #111827);
        font-weight: 400;
        flex-shrink: 0;
        line-height: 1.35;
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
        height: 26px;
        cursor: pointer;
        z-index: 2;
        padding-right: 10px; /* espacio para el dot */
      }
      .gtl-bar {
        height: 100%;
        border-radius: 5px;
        display: flex;
        align-items: center;
        padding: 0 10px;
        font-size: 11.5px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: opacity 0.15s;
        position: relative;
        width: 100%;
      }
      .gtl-bar-wrap:hover .gtl-bar { opacity: 0.82; }
      .gtl-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 3;
        border: 2px solid var(--color-bg-primary, #fff);
        flex-shrink: 0;
      }

      /* ── Tooltip ── */
      .gtl-tooltip {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.15s, transform 0.15s;
        width: 260px;
      }
      .gtl-tooltip.visible { opacity: 1; transform: translateY(0); }
      .gtl-tooltip-inner {
        background: var(--color-bg-primary, #fff);
        border: 1px solid var(--color-border, #E5E7EB);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        overflow: hidden;
        font-size: 12px;
      }
      .gtl-tt-head {
        padding: 10px 14px 8px;
        border-bottom: 1px solid var(--color-border, #E5E7EB);
        border-left-width: 3px;
        border-left-style: solid;
      }
      .gtl-tt-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-primary, #111827);
        line-height: 1.3;
        margin-bottom: 2px;
      }
      .gtl-tt-id { font-size: 10px; color: var(--color-text-muted, #9CA3AF); }
      .gtl-tt-body { padding: 9px 14px; display: flex; flex-direction: column; gap: 5px; }
      .gtl-tt-row { display: flex; align-items: baseline; gap: 8px; }
      .gtl-tt-lbl { min-width: 74px; font-size: 10.5px; color: var(--color-text-muted, #9CA3AF); flex-shrink: 0; }
      .gtl-tt-val { font-size: 12px; font-weight: 500; color: var(--color-text-primary, #111827); line-height: 1.3; }
      .gtl-tt-desc {
        font-size: 11px;
        color: var(--color-text-muted, #9CA3AF);
        line-height: 1.5;
        padding-top: 6px;
        margin-top: 2px;
        border-top: 1px solid var(--color-border, #E5E7EB);
      }

      /* ── Controles restructurados ── */
      .gtl-controls-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        padding-bottom: 12px;
      }
      .gtl-controls-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .gtl-divider {
        width: 1px;
        height: 22px;
        background: var(--color-border, #E5E7EB);
        flex-shrink: 0;
      }
      .gtl-label {
        font-size: 11.5px;
        color: var(--color-text-muted, #9CA3AF);
        white-space: nowrap;
        flex-shrink: 0;
      }
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
        return task['Actividad']?.toLowerCase().includes(q)
            || task['Descripción']?.toLowerCase().includes(q)
            || task['ID']?.toLowerCase().includes(q);
      }
      return true;
    });

    filteredTasks.sort((a, b) =>
      this._parseDate(a['Fecha Inicio']) - this._parseDate(b['Fecha Inicio'])
    );

    const { minDate, maxDate }   = this._calcRange();
    const { ticks, totalDays }   = this._buildTicks(minDate, maxDate);
    const modulesSet = new Set(STATE.tasks.map(t => t['Módulo']).filter(Boolean));
    const statusSet  = new Set(STATE.tasks.map(t => t['Estatus']).filter(s => s && s !== '-'));
    const monthOpts  = this._buildMonthOptions();
    const isExp      = this._expanded;
    const dark       = this._isDark();
    const palette    = dark ? this._moduleColorsDark : this._moduleColors;
    const todayColor = dark ? '#34D399' : '#10B981';

    const moduleList = [...new Set(STATE.tasks.map(t => t['Módulo']).filter(Boolean))];
    const moduleColorMap = {};
    moduleList.forEach((m, i) => { moduleColorMap[m] = palette[i % palette.length]; });

    const grouped = {};
    filteredTasks.forEach(t => {
      const mod = t['Módulo'] || '(Sin módulo)';
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(t);
    });

    // Botones de tick mode
    const tickBtn = (mode, label) =>
      `<button class="btn ${this.tickMode === mode ? 'btn-primary' : 'btn-secondary'}"
               onclick="GanttView.setTickMode('${mode}')"
               style="padding:4px 10px;font-size:12px;">${label}</button>`;

    container.innerHTML = `
      <div class="gantt-layout ${isExp ? 'gantt-expanded' : ''}">

        ${!isExp ? `
        <div class="gantt-sidebar">
          <h3 style="margin:0 0 var(--spacing-lg) 0;font-size:11px;font-weight:600;
                     letter-spacing:0.06em;text-transform:uppercase;color:var(--color-text-muted);">
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
                   placeholder="Buscar actividad..." value="${this.currentFilters.search}">
          </div>
          <button class="btn btn-secondary" onclick="GanttView.clearFilters()"
                  style="width:100%;margin-bottom:var(--spacing-lg);">Limpiar Filtros</button>
          <div style="padding-top:var(--spacing-lg);border-top:1px solid var(--color-border);">
            <div style="font-size:11px;color:var(--color-text-muted);">
              ${filteredTasks.length} tareas mostradas
            </div>
          </div>
        </div>
        ` : ''}

        <div class="gantt-main-area">

          <!-- ── Barra de controles restructurada ── -->
          <div class="gtl-controls-bar">

            <!-- Bloque 1: rango de vista -->
            <div class="gtl-controls-group">
              <span class="gtl-label">Vista</span>
              <button class="btn ${this.viewMode==='current'?'btn-primary':'btn-secondary'}"
                      onclick="GanttView.setViewMode('current')"
                      style="padding:4px 10px;font-size:12px;">±3 Meses</button>
              <button class="btn ${this.viewMode==='full'?'btn-primary':'btn-secondary'}"
                      onclick="GanttView.setViewMode('full')"
                      style="padding:4px 10px;font-size:12px;">Completa</button>
            </div>

            <div class="gtl-divider"></div>

            <!-- Bloque 2: escala de tiempo -->
            <div class="gtl-controls-group">
              <span class="gtl-label">Escala</span>
              ${tickBtn('days',   'Días')}
              ${tickBtn('weeks',  'Semanas')}
              ${tickBtn('months', 'Meses')}
            </div>

            <div class="gtl-divider"></div>

            <!-- Bloque 3: rango personalizado -->
            <div class="gtl-controls-group">
              <span class="gtl-label">Desde</span>
              <select id="gtl-month-from" class="filter-select" style="min-width:130px;padding:4px 8px;font-size:12px;">
                <option value="">-- mes --</option>
                ${monthOpts.map(o =>
                  `<option value="${o.value}" ${this.monthRange.from===o.value?'selected':''}>${o.label}</option>`
                ).join('')}
              </select>
              <span class="gtl-label">Hasta</span>
              <select id="gtl-month-to" class="filter-select" style="min-width:130px;padding:4px 8px;font-size:12px;">
                <option value="">-- mes --</option>
                ${monthOpts.map(o =>
                  `<option value="${o.value}" ${this.monthRange.to===o.value?'selected':''}>${o.label}</option>`
                ).join('')}
              </select>
              <button class="btn btn-secondary" onclick="GanttView.clearMonthRange()"
                      style="padding:4px 10px;font-size:12px;">Limpiar</button>
            </div>

            <!-- Expandir al extremo derecho -->
            <button class="btn btn-secondary" onclick="GanttView.toggleExpand()"
                    style="display:flex;align-items:center;gap:6px;padding:5px 12px;
                           font-size:12px;white-space:nowrap;margin-left:auto;flex-shrink:0;">
              ${isExp
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                     <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
                     <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                     <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
                     <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                   </svg>Salir`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                     <path d="M3 7V3h4"/><path d="M21 7V3h-4"/>
                     <path d="M3 17v4h4"/><path d="M21 17v4h-4"/>
                   </svg>Expandir`}
            </button>
          </div>

          <!-- ── Timeline ── -->
          <div class="gantt-container" style="overflow:auto;flex:1;">
            <div style="min-width:700px;">
              ${filteredTasks.length
                ? this._renderTimeline(grouped, moduleColorMap, minDate, maxDate, totalDays, ticks, todayColor)
                : `<div style="padding:48px;text-align:center;color:var(--color-text-muted);font-size:13px;">
                     No hay tareas con fechas válidas para el rango seleccionado.
                   </div>`}
            </div>
          </div>
        </div>
      </div>`;

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

  _renderTimeline(grouped, moduleColorMap, minDate, maxDate, totalDays, ticks, todayColor) {
    const today    = new Date();
    const todayPct = this._pct(today, minDate, totalDays);
    const showToday = todayPct >= 0 && todayPct <= 100;

    // ── Header de ticks — sin líneas verticales, solo texto ──
    const headerHTML = `
      <div class="gtl-header">
        <div class="gtl-header-label">Timeline</div>
        <div class="gtl-header-ticks">
          ${ticks.map(t => {
            const left = this._pct(t, minDate, totalDays);
            const isToday = this.tickMode === 'days'
              && t.toDateString() === today.toDateString();
            return `
              <div class="gtl-tick-lbl ${isToday ? 'is-today' : ''}"
                   style="left:${left}%;">
                <span style="${isToday ? `color:${todayColor};` : ''}">${this._fmtTick(t)}</span>
              </div>`;
          }).join('')}
          ${showToday ? `
            <div class="gtl-today-line"
                 style="left:${todayPct}%;background:${todayColor};"></div>` : ''}
        </div>
      </div>`;

    // ── Grupos ──
    const groupsHTML = Object.entries(grouped).map(([modName, tasks]) => {
      const color = moduleColorMap[modName] || this._moduleColors[0];

      const groupRow = `
        <div class="gtl-group-header">
          <div class="gtl-group-label-cell">
            <span class="gtl-group-pill"
                  style="background:${color.bg};color:${color.text};">${modName}</span>
          </div>
          <div class="gtl-group-timeline">
            ${showToday ? `
              <div class="gtl-today-line"
                   style="left:${todayPct}%;background:${todayColor};opacity:0.35;"></div>` : ''}
          </div>
        </div>`;

      const taskRows = tasks.map(task => {
        const fi = this._parseDate(task['Fecha Inicio']);
        const ff = this._parseDate(task['Fecha Fin']);
        const lp = this._pct(fi, minDate, totalDays);
        const rp = this._pct(ff, minDate, totalDays);
        const wp = Math.max(0.5, rp - lp);
        const tip = encodeURIComponent(this._buildTooltip(task, color));

        return `
          <div class="gtl-task-row">
            <div class="gtl-task-label-cell">${task['Actividad']}</div>
            <div class="gtl-task-timeline">
              ${showToday ? `
                <div class="gtl-today-line"
                     style="left:${todayPct}%;background:${todayColor};opacity:0.25;"></div>` : ''}
              <div class="gtl-bar-wrap"
                   style="left:${lp}%;width:${wp}%;"
                   data-tip="${tip}"
                   onmouseenter="GanttView._showTip(event,this)"
                   onmouseleave="GanttView._hideTip()"
                   onclick="TaskModal.open(${JSON.stringify(task).replace(/"/g,'&quot;')})">
                <div class="gtl-bar" style="background:${color.barBg};color:${color.barText};">
                  ${task['Estatus']}
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
      <div class="gtl-tt-head" style="border-left-color:${color?.bg || '#6366F1'};">
        <div class="gtl-tt-title">${task['Actividad'] || '—'}</div>
        ${task['ID'] ? `<div class="gtl-tt-id">${task['ID']}</div>` : ''}
      </div>
      <div class="gtl-tt-body">
        <div class="gtl-tt-row">
          <span class="gtl-tt-lbl">Estatus</span>
          <span class="gtl-tt-val">${task['Estatus'] || '—'}</span>
        </div>
        ${task['Módulo'] ? `
        <div class="gtl-tt-row">
          <span class="gtl-tt-lbl">Módulo</span>
          <span class="gtl-tt-val">${task['Módulo']}</span>
        </div>` : ''}
        ${task['Responsable'] ? `
        <div class="gtl-tt-row">
          <span class="gtl-tt-lbl">Responsable</span>
          <span class="gtl-tt-val">${task['Responsable']}</span>
        </div>` : ''}
        <div class="gtl-tt-row">
          <span class="gtl-tt-lbl">Inicio</span>
          <span class="gtl-tt-val">${fmt(fi)}</span>
        </div>
        <div class="gtl-tt-row">
          <span class="gtl-tt-lbl">Fin</span>
          <span class="gtl-tt-val">${fmt(ff)}</span>
        </div>
        ${dur ? `
        <div class="gtl-tt-row">
          <span class="gtl-tt-lbl">Duración</span>
          <span class="gtl-tt-val">${dur} día${dur !== 1 ? 's' : ''}</span>
        </div>` : ''}
        ${task['Prioridad'] ? `
        <div class="gtl-tt-row">
          <span class="gtl-tt-lbl">Prioridad</span>
          <span class="gtl-tt-val">${task['Prioridad']}</span>
        </div>` : ''}
        ${task['Descripción'] ? `<div class="gtl-tt-desc">${task['Descripción']}</div>` : ''}
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
    tip.style.left  = x + 'px';
    tip.style.top   = (rect.top - tipH - 6 < 0 ? rect.bottom + 6 : rect.top - tipH - 6) + 'px';
    tip.style.width = tw + 'px';
    tip.classList.add('visible');
  },

  _hideTip() {
    document.getElementById('gtl-tooltip')?.classList.remove('visible');
  },

  setViewMode(mode) {
    this.viewMode = mode;
    if (mode !== 'custom') { this.monthRange.from = ''; this.monthRange.to = ''; }
    this.render();
  },
  setTickMode(mode) {
    this.tickMode = mode;
    this.render();
  },
  clearMonthRange() {
    this.monthRange.from = ''; this.monthRange.to = '';
    this.viewMode = 'current';
    this.render();
  },
  clearFilters() {
    this.currentFilters.module = '';
    this.currentFilters.search = '';
    this.currentFilters.status = '';
    this.render();
  },
};