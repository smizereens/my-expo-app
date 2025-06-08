// app/orders.tsx - обновленная версия с фильтром архива

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Badge } from '~/components/Badge';
import { OrderCard, Order as UiOrder, OrderStatus } from '~/components/OrderCard';
import { fetchOrders, OrderFromList } from '~/services/orderService';

// Маппинг OrderFromList к UiOrder
const mapApiOrderToUiOrder = (apiOrder: OrderFromList): UiOrder => ({
  id: apiOrder.displayId,
  internalId: apiOrder.id,
  customerName: apiOrder.customerName,
  total: apiOrder.totalAmount,
  items: apiOrder.itemCount,
  createdAt: new Date(apiOrder.createdAt),
  status: apiOrder.status as OrderStatus,
});

export default function OrdersScreen() {
  const [allOrders, setAllOrders] = useState<UiOrder[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<UiOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { status?: string; search?: string } = {};
      if (activeFilter !== 'all') {
        params.status = activeFilter;
      }
      if (searchQuery.trim() !== '') {
        params.search = searchQuery.trim();
      }
      
      const apiOrders = await fetchOrders(params);
      setDisplayedOrders(apiOrders.map(mapApiOrderToUiOrder));

      // Для подсчета в фильтрах, загружаем все заказы
      if (activeFilter === 'all' && searchQuery.trim() === '') {
        setAllOrders(apiOrders.map(mapApiOrderToUiOrder));
      } else if (allOrders.length === 0) {
        const allApiOrders = await fetchOrders();
        setAllOrders(allApiOrders.map(mapApiOrderToUiOrder));
      }

    } catch (err) {
      console.error("Ошибка загрузки заказов:", err);
      setError('Не удалось загрузить заказы.');
      setDisplayedOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchQuery, allOrders.length]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Обновленные фильтры с архивом
  const filters: { label: string; value: OrderStatus | 'all'; count: number; isArchive?: boolean }[] = [
    { label: 'Все', value: 'all', count: allOrders.length },
    { label: 'Новые', value: 'NEW', count: allOrders.filter(o => o.status === 'NEW').length },
    { label: 'В работе', value: 'PROCESSING', count: allOrders.filter(o => o.status === 'PROCESSING').length },
    { label: 'Готовые', value: 'COMPLETED', count: allOrders.filter(o => o.status === 'COMPLETED').length },
    { label: 'Отменены', value: 'CANCELLED', count: allOrders.filter(o => o.status === 'CANCELLED').length },
    { label: 'Архив', value: 'ARCHIVED', count: allOrders.filter(o => o.status === 'ARCHIVED').length, isArchive: true },
  ];

  return (
    <Container padded={false}>
      <Header title="Заказы" />
      
      <View className="px-4 pb-4">
        {/* Поиск */}
        <View className="flex-row items-center bg-white border border-neutral-200 rounded-lg px-3 py-2 mt-2">
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-neutral-900"
            placeholder="Поиск заказов..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Фильтры */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="py-3"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {filters.map((item) => {
            const isActive = activeFilter === item.value;
            const isArchiveFilter = item.isArchive;
            
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setActiveFilter(item.value)}
                style={{minHeight: 31}}
                className={`px-3 py-2 mr-2 rounded-full border ${
                  isActive 
                    ? isArchiveFilter 
                      ? 'bg-neutral-50 border-neutral-300' 
                      : 'bg-primary-50 border-primary-200'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <View className="flex-row items-center justify-center">
                  {isArchiveFilter && (
                    <Ionicons 
                      name="archive-outline" 
                      size={12} 
                      color={isActive ? '#374151' : '#6B7280'} 
                      style={{ marginRight: 4 }} 
                    />
                  )}
                  <Text 
                    className={`font-medium text-center ${
                      isActive 
                        ? isArchiveFilter 
                          ? 'text-neutral-700' 
                          : 'text-primary-700'
                        : 'text-neutral-700'
                    }`}
                    numberOfLines={1}
                    style={{ fontSize: 13 }}
                  >
                    {item.label}
                  </Text>
                  <View 
                    className={`ml-1.5 px-1.5 rounded-full ${
                      isActive 
                        ? isArchiveFilter 
                          ? 'bg-neutral-200' 
                          : 'bg-primary-100'
                        : 'bg-neutral-100'
                    }`}
                  >
                    <Text 
                      className={`text-xs font-medium ${
                        isActive 
                          ? isArchiveFilter 
                            ? 'text-neutral-700' 
                            : 'text-primary-700'
                          : 'text-neutral-600'
                      }`}
                    >
                      {item.count}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Список заказов */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#4F46E5" className="my-16" />
        ) : error ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
            <Text className="text-red-500 text-base mt-2">{error}</Text>
            <Text className="text-neutral-400 text-sm text-center mt-1">
              Проверьте ваше интернет-соединение или попробуйте позже.
            </Text>
          </View>
        ) : displayedOrders.length > 0 ? (
          <FlatList
            data={displayedOrders}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onPress={(order) => router.push({
                  pathname: '/order-details',
                  params: { id: order.internalId }
                })}
              />
            )}
            keyExtractor={(item) => item.internalId || item.id}
            contentContainerStyle={{ paddingBottom: 193 }}
          />
        ) : (
          <View className="items-center justify-center py-16">
            <Ionicons 
              name={activeFilter === 'ARCHIVED' ? 'archive-outline' : 'document-text-outline'} 
              size={48} 
              color="#9CA3AF" 
            />
            <Text className="text-neutral-500 text-base mt-2">
              {activeFilter === 'ARCHIVED' ? 'Нет архивированных заказов' : 'Нет заказов'}
            </Text>
            <Text className="text-neutral-400 text-sm text-center mt-1">
              {activeFilter === 'ARCHIVED' 
                ? 'Архивированные заказы появятся здесь'
                : 'Попробуйте изменить параметры поиска или фильтры'
              }
            </Text>
          </View>
        )}
      </View>
    </Container>
  );
}
