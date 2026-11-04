// Administrative contact projection only: never expose provider subjects or session data.
export function applicationEmails(
  identities: ReadonlyArray<{ email: string; verifiedAt: Date | null }>,
) {
  const addresses = new Map<string, { email: string; verified: boolean }>();
  for (const identity of identities) {
    const key = identity.email.trim().toLowerCase(),
      current = addresses.get(key);
    addresses.set(key, {
      email: current?.email ?? identity.email,
      verified: !!identity.verifiedAt || !!current?.verified,
    });
  }
  return [...addresses.values()].sort(
    (a, b) =>
      Number(b.verified) - Number(a.verified) || a.email.localeCompare(b.email),
  );
}
