import { useEffect, useMemo, useState } from 'react';

// Get Sweden (Europe/Stockholm) time parts reliably via Intl
const getSwedenParts = () => {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const map: Record<string, number> = {} as any;
  for (const p of parts) {
    if (p.type === 'year' || p.type === 'month' || p.type === 'day' || p.type === 'hour' || p.type === 'minute' || p.type === 'second') {
      map[p.type] = parseInt(p.value, 10);
    }
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  };
};

export const getDailyKeySE = () => {
  const { year, month, day } = getSwedenParts();
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

const epochDaysFromYmd = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m - 1, d) / 86400000);

export const getPuzzleNumberSE = () => {
  const base = { y: 2025, m: 8, d: 11 }; // #01
  const { year, month, day } = getSwedenParts();
  const todayDays = epochDaysFromYmd(year, month, day);
  const baseDays = epochDaysFromYmd(base.y, base.m, base.d);
  return Math.max(1, todayDays - baseDays + 1);
};

export const getMsUntilMidnightSE = () => {
  const { hour, minute, second } = getSwedenParts();
  const secondsToday = hour * 3600 + minute * 60 + second;
  const remaining = 24 * 3600 - secondsToday;
  return remaining * 1000;
};

export const useDailyInfo = () => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const seed = useMemo(() => `SEED_${getDailyKeySE()}`,[now]);
  const puzzleNumber = useMemo(() => getPuzzleNumberSE(), [now]);
  const msToMidnight = useMemo(() => getMsUntilMidnightSE(), [now]);

  const formatCountdown = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return { seed, puzzleNumber, msToMidnight, countdown: formatCountdown(msToMidnight) };
};
