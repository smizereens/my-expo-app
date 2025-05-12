import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Badge } from './Badge';

// Тип статуса заказа (должен соответствовать Prisma Enum)
export type OrderStatus = 'NEW' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

// Модель заказа
export type Order = {
  id: string; // Это будет displayId
  internalId?: string; // Реальный UUID для навигации и ключей
  customerName: string;
  total: number;
  items: number;
  createdAt: Date;
  status: OrderStatus;
};

type OrderCardProps = {
  order: Order;
  onPress?: (order: Order) => void;
};

// Функция для получения параметров бейджа на основе статуса
const getStatusBadgeProps = (status: OrderStatus) => {
  switch (status) {
    case 'NEW':
      return { label: 'Новый', variant: 'info' as const };
    case 'PROCESSING':
      return { label: 'В работе', variant: 'warning' as const };
    case 'COMPLETED':
      return { label: 'Готов', variant: 'success' as const };
    case 'CANCELLED':
      return { label: 'Отменен', variant: 'error' as const };
    case 'ARCHIVED':
      return { label: 'Архивирован', variant: 'default' as const }; // Или другой цвет для архива
    default:
      // Если статус не соответствует ни одному из известных, отображаем "Неизвестно"
      // Этого не должно происходить, если данные с бэкенда всегда корректны.
      return { label: String(status) || 'Неизвестно', variant: 'default' as const };
  }
};

// Функция для форматирования даты
const formatDate = (date: Date) => {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const OrderCard = ({ order, onPress }: OrderCardProps) => {
  const { id, customerName, total, items, createdAt, status } = order;
  const badgeProps = getStatusBadgeProps(status);
  
  return (
    <TouchableOpacity
      onPress={() => onPress?.(order)}
      className="bg-white rounded-xl shadow-sm shadow-neutral-200 p-4 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-neutral-500 text-xs mb-1">Заказ #{id}</Text>
          <Text className="text-base font-semibold text-neutral-900">{customerName}</Text>
        </View>
        <Badge {...badgeProps} />
      </View>
      
      <View className="flex-row justify-between mt-3">
        <View>
          <Text className="text-neutral-500 text-xs">Позиций</Text>
          <Text className="text-base font-medium text-neutral-800">{items}</Text>
        </View>
        <View>
          <Text className="text-neutral-500 text-xs">Сумма</Text>
          <Text className="text-base font-medium text-neutral-800">{total.toLocaleString()} ₽</Text>
        </View>
        <View>
          <Text className="text-neutral-500 text-xs">Дата</Text>
          <Text className="text-xs text-neutral-800">{formatDate(createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
