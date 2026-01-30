export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const normalized = dateKey.split('T')[0].split(' ')[0];
  const [year, month, day] = normalized.split('-').map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return new Date();
  }
  return new Date(year, month - 1, day);
}

export function formatActiveDateLabel(
  filterDate: string | null,
  tasksByDate: Record<string, unknown>,
): string | null {
  if (!filterDate || !tasksByDate[filterDate]) {
    return null;
  }

  return new Date(filterDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
