// CONFIGURACIÓN
const CONFIG = {
  API_URL: 'https://script.google.com/a/macros/fahorro.com.mx/s/AKfycbzAolQ9xn6gb4VJYHwnQuJ73oVm8FI3sr8ZWpud-Uf1WSoigWscWWxTAidmtaSlhkvW/exec', // La URL del deployment
  CACHE_DURATION: 5 * 60 * 1000,
};

// ============================================================
// API SERVICE CON OAUTH
// ============================================================

const API = {
  authWindow: null,
  isAuthenticated: false,
  
  async fetchTasks(params = {}) {
    const now = Date.now();
    if (STATE.cache.data && STATE.cache.timestamp && (now - STATE.cache.timestamp < CONFIG.CACHE_DURATION)) {
      console.log('Usando datos en cache');
      return STATE.cache.data;
    }

    try {
      // Si no está autenticado, abrir ventana de auth
      if (!this.isAuthenticated) {
        await this.authenticate();
      }
      
      // Hacer petición a través de Google Apps Script
      const data = await this.callGoogleScript('getTasks', params);
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      STATE.cache.data = data;
      STATE.cache.timestamp = now;
      
      return data;
      
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },
  
  async authenticate() {
    return new Promise((resolve, reject) => {
      // Abrir ventana de autenticación
      this.authWindow = window.open(
        CONFIG.API_URL,
        'auth',
        'width=600,height=600'
      );
      
      // Escuchar mensaje de autenticación exitosa
      window.addEventListener('message', (event) => {
        if (event.data.type === 'AUTH_SUCCESS') {
          this.isAuthenticated = true;
          if (this.authWindow) {
            this.authWindow.close();
          }
          resolve();
        }
      });
      
      // Timeout de 60 segundos
      setTimeout(() => {
        if (!this.isAuthenticated) {
          if (this.authWindow) {
            this.authWindow.close();
          }
          reject(new Error('Timeout de autenticación'));
        }
      }, 60000);
    });
  },
  
  async callGoogleScript(functionName, params) {
    // Usar iframe oculto para llamar a Google Apps Script
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = CONFIG.API_URL;
      
      iframe.onload = function() {
        try {
          // Llamar a la función del iframe
          iframe.contentWindow.getTasksData()
            .then(resolve)
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      };
      
      document.body.appendChild(iframe);
      
      // Timeout
      setTimeout(() => {
        document.body.removeChild(iframe);
        reject(new Error('Timeout'));
      }, 30000);
    });
  },

  clearCache() {
    STATE.cache.data = null;
    STATE.cache.timestamp = null;
  },
};
