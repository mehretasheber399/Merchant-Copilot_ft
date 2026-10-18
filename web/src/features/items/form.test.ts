import { describe, expect, it } from 'vitest';
import { displayName, starterRows, starterSubmit, validateDraft } from './form';
import type { StarterTemplateItem } from '../../shared/types';

const templateItem: StarterTemplateItem = {
  index: 3,
  id: 'tpl-3',
  name: 'Sugar',
  nameAm: 'ስኳር',
  category: 'Grocery',
  price: 80,
  cost: 50,
  stock: 10,
  reorderThreshold: 2,
};

describe('item form', () => {
  it('requires a whole-number price and rejects decimals', () => {
    expect(validateDraft({ ...blank(), name: 'Bread' }).errors.price).toBe('required');
    expect(validateDraft({ ...blank(), name: 'Bread', price: '12.5' }).errors.price).toBe(
      'integer',
    );
    expect(validateDraft({ ...blank(), name: 'Bread', price: '10', cost: '1.5' }).errors.cost).toBe(
      'integer',
    );
    expect(validateDraft({ ...blank(), name: 'Bread', price: '-1' }).errors.price).toBe('integer');
  });

  it('builds an integer payload and omits empty optional fields', () => {
    const result = validateDraft({
      ...blank(),
      name: ' Bread ',
      nameAm: '',
      price: '80',
      cost: '50',
      stock: '',
      reorderThreshold: '2',
    });
    expect(result.errors).toEqual({});
    expect(result.input).toEqual({ name: 'Bread', price: 80, cost: 50, reorderThreshold: 2 });
  });

  it('uses the Amharic name only when that language is active', () => {
    expect(displayName({ name: 'Sugar', nameAm: 'ስኳር' }, 'am')).toBe('ስኳር');
    expect(displayName({ name: 'Sugar', nameAm: 'ስኳር' }, 'en')).toBe('Sugar');
    expect(displayName({ name: 'Sugar', nameAm: ' ' }, 'am')).toBe('Sugar');
  });

  it('applies template indexes, or bulk-creates when a price was edited', () => {
    const rows = starterRows([templateItem]);
    expect(starterSubmit(rows)).toEqual({ kind: 'apply', items: [3] });
    expect(starterSubmit([{ ...rows[0]!, price: '90' }])).toMatchObject({ kind: 'bulk' });
    expect(starterSubmit([{ ...rows[0]!, selected: false }])).toEqual({ kind: 'empty' });
    expect(starterSubmit([{ ...rows[0]!, price: '9.5' }])).toEqual({ kind: 'invalid' });
  });
});

function blank() {
  return { name: '', nameAm: '', price: '', cost: '', stock: '', reorderThreshold: '' };
}
