export function formatPrice(cents: number): string {
  if (isNaN(cents) || cents < 0) return 'R$ 0,00';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) {
    // 55 84 99153-7520
    const ddd = digits.substring(2, 4);
    const part1 = digits.substring(4, 9);
    const part2 = digits.substring(9, 13);
    return `(${ddd}) ${part1}-${part2}`;
  }
  if (digits.length === 11) {
    const ddd = digits.substring(0, 2);
    const part1 = digits.substring(2, 7);
    const part2 = digits.substring(7, 11);
    return `(${ddd}) ${part1}-${part2}`;
  }
  return phone;
}

export function normalizeCategoryKey(key?: string): string {
  if (!key) return 'lanches';
  const clean = key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-');

  // Map known singular or alternate terms to standard keys
  switch (clean) {
    case 'lanche':
    case 'hamburguer':
    case 'hamburgueres':
    case 'burgers':
    case 'burger':
      return 'lanches';
    case 'cuscuzes':
      return 'cuscuz';
    case 'sopa':
    case 'canja':
    case 'canjas':
    case 'caldo':
    case 'caldos':
      return 'sopas';
    case 'bebida':
    case 'suco':
    case 'sucos':
    case 'vitamina':
    case 'vitaminas':
      return 'bebidas';
    default:
      return clean;
  }
}

export function formatCategoryLabel(key: string, customCategories?: any[]): string {
  const clean = (key || '').toLowerCase().trim();
  switch (clean) {
    case 'todos':
      return 'Todos';
    case 'lanches':
      return 'Lanches';
    case 'cuscuz':
      return 'Cuscuz';
    case 'sopas':
      return 'Sopas e Canjas';
    case 'bebidas':
      return 'Sucos e Vitaminas';
    default: {
      if (customCategories && Array.isArray(customCategories)) {
        const found = customCategories.find((c) => {
          if (!c) return false;
          if (typeof c === 'string') return normalizeCategoryKey(c) === normalizeCategoryKey(clean);
          return normalizeCategoryKey(c.id || c.name) === normalizeCategoryKey(clean);
        });
        if (found) {
          return typeof found === 'string' ? found : (found.name || found.label || clean);
        }
      }
      return clean
        .split(/[-_ ]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }
}

export function parseCustomCategories(list?: any[]): { id: string; name: string }[] {
  if (!list || !Array.isArray(list)) return [];
  return list
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'string') {
        const id = normalizeCategoryKey(item);
        return { id, name: formatCategoryLabel(item) };
      }
      const id = normalizeCategoryKey(item.id || item.name || '');
      const name = item.name || formatCategoryLabel(id);
      return { id, name };
    })
    .filter((cat) => cat.id && cat.id !== 'todos');
}
