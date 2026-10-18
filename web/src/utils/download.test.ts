import { describe, expect, it, vi } from 'vitest';
import { filenameFromDisposition } from '../api/client';
import { chosenFilename, datedReportName, saveBlob } from './download';

describe('blob download', () => {
  it('reads the attachment name and falls back to a dated file', () => {
    expect(filenameFromDisposition('attachment; filename="report-today-2026-10-18.csv"')).toBe(
      'report-today-2026-10-18.csv',
    );
    expect(filenameFromDisposition("attachment; filename*=UTF-8''report%20week.pdf")).toBe(
      'report week.pdf',
    );
    expect(filenameFromDisposition(null)).toBe('download');
    expect(chosenFilename('download', 'report-today-2026-10-18.csv')).toBe(
      'report-today-2026-10-18.csv',
    );
    expect(chosenFilename('shop.csv', 'fallback.csv')).toBe('shop.csv');
    expect(datedReportName('week', 'pdf', new Date('2026-10-18T21:30:00.000Z'))).toBe(
      'report-week-2026-10-19.pdf',
    );
  });

  it('saves a blob through an object URL', () => {
    const create = vi.fn(() => 'blob:report');
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.fn();
    const anchor = document.createElement('a');
    anchor.click = click;
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return anchor;
      }
      return realCreate(tagName);
    });

    saveBlob(new Blob(['a,b']), 'report.csv');

    expect(create).toHaveBeenCalledOnce();
    expect(anchor.download).toBe('report.csv');
    expect(anchor.href).toContain('blob:report');
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:report');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
