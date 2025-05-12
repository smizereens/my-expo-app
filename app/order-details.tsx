import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Card } from '~/components/Card';
import { Badge } from '~/components/Badge';
import { Button } from '~/components/Button';
import { OrderStatus } from '~/components/OrderCard';
import { fetchOrderDetails, updateOrderStatus, OrderDetails as ApiOrderDetails } from '~/services/orderService'; // Добавляем updateOrderStatus

// Убираем локальные типы OrderItem и OrderDetails, будем использовать ApiOrderDetails
// Убираем демо-функцию getOrderDetails

// Функция для получения параметров бейджа на основе статуса (уже должна быть обновлена в OrderCard.tsx, но дублируется здесь)
// Лучше импортировать ее из общего места или OrderCard.tsx, если она там export const
const getStatusBadgeProps = (status?: OrderStatus) => { // Делаем status опциональным на случай если order еще null
  if (!status) return { label: 'Загрузка...', variant: 'default' as const };
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
      return { label: 'Архивирован', variant: 'default' as const };
    default:
      return { label: String(status) || 'Неизвестно', variant: 'default' as const };
  }
};

// Функция для форматирования даты (оставляем)
const formatDate = (dateString: string | Date) => { // Принимаем строку или Date
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function OrderDetailsScreen() {
  const { id: orderId } = useLocalSearchParams<{ id: string }>(); // Переименовываем id в orderId для ясности
  const [order, setOrder] = useState<ApiOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Состояние для индикации обновления статуса
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);


  const loadOrderDetails = useCallback(async () => {
    if (!orderId) {
      setError("ID заказа не найден.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderDetails(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error("Ошибка загрузки деталей заказа:", err);
      setError(err.message || 'Не удалось загрузить детали заказа.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => { // Делаем асинхронной
    if (!order || !orderId) return;
    
    Alert.alert(
      'Обновление статуса',
      `Изменить статус заказа на "${getStatusBadgeProps(newStatus).label}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Обновить',
          onPress: async () => {
            setIsUpdatingStatus(true);
            try {
              console.log(`[ фронтенд ]: Попытка обновить статус заказа ${orderId} на ${newStatus}`);
              const updatedOrderData = await updateOrderStatus(orderId, newStatus);
              setOrder(updatedOrderData); // Обновляем состояние заказа данными с сервера
              console.log(`[ фронтенд ]: Статус заказа ${orderId} успешно обновлен на ${newStatus}. Ответ сервера:`, updatedOrderData);
              Alert.alert('Успех', `Статус заказа #${updatedOrderData.displayId} обновлен на "${getStatusBadgeProps(newStatus).label}".`);
            } catch (updateError: any) {
              console.error(`[ фронтенд ]: Ошибка при обновлении статуса заказа ${orderId} на ${newStatus}:`, updateError);
              Alert.alert('Ошибка обновления статуса', updateError.message || 'Не удалось обновить статус заказа.');
              // Можно добавить логику отката локального изменения статуса, если оно было сделано оптимистично
              // или перезагрузить детали заказа, чтобы получить актуальное состояние с сервера:
              // await loadOrderDetails();
            } finally {
              setIsUpdatingStatus(false);
            }
          }
        }
      ]
    );
  };
  
  if (loading) { // Показываем индикатор загрузки на весь экран
    return (
      <Container>
        <Header title="Детали заказа" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </Container>
    );
  }

  if (error) { // Показываем ошибку на весь экран
    return (
      <Container>
        <Header title="Ошибка" showBackButton />
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <Text className="text-red-500 text-lg mt-4 text-center">{error}</Text>
          <Button title="Попробовать снова" onPress={loadOrderDetails} className="mt-6" />
        </View>
      </Container>
    );
  }

  if (!order) { // Если нет ни загрузки, ни ошибки, но заказа нет (маловероятно, но для полноты)
    return (
      <Container>
        <Header title="Детали заказа" showBackButton />
        <View className="flex-1 items-center justify-center">
          <Text className="text-neutral-500">Заказ не найден.</Text>
        </View>
      </Container>
    );
  }

  const badgeProps = getStatusBadgeProps(order.status as OrderStatus); // Приводим к типу OrderStatus из OrderCard
  // Логика кнопок на основе строковых значений статусов
  const canProcessOrder = order.status === 'NEW';
  const canCompleteOrder = order.status === 'PROCESSING';
  const canCancelOrder = (['NEW', 'PROCESSING'] as OrderStatus[]).includes(order.status as OrderStatus);
  // Добавляем возможность архивации
  const canArchiveOrder = (['COMPLETED', 'CANCELLED'] as OrderStatus[]).includes(order.status as OrderStatus);


  return (
    <Container scrollable padded={false}>
      <Header
        title={`Заказ #${order.displayId}`} // Используем displayId
        showBackButton
        rightAction={
          <TouchableOpacity 
            className="p-2" 
            onPress={() => {
              // Здесь будет логика печати/экспорта заказа
              Alert.alert('Экспорт', 'Функция экспорта заказа в разработке');
            }}
          >
            <Ionicons name="share-outline" size={24} color="#374151" />
          </TouchableOpacity>
        }
      />
      
      <View className="p-4">
        {/* Информация о заказе */}
        <Card>
          <View className="flex-row justify-between items-center mb-3">
            <View>
              {/* <Text className="text-neutral-500 text-xs">Заказ #{order.id}</Text> Убрали, т.к. displayId в заголовке */}
              <Text className="text-xl font-semibold text-neutral-900 mt-1">{order.customerName}</Text>
            </View>
            <Badge {...badgeProps} size="lg" />
          </View>
          
          <View className="border-t border-neutral-100 pt-3">
            <Text className="text-neutral-500 text-xs mb-1">Контактная информация</Text>
            
            {order.customerPhone && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text className="ml-2 text-neutral-800">{order.customerPhone}</Text>
            </View>
            )}
            
            {order.customerEmail && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text className="ml-2 text-neutral-800">{order.customerEmail}</Text>
            </View>
            )}
            
            <View className="flex-row items-center mt-1">
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text className="ml-2 text-neutral-800">{formatDate(order.createdAt)}</Text>
            </View>
          </View>
        </Card>
        
        {/* Товары в заказе */}
        <Card title="Товары" className="mt-4">
          {order.items.map((item) => (
            <View 
              key={item.id} 
              className="flex-row justify-between py-3 border-b border-neutral-100 last:border-b-0"
            >
              <View className="flex-1">
                <Text className="text-neutral-900 font-medium">{item.product.name}</Text>
                <Text className="text-neutral-500 text-sm">{item.priceAtPurchase.toLocaleString()} ₽ × {item.quantity}</Text>
              </View>
              <Text className="text-neutral-900 font-semibold">
                {(item.priceAtPurchase * item.quantity).toLocaleString()} ₽
              </Text>
            </View>
          ))}
          
          <View className="pt-2 mt-2 border-t border-neutral-200">
            <View className="flex-row justify-between">
              <Text className="text-neutral-700">Общее количество:</Text>
              <Text className="text-neutral-900 font-medium">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-lg font-semibold text-neutral-900">Итого:</Text>
              <Text className="text-lg font-bold text-primary-600">
                {order.totalAmount.toLocaleString()} ₽
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Примечания к заказу */}
        {order.note && ( // Используем order.note с бэкенда
          <Card title="Примечания" className="mt-4">
            <Text className="text-neutral-700">{order.note}</Text>
          </Card>
        )}
        
        {/* Действия с заказом */}
        <View className="mt-6 space-y-3 mb-10">
          {canProcessOrder && (
            <Button
              title="Начать обработку"
              variant="filled"
              icon={<Ionicons name="play" size={18} color="white" />}
              onPress={() => handleUpdateStatus('PROCESSING')}
              loading={isUpdatingStatus}
              disabled={isUpdatingStatus}
            />
          )}
          
          {canCompleteOrder && (
            <Button
              title="Отметить как выполненный"
              variant="filled"
              icon={<Ionicons name="checkmark-circle" size={18} color="white" />}
              onPress={() => handleUpdateStatus('COMPLETED')}
              loading={isUpdatingStatus}
              disabled={isUpdatingStatus}
            />
          )}
          
          {canCancelOrder && (
            <Button
              title="Отменить заказ"
              variant="outlined" // Можно сделать "danger" если есть такой вариант
              icon={<Ionicons name="close-circle" size={18} color="#EF4444" />} // Красный для отмены
              onPress={() => handleUpdateStatus('CANCELLED')}
              loading={isUpdatingStatus}
              disabled={isUpdatingStatus}
            />
          )}
          {/* Кнопка архивации */}
          {canArchiveOrder && (
            <Button
              title="Архивировать заказ"
              variant="outlined"
              icon={<Ionicons name="archive" size={18} color="#6B7280" />}
              onPress={() => handleUpdateStatus('ARCHIVED')}
              loading={isUpdatingStatus}
              disabled={isUpdatingStatus}
            />
          )}
        </View>
      </View>
    </Container>
  );
}
