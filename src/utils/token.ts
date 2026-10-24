export function parseTokenExpiry(token: string): Date | null {
  try {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    if (!payload.exp) return null;

    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}
