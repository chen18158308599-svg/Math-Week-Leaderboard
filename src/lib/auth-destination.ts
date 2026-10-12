// Shared by browser login and server redirects: preserve participation routes,
// never send a sign-in without a valid destination to the kiosk home.
export const DEFAULT_AUTH_DESTINATION = "/puzzles";

export function authDestination(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) {
    return DEFAULT_AUTH_DESTINATION;
  }
  try {
    const url = new URL(value, "https://mathweek.invalid");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "https://mathweek.invalid" || /[\\\u0000-\u001f]/.test(path)) return DEFAULT_AUTH_DESTINATION;
    const allowed = /^(?:\/puzzles|\/profile|\/staff\/claim|\/puzzle\/[a-z0-9-]+|\/claim\/[A-Za-z0-9_-]+|\/digital\/pair\/[A-Za-z0-9_-]+|\/admin(?:\/[a-z0-9-]+)*)$/;
    if (!allowed.test(path)) return DEFAULT_AUTH_DESTINATION;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_DESTINATION;
  }
}
