export interface GenerationRecord {
  id: string;
  time: string;
  credits: number;
  email: string;
  modelName: string;
  referenceId: string;
  type: string;
  numberOfGenerations: number;
}

export interface AnomalyFlag {
  recordId: string;
  type: 'duplicate' | 'outlier' | 'missing_data' | 'date_anomaly' | 'spike' | 'suspicious_frequency';
  severity: 'high' | 'medium' | 'low';
  message: string;
  dismissed: boolean;
}

export interface SpendTarget {
  id: string;
  period: 'monthly' | 'quarterly';
  amount: number;
  email?: string;
}

export interface DailyAggregation {
  date: string;
  totalCredits: number;
  totalGenerations: number;
  totalRequests: number;
  uniqueUsers: number;
}

export type TimeGranularity = 'daily' | 'weekly' | 'monthly';
export type ProjectionStatus = 'on_track' | 'at_risk' | 'below_target' | 'exceeding' | 'no_target';
