const fs = require('node:fs');
const path = require('node:path');
const { Sequelize, DataTypes } = require('sequelize');
function createDatabase(url, ssl = false, schema) {
  if (schema && !/^pt_test_[a-f0-9]+$/.test(schema)) throw new Error('Invalid test schema');
  const sequelize = new Sequelize(url, { dialect: 'postgres', logging: false, pool: {max: 10, min: 0, acquire: 10000}, dialectOptions: {...(ssl ? {ssl: {require: true, rejectUnauthorized: true}} : {}), ...(schema ? {options: '-c search_path=' + schema} : {})} });
  const db = { sequelize };
  for (const file of fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js')) {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  }
  for (const model of Object.values(db)) if (model.associate) model.associate(db);
  return db;
}
module.exports = { createDatabase };
