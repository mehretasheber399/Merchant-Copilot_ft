import { apiRequest, downloadAuthorized } from './client';
import { config } from '../config';
import type {
  ApplyTemplateResult,
  BulkCreateResult,
  CreateProductInput,
  DashboardRange,
  DashboardView,
  DemoResetResult,
  DirectPaymentResult,
  GatewayMode,
  GatewayModeView,
  HoursView,
  InsightEvidence,
  InsightsPayload,
  LoginResult,
  Merchant,
  MockPending,
  ProductView,
  ReportSummary,
  SaleRequestInput,
  SaleRequestView,
  StarterTemplateItem,
  StockItem,
  TopProduct,
  TransactionPage,
  TrendPoint,
  UnmappedTransaction,
  UpdateProductInput,
} from '../shared/types';

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function login(email: string, password: string): Promise<LoginResult> {
  return apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
    skipAuthRedirect: true,
  });
}

export async function getMe(): Promise<Merchant> {
  const body = await apiRequest<{ merchant: Merchant }>('/auth/me');
  return body.merchant;
}

export async function listProducts(
  params: {
    search?: string;
    category?: string;
    activeOnly?: boolean;
    limit?: number;
  } = {},
): Promise<ProductView[]> {
  const body = await apiRequest<{ products: ProductView[] }>(
    `/products${toQuery({ ...params, limit: params.limit ?? 100 })}`,
  );
  return body.products;
}

export async function createProduct(input: CreateProductInput): Promise<ProductView> {
  const body = await apiRequest<{ product: ProductView }>('/products', {
    method: 'POST',
    body: input,
  });
  return body.product;
}

export async function getProduct(id: string): Promise<ProductView> {
  const body = await apiRequest<{ product: ProductView }>(`/products/${id}`);
  return body.product;
}

export async function updateProduct(id: string, patch: UpdateProductInput): Promise<ProductView> {
  const body = await apiRequest<{ product: ProductView }>(`/products/${id}`, {
    method: 'PATCH',
    body: patch,
  });
  return body.product;
}

export async function deleteProduct(id: string): Promise<ProductView> {
  const body = await apiRequest<{ product: ProductView }>(`/products/${id}`, {
    method: 'DELETE',
  });
  return body.product;
}

export async function getStarterTemplate(): Promise<StarterTemplateItem[]> {
  const body = await apiRequest<{ items: StarterTemplateItem[] }>('/products/starter-template');
  return body.items;
}

export function applyStarterTemplate(input: {
  items: Array<number | string>;
  overrides?: { price?: number };
}): Promise<ApplyTemplateResult> {
  return apiRequest<ApplyTemplateResult>('/products/starter-template/apply', {
    method: 'POST',
    body: input,
  });
}

export function bulkCreateProducts(items: unknown[]): Promise<BulkCreateResult> {
  return apiRequest<BulkCreateResult>('/products/bulk', {
    method: 'POST',
    body: { items },
  });
}

export async function requestSale(
  input: SaleRequestInput,
  idempotencyKey?: string,
): Promise<SaleRequestView> {
  const body = await apiRequest<{ sale: SaleRequestView }>('/sales/request', {
    method: 'POST',
    body: input,
    idempotencyKey,
  });
  return body.sale;
}

export async function getSale(requestId: string): Promise<SaleRequestView> {
  const body = await apiRequest<{ sale: SaleRequestView }>(`/sales/${requestId}`);
  return body.sale;
}

export async function cancelSale(requestId: string): Promise<SaleRequestView> {
  const body = await apiRequest<{ sale: SaleRequestView }>(`/sales/${requestId}/cancel`, {
    method: 'POST',
  });
  return body.sale;
}

export function getMockPending(requestId: string): Promise<MockPending> {
  return apiRequest<MockPending>(`/gateway/mock/pending/${encodeURIComponent(requestId)}`, {
    auth: false,
  });
}

export async function submitMockPin(requestId: string, pin: string): Promise<SaleRequestView> {
  const body = await apiRequest<{ sale: SaleRequestView }>('/gateway/mock/pin', {
    method: 'POST',
    auth: false,
    body: { requestId, pin },
  });
  return body.sale;
}

