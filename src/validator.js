function validateEmployeePayload(data) {
  const errors = [];

  if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim().length < 3) {
    errors.push('Укажите корректное ФИО (минимум 3 символа)');
  }

  if (!data.birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.birth_date)) {
    errors.push('Укажите корректную дату рождения');
  }

  if (!data.passport || !/^\d{4}\s\d{6}$/.test(data.passport.trim())) {
    errors.push('Паспорт должен быть в формате: 0000 000000');
  }

  if (!data.phone || !/^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/.test(data.phone.trim())) {
    errors.push('Телефон должен быть в формате: +7 (000) 000-00-00');
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.push('Укажите корректный адрес проживания');
  }

  if (!Number.isInteger(Number(data.department_id)) || Number(data.department_id) <= 0) {
    errors.push('Выберите отдел');
  }

  if (!Number.isInteger(Number(data.position_id)) || Number(data.position_id) <= 0) {
    errors.push('Выберите должность');
  }

  const salary = Number(data.salary);
  if (Number.isNaN(salary) || salary < 0) {
    errors.push('Укажите корректный размер зарплаты');
  }

  if (!data.hire_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.hire_date)) {
    errors.push('Укажите корректную дату принятия на работу');
  }

  return errors;
}

module.exports = { validateEmployeePayload };