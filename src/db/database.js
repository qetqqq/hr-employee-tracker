const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await open({
    filename: path.join(__dirname, '../../database.sqlite'),
    driver: sqlite3.Database,
  });

  await dbInstance.exec('PRAGMA foreign_keys = ON;');
  await initSchema(dbInstance);
  await seedData(dbInstance);

  return dbInstance;
}

async function initSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      passport TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      position_id INTEGER NOT NULL,
      salary REAL NOT NULL CHECK (salary >= 0),
      hire_date TEXT NOT NULL,
      is_fired INTEGER NOT NULL DEFAULT 0,
      fired_at TEXT DEFAULT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT
    );
  `);
}

async function seedData(db) {
  const deptCount = await db.get('SELECT COUNT(*) as count FROM departments');
  if (deptCount.count > 0) return;

  const departments = ['IT-отдел', 'Отдел продаж', 'Бухгалтерия', 'HR-отдел', 'Маркетинг'];
  for (const name of departments) {
    await db.run('INSERT INTO departments (name) VALUES (?)', [name]);
  }

  const positions = [
    'Frontend-разработчик',
    'Backend-разработчик',
    'Менеджер по продажам',
    'Главный бухгалтер',
    'HR-менеджер',
    'Маркетолог',
  ];
  for (const title of positions) {
    await db.run('INSERT INTO positions (title) VALUES (?)', [title]);
  }

  const initialEmployees = [
    {
      full_name: 'Иванов Алексей Сергеевич',
      birth_date: '1992-05-14',
      passport: '4512 849302',
      phone: '+7 (916) 452-18-90',
      address: 'г. Москва, ул. Ленина, д. 15, кв. 42',
      department_id: 1,
      position_id: 2,
      salary: 185000,
      hire_date: '2022-03-01',
      is_fired: 0,
      fired_at: null,
    },
    {
      full_name: 'Смирнова Елена Викторовна',
      birth_date: '1995-11-23',
      passport: '4515 392014',
      phone: '+7 (926) 781-04-33',
      address: 'г. Москва, пр-т Мира, д. 102, кв. 11',
      department_id: 4,
      position_id: 5,
      salary: 120000,
      hire_date: '2023-06-15',
      is_fired: 0,
      fired_at: null,
    },
    {
      full_name: 'Козлов Дмитрий Андреевич',
      birth_date: '1988-02-09',
      passport: '4509 617283',
      phone: '+7 (903) 519-77-12',
      address: 'г. Химки, ул. Молодежная, д. 8, кв. 95',
      department_id: 2,
      position_id: 3,
      salary: 95000,
      hire_date: '2021-09-10',
      is_fired: 1,
      fired_at: '2025-01-20',
    },
  ];

  for (const emp of initialEmployees) {
    await db.run(
      `INSERT INTO employees
      (full_name, birth_date, passport, phone, address, department_id, position_id, salary, hire_date, is_fired, fired_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp.full_name,
        emp.birth_date,
        emp.passport,
        emp.phone,
        emp.address,
        emp.department_id,
        emp.position_id,
        emp.salary,
        emp.hire_date,
        emp.is_fired,
        emp.fired_at,
      ]
    );
  }
}

module.exports = { getDb };