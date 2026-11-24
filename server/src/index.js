const http = require("node:http");
const { readConfig } = require("./config");
const { createDatabase } = require("../db/models");
const { createApp } = require("./app");
const { attachChat } = require("./ws");
const { createLogger } = require("./logger");
async function start(config = readConfig()) {
  const db = createDatabase(
    config.DATABASE_URL,
    config.DB_SSL === "true",
    config.schema,
  );
  const runtime = createApp({ db, config });
  const server = http.createServer(runtime.app);
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  const chat = attachChat(server, runtime, db, config);
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(config.PORT, config.HOST, resolve);
    });
  } catch (error) {
    chat.close();
    runtime.store.close();
    await runtime.pool.end();
    await db.sequelize.close();
    throw error;
  }
  runtime.log("info", "server_started", { port: server.address().port });
  let closing;
  const close = () =>
    (closing ||= (async () => {
      runtime.app.locals.draining = true;
      chat.close();
      const timeout = setTimeout(() => server.closeAllConnections(), 10000);
      timeout.unref();
      await new Promise((resolve) => server.close(resolve));
      clearTimeout(timeout);
      runtime.store.close();
      await runtime.pool.end();
      await db.sequelize.close();
      runtime.log("info", "server_stopped");
    })());
  return { ...runtime, db, server, chat, close };
}
if (require.main === module) {
  start()
    .then((runtime) => {
      const shutdown = () =>
        runtime
          .close()
          .catch(() => {
            process.exitCode = 1;
          })
          .finally(() => {
            if (process.connected) process.disconnect();
          });
      for (const signal of ["SIGTERM", "SIGINT"])
        process.once(signal, shutdown);
      process.on("message", (message) => {
        if (message === "shutdown") shutdown();
      });
      process.once("disconnect", shutdown);
    })
    .catch(() => {
      createLogger()("error", "startup_failed");
      process.exitCode = 1;
      if (process.connected) process.disconnect();
    });
}
module.exports = { start };
