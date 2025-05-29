import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Card } from '~/components/Card';
import { Button } from '~/components/Button';
import { OrderCard, Order as UiOrder, OrderStatus } from '~/components/OrderCard';
import { fetchOrders, OrderFromList } from '~/services/orderService';

// Функция маппинга, аналогичная той, что в app/orders.tsx
const mapApiOrderToUiOrder = (apiOrder: OrderFromList): UiOrder => ({
  id: apiOrder.displayId,
  internalId: apiOrder.id,
  customerName: apiOrder.customerName,
  total: apiOrder.totalAmount,
  items: apiOrder.itemCount,
  createdAt: new Date(apiOrder.createdAt),
  status: apiOrder.status as OrderStatus,
});

// Статистика для дашборда
type DashboardStats = {
  totalOrders: number;
  newOrders: number;
  completedOrders: number;
  revenue: number;
};

export default function Home() {
  const [allOrders, setAllOrders] = useState<UiOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    newOrders: 0,
    completedOrders: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiOrders = await fetchOrders(); // Загружаем все заказы без фильтров
      const uiOrders = apiOrders.map(mapApiOrderToUiOrder);
      setAllOrders(uiOrders);
      
      const totalOrders = uiOrders.length;
      const newOrders = uiOrders.filter(o => o.status === 'NEW').length;
      const completedOrders = uiOrders.filter(o => o.status === 'COMPLETED').length;
      const revenue = uiOrders
        .filter(o => o.status === 'COMPLETED')
        .reduce((sum, order) => sum + order.total, 0);
      
      setStats({ totalOrders, newOrders, completedOrders, revenue });
    } catch (err) {
      console.error("Ошибка загрузки данных для главной страницы:", err);
      setError('Не удалось загрузить данные.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const recentOrders = allOrders
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  // Создаем данные для FlatList (статистика + заказы)
  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <Text className="text-red-500 text-lg mt-4 text-center">{error}</Text>
          <Button title="Попробовать снова" onPress={loadDashboardData} className="mt-6" />
        </View>
      );
    }

    return (
      <FlatList
        data={[{ type: 'content' }]} // Фиктивные данные для FlatList
        renderItem={() => (
          <View className="p-4">
            <Text className="text-xl font-bold text-neutral-900 mb-4">Обзор</Text>
            {/* Карточки со статистикой */}
            <View className="flex-row flex-wrap -mx-2">
              <StatCard 
                title="Всего заказов"
                value={stats.totalOrders.toString()}
                icon="document-text-outline"
                color="primary"
                className="w-1/2"
              />
              <StatCard 
                title="Новых"
                value={stats.newOrders.toString()}
                icon="hourglass-outline"
                color="info"
                className="w-1/2" 
              />
              <StatCard 
                title="Выполнено"
                value={stats.completedOrders.toString()}
                icon="checkmark-circle-outline"
                color="success"
                className="w-1/2"
              />
              <StatCard 
                title="Выручка"
                value={`${stats.revenue.toLocaleString()} ₽`}
                icon="cash-outline"
                color="accent"
                className="w-1/2"
              />
            </View>

            {/* Последние заказы */}
            <View className="mt-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-semibold text-neutral-900">Последние заказы</Text>
                <TouchableOpacity onPress={() => router.push('/orders')}>
                  <Text className="text-primary-600 font-medium text-sm">Все заказы</Text>
                </TouchableOpacity>
              </View>

              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <OrderCard 
                    key={order.internalId || order.id}
                    order={order} 
                    onPress={() => router.push({
                      pathname: '/order-details',
                      params: { id: order.internalId || order.id } 
                    })}
                  />
                ))
              ) : (
                <Text className="text-neutral-500 text-center py-8">Нет недавних заказов.</Text>
              )}
            </View>
          </View>
        )}
        keyExtractor={() => 'content'}
        contentContainerStyle={{ paddingBottom: 0 }}
      />
    );
  };

  return (
    <Container padded={false}>
      <Header 
        title="Управление заказами" 
        rightAction={
          <TouchableOpacity className="p-2" onPress={() => { /* TODO: Navigate to notifications */ }}>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            {/* Можно добавить реальный счетчик уведомлений, если будет такая логика */}
            {/* <View className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2" /> */}
          </TouchableOpacity>
        } 
      />

      {renderContent()}
    </Container>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  className?: string;
};

const StatCard = ({ title, value, icon, color, className }: StatCardProps) => {
  const colorMap = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-sky-100 text-sky-800',
    accent: 'bg-orange-100 text-orange-800',
  };

  const [bgColor, textColor] = colorMap[color].split(' ');

  return (
    <View className={`p-2 ${className}`}>
      <Card>
        <View className="flex-row items-center">
          <View className={`w-10 h-10 ${bgColor} rounded-full items-center justify-center mr-3`}>
            <Ionicons name={icon} size={18} color={textColor.replace('text-', '')} />
          </View>
          <View>
            <Text className="text-neutral-500 text-xs">{title}</Text>
            <Text className="text-lg font-bold text-neutral-900">{value}</Text>
          </View>
        </View>
      </Card>
    </View>
  );
};
