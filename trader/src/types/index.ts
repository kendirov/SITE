export type MarketType = 'stocks' | 'futures';
export type FuturesYear = 2025 | 2026;

export interface TimePhase {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;
  type: 'auction' | 'trading' | 'clearing' | 'closed';
  description: string;
  details?: string;
  warning?: string;
  color: string;
}

export interface MarketSchedule {
  type: MarketType;
  year?: FuturesYear;
  phases: TimePhase[];
}

export interface CurrentStatus {
  phase: TimePhase | null;
  nextPhase: TimePhase | null;
  timeUntilNext: string;
  progress: number; // 0-100
}


