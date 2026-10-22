/**
 * Timezone utilities for Asia/Jakarta (WIB)
 */

export function getNowJakarta(): Date {
  const now = new Date();
  return now;
}

export function formatJakartaDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatJakartaDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getJakartaDateString(): string {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d); // YYYY-MM-DD
}

export function getJakartaDateTimeString(): string {
  const d = new Date();
  const dateStr = getJakartaDateString();
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${dateStr} ${timeFormatter.format(d)}`;
}

export function diffDays(dateA: string | Date | null, dateB: string | Date = new Date()): number | null {
  if (!dateA) return null;
  const dA = new Date(dateA);
  const dB = new Date(dateB);
  if (isNaN(dA.getTime()) || isNaN(dB.getTime())) return null;
  const diffTime = dB.getTime() - dA.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
