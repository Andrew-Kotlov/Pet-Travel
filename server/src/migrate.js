const fs = require("node:fs");
const path = require("node:path");
const { DataTypes } = require("sequelize");
const { createDatabase } = require("../db/models");
async function migrate(db) {
  const q = db.sequelize.getQueryInterface();
  await db.sequelize.transaction(async (transaction) => {
    await db.sequelize.query("SELECT pg_advisory_xact_lock(721124)", {
      transaction,
    });
    await db.sequelize.query(
      'CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name varchar(255) PRIMARY KEY)',
      { transaction },
    );
    const [rows] = await db.sequelize.query(
      'SELECT name FROM "SequelizeMeta"',
      { transaction },
    );
    const done = new Set(rows.map((r) => r.name));
    const positions = {
      createTable: 2,
      addIndex: 2,
      changeColumn: 3,
      addConstraint: 1,
    };
    const txq = new Proxy(q, {
      get(target, key) {
        if (!(key in positions))
          return typeof target[key] === "function"
            ? target[key].bind(target)
            : target[key];
        return (...args) => {
          const i = positions[key];
          args[i] = { ...args[i], transaction };
          return target[key](...args);
        };
      },
    });
    for (const name of fs
      .readdirSync(path.join(__dirname, "../db/migrations"))
      .filter((n) => n.endsWith(".js"))
      .sort()) {
      if (done.has(name)) continue;
      await require("../db/migrations/" + name).up(txq, DataTypes, transaction);
      await db.sequelize.query(
        'INSERT INTO "SequelizeMeta" (name) VALUES (:name)',
        { replacements: { name }, transaction },
      );
    }
  });
}
if (require.main === module) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const db = createDatabase(
    process.env.DATABASE_URL,
    process.env.DB_SSL === "true",
  );
  migrate(db)
    .then(() => console.log("Migrations complete"))
    .catch(() => {
      console.error(
        "Migration failed; transaction rolled back. Check database access, duplicate emails and profiles.",
      );
      process.exitCode = 1;
    })
    .finally(() => db.sequelize.close());
}
module.exports = { migrate };
