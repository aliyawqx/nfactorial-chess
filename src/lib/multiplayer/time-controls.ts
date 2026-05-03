export interface TimeControl {
  id: string;
  label: string;
  initialMs: number | null;
  incrementMs: number;
}

export const TIME_CONTROLS: TimeControl[] = [
  { id: "1+0", label: "1 мин", initialMs: 60_000, incrementMs: 0 },
  { id: "3+0", label: "3 мин", initialMs: 180_000, incrementMs: 0 },
  { id: "5+0", label: "5 мин", initialMs: 300_000, incrementMs: 0 },
  { id: "5+3", label: "5+3", initialMs: 300_000, incrementMs: 3_000 },
  { id: "10+0", label: "10 мин", initialMs: 600_000, incrementMs: 0 },
  { id: "15+10", label: "15+10", initialMs: 900_000, incrementMs: 10_000 },
  { id: "unlimited", label: "Без лимита", initialMs: null, incrementMs: 0 },
];

export const DEFAULT_TIME_CONTROL_ID = "5+0";

export function findTimeControl(id: string): TimeControl | undefined {
  return TIME_CONTROLS.find((tc) => tc.id === id);
}

export function formatClock(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  if (m === 0) {
    const tenths = Math.floor((totalSec - s) * 10);
    return `0:${s.toString().padStart(2, "0")}.${tenths}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
