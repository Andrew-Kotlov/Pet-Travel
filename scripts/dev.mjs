import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
// Own both processes directly so Ctrl+C cannot leave npm grandchildren running.
const children = [
  spawn(
    process.execPath,
    ["--env-file-if-exists=.env", "server/src/index.js"],
    {
      cwd: root,
      stdio: ["inherit", "inherit", "inherit", "ipc"],
    },
  ),
  spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL("../node_modules/vite/bin/vite.js", import.meta.url),
      ),
      "--host",
      "127.0.0.1",
    ],
    {
      cwd: fileURLToPath(new URL("../client", import.meta.url)),
      stdio: "inherit",
    },
  ),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null || child.signalCode !== null) continue;
    if (child.connected) child.send("shutdown");
    else child.kill();
  }
  const deadline = setTimeout(
    () => children.forEach((child) => child.kill()),
    12000,
  );
  deadline.unref();
  process.exitCode = code;
}
children.forEach((child) => {
  child.on("exit", (code) => {
    stop(code || 0);
    if (
      process.connected &&
      children.every(
        (item) => item.exitCode !== null || item.signalCode !== null,
      )
    )
      process.disconnect();
  });
  child.on("error", () => stop(1));
});
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
process.on("message", (message) => {
  if (message === "shutdown") stop();
});
