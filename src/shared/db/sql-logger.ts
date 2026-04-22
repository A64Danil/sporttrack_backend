const isDevMode = () => (process.env.NODE_ENV || 'development') !== 'production';

const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

export const logSql = (sql: string, values?: unknown[]) => {
  if (!isDevMode()) {
    return;
  }

  const normalizedSql = normalizeSql(sql);
  if (values && values.length > 0) {
    console.log(`[SQL] ${normalizedSql} | params=${JSON.stringify(values)}`);
    return;
  }

  console.log(`[SQL] ${normalizedSql}`);
};
