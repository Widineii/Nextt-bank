/*
 * PostgreSQL adapter placeholder.
 *
 * The project intentionally avoids external runtime dependencies so it can run
 * on any Windows machine as a portfolio demo. For production, install `pg`,
 * wire these methods to SQL queries, and run the migrations in docs/migrations.
 */

function isPostgresConfigured(databaseUrl) {
  return typeof databaseUrl === "string" && databaseUrl.startsWith("postgres");
}

function createPostgresStore() {
  return {
    mode: "postgres-ready",
    async connect() {
      throw new Error("PostgreSQL adapter requires installing `pg` and enabling production wiring.");
    },
  };
}

module.exports = { isPostgresConfigured, createPostgresStore };
