export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isDateString(value: unknown): value is string {
  if (!isString(value)) return false;

  const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;

  return dateRegex.test(value);
}

export function isEmptyString(value: unknown): boolean {
  return isString(value) && value.trim() === '';
}
