import axios from 'axios';

// Определяем базовый URL для нашего API
// Убедитесь, что ваш бэкенд-сервер запущен на этом адресе
// Для разработки на симуляторе/эмуляторе Android используйте 10.0.2.2 вместо localhost
// Для разработки на физическом устройстве используйте IP-адрес вашего компьютера в локальной сети
// Пока что, для простоты и если вы тестируете на веб или симуляторе iOS, localhost должен работать.
// Если бэкенд запущен на той же машине, что и симулятор/эмулятор.
// const API_BASE_URL = 'http://localhost:3001/api';
// const API_BASE_URL = 'http://10.0.2.2:3001/api'; // Для Android Emulator, если бэкенд на той же машине
const API_BASE_URL = 'http://192.168.0.100:3001/api'; // Для физического устройства или Expo Go на телефоне в той же сети

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Здесь можно будет добавить перехватчики (interceptors) для запросов и ответов,
// например, для добавления токенов аутентификации или глобальной обработки ошибок.

/*
// Пример перехватчика запроса (для добавления токена)
apiClient.interceptors.request.use(
  async (config) => {
    // const token = await AsyncStorage.getItem('userToken'); // Пример получения токена
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Пример перехватчика ответа (для обработки ошибок)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // const originalRequest = error.config;
    // if (error.response?.status === 401 && !originalRequest._retry) {
    //   originalRequest._retry = true;
    //   // Здесь может быть логика обновления токена
    //   // const newToken = await refreshToken(); 
    //   // axios.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
    //   // return apiClient(originalRequest);
    // }
    // Обработка других ошибок
    if (error.response) {
      // Запрос был сделан, и сервер ответил кодом состояния, который выходит за пределы 2xx
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // Запрос был сделан, но ответ не был получен
      console.error('API Error Request:', error.request);
    } else {
      // Что-то случилось при настройке запроса, что вызвало ошибку
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error.response?.data || error.message); // Возвращаем данные ошибки или сообщение
  }
);
*/

export default apiClient;