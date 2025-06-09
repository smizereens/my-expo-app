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


// Перехватчик запросов для автоматического добавления токена
apiClient.interceptors.request.use(
  async (config) => {
    // Логирование в development
    if (__DEV__) {
      console.log(`🟢 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('Request Data:', config.data);
      }
    }

    // Добавляем токен авторизации, если он есть
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('auth_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('⚠️ Не удалось получить токен из AsyncStorage:', error);
    }

    return config;
  },
  (error) => {
    console.error('🔴 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок
apiClient.interceptors.response.use(
  (response) => {
    // Успешный ответ просто возвращается дальше
    return response;
  },
  async (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    // --- НАЧАЛО БЛОКА ОБРАБОТКИ ОШИБОК С ОТВЕТОМ ОТ СЕРВЕРА ---
    if (error.response) {
      // **НОВАЯ ЛОГИКА ИЗ ВТОРОГО ФРАГМЕНТА**
      // Особая обработка для ошибки 401 при логине (неверный логин/пароль).
      // Это ожидаемое поведение, а не ошибка сервера, поэтому не засоряем консоль.
      if (isLoginRequest && error.response.status === 401) {
        // Просто пробрасываем ошибку дальше, чтобы ее можно было обработать в компоненте формы входа.
        return Promise.reject(error.response.data || { error: 'Неверный логин или пароль' });
      }

      // **ЛОГИКА ИЗ ПЕРВОГО ФРАГМЕНТА**
      // Для всех остальных ошибок с ответом от сервера — выводим подробную информацию.
      console.error('🔴 API Error Response:');
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('URL:', error.config?.url);

      // Специальная обработка для 401 ошибок на других страницах (неавторизован, токен истек).
      // Условие isLoginRequest здесь уже не нужно, т.к. мы бы вышли из функции раньше.
      if (error.response.status === 401) {
        console.warn('🚨 Получена 401 ошибка - токен недействителен или истек.');
        // Здесь можно добавить логику для автоматического выхода пользователя (разлогинивания)
        // Например, вызов authService.logout() и редирект на страницу входа.
      }
      
      // Пробрасываем данные ошибки дальше
      return Promise.reject(error.response.data);

    // --- КОНЕЦ БЛОКА ОБРАБОТКИ ОШИБОК С ОТВЕТОМ ОТ СЕРВЕРА ---

    } else if (error.request) {
      // **ЛОГИКА ИЗ ПЕРВОГО ФРАГМЕНТА (без изменений)**
      // Запрос был сделан, но ответ не был получен (проблемы с сетью, сервер недоступен).
      console.error('🔴 API Network Error:');
      console.error('Request:', error.request);
      console.error('Message:', error.message);

      // Создаем более понятное сообщение об ошибке для пользователя.
      const networkError = {
        error: 'Проблема с подключением к серверу',
        details: 'Проверьте ваше интернет-соединение и убедитесь, что сервер доступен.',
        originalError: error.message
      };

      return Promise.reject(networkError);

    } else {
      // **ЛОГИКА ИЗ ПЕРВОГО ФРАГМЕНТА (без изменений)**
      // Произошла ошибка при настройке запроса (что-то пошло не так до его отправки).
      console.error('🔴 API Request Setup Error:', error.message);
    }

    // **ФИНАЛЬНЫЙ ВОЗВРАТ ИЗ ПЕРВОГО ФРАГМЕНТА**
    // Возвращаем стандартное сообщение об ошибке, если ни один из верхних блоков не вернул свой reject.
    // Это сработает в основном для "Request Setup Error".
    return Promise.reject({
      error: 'Произошла непредвиденная ошибка при выполнении запроса',
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