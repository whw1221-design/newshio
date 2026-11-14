const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  // Order dates are stored as UTC timestamps; render the UTC calendar date so a
  // date entered as 2026-05-01 never appears as April 30 in western timezones.
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

export function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

const AVATAR_COLORS = ['#4f46e5', '#0f766e', '#b45309', '#be185d', '#0369a1', '#7c3aed'];

export function avatarColor(seed = 0) {
  return AVATAR_COLORS[Math.abs(Number(seed) || 0) % AVATAR_COLORS.length];
}

/** Map a stock quantity to chip props used across the UI. */
export function stockStatus(qty) {
  const quantity = Number(qty) || 0;
  if (quantity === 0) {
    return { label: 'Out of stock', color: 'error', severity: 'error' };
  }
  if (quantity <= 5) {
    return { label: `Low · ${quantity}`, color: 'warning', severity: 'warning' };
  }
  return { label: `${quantity} in stock`, color: 'success', severity: 'success' };
}

export function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Convert a stored ISO timestamp into the YYYY-MM-DD value of a date input. */
export function toDateInputValue(value) {
  if (!value) return todayInputValue();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return todayInputValue();
  return date.toISOString().slice(0, 10);
}
