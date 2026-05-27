const FRENCH_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function formatFrenchDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);

  return parts.join('/');
}

export function parseFrenchDate(date: string) {
  const match = FRENCH_DATE_PATTERN.exec(date.trim());

  if (!match) {
    return null;
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return {
    day: dayText,
    month: monthText,
    year: yearText,
    timestamp: parsedDate.getTime(),
  };
}

export function isFrenchDate(date: string) {
  return parseFrenchDate(date) !== null;
}

export function getDateSortValue(date: string, time = '') {
  const parsedDate = parseFrenchDate(date);

  if (!parsedDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [hours = '0', minutes = '0'] = time.split(':');
  const timeOffset = Number(hours) * 60 * 60 * 1000 + Number(minutes) * 60 * 1000;

  return parsedDate.timestamp + timeOffset;
}
