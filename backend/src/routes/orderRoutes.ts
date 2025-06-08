import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;
  items: OrderItemInput[];
}

// POST /api/orders - Создание нового заказа
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[server]: POST /api/orders - Получен запрос на создание заказа с телом:`, JSON.stringify(req.body, null, 2));
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      note,
      items
    } = req.body as CreateOrderInput;

    // Валидация основных полей заказа
    if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
      return res.status(400).json({ error: 'Имя клиента (customerName) обязательно.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Заказ должен содержать хотя бы одну позицию (items).' });
    }

    let totalAmount = 0;
    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

    // Валидация и обработка каждой позиции заказа
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return res.status(400).json({ error: `Некорректный productId для одной из позиций: ${item.productId}` });
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return res.status(400).json({ error: `Количество (quantity) для товара ${item.productId} должно быть целым положительным числом.` });
      }

      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ error: `Товар с ID ${item.productId} не найден.` });
      }

      totalAmount += product.price * item.quantity;
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price, // Записываем цену на момент покупки
      });
    }
    
    // Генерация displayId (простой пример, можно усложнить)
    // Для простоты пока будем использовать часть UUID или timestamp + случайное число
    // В реальном приложении лучше использовать последовательность из БД или более надежный генератор
    const displayId = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

    // Создание заказа и связанных позиций в одной транзакции
    const newOrder = await prisma.order.create({
      data: {
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim(),
        customerEmail: customerEmail?.trim(),
        note: note?.trim(),
        totalAmount,
        displayId, // Убедитесь, что это поле есть в вашей Prisma схеме и оно @unique
        status: 'NEW', // Начальный статус
        items: {
          createMany: {
            data: orderItemsData,
          },
        },
      },
      include: { // Включаем созданные позиции в ответ
        items: {
          include: {
            product: { // Включаем информацию о товаре для каждой позиции
              select: { name: true, price: true } // Только нужные поля товара
            }
          }
        }
      }
    });
    console.log(`[server]: Заказ ${newOrder.displayId} успешно создан.`);
    res.status(201).json(newOrder);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error:', error.message, error.code, error.meta);
      return res.status(400).json({ 
        error: 'Ошибка базы данных при создании заказа.', 
        details: `Код ошибки: ${error.code}. ${error.message}`
      });
    }
    console.error('Generic Error creating order:', error);
    next(error);
  }
});

// GET /api/orders - Получение списка заказов
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query as { status?: string; search?: string };

    const whereClause: Prisma.OrderWhereInput = {};

    if (status) {
      // Убедимся, что статус валиден для нашего enum OrderStatus
      const validStatuses = Object.values(OrderStatus); // Используем импортированный OrderStatus
      if (validStatuses.includes(status as OrderStatus)) { // Используем импортированный OrderStatus
        whereClause.status = status as OrderStatus; // Используем импортированный OrderStatus
      } else {
        return res.status(400).json({ error: `Некорректный статус фильтра: ${status}. Допустимые значения: ${validStatuses.join(', ')}` });
      }
    }

    if (search) {
      whereClause.OR = [
        { displayId: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: { // Включаем количество позиций для отображения в списке
        _count: {
          select: { items: true }
        }
      }
    });

    // Преобразуем результат, чтобы _count.items стал itemCount
    const ordersWithItemCount = orders.map(order => {
      const { _count, ...restOfOrder } = order;
      return { ...restOfOrder, itemCount: _count?.items || 0 };
    });

    res.json(ordersWithItemCount);
  } catch (error) {
    console.error('Error fetching orders:', error);
    next(error);
  }
});

// GET /api/orders/:id - Получение деталей заказа
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { // Включаем информацию о товаре для каждой позиции
              select: { id: true, name: true, price: true } // Выбираем нужные поля товара
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден.' });
    }
    res.json(order);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
        return res.status(400).json({ error: 'Некорректный формат ID заказа.' });
    }
    console.error(`Error fetching order ${req.params.id}:`, error);
    next(error);
  }
});

// PUT /api/orders/:id/status - Обновление статуса заказа
router.put('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status: newStatus } = req.body as { status?: OrderStatus };
  console.log(`[server]: PUT /api/orders/${id}/status - Получен запрос на обновление статуса на '${newStatus}'`);
  try {

    if (!newStatus) {
      return res.status(400).json({ error: 'Новый статус (status) обязателен в теле запроса.' });
    }

    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: `Некорректный статус: ${newStatus}. Допустимые значения: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден.' });
    }

    const currentStatus = order.status;

    // Валидация переходов статусов
    let isValidTransition = false;
    const allowedTransitions: OrderStatus[] = []; // Явно типизируем массив

    switch (currentStatus) {
      case OrderStatus.NEW:
        allowedTransitions.push(OrderStatus.PROCESSING, OrderStatus.CANCELLED);
        isValidTransition = allowedTransitions.includes(newStatus);
        break;
      case OrderStatus.PROCESSING:
        allowedTransitions.push(OrderStatus.COMPLETED, OrderStatus.CANCELLED);
        isValidTransition = allowedTransitions.includes(newStatus);
        break;
      case OrderStatus.COMPLETED:
        allowedTransitions.push(OrderStatus.ARCHIVED);
        isValidTransition = allowedTransitions.includes(newStatus);
        break;
      case OrderStatus.CANCELLED:
        allowedTransitions.push(OrderStatus.ARCHIVED);
        isValidTransition = allowedTransitions.includes(newStatus);
        break;
      case OrderStatus.ARCHIVED: // Из архива нельзя менять статус (в рамках текущей логики MVP)
        isValidTransition = false;
        break;
    }

    if (!isValidTransition) {
      return res.status(400).json({ error: `Недопустимый переход из статуса '${currentStatus}' в статус '${newStatus}'.` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: { // Возвращаем обновленный заказ с позициями для полноты
        items: {
          include: {
            product: { select: { id: true, name: true, price: true } }
          }
        }
      }
    });
    console.log(`[server]: Статус заказа ${updatedOrder.displayId} (ID: ${id}) успешно обновлен на '${newStatus}'.`);
    res.json(updatedOrder);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
        return res.status(400).json({ error: 'Некорректный формат ID заказа.' });
    }
    console.error(`Error updating status for order ${req.params.id}:`, error);
    next(error);
  }
});

export default router;