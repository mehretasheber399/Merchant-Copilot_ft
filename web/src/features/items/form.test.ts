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

  it('leaves out items already in the shop and sends an apply payload', () => {
    const sugar = starterRows([templateItem], ['sugar'])[0]!;
    const tea = starterRows(
      [{ ...templateItem, index: 4, name: 'Tea', nameAm: 'ሻይ', price: 40 }],
      ['sugar'],
    )[0]!;
    expect(sugar.alreadyAdded).toBe(true);
    expect(sugar.selected).toBe(false);
    expect(tea.alreadyAdded).toBe(false);
    expect(starterSubmit([sugar, tea])).toEqual({ kind: 'apply', calls: [{ items: [4] }] });
    expect(starterSubmit([{ ...tea, price: '55' }])).toEqual({
      kind: 'apply',
      calls: [{ items: [4], overrides: { price: 55 } }],
    });
    expect(starterSubmit([{ ...tea, selected: false }])).toEqual({ kind: 'empty' });
    expect(starterSubmit([{ ...tea, price: '9.5' }])).toEqual({ kind: 'invalid' });
  });
});

function blank() {
  return { name: '', nameAm: '', price: '', cost: '', stock: '', reorderThreshold: '' };
}
