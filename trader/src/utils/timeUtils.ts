import { TimePhase, CurrentStatus, MarketType, FuturesYear } from '../types';
import {
  stocksScheduleWeekday,
  stocksScheduleWeekend,
  futures2025Schedule,
  futures2026Schedule,
} from '../data/schedules';

export function getMoscowTime(): Date {
  // Get current time in Moscow timezone
  const now = new Date();
  const moscowOffset = 3 * 60; // UTC+3
  const localOffset = now.getTimezoneOffset();
  const diff = moscowOffset + localOffset;
  return new Date(now.getTime() + diff * 60 * 1000);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}ч ${minutes}м ${seconds}с`;
  }
  if (minutes > 0) {
    return `${minutes}м ${seconds}с`;
  }
  return `${seconds}с`;
}

export function getScheduleForMarket(
  market: MarketType,
  year?: FuturesYear,
  isWeekend?: boolean
): TimePhase[] {
  if (market === 'stocks') {
    return isWeekend ? stocksScheduleWeekend : stocksScheduleWeekday;
  }
  
  return year === 2026 ? futures2026Schedule : futures2025Schedule;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function getCurrentStatus(
  phases: TimePhase[],
  moscowTime: Date
): CurrentStatus {
  const currentMinutes =
    moscowTime.getHours() * 60 + moscowTime.getMinutes();

  let currentPhase: TimePhase | null = null;
  let nextPhase: TimePhase | null = null;

  // Find current phase
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const startMinutes = timeToMinutes(phase.startTime);
    const endMinutes = timeToMinutes(phase.endTime);

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      currentPhase = phase;
      nextPhase = phases[i + 1] || null;
      break;
    }
  }

  // Calculate time until next phase
  let timeUntilNext = '';
  let progress = 0;

  if (currentPhase) {
    const startMinutes = timeToMinutes(currentPhase.startTime);
    const endMinutes = timeToMinutes(currentPhase.endTime);
    const totalMinutes = endMinutes - startMinutes;
    const elapsedMinutes = currentMinutes - startMinutes;
    
    progress = (elapsedMinutes / totalMinutes) * 100;

    const remainingMinutes = endMinutes - currentMinutes;
    const remainingSeconds = (60 - moscowTime.getSeconds());
    const totalSeconds = remainingMinutes * 60 + remainingSeconds;

    timeUntilNext = formatDuration(totalSeconds);
  }

  return {
    phase: currentPhase,
    nextPhase,
    timeUntilNext,
    progress,
  };
}

export function getPhasePosition(phase: TimePhase): { top: string; height: string } {
  const dayStart = 0;
  const dayEnd = 24 * 60; // Total minutes in a day

  const startMinutes = timeToMinutes(phase.startTime);
  const endMinutes = timeToMinutes(phase.endTime);

  const top = (startMinutes / dayEnd) * 100;
  const height = ((endMinutes - startMinutes) / dayEnd) * 100;

  return {
    top: `${top}%`,
    height: `${height}%`,
  };
}


