let tokenGetter: (() => Promise<string | null>) | null = null;

export function registerTokenGetter(getter: (() => Promise<string | null>) | null): void {
  tokenGetter = getter;
}

export async function getAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  return tokenGetter();
}
