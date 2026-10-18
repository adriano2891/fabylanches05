import type { StoreConfig, StoreStatus } from '../types.ts';

/**
 * Returns current date/time components in America/Fortaleza timezone
 */
export function getFortalezaDateTime(date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ...
  hours: number;
  minutes: number;
  timeString: string; // "HH:mm"
  dateString: string; // "YYYY-MM-DD"
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = parseInt(partMap['year'] || '2026', 10);
  const month = parseInt(partMap['month'] || '1', 10);
  const day = parseInt(partMap['day'] || '1', 10);
  const hours = parseInt(partMap['hour'] || '0', 10);
  const minutes = parseInt(partMap['minute'] || '0', 10);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = weekdayMap[partMap['weekday']] ?? 0;

  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  const timeString = `${pad(hours)}:${pad(minutes)}`;
  const dateString = `${year}-${pad(month)}-${pad(day)}`;

  return { year, month, day, dayOfWeek, hours, minutes, timeString, dateString };
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function computeStoreStatus(config: StoreConfig, now = new Date()): StoreStatus {
  // 1. Temporary Pause Check
  if (config.temporaryPause) {
    return {
      isOpen: false,
      statusLabel: 'Pausa Temporária',
      statusDetail: config.temporaryPauseMessage || 'Atendimento temporariamente pausado.',
      isPaused: true,
      pauseMessage: config.temporaryPauseMessage,
      nextOpeningText: 'Retornaremos em breve',
      canOrder: false,
    };
  }

  const { dayOfWeek, dateString, timeString } = getFortalezaDateTime(now);
  const currentMins = timeToMinutes(timeString);

  // 2. Special Closures Check
  const specialClosure = config.specialClosures?.find((sc) => sc.date === dateString);
  if (specialClosure) {
    return {
      isOpen: false,
      statusLabel: 'Fechado hoje',
      statusDetail: specialClosure.reason || 'Fechamento especial nesta data.',
      isPaused: false,
      nextOpeningText: 'Consulte os próximos horários',
      canOrder: config.acceptOrdersWhenClosed,
    };
  }

  // Check if businessHours are configured
  if (!config.businessHours || config.businessHours.length === 0) {
    return {
      isOpen: false,
      statusLabel: 'Consulte o horário',
      statusDetail: 'Consulte o horário de atendimento pelo WhatsApp.',
      isPaused: false,
      canOrder: config.acceptOrdersWhenClosed,
    };
  }

  // Check today's schedule
  const todaySchedule = config.businessHours.find((h) => h.dayOfWeek === dayOfWeek);
  // Also check yesterday's schedule for past-midnight periods
  const yesterdayDayOfWeek = (dayOfWeek + 6) % 7;
  const yesterdaySchedule = config.businessHours.find((h) => h.dayOfWeek === yesterdayDayOfWeek);

  let isOpenNow = false;
  let currentClosingTime: string | null = null;

  // Check spillover from yesterday
  if (yesterdaySchedule && yesterdaySchedule.enabled && yesterdaySchedule.periods) {
    for (const p of yesterdaySchedule.periods) {
      const openMins = timeToMinutes(p.open);
      const closeMins = timeToMinutes(p.close);
      if (closeMins < openMins) {
        if (currentMins < closeMins) {
          isOpenNow = true;
          currentClosingTime = p.close;
          break;
        }
      }
    }
  }

  // Check today's periods if not already open from yesterday's spillover
  if (!isOpenNow && todaySchedule && todaySchedule.enabled && todaySchedule.periods) {
    for (const p of todaySchedule.periods) {
      const openMins = timeToMinutes(p.open);
      const closeMins = timeToMinutes(p.close);

      if (closeMins < openMins) {
        if (currentMins >= openMins) {
          isOpenNow = true;
          currentClosingTime = `${p.close} (madrugada)`;
          break;
        }
      } else {
        if (currentMins >= openMins && currentMins <= closeMins) {
          isOpenNow = true;
          currentClosingTime = p.close;
          break;
        }
      }
    }
  }

  // If currently open
  if (isOpenNow) {
    return {
      isOpen: true,
      statusLabel: 'Aberto agora',
      statusDetail: currentClosingTime ? `Até às ${currentClosingTime}` : 'Recebendo pedidos',
      isPaused: false,
      canOrder: true,
    };
  }

  // If closed, find next opening
  let nextOpeningText = 'Consulte o WhatsApp';
  if (todaySchedule && todaySchedule.enabled && todaySchedule.periods) {
    for (const p of todaySchedule.periods) {
      const openMins = timeToMinutes(p.open);
      if (openMins > currentMins) {
        nextOpeningText = `Abre hoje às ${p.open}`;
        break;
      }
    }
  }

  if (nextOpeningText === 'Consulte o WhatsApp') {
    for (let offset = 1; offset <= 7; offset++) {
      const checkDay = (dayOfWeek + offset) % 7;
      const nextDaySched = config.businessHours.find((h) => h.dayOfWeek === checkDay);
      if (nextDaySched && nextDaySched.enabled && nextDaySched.periods && nextDaySched.periods.length > 0) {
        const firstPeriod = nextDaySched.periods[0];
        const dayLabel = offset === 1 ? 'Amanhã' : nextDaySched.dayName;
        nextOpeningText = `Abre ${dayLabel} às ${firstPeriod.open}`;
        break;
      }
    }
  }

  return {
    isOpen: false,
    statusLabel: 'Fechado',
    statusDetail: nextOpeningText,
    isPaused: false,
    nextOpeningText,
    canOrder: config.acceptOrdersWhenClosed,
  };
}
