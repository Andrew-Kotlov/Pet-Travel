function createLogger(level = "info") {
  return (severity, event, fields = {}) => {
    if (level === "silent" || (level === "error" && severity !== "error"))
      return;
    // Callers supply only operational metadata; never log request bodies, URLs, user IDs or errors.
    const safe = Object.fromEntries(
      Object.entries(fields).filter(([k]) =>
        ["requestId", "method", "status", "durationMs", "port"].includes(k),
      ),
    );
    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        level: severity,
        event,
        ...safe,
      }),
    );
  };
}
module.exports = { createLogger };
