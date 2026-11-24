const { z } = require("zod");
function readConfig(env = process.env) {
  const schema = z.object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    HOST: z.string().default("127.0.0.1"),
    PORT: z.coerce.number().int().min(0).max(65535).default(3001),
    DATABASE_URL: z
      .string()
      .url()
      .refine((v) => /^postgres(ql)?:/.test(v)),
    SESSION_SECRET: z
      .string()
      .min(32)
      .refine((v) => !v.startsWith("replace_")),
    ALLOWED_ORIGINS: z
      .string()
      .default("http://localhost:5173,http://127.0.0.1:5173"),
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    DB_SSL: z.enum(["true", "false"]).default("false"),
    LOG_LEVEL: z.enum(["info", "error", "silent"]).default("info"),
  });
  const parsed = schema.safeParse(env);
  if (!parsed.success)
    throw new Error(
      "Invalid configuration: " +
        [...new Set(parsed.error.issues.map((i) => i.path[0]))].join(", "),
    );
  const value = parsed.data;
  value.origins = value.ALLOWED_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    !value.origins.length ||
    value.origins.some((s) => {
      try {
        return new URL(s).origin !== s;
      } catch {
        return true;
      }
    })
  )
    throw new Error("Invalid ALLOWED_ORIGINS");
  if (
    value.NODE_ENV === "production" &&
    value.origins.some((s) => !s.startsWith("https://"))
  )
    throw new Error("Production origins require HTTPS");
  return value;
}
module.exports = { readConfig };
