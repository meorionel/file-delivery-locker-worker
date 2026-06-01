export function csrfHeaders(csrfToken?: string | null): Record<string, string> {
  return csrfToken ? { "x-csrf-token": csrfToken } : {};
}
