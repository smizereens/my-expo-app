import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client'; // Import Prisma namespace

const prisma = new PrismaClient();
const router = express.Router();

// POST /api/products - Создание нового товара
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[server]: POST /api/products - Получен запрос на создание товара с телом:`, JSON.stringify(req.body, null, 2));
  try {
    const { name, price, description } = req.body as { name?: string; price?: number; description?: string | null }; // description может быть null

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Название товара (name) обязательно и должно быть непустой строкой.' });
    }
    if (price === undefined || typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: 'Цена товара (price) обязательна и должна быть положительным числом.' });
    }
    
    // Новая валидация для description:
    // Оно может быть undefined, null, или строкой. Если строка, то может быть пустой.
    if (description !== undefined && description !== null && typeof description !== 'string') {
      // Эта ошибка теперь должна срабатывать, если пришло что-то кроме строки, null или undefined
      return res.status(400).json({ error: 'Описание товара (description), если предоставлено, должно быть строкой или null.' });
    }

    const productData: Prisma.ProductCreateInput = {
      name: name.trim(),
      price,
    };

    if (description === null) {
      productData.description = null;
    } else if (typeof description === 'string') {
      const trimmedDescription = description.trim();
      // Если после trim строка пустая, считаем это как null (отсутствие описания)
      // Если не пустая, то записываем ее.
      productData.description = trimmedDescription === '' ? null : trimmedDescription;
    }
    // Если description === undefined, то поле description не будет добавлено в productData,
    // и Prisma по умолчанию установит null для опционального поля.

    const newProduct = await prisma.product.create({
      data: productData,
    });
    console.log(`[server]: Товар "${newProduct.name}" (ID: ${newProduct.id}) успешно создан.`);
    res.status(201).json(newProduct);
  } catch (error: unknown) { // Explicitly type error as unknown
    if (error instanceof Prisma.PrismaClientKnownRequestError) { // Use Prisma namespace
      console.error('Prisma Error:', error.message, error.code);
      return res.status(400).json({
        error: 'Ошибка базы данных при создании товара.',
        details: `Код ошибки: ${error.code}. ${error.message}`
      });
    } else if (error instanceof Error) { // Handle generic errors
      console.error('Generic Error:', error.message);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера.', details: error.message });
    } else { // Handle other unknown errors
      console.error('Unknown Error:', error);
      return res.status(500).json({ error: 'Произошла неизвестная ошибка.' });
    }
  }
});

// GET /api/products - Получение списка всех товаров
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[server]: GET /api/products - Получен запрос на список всех товаров.`);
  try {
    const products = await prisma.product.findMany({
      orderBy: { // Опционально: сортировка по дате создания или имени
        createdAt: 'desc',
      }
    });
    console.log(`[server]: GET /api/products - Отправлено ${products.length} товаров.`);
    res.json(products);
  } catch (error) {
    console.error(`[server]: GET /api/products - Ошибка:`, error);
    next(error);
  }
});

// GET /api/products/:id - Получение информации о конкретном товаре
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  console.log(`[server]: GET /api/products/${id} - Получен запрос на товар.`);
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      console.log(`[server]: GET /api/products/${id} - Товар не найден.`);
      return res.status(404).json({ error: 'Товар не найден.' });
    }
    console.log(`[server]: GET /api/products/${id} - Товар "${product.name}" найден и отправлен.`);
    res.json(product);
  } catch (error) {
    console.error(`[server]: GET /api/products/${id} - Ошибка:`, error);
    // Обработка возможных ошибок Prisma, например, если id невалидный UUID
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
        return res.status(400).json({ error: 'Некорректный формат ID товара.' });
    }
    next(error);
  }
});

// PUT /api/products/:id - Обновление информации о товаре
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  console.log(`[server]: PUT /api/products/${id} - Получен запрос на обновление товара с телом:`, JSON.stringify(req.body, null, 2));
  try {
    // Разрешаем description быть null при обновлении
    const { name, price, description } = req.body as { name?: string; price?: number; description?: string | null };

    // Валидация входных данных
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Название товара (name) должно быть непустой строкой.' });
    }
    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
      return res.status(400).json({ error: 'Цена товара (price) должна быть положительным числом.' });
    }
    // Обновленная валидация для description при PUT
    if (description !== undefined && description !== null && typeof description !== 'string') {
      return res.status(400).json({ error: 'Описание товара (description), если предоставлено, должно быть строкой или null.' });
    }
    
    const productData: Prisma.ProductUpdateInput = {};
    if (name !== undefined) productData.name = name.trim(); // Обновляем только если передано
    if (price !== undefined) productData.price = price;     // Обновляем только если передано
    
    // Логика для description при обновлении:
    // Если description явно передан как null, устанавливаем null.
    // Если передана строка, тримим ее; если пустая после трима - null, иначе тримленное значение.
    // Если description не передан (undefined), это поле не трогаем в productData.
    if (description === null) {
      productData.description = null;
    } else if (typeof description === 'string') {
      const trimmedDescription = description.trim();
      productData.description = trimmedDescription === '' ? null : trimmedDescription;
    }


    const updatedProduct = await prisma.product.update({
      where: { id },
      data: productData,
    });
    console.log(`[server]: PUT /api/products/${id} - Товар "${updatedProduct.name}" успешно обновлен.`);
    res.json(updatedProduct);
  } catch (error) {
    console.error(`[server]: PUT /api/products/${id} - Ошибка:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // Запись для обновления не найдена
        return res.status(404).json({ error: 'Товар для обновления не найден.' });
      }
      if (error.code === 'P2023') { // Некорректный формат ID
        return res.status(400).json({ error: 'Некорректный формат ID товара.' });
      }
    }
    next(error);
  }
});

// DELETE /api/products/:id - Удаление товара
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  console.log(`[server]: DELETE /api/products/${id} - Получен запрос на удаление товара.`);
  try {
    // Проверяем, используется ли товар в каких-либо позициях заказа
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      const message = `Невозможно удалить товар (ID: ${id}), так как он используется в ${orderItemsCount} позициях заказа.`;
      console.log(`[server]: DELETE /api/products/${id} - Отказ в удалении: ${message}`);
      return res.status(400).json({
        error: 'Невозможно удалить товар, так как он используется в заказах.',
        details: `Товар найден в ${orderItemsCount} позициях заказа.`
      });
    }

    await prisma.product.delete({
      where: { id },
    });
    console.log(`[server]: DELETE /api/products/${id} - Товар успешно удален.`);
    res.status(204).send(); // No Content
  } catch (error) {
    console.error(`[server]: DELETE /api/products/${id} - Ошибка:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // Запись для удаления не найдена
        return res.status(404).json({ error: 'Товар для удаления не найден.' });
      }
      if (error.code === 'P2023') { // Некорректный формат ID
        return res.status(400).json({ error: 'Некорректный формат ID товара.' });
      }
    }
    next(error);
  }
});

export default router;