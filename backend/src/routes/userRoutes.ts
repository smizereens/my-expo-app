// backend/src/routes/userRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { requireRole, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();
const SALT_ROUNDS = 10;

// GET /api/users - Получить всех пользователей (админы и менеджеры)
router.get('/', requireRole(['admin', 'manager']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, status, search } = req.query as { role?: string; status?: string; search?: string };
    
    const whereClause: any = {};
    
    // Фильтр по роли
    if (role && ['admin', 'manager', 'employee'].includes(role)) {
      whereClause.role = role;
    }
    
    // Фильтр по статусу активности
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }
    
    // Поиск по имени пользователя
    if (search) {
      whereClause.username = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { isActive: 'desc' }, // Активные первыми
        { role: 'asc' },      // admin, employee, manager
        { createdAt: 'desc' }  // Новые первыми
      ]
    });

    res.json(users);
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    next(error);
  }
});

// GET /api/users/stats - Статистика пользователей (админы и менеджеры)
router.get('/stats', requireRole(['admin', 'manager']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [total, active, inactive, admins, managers, employees] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { role: 'manager' } }),
      prisma.user.count({ where: { role: 'employee' } })
    ]);

    res.json({
      total,
      active,
      inactive,
      admins,
      managers,
      employees
    });
  } catch (error) {
    console.error('Ошибка при получении статистики пользователей:', error);
    next(error);
  }
});

// GET /api/users/:id - Получить пользователя по ID (админы и менеджеры)
router.get('/:id', requireRole(['admin', 'manager']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    next(error);
  }
});

// POST /api/users - Создать пользователя (только админы)
router.post('/', requireRole(['admin']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, password, role = 'employee' } = req.body as { 
      username?: string; 
      password?: string; 
      role?: string; 
    };

    // Валидация
    if (!username?.trim()) {
      return res.status(400).json({ error: 'Логин обязателен' });
    }

    if (!password?.trim()) {
      return res.status(400).json({ error: 'Пароль обязателен' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }

    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' });
    }

    // Проверяем уникальность логина
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Создаем пользователя
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        role,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`[USERS]: Пользователь "${username}" создан админом "${req.user?.username}"`);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    next(error);
  }
});

// PUT /api/users/:id - Обновить пользователя (только админы)
router.put('/:id', requireRole(['admin']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { username, role, isActive, password } = req.body as {
      username?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    };

    // Находим пользователя
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const isEditingSelf = existingUser.id === req.user?.id;

    // Ограничения при редактировании самого себя
    if (isEditingSelf) {
      // Нельзя деактивировать себя
      if (isActive === false) {
        return res.status(400).json({ error: 'Нельзя деактивировать собственную учетную запись' });
      }
      
      // Нельзя понижать свою роль, если это единственный админ
      if (role && role !== 'admin') {
        const adminCount = await prisma.user.count({ 
          where: { role: 'admin', isActive: true } 
        });
        
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Нельзя изменить роль - вы единственный активный администратор' });
        }
      }
    }

    const updateData: any = {};

    // Валидация и подготовка данных для обновления
    if (username !== undefined) {
      if (!username.trim()) {
        return res.status(400).json({ error: 'Логин не может быть пустым' });
      }
      
      // Проверяем уникальность нового логина
      if (username.trim() !== existingUser.username) {
        const userWithSameUsername = await prisma.user.findUnique({
          where: { username: username.trim() }
        });
        
        if (userWithSameUsername) {
          return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        }
      }
      
      updateData.username = username.trim();
    }

    if (role !== undefined) {
      if (!['admin', 'manager', 'employee'].includes(role)) {
        return res.status(400).json({ error: 'Недопустимая роль' });
      }
      updateData.role = role;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (password !== undefined && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
      }
      updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const action = isEditingSelf ? 'обновил свой профиль' : `обновил пользователя "${existingUser.username}"`;
    console.log(`[USERS]: Админ "${req.user?.username}" ${action}`);
    res.json(updatedUser);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    next(error);
  }
});

// PUT /api/users/:id/toggle - Переключить статус активности (только админы)
router.put('/:id/toggle', requireRole(['admin']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Нельзя деактивировать самого себя
    if (user.id === req.user?.id) {
      return res.status(400).json({ error: 'Нельзя изменить статус собственной учетной записи' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    console.log(`[USERS]: Пользователь "${user.username}" ${updatedUser.isActive ? 'активирован' : 'деактивирован'} админом "${req.user?.username}"`);
    res.json(updatedUser);
  } catch (error) {
    console.error('Ошибка при изменении статуса пользователя:', error);
    next(error);
  }
});

// DELETE /api/users/:id - Удалить пользователя (только админы, осторожно!)
router.delete('/:id', requireRole(['admin']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Нельзя удалять самого себя
    if (user.id === req.user?.id) {
      return res.status(400).json({ error: 'Нельзя удалить собственную учетную запись' });
    }

    // Нельзя удалять других админов (безопасность)
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Нельзя удалять других администраторов' });
    }

    await prisma.user.delete({
      where: { id }
    });

    console.log(`[USERS]: Пользователь "${user.username}" удален админом "${req.user?.username}"`);
    res.status(204).send();
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    next(error);
  }
});

export default router;