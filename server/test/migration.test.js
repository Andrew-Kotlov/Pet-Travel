const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DataTypes } = require("sequelize");
const { createDatabase } = require("../db/models");
const { migrate } = require("../src/migrate");

test("legacy upgrade preserves rows and refuses ambiguous accounts atomically", async (t) => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(
    url && new URL(url).pathname.endsWith("_test"),
    "Explicit _test database required",
  );
  const schema = "pt_test_" + randomBytes(8).toString("hex"),
    admin = createDatabase(url);
  await admin.sequelize.query('CREATE SCHEMA "' + schema + '"');
  const db = createDatabase(url, false, schema);
  t.after(async () => {
    await db.sequelize.close();
    await admin.sequelize.query('DROP SCHEMA "' + schema + '" CASCADE');
    await admin.sequelize.close();
  });
  await db.sequelize.query(
    'CREATE TABLE "SequelizeMeta" (name varchar(255) PRIMARY KEY)',
  );
  const directory = path.join(__dirname, "../db/migrations");
  for (const name of fs
    .readdirSync(directory)
    .filter((n) => n.startsWith("2022"))
    .sort()) {
    await require(path.join(directory, name)).up(
      db.sequelize.getQueryInterface(),
      DataTypes,
    );
    await db.sequelize.query('INSERT INTO "SequelizeMeta" VALUES (:name)', {
      replacements: { name },
    });
  }
  const user = await db.User.create({
    name: "Legacy Test",
    email: "legacy@example.test",
    password: "not-a-real-account-hash",
    role: "parent",
  });
  const profile = await db.ParentProfile.create({
    UserId: user.id,
    country: "Test",
    city: "Test",
    title: "Existing profile",
    dateSince1: new Date(),
    dateUntil1: new Date(),
  });
  const pet = await db.Pet.create({
    ParentProfileId: profile.id,
    petName: "Existing fictional pet",
    type: "cat",
    petAge: 4,
  });
  const duplicate = await db.User.create({
    name: "Duplicate Test",
    email: "LEGACY@example.test",
    password: "not-a-real-account-hash",
    role: "parent",
  });
  await assert.rejects(migrate(db));
  assert.equal((await db.User.findByPk(user.id)).email, "legacy@example.test");
  assert.equal(
    (
      await db.sequelize.query(
        'SELECT count(*)::int AS count FROM "SequelizeMeta"',
      )
    )[0][0].count,
    8,
  );
  assert.equal(
    (
      await db.sequelize.query("SELECT to_regclass('session') AS table_name")
    )[0][0].table_name,
    null,
  );
  // This row was created by this test; resolving a real duplicate needs an owner's decision.
  await duplicate.destroy();
  await migrate(db);
  assert.equal(
    (await db.Pet.findByPk(pet.id)).petName,
    "Existing fictional pet",
  );
  assert.equal(
    (await db.ParentProfile.findByPk(profile.id)).title,
    "Existing profile",
  );
  await profile.update({ dateSince1: null, dateUntil1: null });
  assert.equal(
    (
      await db.sequelize.query(
        'SELECT count(*)::int AS count FROM "SequelizeMeta"',
      )
    )[0][0].count,
    9,
  );
});
