import apiClient from './api';

// Определяем тип для товара, как он приходит с бэкенда
// Это должно соответствовать вашей Prisma модели Product
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  createdAt: string; // Даты приходят как строки ISO
  updatedAt: string;
}

// Функция для получения списка всех товаров
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    console.log('Attempting to fetch products from:', apiClient.defaults.baseURL + '/products');
    const response = await apiClient.get<Product[]>('/products');
    console.log('Products fetched successfully:', response.data);
    return response.data;
  } catch (error: any) { // Явно типизируем error как any для доступа к свойствам
    console.error('-----------------------------------------');
    console.error('Ошибка при загрузке списка товаров (productService.ts):');
    if (error.isAxiosError) {
      console.error('Axios Error:', error.message);
      console.error('Axios Error Code:', error.code); // e.g., ECONNREFUSED, ENOTFOUND
      if (error.request) {
        console.error('Axios Error Request:', JSON.stringify(error.request, null, 2));
      }
      if (error.response) {
        console.error('Axios Error Response Status:', error.response.status);
        console.error('Axios Error Response Data:', JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.error('Generic Error:', error);
    }
    console.error('-----------------------------------------');
    // В реальном приложении здесь можно обработать ошибку более специфично
    // или пробросить ее дальше для обработки в UI
    throw error;
  }
};

// Тип для данных товара, отправляемых на бэкенд (создание/обновление)
export interface ProductPayload {
  name: string;
  price: number;
  description?: string | null;
}

// Функция для получения товара по ID
export const fetchProductById = async (id: string): Promise<Product> => {
  try {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Ошибка при загрузке товара ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Не удалось загрузить товар');
  }
};

// Функция для создания нового товара
export const createProduct = async (productData: ProductPayload): Promise<Product> => {
  try {
    const response = await apiClient.post<Product>('/products', productData);
    return response.data;
  } catch (error: any) {
    console.error('Ошибка при создании товара:', error.response?.data || error.message);
    throw error.response?.data || new Error('Не удалось создать товар');
  }
};

// Функция для обновления товара
export const updateProduct = async (id: string, productData: ProductPayload): Promise<Product> => {
  try {
    const response = await apiClient.put<Product>(`/products/${id}`, productData);
    return response.data;
  } catch (error: any) {
    console.error(`Ошибка при обновлении товара ${id}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Не удалось обновить товар');
  }
};

// Функция для удаления товара
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/products/${id}`);
  } catch (error: any) {
    // console.error(`Ошибка при удалении товара ${id}:`, error.response?.data || error.message); // Убираем console.error отсюда
    // Бэкенд возвращает 400 если товар используется в заказах, или 404 если не найден.
    // Компонент UI будет решать, как отобразить ошибку.
    // Пробрасываем оригинальную ошибку axios, чтобы иметь доступ к status code
    return Promise.reject(error);
  }
};