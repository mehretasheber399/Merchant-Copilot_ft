import type { DashboardRange } from '../shared/types';

export function datedReportName(
  range: DashboardRange,
  format: 'csv' | 'pdf',
  now = new Date(),
): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return `report-${range}-${day}.${format}`;
}

export function chosenFilename(fromHeader: string, fallback: string): string {
  const name = fromHeader.trim();
  if (!name || name === 'download') {
    return fallback;
  }
  return name;
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
