const UTC_SUFFIX = /(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * API timestamps are stored as UTC. Older rows are serialized without a
 * timezone suffix, so explicitly mark those values as UTC before formatting.
 */
export function parseApiDate(value: string): Date {
  const normalized = UTC_SUFFIX.test(value) ? value : `${value}Z`;
  return new Date(normalized);
}

export function formatFullDateTime(value: string): string {
  return parseApiDate(value).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "long",
  });
}

export function formatShortDate(value: string): string {
  return parseApiDate(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
