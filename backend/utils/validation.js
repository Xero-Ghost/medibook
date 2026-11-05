export function isValidAvailability(availability) {
  const { days, startTime, endTime, slotDuration } = availability || {};
  const validTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  return Array.isArray(days) &&
    days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
    validTime(startTime) &&
    validTime(endTime) &&
    startTime < endTime &&
    Number.isInteger(slotDuration) &&
    slotDuration >= 15 &&
    slotDuration <= 120;
}

export function validPassword(password) {
  return typeof password === 'string' && password.length >= 8 && Buffer.byteLength(password, 'utf8') <= 72;
}
