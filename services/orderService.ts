import apiClient from './api';
import { Product as UiProduct } from '~/app/new-order'; // Импортируем тип Product из new-order для selectedProducts

// Тип для элемента заказа, отправляемого на бэкенд
interface OrderItemPayload {
  productId: string;
  quantity: number;
}

// Тип для данных заказа, отправляемых на бэкенд
interface CreateOrderPayload {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;
  items: OrderItemPayload[];
}

// Тип для ответа от сервера при создании заказа (можно уточнить на основе реального ответа)
// Предполагаем, что он соответствует структуре, которую мы видели при тестировании бэкенда
interface CreatedOrderResponse {
  id: string;
  displayId: string;
  // ... другие поля заказа, если они нужны после создания на фронте
}

export const createOrder = async (orderData: CreateOrderPayload): Promise<CreatedOrderResponse> => {
  try {
    const response = await apiClient.post<CreatedOrderResponse>('/orders', orderData);
    return response.data;
  } catch (error: any) {
    console.error('Ошибка при создании заказа:', error.response?.data || error.message);
    throw error.response?.data || new Error('Не удалось создать заказ');
  }
};

// Тип для заказа, как он приходит из списка (с itemCount)
export interface OrderFromList {
  id: string;
  displayId: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  status: string; // OrderStatus enum
  totalAmount: number;
  note?: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  itemCount: number;
}

interface FetchOrdersParams {
  status?: string; // OrderStatus enum
  search?: string;
}

// Функция для получения списка заказов
export const fetchOrders = async (params?: FetchOrdersParams): Promise<OrderFromList[]> => {
  try {
    const response = await apiClient.get<OrderFromList[]>('/orders', { params });
    return response.data;
  } catch (error: any) {
    console.error('Ошибка при загрузке списка заказов:', error.response?.data || error.message);
    throw error.response?.data || new Error('Не удалось загрузить список заказов');
  }
};

// Тип для товара внутри позиции заказа (детали)
interface OrderItemProductDetails {
  id: string;
  name: string;
  price: number; // Это текущая цена товара, не priceAtPurchase
}

// Тип для позиции заказа в деталях заказа
export interface OrderItemDetails {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: OrderItemProductDetails; // Детали связанного товара
  // createdAt, updatedAt - если нужны
}

// Тип для детального заказа, как он приходит с бэкенда
export interface OrderDetails extends Omit<OrderFromList, 'itemCount'> {
  items: OrderItemDetails[];
}

// Функция для получения деталей заказа
export const fetchOrderDetails = async (orderId: string): Promise<OrderDetails> => {
  try {
    const response = await apiClient.get<OrderDetails>(`/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Ошибка при загрузке деталей заказа ${orderId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Не удалось загрузить детали заказа');
  }
};

// Тип для статуса заказа, используемый в UI (должен быть синхронизирован с OrderStatus в OrderCard.tsx)
// 'NEW' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
type UiOrderStatus = string; // Используем string для простоты, т.к. OrderStatus из OrderCard уже типизирован

// Функция для обновления статуса заказа
export const updateOrderStatus = async (orderId: string, status: UiOrderStatus): Promise<OrderDetails> => {
  try {
    const response = await apiClient.put<OrderDetails>(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error: any) {
    console.error(`Ошибка при обновлении статуса заказа ${orderId} на ${status}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Не удалось обновить статус заказа');
  }
};