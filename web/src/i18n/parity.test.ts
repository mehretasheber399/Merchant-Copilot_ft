import { describe, expect, it } from 'vitest';
import am from './am.json';
import en from './en.json';

function leafKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    if (key.startsWith('//')) {
      return [];
    }
    const next = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      return leafKeys(child, next);
    }
    return [next];
  });
}

describe('i18n parity', () => {
  it('gives English and Amharic the same user-facing keys', () => {
    expect(leafKeys(en).sort()).toEqual(leafKeys(am).sort());
  });
});
