// services/api.ts
import axios from 'axios';

// Определяем базовый URL для нашего API
// const API_BASE_URL = 'http://localhost:3001/api'; // Localhost для веб и iOS симулятора
// const API_BASE_URL = 'http://10.0.2.2:3001/api'; // Для Android Emulator
const API_BASE_URL = 'http://192.168.0.100:3001/api'; // Для физического устройства

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд таймаут
});

// Перехватчик ответов для обработки ошибок
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Логирование ошибок для отладки
    if (error.response) {
      // Запрос был сделан, и сервер ответил кодом состояния, который выходит за пределы 2xx
      console.error('🔴 API Error Response:');
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('URL:', error.config?.url);
      
      // Специальная обработка для 401 ошибок (неавторизован)
      if (error.response.status === 401) {
        console.warn('🚨 Получена 401 ошибка - токен недействителен');
        // Здесь можно добавить логику для автоматического выхода пользователя
        // Но лучше обрабатывать это в AuthService
      }
    } else if (error.request) {
      // Запрос был сделан, но ответ не был получен (проблемы с сетью)
      console.error('🔴 API Network Error:');
      console.error('Request:', error.request);
      console.error('Message:', error.message);
      
      // Создаем более понятное сообщение об ошибке
      const networkError = {
        error: 'Проблема с подключением к серверу',
        details: 'Проверьте интернет-соединение и убедитесь, что сервер запущен',
        originalError: error.message
      };
      
      return Promise.reject(networkError);
    } else {
      // Что-то случилось при настройке запроса
      console.error('🔴 API Request Error:', error.message);
    }
    
    // Возвращаем данные ошибки или создаем стандартное сообщение
    return Promise.reject(error.response?.data || {
      error: 'Произошла ошибка при выполнении запроса',
      details: error.message
    });
  }
);

// Перехватчик запросов для логирования (только в development)
if (__DEV__) {
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`🟢 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('Request Data:', config.data);
      }
      return config;
    },
    (error) => {
      console.error('🔴 API Request Error:', error);
      return Promise.reject(error);
    }
  );
}

export default apiClient;