function applyPassportMask(input) {
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 4) {
      input.value = `${digits.slice(0, 4)} ${digits.slice(4)}`;
    } else {
      input.value = digits;
    }
  });
}

function applyPhoneMask(input) {
  const formatPhone = (rawValue) => {
    let digits = rawValue.replace(/\D/g, '');
    if (!digits) return '';

    if (digits[0] === '8' || digits[0] === '7') {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);

    let result = '+7';
    if (digits.length > 0) {
      result += ` (${digits.slice(0, 3)}`;
    }
    if (digits.length >= 4) {
      result += `) ${digits.slice(3, 6)}`;
    }
    if (digits.length >= 7) {
      result += `-${digits.slice(6, 8)}`;
    }
    if (digits.length >= 9) {
      result += `-${digits.slice(8, 10)}`;
    }
    return result;
  };

  input.addEventListener('focus', () => {
    if (!input.value) {
      input.value = '+7 (';
    }
  });

  input.addEventListener('input', () => {
    input.value = formatPhone(input.value);
  });

  input.addEventListener('blur', () => {
    if (input.value === '+7 (' || input.value === '+7') {
      input.value = '';
    }
  });
}