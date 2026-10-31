export function assertTestDatabaseUrl(value: string | undefined): string {
  try {
    if (!value || process.env.NODE_ENV === "production") throw new Error();
    const url = new URL(value);
    if (
      !["postgresql:", "postgres:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.pathname !== "/beauty_wellness_test" ||
      decodeURIComponent(url.username) !== "bw_test" ||
      [...url.searchParams.keys()].some((key) => key !== "schema") ||
      (url.searchParams.has("schema") &&
        url.searchParams.get("schema") !== "public")
    )
      throw new Error();
    return value;
  } catch {
    throw new Error(
      "Tests requieren TEST_DATABASE_URL local, usuario bw_test y base beauty_wellness_test; no se ejecutaron migraciones ni escrituras.",
    );
  }
}
