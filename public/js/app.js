document.addEventListener('DOMContentLoaded', () => {
  const state = {
    employees: [],
    departments: [],
    positions: [],
  };

  // Элементы интерфейса
  const tableBody = document.getElementById('employeesTableBody');
  const searchInput = document.getElementById('searchInput');
  const filterDepartment = document.getElementById('filterDepartment');
  const filterPosition = document.getElementById('filterPosition');
  const btnResetFilters = document.getElementById('btnResetFilters');
  const btnAddEmployee = document.getElementById('btnAddEmployee');

  // Модальное окно и форма
  const modal = document.getElementById('employeeModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('employeeForm');
  const formErrors = document.getElementById('formErrors');

  const fields = {
    id: document.getElementById('employeeId'),
    full_name: document.getElementById('fullName'),
    birth_date: document.getElementById('birthDate'),
    hire_date: document.getElementById('hireDate'),
    passport: document.getElementById('passport'),
    phone: document.getElementById('phone'),
    department_id: document.getElementById('departmentId'),
    position_id: document.getElementById('positionId'),
    salary: document.getElementById('salary'),
    address: document.getElementById('address'),
  };

  // Инициализация масок
  applyPassportMask(fields.passport);
  applyPhoneMask(fields.phone);

  // Форматирование даты (YYYY-MM-DD -> DD.MM.YYYY)
  function formatDate(isoDate) {
    if (!isoDate) return '—';
    const [y, m, d] = isoDate.split('-');
    return `${d}.${m}.${y}`;
  }

  // Форматирование зарплаты
  function formatSalary(amount) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Экранирование HTML для защиты от XSS
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Загрузка справочников
  async function loadDictionaries() {
    const res = await fetch('/api/employees/dictionaries');
    const data = await res.json();
    state.departments = data.departments;
    state.positions = data.positions;

    fillSelect(filterDepartment, state.departments, 'id', 'name', 'Все отделы');
    fillSelect(filterPosition, state.positions, 'id', 'title', 'Все должности');
    fillSelect(fields.department_id, state.departments, 'id', 'name', 'Выберите отдел');
    fillSelect(fields.position_id, state.positions, 'id', 'title', 'Выберите должность');
  }

  function fillSelect(selectEl, items, valueKey, labelKey, defaultText) {
    selectEl.innerHTML = `<option value="">${defaultText}</option>`;
    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item[valueKey];
      opt.textContent = item[labelKey];
      selectEl.appendChild(opt);
    });
  }

  // Загрузка сотрудников с учётом фильтров
  async function loadEmployees() {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
    if (filterDepartment.value) params.set('department_id', filterDepartment.value);
    if (filterPosition.value) params.set('position_id', filterPosition.value);

    const res = await fetch(`/api/employees?${params.toString()}`);
    state.employees = await res.json();
    renderTable();
  }

  // Отрисовка таблицы
  function renderTable() {
    if (state.employees.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" class="empty-state">Сотрудники не найдены</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = state.employees
      .map((emp) => {
        const isFired = emp.is_fired === 1;
        const statusBadge = isFired
          ? `<span class="badge badge-fired" title="Дата увольнения: ${formatDate(emp.fired_at)}">Уволен</span>`
          : `<span class="badge badge-active">Работает</span>`;

        return `
          <tr class="${isFired ? 'row-fired' : ''}">
            <td><strong>${escapeHtml(emp.full_name)}</strong></td>
            <td class="nowrap">${formatDate(emp.birth_date)}</td>
            <td class="nowrap">${escapeHtml(emp.passport)}</td>
            <td class="nowrap">${escapeHtml(emp.phone)}</td>
            <td>${escapeHtml(emp.address)}</td>
            <td>${escapeHtml(emp.department_name)}</td>
            <td>${escapeHtml(emp.position_title)}</td>
            <td class="nowrap">${formatSalary(emp.salary)}</td>
            <td class="nowrap">${formatDate(emp.hire_date)}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="actions-cell">
                <button
                  class="btn btn-secondary btn-sm"
                  data-action="edit"
                  data-id="${emp.id}"
                  ${isFired ? 'disabled title="Редактирование уволенного сотрудника заблокировано"' : ''}
                >
                  Редактировать
                </button>
                ${
                  !isFired
                    ? `<button class="btn btn-danger btn-sm" data-action="fire" data-id="${emp.id}">Уволить</button>`
                    : ''
                }
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Управление модальным окном
  function openCreateModal() {
    form.reset();
    fields.id.value = '';
    formErrors.classList.add('hidden');
    modalTitle.textContent = 'Новый сотрудник';
    modal.classList.remove('hidden');
  }

  function openEditModal(employee) {
    if (employee.is_fired === 1) return;

    formErrors.classList.add('hidden');
    modalTitle.textContent = 'Редактирование сотрудника';

    fields.id.value = employee.id;
    fields.full_name.value = employee.full_name;
    fields.birth_date.value = employee.birth_date;
    fields.hire_date.value = employee.hire_date;
    fields.passport.value = employee.passport;
    fields.phone.value = employee.phone;
    fields.department_id.value = employee.department_id;
    fields.position_id.value = employee.position_id;
    fields.salary.value = employee.salary;
    fields.address.value = employee.address;

    modal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  // Сохранение сотрудника (создание или обновление)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErrors.classList.add('hidden');

    const payload = {
      full_name: fields.full_name.value,
      birth_date: fields.birth_date.value,
      hire_date: fields.hire_date.value,
      passport: fields.passport.value,
      phone: fields.phone.value,
      department_id: Number(fields.department_id.value),
      position_id: Number(fields.position_id.value),
      salary: Number(fields.salary.value),
      address: fields.address.value,
    };

    const id = fields.id.value;
    const url = id ? `/api/employees/${id}` : '/api/employees';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const messages = data.errors || [data.error || 'Произошла ошибка'];
      formErrors.innerHTML = messages.map((m) => `<div>• ${escapeHtml(m)}</div>`).join('');
      formErrors.classList.remove('hidden');
      return;
    }

    closeModal();
    await loadEmployees();
  });

  // Обработка кликов по кнопкам в таблице (Редактировать / Уволить)
  tableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn || btn.disabled) return;

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    const employee = state.employees.find((emp) => emp.id === id);
    if (!employee) return;

    if (action === 'edit') {
      openEditModal(employee);
    }

    if (action === 'fire') {
      const confirmed = confirm(
        `Вы уверены, что хотите уволить сотрудника «${employee.full_name}»? После увольнения редактирование карточки будет заблокировано.`
      );
      if (!confirmed) return;

      const res = await fetch(`/api/employees/${id}/fire`, { method: 'PATCH' });
      if (res.ok) {
        await loadEmployees();
      } else {
        const err = await res.json();
        alert(err.error || 'Не удалось уволить сотрудника');
      }
    }
  });

  // События фильтров и поиска (с небольшой задержкой для поиска)
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadEmployees, 250);
  });

  filterDepartment.addEventListener('change', loadEmployees);
  filterPosition.addEventListener('change', loadEmployees);

  btnResetFilters.addEventListener('click', () => {
    searchInput.value = '';
    filterDepartment.value = '';
    filterPosition.value = '';
    loadEmployees();
  });

  // События модального окна
  btnAddEmployee.addEventListener('click', openCreateModal);
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  // Старт приложения
  (async function init() {
    await loadDictionaries();
    await loadEmployees();
  })();
});