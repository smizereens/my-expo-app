import { useState, useEffect } from 'react'; // Добавляем useEffect
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native'; // Добавляем ActivityIndicator
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createOrder } from '~/services/orderService'; // Импортируем сервис создания заказа

import { Container } from '~/components/Container';
import { Header } from '~/components/Header';
import { Input } from '~/components/Input';
import { Button } from '~/components/Button';
import { Card } from '~/components/Card';
import { fetchProducts, Product as ApiProduct } from '~/services/productService'; // Импортируем сервис и тип
 
// Локальный тип продукта для UI, включая количество
export type Product = { // Добавляем export
  id: string;
  name: string;
  price: number;
  quantity: number;
};

// Убираем заглушку demoProducts

export default function NewOrderScreen() {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [products, setProducts] = useState<Product[]>([]); // Начальное состояние - пустой массив
  const [isLoadingProducts, setIsLoadingProducts] = useState(true); // Состояние для загрузки
  const [productLoadError, setProductLoadError] = useState<string | null>(null); // Состояние для ошибки загрузки
  const [note, setNote] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false); // Состояние для индикатора создания заказа

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductLoadError(null);
        const apiProducts = await fetchProducts();
        const uiProducts = apiProducts.map(p => ({
          ...p,
          description: p.description ?? '', // Убедимся, что description не null для UI, если нужно
          quantity: 0 // Добавляем начальное количество
        }));
        setProducts(uiProducts);
      } catch (error) {
        console.error("Ошибка загрузки товаров:", error);
        setProductLoadError('Не удалось загрузить список товаров. Попробуйте позже.');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const selectedProducts = products.filter(p => p.quantity > 0);
  const totalAmount = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const isFormValid = customerName.trim() !== '' && selectedProducts.length > 0;

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, quantity: Math.max(0, quantity) } 
        : p
    ));
  };

  const handleCreateOrder = async () => { // Делаем функцию асинхронной
    if (!isFormValid) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните имя клиента и выберите хотя бы один товар.');
      return;
    }

    setIsCreatingOrder(true); // Включаем индикатор

    const orderPayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined, // Отправляем undefined если пусто
      customerEmail: customerEmail.trim() || undefined, // Отправляем undefined если пусто
      note: note.trim() || undefined, // Отправляем undefined если пусто
      items: selectedProducts.map(p => ({
        productId: p.id,
        quantity: p.quantity,
      })),
    };

    try {
      const createdOrder = await createOrder(orderPayload);
      Alert.alert(
        'Заказ создан',
        `Заказ #${createdOrder.displayId} успешно создан!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Очищаем форму и переходим на главный экран или экран заказов
              setCustomerName('');
              setCustomerPhone('');
              setCustomerEmail('');
              setNote('');
              // Сбрасываем количество товаров (если нужно, чтобы форма была полностью чистой)
              setProducts(products.map(p => ({ ...p, quantity: 0 })));
              router.replace('/orders'); // или '/'
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Ошибка при создании заказа на фронте:", error);
      Alert.alert('Ошибка создания заказа', error.message || 'Не удалось создать заказ. Пожалуйста, попробуйте снова.');
    } finally {
      setIsCreatingOrder(false); // Выключаем индикатор
    }
  };

  return (
    <Container scrollable keyboardAvoiding padded={false}>
      <Header title="Новый заказ" showBackButton />
      
      <View className="p-4">
        {/* Данные клиента */}
        <Card title="Данные клиента">
          <Input
            label="Имя клиента"
            placeholder="Введите имя клиента"
            value={customerName}
            onChangeText={setCustomerName}
            leftIcon={<Ionicons name="person-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Телефон"
            placeholder="+7 (___) ___-__-__"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={20} color="#6B7280" />}
          />
          
          <Input
            label="Email"
            placeholder="email@example.com"
            value={customerEmail}
            onChangeText={setCustomerEmail}
            keyboardType="email-address"
            leftIcon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
          />
        </Card>
        
        {/* Товары */}
        <View className="mt-4">
          <Card title="Товары">
            {isLoadingProducts ? (
              <ActivityIndicator size="large" color="#4F46E5" className="my-4" />
            ) : productLoadError ? (
              <Text className="text-red-500 text-center my-4">{productLoadError}</Text>
            ) : products.length === 0 ? (
              <Text className="text-neutral-500 text-center my-4">Список товаров пуст.</Text>
            ) : (
              products.map((product) => (
                <View
                  key={product.id}
                  className="flex-row items-center justify-between py-2 border-b border-neutral-100 last:border-b-0"
                >
                  <View className="flex-1">
                    <Text className="text-neutral-900 font-medium">{product.name}</Text>
                    <Text className="text-neutral-500 text-sm">{product.price.toLocaleString()} ₽</Text>
                  </View>
                  
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => handleProductQuantityChange(product.id, product.quantity - 1)}
                      className="w-8 h-8 bg-neutral-100 rounded-full items-center justify-center"
                    >
                      <Ionicons name="remove" size={20} color="#374151" />
                    </TouchableOpacity>
                    
                    <Text className="w-8 text-center text-neutral-900 font-medium">
                      {product.quantity}
                    </Text>
                    
                    <TouchableOpacity
                      onPress={() => handleProductQuantityChange(product.id, product.quantity + 1)}
                      className="w-8 h-8 bg-neutral-100 rounded-full items-center justify-center"
                    >
                      <Ionicons name="add" size={20} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            <Input
              label="Примечание к заказу"
              placeholder="Дополнительная информация..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              className="min-h-[80px] pt-2"
            />
          </Card>
        </View>
        
        {/* Итоги */}
        <Card className="mt-4">
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-neutral-600">Товаров в заказе:</Text>
            <Text className="text-neutral-900 font-medium">{selectedProducts.length}</Text>
          </View>
          
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-neutral-600">Общее количество:</Text>
            <Text className="text-neutral-900 font-medium">
              {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-lg font-semibold text-neutral-900">Итого:</Text>
            <Text className="text-lg font-bold text-primary-600">
              {totalAmount.toLocaleString()} ₽
            </Text>
          </View>
        </Card>
        
        {/* Кнопка создания заказа */}
        <View className="mt-6 mb-10">
          <Button
            title={isCreatingOrder ? "Создание заказа..." : "Создать заказ"}
            size="lg"
            onPress={handleCreateOrder}
            disabled={!isFormValid || isCreatingOrder} // Блокируем кнопку во время отправки
            icon={!isCreatingOrder ? <Ionicons name="checkmark-circle" size={20} color="white" /> : undefined}
            loading={isCreatingOrder} // Используем проп 'loading'
          />
        </View>
      </View>
    </Container>
  );
}
