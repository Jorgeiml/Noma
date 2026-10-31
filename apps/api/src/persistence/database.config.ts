export function databaseUrl(env: NodeJS.ProcessEnv): string {
  const value = env.DATABASE_URL;
  try {
    if (!value) throw new Error();
    const url = new URL(value);
    if (
      !["postgresql:", "postgres:"].includes(url.protocol) ||
      !url.hostname ||
      url.pathname.length < 2
    )
      throw new Error();
    return value;
  } catch {
    throw new Error(
      "DATABASE_URL debe configurar una conexión PostgreSQL válida.",
    );
  }
}
