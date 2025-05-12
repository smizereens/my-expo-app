import { useState, useEffect, useCallback } from 'react'; // Добавляем useCallback
import { View, Text, Dimensions, ActivityIndicator } from 'react-native'; // Добавляем ActivityIndicator
import { Ionicons } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Card } from '~/components/Card';
import { fetchOrders, OrderFromList } from '~/services/orderService'; // Импортируем сервис
import { OrderStatus } from '~/components/OrderCard'; // Импортируем OrderStatus для сравнения

// Placeholder for a charting library component
// In a real application, you would use a charting library like react-native-svg-charts or Victory Native
const BarChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <View className="h-56 flex-row items-end justify-between pt-5 pb-2">
      {data.map((item, index) => {
        const heightPercentage = (item.value / maxValue) * 100;
        
        return (
          <View key={index} className="items-center">
            <View 
              className="w-8 rounded-t-lg mb-1" 
              style={{ 
                height: `${heightPercentage}%`, 
                backgroundColor: item.color 
              }} 
            />
            <Text className="text-xs text-neutral-500">{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

// Placeholder for a charting library component
const LineChart = ({ data }: { data: { date: string; value: number }[] }) => {
  // Simplified placeholder for line chart
  return (
    <View className="h-56 justify-center items-center">
      <Text className="text-neutral-400">
        Линейная диаграмма (В реальном приложении здесь будет график)
      </Text>
    </View>
  );
};

// Placeholder for a charting library component
const PieChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  // Simplified placeholder for pie chart
  return (
    <View className="h-56 justify-center items-center">
      <View className="w-32 h-32 rounded-full bg-neutral-200 items-center justify-center">
        <Text className="text-neutral-400 text-center">
          Круговая диаграмма (В реальном приложении)
        </Text>
      </View>
      
      <View className="flex-row flex-wrap justify-center mt-4">
        {data.map((item, index) => (
          <View key={index} className="flex-row items-center mr-4 mb-2">
            <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: item.color }} />
            <Text className="text-xs text-neutral-700">{item.label}: {item.value}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Определяем тип для агрегированной статистики
type CalculatedStats = {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  // conversionRate: number; // Пропускаем для MVP
};

export default function StatsScreen() {
  const [stats, setStats] = useState<CalculatedStats>({
    totalRevenue: 0,
    orderCount: 0,
    averageOrderValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Демо-данные для диаграмм оставляем пока что, т.к. их расчет сложен для MVP
  const monthlyData = [
    { label: 'Янв', value: 12500, color: '#4F46E5' }, { label: 'Фев', value: 17800, color: '#4F46E5' },
    { label: 'Мар', value: 21300, color: '#4F46E5' }, { label: 'Апр', value: 19200, color: '#4F46E5' },
    { label: 'Май', value: 25400, color: '#4F46E5' }, { label: 'Июн', value: 22900, color: '#4F46E5' },
  ];
  const weeklyData = [
    { date: 'Пн', value: 2100 }, { date: 'Вт', value: 3200 }, { date: 'Ср', value: 2800 },
    { date: 'Чт', value: 3900 }, { date: 'Пт', value: 4200 }, { date: 'Сб', value: 3500 }, { date: 'Вс', value: 2700 },
  ];
  const categoryData = [
    { label: 'Категория 1', value: 35, color: '#4F46E5' }, { label: 'Категория 2', value: 25, color: '#0EA5E9' },
    { label: 'Категория 3', value: 20, color: '#FB923C' }, { label: 'Категория 4', value: 15, color: '#10B981' },
    { label: 'Другое', value: 5, color: '#6B7280' },
  ];
  // Демо-конверсию оставляем, т.к. ее не считаем
  const demoConversionRate = 4.2;


  const loadStatsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiOrders = await fetchOrders(); // Загружаем все заказы
      
      const orderCount = apiOrders.length;
      
      const completedOrders = apiOrders.filter(o => o.status === 'COMPLETED'); // Используем строковый литерал
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      const averageOrderValue = completedOrders.length > 0
        ? totalRevenue / completedOrders.length
        : 0;
      
      setStats({ totalRevenue, orderCount, averageOrderValue });

    } catch (err) {
      console.error("Ошибка загрузки данных для статистики:", err);
      setError('Не удалось загрузить данные для статистики.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatsData();
  }, [loadStatsData]);

  if (isLoading) {
    return (
      <Container>
        <Header title="Статистика" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header title="Ошибка" />
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <Text className="text-red-500 text-lg mt-4 text-center">{error}</Text>
          {/* Можно добавить кнопку "Попробовать снова", если нужно */}
        </View>
      </Container>
    );
  }

  return (
    <Container scrollable padded={false}>
      <Header title="Статистика" />
      
      <View className="p-4">
        {/* Ключевые показатели */}
        <View className="flex-row flex-wrap -mx-2 mb-4">
          <View className="w-1/2 px-2 mb-3">
            <Card>
              <View>
                <Text className="text-neutral-500 text-xs">Выручка</Text>
                <Text className="text-xl font-bold text-neutral-900 mt-1">
                  {stats.totalRevenue.toLocaleString()} ₽
                </Text>
              </View>
            </Card>
          </View>
          
          <View className="w-1/2 px-2 mb-3">
            <Card>
              <View>
                <Text className="text-neutral-500 text-xs">Заказов</Text>
                <Text className="text-xl font-bold text-neutral-900 mt-1">
                  {stats.orderCount}
                </Text>
              </View>
            </Card>
          </View>
          
          <View className="w-1/2 px-2">
            <Card>
              <View>
                <Text className="text-neutral-500 text-xs">Средний чек</Text>
                <Text className="text-xl font-bold text-neutral-900 mt-1">
                  {stats.averageOrderValue.toLocaleString()} ₽
                </Text>
              </View>
            </Card>
          </View>
          
          <View className="w-1/2 px-2">
            <Card>
              <View>
                <Text className="text-neutral-500 text-xs">Конверсия</Text>
                <Text className="text-xl font-bold text-neutral-900 mt-1">
                  {demoConversionRate}% {/* Используем демо-конверсию */}
                </Text>
              </View>
            </Card>
          </View>
        </View>
        
        {/* Месячная выручка */}
        <Card title="Выручка по месяцам" className="mb-4">
          <BarChart data={monthlyData} />
        </Card>
        
        {/* Недельная статистика */}
        <Card title="Статистика за неделю" className="mb-4">
          <LineChart data={weeklyData} />
        </Card>
        
        {/* Распределение по категориям */}
        <Card title="Распределение по категориям" className="mb-10">
          <PieChart data={categoryData} />
        </Card>
      </View>
    </Container>
  );
}