export function streamUrl(token: string): string {
  const url = new URL('/stream', config.apiBaseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

export function getDashboard(range: DashboardRange = 'today'): Promise<DashboardView> {
  return apiRequest<DashboardView>(`/dashboard${toQuery({ range })}`);
}

export function getDashboardHours(range: DashboardRange = 'today'): Promise<HoursView> {
  return apiRequest<HoursView>(`/dashboard/hours${toQuery({ range })}`);
}

export async function getTopProducts(
  range: DashboardRange = 'today',
  limit = 10,
): Promise<TopProduct[]> {
  const body = await apiRequest<{ products: TopProduct[] }>(
    `/dashboard/top-products${toQuery({ range, limit })}`,
  );
  return body.products;
}

export async function getTrend(days = 14): Promise<TrendPoint[]> {
  const body = await apiRequest<{ trend: TrendPoint[] }>(`/dashboard/trend${toQuery({ days })}`);
  return body.trend;
}

export async function getStock(): Promise<StockItem[]> {
  const body = await apiRequest<{ items: StockItem[] }>('/stock');
  return body.items;
}

export function listTransactions(
  params: { limit?: number; cursor?: string } = {},
): Promise<TransactionPage> {
  return apiRequest<TransactionPage>(`/transactions${toQuery(params)}`);
}

export async function listUnmappedTransactions(limit = 20): Promise<UnmappedTransaction[]> {
  const body = await apiRequest<{ transactions: UnmappedTransaction[] }>(
    `/transactions/unmapped${toQuery({ limit })}`,
  );
  return body.transactions;
}

export function mapTransaction(
  id: string,
  items: { productId: string; qty: number }[],
): Promise<{ id: string; mappingSource: 'manual' }> {
  return apiRequest(`/transactions/${id}/mapping`, { method: 'PATCH', body: { items } });
}

export function dismissTransactionMapping(id: string): Promise<{ id: string; dismissed: true }> {
  return apiRequest(`/transactions/${id}/mapping/dismiss`, { method: 'PATCH' });
}

export function getInsights(): Promise<InsightsPayload> {
  return apiRequest<InsightsPayload>('/insights');
}

export function refreshInsights(): Promise<InsightsPayload> {
  return apiRequest<InsightsPayload>('/insights/refresh', { method: 'POST' });
}

export function getInsightEvidence(id: string): Promise<InsightEvidence> {
  return apiRequest<InsightEvidence>(`/insights/${id}/evidence`);
}

export function getReportSummary(range: DashboardRange): Promise<ReportSummary> {
  return apiRequest<ReportSummary>(`/reports/summary${toQuery({ range })}`);
}

export function exportReport(range: DashboardRange, format: 'csv' | 'pdf', lang: 'en' | 'am') {
  return downloadAuthorized(`/reports/export${toQuery({ range, format, lang })}`, 60_000, lang);
}

export function resetDemo(): Promise<DemoResetResult> {
  return apiRequest<DemoResetResult>('/demo/reset', { method: 'POST' });
}

export function getGatewayMode(): Promise<GatewayModeView> {
  return apiRequest<GatewayModeView>('/demo/gateway');
}

export function setGatewayMode(mode: GatewayMode): Promise<GatewayModeView> {
  return apiRequest<GatewayModeView>('/demo/gateway', {
    method: 'POST',
    body: { mode },
  });
}

export async function simulateSale(productIds?: string[]): Promise<SaleRequestView> {
  const body = await apiRequest<{ sale: SaleRequestView }>('/demo/simulate-sale', {
    method: 'POST',
    body: productIds ? { productIds } : {},
  });
  return body.sale;
}

export function simulateDirectPayment(amount?: number): Promise<DirectPaymentResult> {
  return apiRequest<DirectPaymentResult>('/demo/simulate-direct-payment', {
    method: 'POST',
    body: amount === undefined ? {} : { amount },
  });
}

export function drainStock(
  productId: string,
): Promise<{ productId: string; stock: number; avgDailySales: number }> {
  return apiRequest('/demo/drain-stock', { method: 'POST', body: { productId } });
}

export function getHealth(): Promise<{ status: 'ok' }> {
  return apiRequest('/health', { auth: false });
}
