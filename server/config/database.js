// Sequelize configuration uses the same URL in every environment. Tests explicitly inject their own URL.
module.exports = Object.fromEntries(['development', 'test', 'production'].map(env => [env, {
  use_env_variable: 'DATABASE_URL', dialect: 'postgres', logging: false,
  dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: true } } : {}
}]));
