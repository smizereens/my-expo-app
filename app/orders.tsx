import { useState, useEffect, useCallback } from 'react'; // Добавляем useCallback
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native'; // Добавляем ActivityIndicator
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Badge } from '~/components/Badge';
// Order и OrderStatus из OrderCard должны быть совместимы с OrderFromList
// или OrderFromList нужно адаптировать для OrderCard
import { OrderCard, Order as UiOrder, OrderStatus } from '~/components/OrderCard';
import { fetchOrders, OrderFromList } from '~/services/orderService';

// Убираем generateOrders

// Сопоставляем OrderFromList с UiOrder, если необходимо, или используем OrderFromList напрямую в OrderCard
// Для простоты предположим, что OrderFromList достаточно совместим с UiOrder
// или что OrderCard может принять OrderFromList.
// Если нет, здесь нужна функция-маппер.
// Важно: поле items в UiOrder было number, а в OrderFromList это itemCount.
// Поле total в UiOrder было number, в OrderFromList это totalAmount.
// Поле createdAt в UiOrder было Date, в OrderFromList это string.

const mapApiOrderToUiOrder = (apiOrder: OrderFromList): UiOrder => ({
  id: apiOrder.displayId, // Используем displayId для отображения, но id для навигации
  internalId: apiOrder.id, // Сохраняем реальный UUID для навигации
  customerName: apiOrder.customerName,
  total: apiOrder.totalAmount,
  items: apiOrder.itemCount, // Используем itemCount
  createdAt: new Date(apiOrder.createdAt), // Преобразуем строку в Date
  status: apiOrder.status as OrderStatus, // Приводим к локальному типу статуса
});


export default function OrdersScreen() {
  const [allOrders, setAllOrders] = useState<UiOrder[]>([]); // Для подсчета в фильтрах
  const [displayedOrders, setDisplayedOrders] = useState<UiOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all'); // OrderStatus теперь 'NEW', 'PROCESSING' и т.д.
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

      // Для подсчета в фильтрах, загрузим все заказы один раз или при сбросе фильтров
      // Это не оптимально, если заказов очень много.
      // В идеале, API должен возвращать и количество по статусам.
      // Пока что, если фильтр или поиск активны, счетчики могут быть неточными
      // или мы загружаем все заказы для точного подсчета.
      // Для MVP можно упростить: загружать все при 'all' и считать.
      if (activeFilter === 'all' && searchQuery.trim() === '') {
        setAllOrders(apiOrders.map(mapApiOrderToUiOrder));
      } else if (allOrders.length === 0) { // Загрузить все, если еще не загружены
        const allApiOrders = await fetchOrders();
        setAllOrders(allApiOrders.map(mapApiOrderToUiOrder));
      }

    } catch (err) {
      console.error("Ошибка загрузки заказов:", err);
      setError('Не удалось загрузить заказы.');
      setDisplayedOrders([]); // Очищаем список при ошибке
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchQuery, allOrders.length]); // Добавляем allOrders.length в зависимости

  useEffect(() => {
    loadOrders();
  }, [loadOrders]); // Вызываем loadOrders при изменении activeFilter или searchQuery

  // Обновляем подсчет для фильтров на основе allOrders
  const filters: { label: string; value: OrderStatus | 'all'; count: number }[] = [
    { label: 'Все', value: 'all', count: allOrders.length },
    { label: 'Новые', value: 'NEW', count: allOrders.filter(o => o.status === 'NEW').length },
    { label: 'В работе', value: 'PROCESSING', count: allOrders.filter(o => o.status === 'PROCESSING').length },
    { label: 'Готовые', value: 'COMPLETED', count: allOrders.filter(o => o.status === 'COMPLETED').length },
    { label: 'Отменены', value: 'CANCELLED', count: allOrders.filter(o => o.status === 'CANCELLED').length },
    // Можно добавить фильтр для ARCHIVED, если нужно
    // { label: 'Архивные', value: 'ARCHIVED', count: allOrders.filter(o => o.status === 'ARCHIVED').length },
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
            // Вычисляем минимальную ширину для каждого фильтра
            const minWidth = item.label === 'В работе' ? 90 : item.label === 'Готовые' ? 90 : item.label === 'Отменены' ? 90 : 60;
            
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setActiveFilter(item.value)}
                style={{minHeight: 31}}
                className={`px-3 py-2 mr-2 rounded-full border ${
                  activeFilter === item.value ? 'bg-primary-50 border-primary-200' : 'bg-white border-neutral-200'
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Text 
                    className={`font-medium text-center ${
                      activeFilter === item.value ? 'text-primary-700' : 'text-neutral-700'
                    }`}
                    numberOfLines={1}
                    style={{ fontSize: 13 }}
                  >
                    {item.label}
                  </Text>
                  <View 
                    className={`ml-1.5 px-1.5 rounded-full ${
                      activeFilter === item.value ? 'bg-primary-100' : 'bg-neutral-100'
                    }`}
                  >
                    <Text 
                      className={`text-xs font-medium ${
                        activeFilter === item.value ? 'text-primary-700' : 'text-neutral-600'
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
                  // Используем internalId (реальный UUID) для навигации к деталям
                  params: { id: order.internalId }
                })}
              />
            )}
            keyExtractor={(item) => item.internalId || item.id} // Используем internalId если есть
            contentContainerStyle={{ paddingBottom: 193 }}
          />
        ) : (
          <View className="items-center justify-center py-16">
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text className="text-neutral-500 text-base mt-2">Нет заказов</Text>
            <Text className="text-neutral-400 text-sm text-center mt-1">
              Попробуйте изменить параметры поиска или фильтры
            </Text>
          </View>
        )}
      </View>
    </Container>
  );
}