import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3003',
  withCredentials: true,
  timeout: 60000, // 60 saniye — Render cold start için yeterli süre
});

// Retry interceptor — ağ hatalarında otomatik tekrar dene (cold start koruması)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Sadece ağ/timeout hatalarında ve henüz retry yapılmamışsa tekrar dene
    const isNetworkError = !error.response && (error.code === 'ECONNABORTED' || error.message?.includes('Network Error'));
    if (isNetworkError && !config._retry) {
      config._retry = true;
      console.log('[API] Sunucu uyanıyor, tekrar deneniyor...');
      // 3 saniye bekleyip tekrar dene
      await new Promise(resolve => setTimeout(resolve, 3000));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
