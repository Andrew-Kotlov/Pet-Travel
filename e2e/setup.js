const { loadEnvFile } = require("node:process");
const { randomBytes } = require("node:crypto");
const { createDatabase } = require("../server/db/models");
const { migrate } = require("../server/src/migrate");
const { start } = require("../server/src/index");
const { readConfig } = require("../server/src/config");
module.exports = async () => {
  try {
    loadEnvFile(".env.test");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw Error("TEST_DATABASE_URL must name a disposable _test database");
  const schema = "pt_test_" + randomBytes(8).toString("hex"),
    admin = createDatabase(url),
    db = createDatabase(url, false, schema);
  await admin.sequelize.query('CREATE SCHEMA "' + schema + '"');
  let runtime;
  const cleanup = async () => {
    if (runtime) await runtime.close();
    await db.sequelize.close();
    await admin.sequelize.query('DROP SCHEMA "' + schema + '" CASCADE');
    await admin.sequelize.close();
  };
  try {
    await migrate(db);
    runtime = await start({
      ...readConfig({
        NODE_ENV: "test",
        DATABASE_URL: url,
        SESSION_SECRET: randomBytes(32).toString("hex"),
        ALLOWED_ORIGINS: "http://127.0.0.1:3187",
        HOST: "127.0.0.1",
        PORT: "3187",
        LOG_LEVEL: "silent",
      }),
      schema,
    });
  } catch (error) {
    await cleanup();
    throw error;
  }
  return cleanup;
};
