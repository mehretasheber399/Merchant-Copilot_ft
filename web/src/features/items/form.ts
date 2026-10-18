import type { CreateProductInput, ProductView, StarterTemplateItem } from '../../shared/types';

const WHOLE_NUMBER = /^\d+$/;

export type FieldError = 'required' | 'integer';

export interface ItemDraft {
  name: string;
  nameAm: string;
  price: string;
  cost: string;
  stock: string;
  reorderThreshold: string;
}

export function emptyDraft(): ItemDraft {
  return { name: '', nameAm: '', price: '', cost: '', stock: '', reorderThreshold: '' };
}

export function draftFromProduct(product: ProductView): ItemDraft {
  return {
    name: product.name,
    nameAm: product.nameAm,
    price: String(product.price),
    cost: product.cost === undefined ? '' : String(product.cost),
    stock: product.stock === undefined ? '' : String(product.stock),
    reorderThreshold:
      product.reorderThreshold === undefined ? '' : String(product.reorderThreshold),
  };
}

export function displayName(
  product: { name: string; nameAm: string },
  locale: 'en' | 'am',
): string {
  if (locale === 'am' && product.nameAm.trim()) {
    return product.nameAm;
  }
  return product.name;
}

function optionalInt(value: string): { ok: true; value?: number } | { ok: false } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true };
  }
  if (!WHOLE_NUMBER.test(trimmed)) {
    return { ok: false };
  }
  return { ok: true, value: Number(trimmed) };
}

export function validateDraft(
  draft: ItemDraft,
  options?: { keepEmptyNameAm?: boolean },
): {
  errors: Partial<Record<'name' | 'price' | 'cost' | 'stock' | 'reorderThreshold', FieldError>>;
  input?: CreateProductInput;
} {
  const errors: Partial<
    Record<'name' | 'price' | 'cost' | 'stock' | 'reorderThreshold', FieldError>
  > = {};
  const name = draft.name.trim();
  if (!name || name.length > 80) {
    errors.name = 'required';
  }

  const priceText = draft.price.trim();
  let price: number | undefined;
  if (!priceText) {
    errors.price = 'required';
  } else if (!WHOLE_NUMBER.test(priceText)) {
    errors.price = 'integer';
  } else {
    price = Number(priceText);
  }

  const cost = optionalInt(draft.cost);
  if (!cost.ok) {
    errors.cost = 'integer';
  }
  const stock = optionalInt(draft.stock);
  if (!stock.ok) {
    errors.stock = 'integer';
  }
  const threshold = optionalInt(draft.reorderThreshold);
  if (!threshold.ok) {
    errors.reorderThreshold = 'integer';
  }

  if (
    !cost.ok ||
    !stock.ok ||
    !threshold.ok ||
    Object.keys(errors).length > 0 ||
    price === undefined
  ) {
    return { errors };
  }

  const input: CreateProductInput = { name, price };
  const nameAm = draft.nameAm.trim();
  if (nameAm || options?.keepEmptyNameAm) {
    input.nameAm = nameAm;
  }
  if (cost.value !== undefined) {
    input.cost = cost.value;
  }
  if (stock.value !== undefined) {
    input.stock = stock.value;
  }
  if (threshold.value !== undefined) {
    input.reorderThreshold = threshold.value;
  }
  return { errors, input };
}

export interface StarterRow {
  index: number;
  name: string;
  nameAm: string;
  category: string;
  price: string;
  templatePrice: number;
  cost: number;
  stock: number;
  reorderThreshold: number;
  selected: boolean;
  alreadyAdded: boolean;
}

export function starterRows(
  items: StarterTemplateItem[],
  existingNames: string[] = [],
): StarterRow[] {
  const taken = new Set(existingNames.map((name) => name.trim().toLowerCase()));
  return items.map((item) => {
    const alreadyAdded = taken.has(item.name.trim().toLowerCase());
    return {
      index: item.index,
      name: item.name,
      nameAm: item.nameAm,
      category: item.category,
      price: String(item.price),
      templatePrice: item.price,
      cost: item.cost,
      stock: item.stock,
      reorderThreshold: item.reorderThreshold,
      alreadyAdded,
      selected: !alreadyAdded,
    };
  });
}

export interface StarterApplyCall {
  items: Array<number | string>;
  overrides?: { price: number };
}

export type StarterSubmit =
  { kind: 'empty' } | { kind: 'invalid' } | { kind: 'apply'; calls: StarterApplyCall[] };

export function starterSubmit(rows: StarterRow[]): StarterSubmit {
  const selected = rows.filter((row) => row.selected && !row.alreadyAdded);
  if (selected.length === 0) {
    return { kind: 'empty' };
  }
  if (selected.some((row) => !WHOLE_NUMBER.test(row.price.trim()))) {
    return { kind: 'invalid' };
  }
  const unchanged: number[] = [];
  const changed = new Map<number, number[]>();
  for (const row of selected) {
    const price = Number(row.price);
    if (price === row.templatePrice) {
      unchanged.push(row.index);
    } else {
      const group = changed.get(price) ?? [];
      group.push(row.index);
      changed.set(price, group);
    }
  }
  const calls: StarterApplyCall[] = [];
  if (unchanged.length > 0) {
    calls.push({ items: unchanged });
  }
  for (const [price, items] of changed) {
    calls.push({ items, overrides: { price } });
  }
  return { kind: 'apply', calls };
}
