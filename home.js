// ============================================================
// HOME VIEW - Vista principal con módulos
// ============================================================

const HomeView = {
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
      card.addEventListener('click', () => {
        const module = card.dataset.module;
        this.openModule(module);
      });
    });
  },

  calculateModuleStats() {
    const stats = {};
    
    STATE.tasks.forEach(task => {
      const module = task['Módulo'] || 'Sin módulo';
      
      if (!stats[module]) {
        stats[module] = {
          total: 0,
          ejecutado: 0,
          proceso: 0,
          pendiente: 0,
        };
      }
      
      stats[module].total++;
      
      const status = task['Estatus'];
      if (status === 'Ejecutado') stats[module].ejecutado++;
      else if (status === 'En Proceso') stats[module].proceso++;
      else stats[module].pendiente++;
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

    return `
      <div class="module-card" data-module="${module}" style="color: ${color};">
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
      </div>
    `;
  },

  openModule(module) {
    STATE.filters.module = module;
    STATE.filters.status = '';
    STATE.filters.priority = '';
    STATE.filters.search = '';
    
    Navigation.switchView('tasks');
  },
};
