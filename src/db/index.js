const { config } = require("../config");
const { loadJsonStore, saveJsonStore, ensureJsonStore } = require("./jsonStore");
const { isPostgresConfigured, createPostgresStore } = require("./postgresStore");

function createStore(createInitialData) {
  if (isPostgresConfigured(config.databaseUrl) && config.env === "production") {
    return createPostgresStore();
  }

  return {
    mode: "json",
    load() {
      return loadJsonStore(createInitialData);
    },
    save(db) {
      saveJsonStore(db);
    },
    ensure() {
      ensureJsonStore(createInitialData);
    },
  };
}

module.exports = { createStore };
