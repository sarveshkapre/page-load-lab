export type PsiMetric = {
  id: string;
  title: string;
  displayValue: string;
  numericValue: number | null;
  score: number | null;
};

export type PsiOpportunity = {
  id: string;
  title: string;
  description: string;
  savingsMs: number | null;
  displayValue: string;
};

export type PsiDiagnosis = {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  expectedImpact: "high" | "medium" | "low";
  evidence: string[];
  recommendedFixes: string[];
};

export type PsiFieldData = {
  overallCategory: string | null;
  metrics: Array<{ id: string; percentile: number | null; category: string | null }>;
};

export type PsiSummary = {
  fetchedAt: string;
  status: number;
  perfScore: number | null;
  metrics: PsiMetric[];
  opportunities: PsiOpportunity[];
  reasons?: PsiDiagnosis[];
  field?: PsiFieldData | null;
  raw?: unknown;
};

export type PsiError = {
  error: string;
  fetchedAt: string;
  status: number | null;
  detail?: string;
  hint?: string | null;
};

export type PsiResult = PsiSummary | PsiError;

export type PageLoadResponse = {
  url: string;
  source: string;
  apiKeyConfigured?: boolean;
  error?: string;
  hint?: string;
  notes?: string[];
  mobile: PsiResult | null;
  desktop: PsiResult | null;
  trust?: string;
};
