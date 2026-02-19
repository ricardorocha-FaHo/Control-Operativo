// ============================================================
// HOME VIEW
// ============================================================

const HomeView = {
  UPCOMING_DAYS: 7,

  render() {
    const container = document.getElementById('modules-grid');
    if (!STATE.tasks.length) {
      Utils.showEmptyState('modules-grid', 'No hay datos disponibles');
      return;
    }
    const stats = this.calculateModuleStats();
    container.innerHTML = Object.entries(stats)
      .map(([module, data]) => this.createModuleCard(module, data))
      .join('');

    document.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const module = e.currentTarget.dataset.module;
        if (action === 'upcoming') {
          this.openModuleUpcoming(module);
        } else {
          this.openModule(module);
        }
      });
    });

    // Upcoming stat click needs separate delegation
    document.querySelectorAll('.upcoming-stat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const module = btn.dataset.module;
        this.openModuleUpcoming(module);
      });
    });
  },

  calculateModuleStats() {
    const stats = {};
    STATE.tasks.forEach(task => {
      const module = task['Módulo'] || 'Sin módulo';
      if (!stats[module]) {
        stats[module] = { total: 0, ejecutado: 0, proceso: 0, pendiente: 0, upcoming: 0 };
      }
      stats[module].total++;
      const status = task['Estatus'];
      if (status === 'Ejecutado') stats[module].ejecutado++;
      else if (status === 'En Proceso') stats[module].proceso++;
      else stats[module].pendiente++;

      if (Utils.isUpcoming(task, this.UPCOMING_DAYS)) stats[module].upcoming++;
    });
    return stats;
  },

  createModuleCard(module, stats) {
    const moduleColors = {
      'Trabajo': 'var(--modulo-trabajo)',
      'Soporte Técnico': 'var(--modulo-soporte)',
      'Analítica y Datos': 'var(--modulo-analitica)',
      'Comunicación': 'var(--modulo-comunicacion)',
      'Pendientes': 'var(--modulo-pendientes)',
    };
    const color = moduleColors[module] || 'var(--color-accent)';
    const escapedModule = module.replace(/'/g, "\\'");

    return `
      <div class="module-card" data-module="${module}" data-action="tasks" style="color: ${color};">
        <div class="module-header">
          <div class="module-name">${module}</div>
          <div class="module-count">${stats.total}</div>
        </div>
        <div class="module-stats">
          <div class="module-stat">
            <div class="module-stat-label">Completado</div>
            <div class="module-stat-value" style="color: var(--status-ejecutado);">${stats.ejecutado}</div>
          </div>
          <div class="module-stat">
            <div class="module-stat-label">En Proceso</div>
            <div class="module-stat-value" style="color: var(--status-proceso);">${stats.proceso}</div>
          </div>
          <div class="module-stat">
            <div class="module-stat-label">Pendiente</div>
            <div class="module-stat-value" style="color: var(--status-pendiente);">${stats.pendiente}</div>
          </div>
        </div>
        ${stats.upcoming > 0 ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border);">
          <button class="upcoming-stat-btn" data-module="${module}"
            style="width:100%;display:flex;align-items:center;justify-content:space-between;
                   background:rgba(193,48,48,0.06);border:1px solid rgba(193,48,48,0.15);
                   border-radius:var(--radius-md);padding:6px 12px;cursor:pointer;
                   transition:all var(--transition-fast);"
            onmouseover="this.style.background='rgba(193,48,48,0.12)'"
            onmouseout="this.style.background='rgba(193,48,48,0.06)'">
            <span style="font-size:12px;font-weight:600;color:var(--priority-p1);">
              Proximos a vencer
            </span>
            <span style="font-size:16px;font-weight:700;font-family:var(--font-mono);color:var(--priority-p1);">
              ${stats.upcoming}
            </span>
          </button>
        </div>
        ` : `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border);">
          <div style="display:flex;align-items:center;justify-content:space-between;
                   background:var(--color-bg-main);border:1px solid var(--color-border);
                   border-radius:var(--radius-md);padding:6px 12px;">
            <span style="font-size:12px;font-weight:600;color:var(--color-text-muted);">
              Proximos a vencer
            </span>
            <span style="font-size:16px;font-weight:700;font-family:var(--font-mono);color:var(--color-text-muted);">
              0
            </span>
          </div>
        </div>
        `}
      </div>
    `;
  },

  openModule(module) {
    STATE.filters.module = module;
    STATE.filters.status = '';
    STATE.filters.priority = '';
    STATE.filters.search = '';
    STATE.filters.area = '';
    STATE.filters.responsable = '';
    STATE.filters.upcomingModule = '';
    Navigation.switchView('tasks');
  },

  openModuleUpcoming(module) {
    STATE.filters.module = module;
    STATE.filters.status = '';
    STATE.filters.priority = '';
    STATE.filters.search = '';
    STATE.filters.area = '';
    STATE.filters.responsable = '';
    STATE.filters.upcomingModule = module;
    Navigation.switchView('tasks');
  },
};
