export type Locale = 'en' | 'am';

export type SaleStatus = 'PENDING' | 'PAID' | 'DECLINED' | 'TIMEOUT' | 'CANCELLED' | 'INSUFFICIENT';

export type StockStatus = 'untracked' | 'out' | 'low' | 'ok';

export type DashboardRange = 'today' | 'week' | 'month';

export type InsightType =
  | 'lowStockRisk'
  | 'unusualDropOrSpike'
  | 'revenueVsBaseline'
  | 'fastestMover'
  | 'slowMover'
  | 'peakPeriod';

export type InsightConfidence = 'high' | 'estimate';

export type MappingSource = 'cart' | 'auto-suggested' | 'manual' | 'unmapped';

export type Confidence = 'exact' | 'estimate';

export type GatewayMode = 'mock' | 'mpesa';

export type GatewayModeState = GatewayMode | 'unknown';

export interface GatewayModeView {
  mode: GatewayModeState;
  switchable: boolean;
}

export interface Merchant {
  id: string;
  businessName: string;
  type?: string;
  branch?: string;
  timezone?: string;
  workingHours?: { open: string; close: string };
}

export interface LoginResult {
  token: string;
  merchant: Pick<Merchant, 'id' | 'businessName'>;
}

export interface ProductView {
  id: string;
  merchantId: string;
  name: string;
  nameAm: string;
  price: number;
  cost?: number;
  stock?: number;
  reorderThreshold?: number;
  category: string;
  isActive: boolean;
  isDemo: boolean;
  stockStatus: StockStatus;
}

export interface SaleLine {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface SaleRequestView {
  requestId: string;
  status: SaleStatus;
  amount: number;
  items: SaleLine[];
  phoneMasked: string;
  expiresAt: string;
  secondsLeft: number;
  warnings: string[];
  failureReason?: string;
  lateConfirmation?: boolean;
  gateway?: GatewayMode;
}

export interface Bilingual {
  en: string;
  am: string;
}

export interface InsightCalc {
  label: Bilingual;
  value: string | number;
}

export interface InsightView {
  id?: string;
  type: InsightType;
  priority: number;
  what: Bilingual;
  why: Bilingual;
  check: Bilingual;
  nextAction: Bilingual;
  confidence: InsightConfidence;
  evidenceTransactionIds: string[];
  calc: InsightCalc[];
  dateKey: string;
}

export interface SuggestionLine {
  productId: string;
  name: string;
  qty: number;
}

export interface SuggestionCandidate {
  items: SuggestionLine[];
  total: number;
  exact: boolean;
  score: number;
}

export interface ComparisonPoint {
  total: number;
  count: number;
  deltaAbs: number;
  deltaPct: number | null;
  fullDayTotal?: number;
}

export interface DashboardView {
  range: DashboardRange;
  from: string;
  to: string;
  totalCollections: number;
  transactionCount: number;
  averageSale: number;
  comparisons: {
    yesterday?: ComparisonPoint;
    sameWeekdayLastWeek?: ComparisonPoint;
    sevenDayAverage?: ComparisonPoint;
    previousPeriod?: ComparisonPoint;
  };
  dataCoverage: { mappedAmount: number; totalAmount: number; pct: number };
}

export interface HourBucket {
  hour: number;
  label: string;
  total: number;
  count: number;
}

export interface HoursView {
  range: DashboardRange;
  from: string;
  to: string;
  buckets: HourBucket[];
  peakHours: HourBucket[];
}

export interface TopProduct {
  productId: string;
  name: string;
  nameAm: string;
  qty: number;
  revenue: number;
}

export interface TrendPoint {
  dayKey: string;
  total: number;
  count: number;
}

export interface StockItem {
  productId: string;
  name: string;
  nameAm: string;
  stock: number;
  reorderThreshold: number;
  avgDailySales: number;
  daysOfStockLeft: number | null;
  status: 'out' | 'low' | 'ok';
}

export interface TransactionItem {
  name: string;
  qty: number;
}

export interface TransactionRow {
  id: string;
  amount: number;
  timestamp: string;
  mappingSource: MappingSource;
  confidence: Confidence;
  items: TransactionItem[];
  phoneMasked?: string;
}

export interface TransactionPage {
  transactions: TransactionRow[];
  nextCursor: string | null;
}

export interface UnmappedTransaction {
  id: string;
  amount: number;
  timestamp: string;
  externalReference: string;
  mappingSource: MappingSource;
  phoneMasked: string;
  suggestion: SuggestionCandidate | null;
}

export interface InsightsPayload {
  insights: InsightView[];
  briefing: { en: string; am: string; source: 'template' | 'llm' };
}

export interface EvidenceTransaction {
  id: string;
  amount: number;
  timestamp: string;
  items: TransactionItem[];
}

export interface InsightEvidence {
  insight: InsightView;
  calc: InsightCalc[];
  transactions: EvidenceTransaction[];
}

export interface MappingMixPoint {
  amount: number;
  pct: number | null;
}

export interface ReportInsight {
  type: InsightType;
  priority: number;
  what: Bilingual;
  why: Bilingual;
  check: Bilingual;
  nextAction: Bilingual;
  confidence: InsightConfidence;
}

export interface ReportSummary {
  merchant: { id: string; businessName: string; branch: string; type: string };
  period: { from: string; to: string };
  summary: DashboardView;
  hourly: HoursView;
  topProducts: TopProduct[];
  lowStock: StockItem[];
  mappingMix: {
    cart: MappingMixPoint;
    manual: MappingMixPoint;
    autoSuggested: MappingMixPoint;
    unmapped: MappingMixPoint;
  };
  insights: ReportInsight[];
  generatedAt: string;
}

export interface StarterTemplateItem {
  index: number;
  id: string;
  name: string;
  nameAm: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderThreshold: number;
}

export interface ApplyTemplateResult {
  created: number;
  skipped: number;
}

export interface BulkCreateResult {
  created: number;
  errors: { index: number; message: string }[];
}

export interface CreateProductInput {
  name: string;
  price: number;
  nameAm?: string;
  category?: string;
  cost?: number;
  stock?: number;
  reorderThreshold?: number;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  nameAm?: string;
  category?: string;
  cost?: number;
  stock?: number;
  reorderThreshold?: number;
  isActive?: boolean;
}

export interface SaleRequestInput {
  phone: string;
  items: { productId: string; qty: number }[];
}

export interface SaleUpdatedEvent {
  merchantId: string;
  requestId: string;
  status: SaleStatus;
  amount: number;
  lateConfirmation?: boolean;
}

export interface StockLowEvent {
  merchantId: string;
  productId: string;
  name: string;
  stock: number;
  threshold: number;
}

export interface InsightUpdatedEvent {
  merchantId: string;
}

export interface MockPending {
  items?: SaleLine[];
  businessName: string;
  amount: number;
  phoneMasked: string;
  secondsLeft: number;
  status: SaleStatus;
}

export interface DemoResetResult {
  merchantId: string;
  products: number;
  transactions: number;
  todayTotal: number;
}

export interface DirectPaymentResult {
  id: string;
  amount: number;
  mappingSource: MappingSource;
  suggestion: SuggestionCandidate | null;
  created: boolean;
}

export interface ApiIssue {
  path: string;
  message: string;
}

export type ToastTone = 'success' | 'warning' | 'danger' | 'info';
