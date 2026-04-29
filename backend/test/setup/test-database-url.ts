export const getTestDatabaseUrl = (): string => {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to derive the integration test database URL');
  }

  const databaseUrl = new URL(process.env.DATABASE_URL);
  const databaseName = databaseUrl.pathname.replace(/^\//, '');

  if (!databaseName) {
    throw new Error('DATABASE_URL must include a database name');
  }

  databaseUrl.pathname = `/${databaseName}_test`;

  return databaseUrl.toString();
};

