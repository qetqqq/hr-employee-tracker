const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { validateEmployeePayload } = require('../utils/validator');

// Получить справочники (отделы и должности)
router.get('/dictionaries', async (req, res) => {
  try {
    const db = await getDb();
    const departments = await db.all('SELECT * FROM departments ORDER BY name ASC');
    const positions = await db.all('SELECT * FROM positions ORDER BY title ASC');
    res.json({ departments, positions });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при загрузке справочников' });
  }
});

// Получить список сотрудников с фильтрацией и поиском по ФИО
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { search, department_id, position_id } = req.query;

    let query = `
      SELECT
        e.*,
        d.name AS department_name,
        p.title AS position_title
      FROM employees e
      JOIN departments d ON e.department_id = d.id
      JOIN positions p ON e.position_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ' AND LOWER(e.full_name) LIKE LOWER(?)';
      params.push(`%${search.trim()}%`);
    }

    if (department_id && department_id !== '') {
      query += ' AND e.department_id = ?';
      params.push(Number(department_id));
    }

    if (position_id && position_id !== '') {
      query += ' AND e.position_id = ?';
      params.push(Number(position_id));
    }

    query += ' ORDER BY e.is_fired ASC, e.id DESC';

    const employees = await db.all(query, params);
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении списка сотрудников' });
  }
});

// Создать нового сотрудника
router.post('/', async (req, res) => {
  try {
    const errors = validateEmployeePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const db = await getDb();
    const {
      full_name,
      birth_date,
      passport,
      phone,
      address,
      department_id,
      position_id,
      salary,
      hire_date,
    } = req.body;

    const result = await db.run(
      `INSERT INTO employees
      (full_name, birth_date, passport, phone, address, department_id, position_id, salary, hire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        birth_date,
        passport.trim(),
        phone.trim(),
        address.trim(),
        Number(department_id),
        Number(position_id),
        Number(salary),
        hire_date,
      ]
    );

    const created = await db.get('SELECT * FROM employees WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при создании сотрудника' });
  }
});

// Редактировать информацию о сотруднике
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const employee = await db.get('SELECT * FROM employees WHERE id = ?', [req.params.id]);

    if (!employee) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    // ВАЖНО: Блокировка редактирования уволенного сотрудника на уровне API
    if (employee.is_fired === 1) {
      return res.status(403).json({
        error: 'Редактирование заблокировано: сотрудник имеет статус «Уволен»',
      });
    }

    const errors = validateEmployeePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const {
      full_name,
      birth_date,
      passport,
      phone,
      address,
      department_id,
      position_id,
      salary,
      hire_date,
    } = req.body;

    await db.run(
      `UPDATE employees SET
        full_name = ?,
        birth_date = ?,
        passport = ?,
        phone = ?,
        address = ?,
        department_id = ?,
        position_id = ?,
        salary = ?,
        hire_date = ?
      WHERE id = ?`,
      [
        full_name.trim(),
        birth_date,
        passport.trim(),
        phone.trim(),
        address.trim(),
        Number(department_id),
        Number(position_id),
        Number(salary),
        hire_date,
        req.params.id,
      ]
    );

    const updated = await db.get('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при обновлении данных сотрудника' });
  }
});

// Уволить сотрудника (мягкое увольнение без удаления из БД)
router.patch('/:id/fire', async (req, res) => {
  try {
    const db = await getDb();
    const employee = await db.get('SELECT * FROM employees WHERE id = ?', [req.params.id]);

    if (!employee) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    if (employee.is_fired === 1) {
      return res.status(400).json({ error: 'Сотрудник уже уволен' });
    }

    const firedAt = new Date().toISOString().split('T')[0];

    await db.run(
      'UPDATE employees SET is_fired = 1, fired_at = ? WHERE id = ?',
      [firedAt, req.params.id]
    );

    const updated = await db.get('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при увольнении сотрудника' });
  }
});

module.exports = router;