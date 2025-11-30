export const buildPrefillQuery = (obj: unknown) =>
  'prefill=' + encodeURIComponent(JSON.stringify(obj ?? {}));

