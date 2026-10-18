import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyStarterTemplate,
  bulkCreateProducts,
  createProduct,
  getStarterTemplate,
  listProducts,
} from '../api/endpoints';
import i18n from '../i18n';
import type { ProductView, StarterTemplateItem } from '../shared/types';
import { ItemsPage } from './ItemsPage';

vi.mock('../api/endpoints', () => ({
  listProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getStarterTemplate: vi.fn(),
  applyStarterTemplate: vi.fn(),
  bulkCreateProducts: vi.fn(),
}));

const listProductsMock = vi.mocked(listProducts);
const createProductMock = vi.mocked(createProduct);
const getStarterTemplateMock = vi.mocked(getStarterTemplate);
const applyStarterTemplateMock = vi.mocked(applyStarterTemplate);
const bulkCreateProductsMock = vi.mocked(bulkCreateProducts);

function product(overrides: Partial<ProductView> = {}): ProductView {
  return {
    id: 'p1',
    merchantId: 'm1',
    name: 'Sugar',
    nameAm: 'ስኳር',
    price: 80,
    category: 'Grocery',
    isActive: true,
    isDemo: false,
    stockStatus: 'ok',
    ...overrides,
  };
}

function templateItem(overrides: Partial<StarterTemplateItem> = {}): StarterTemplateItem {
  return {
    index: 1,
    id: 'tpl-1',
    name: 'Sugar',
    nameAm: 'ስኳር',
    category: 'Grocery',
    price: 80,
    cost: 50,
    stock: 10,
    reorderThreshold: 2,
    ...overrides,
  };
}

function renderItems() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <ItemsPage />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('items screen', () => {
  beforeEach(() => {
    listProductsMock.mockReset();
    createProductMock.mockReset();
    getStarterTemplateMock.mockReset();
    applyStarterTemplateMock.mockReset();
    bulkCreateProductsMock.mockReset();
  });

  it('shows stock badges and requests the full list', async () => {
    listProductsMock.mockResolvedValue([
      product({ id: 'ok', name: 'Sugar', stockStatus: 'ok' }),
      product({ id: 'low', name: 'Tea', stockStatus: 'low' }),
      product({ id: 'out', name: 'Oil', stockStatus: 'out' }),
      product({ id: 'none', name: 'Salt', stockStatus: 'untracked' }),
    ]);
    renderItems();

    expect(await screen.findByText('In stock')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Out')).toBeInTheDocument();
    expect(screen.getByText('No stock')).toBeInTheDocument();
    expect(screen.getByText('Low').closest('[data-stock]')).toHaveAttribute('data-stock', 'low');
    expect(screen.getByText('Out').closest('[data-stock]')).toHaveAttribute('data-stock', 'out');
    expect(screen.getByText('No stock').closest('[data-stock]')).toHaveAttribute(
      'data-stock',
      'untracked',
    );
    expect(listProductsMock).toHaveBeenCalledWith({
      search: undefined,
      limit: 100,
      activeOnly: true,
    });
  });

  it('adds an item with integer fields', async () => {
    const user = userEvent.setup();
    const created = product({ name: 'Bread', price: 25 });
    listProductsMock.mockResolvedValueOnce([]).mockResolvedValue([created]);
    createProductMock.mockResolvedValue(created);
    renderItems();

    await user.click(await screen.findByRole('button', { name: 'Add item' }));
    await user.type(screen.getByLabelText('Name'), 'Bread');
    await user.type(screen.getByLabelText('Price'), '25');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(createProductMock).toHaveBeenCalledWith({ name: 'Bread', price: 25 });
    expect(await screen.findByText('Bread')).toBeInTheDocument();
  });

  it('requires a price and whole numbers before saving', async () => {
    const user = userEvent.setup();
    listProductsMock.mockResolvedValue([]);
    renderItems();

    await user.click(await screen.findByRole('button', { name: 'Add item' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Enter a name.')).toBeInTheDocument();
    expect(screen.getByText('Enter a price.')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: /^Name/ }), 'Bread');
    await user.type(screen.getByRole('textbox', { name: /^Price/ }), '12.5');
    await user.type(screen.getByRole('textbox', { name: /^Cost/ }), '1.5');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getAllByText('Use a whole number.')).toHaveLength(2);
    expect(createProductMock).not.toHaveBeenCalled();
  });

  it('applies the starter list and reports created and skipped', async () => {
    const user = userEvent.setup();
    listProductsMock.mockResolvedValue([]);
    getStarterTemplateMock.mockResolvedValue([
      templateItem(),
      templateItem({ index: 2, id: 'tpl-2', name: 'Tea', nameAm: 'ሻይ', price: 40 }),
    ]);
    applyStarterTemplateMock.mockResolvedValue({ created: 2, skipped: 1 });
    renderItems();

    await user.click(await screen.findByRole('button', { name: 'Use starter list' }));
    expect(await screen.findByRole('checkbox', { name: 'Sugar' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Add selected' }));

    expect(applyStarterTemplateMock).toHaveBeenCalledWith({ items: [1, 2] });
    expect(await screen.findByText('Added 2. Skipped 1.')).toBeInTheDocument();
  });

  it('shows bulk errors when an edited starter price only partly saves', async () => {
    const user = userEvent.setup();
    listProductsMock.mockResolvedValue([]);
    getStarterTemplateMock.mockResolvedValue([templateItem()]);
    bulkCreateProductsMock.mockResolvedValue({
      created: 0,
      errors: [{ index: 0, message: 'Duplicate name' }],
    });
    renderItems();

    await user.click(await screen.findByRole('button', { name: 'Use starter list' }));
    const price = await screen.findByRole('textbox', { name: 'Price Sugar' });
    await user.clear(price);
    await user.type(price, '90');
    await user.click(screen.getByRole('button', { name: 'Add selected' }));

    expect(bulkCreateProductsMock).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Sugar', price: 90 }),
    ]);
    expect((await screen.findAllByText(/Some items were not added/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Duplicate name/).length).toBeGreaterThan(0);
  });
});
