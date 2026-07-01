export function formatMonthYear(date: string | Date): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function toISODate(date: string | Date): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return parsed.toISOString().slice(0, 10);
}
