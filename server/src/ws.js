const { WebSocketServer, WebSocket } = require("ws");
const { ServerResponse } = require("node:http");
const V = require("./validation");
function attachChat(server, runtime, db, config) {
  const { app, sessionParser, log } = runtime;
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16384 });
  const sessions = new Map();
  const reject = (socket, status) => {
    socket.end("HTTP/1.1 " + status + "\r\nConnection: close\r\n\r\n");
  };
  server.on("upgrade", (req, socket, head) => {
    socket.on("error", () => {});
    if (
      app.locals.draining ||
      req.url !== "/ws" ||
      !config.origins.includes(req.headers.origin)
    )
      return reject(socket, "403 Forbidden");
    const timer = setTimeout(() => socket.destroy(), 5000);
    sessionParser(req, new ServerResponse(req), async (error) => {
      try {
        if (
          error ||
          !req.session?.userId ||
          !(await db.User.findByPk(req.session.userId))
        ) {
          clearTimeout(timer);
          return reject(socket, "401 Unauthorized");
        }
        clearTimeout(timer);
        wss.handleUpgrade(req, socket, head, (ws) =>
          wss.emit("connection", ws, req),
        );
      } catch {
        clearTimeout(timer);
        reject(socket, "503 Service Unavailable");
      }
    });
  });
  app.locals.closeSession = (sid) => {
    for (const ws of sessions.get(sid) || []) ws.close(1008, "Session ended");
  };
  const send = (ws, payload) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  };
  const activeSession = (ws) =>
    new Promise((resolve) =>
      runtime.store.get(ws.sessionId, (error, value) =>
        resolve(
          !error &&
            value?.userId === ws.userId &&
            new Date(value.cookie.expires) > new Date(),
        ),
      ),
    );
  wss.on("connection", (ws, req) => {
    ws.userId = req.session.userId;
    ws.sessionId = req.sessionID;
    ws.alive = true;
    if (
      [...wss.clients].filter((client) => client.userId === ws.userId).length >
      5
    ) {
      ws.close(1008, "Too many connections");
      return;
    }
    if (!sessions.has(req.sessionID)) sessions.set(req.sessionID, new Set());
    sessions.get(req.sessionID).add(ws);
    send(ws, { type: "ready" });
    ws.on("pong", () => {
      ws.alive = true;
    });
    let count = 0,
      windowStart = Date.now(),
      queue = Promise.resolve();
    ws.on("message", (raw) => {
      if (Date.now() - windowStart > 60000) {
        count = 0;
        windowStart = Date.now();
      }
      if (++count > 30) {
        send(ws, { type: "error", error: "Слишком много сообщений" });
        return;
      }
      queue = queue
        .then(async () => {
          await new Promise((resolve, reject) =>
            req.session.reload((e) => (e ? reject(e) : resolve())),
          );
          if (
            req.session.userId !== ws.userId ||
            new Date(req.session.cookie.expires) <= new Date()
          ) {
            ws.close(1008, "Session expired");
            return;
          }
          let payload;
          try {
            payload = V.parse(V.message, JSON.parse(raw.toString()));
          } catch {
            send(ws, { type: "error", error: "Некорректное сообщение" });
            return;
          }
          if (
            payload.recipientId === ws.userId ||
            !(await db.User.findByPk(payload.recipientId))
          ) {
            send(ws, { type: "error", error: "Собеседник не найден" });
            return;
          }
          const message = await db.Message.create({
            senderId: ws.userId,
            recipientId: payload.recipientId,
            text: payload.text,
          });
          for (const client of wss.clients)
            if ([ws.userId, payload.recipientId].includes(client.userId)) {
              if (await activeSession(client))
                send(client, { type: "message", message });
              else client.close(1008, "Session expired");
            }
        })
        .catch(() => {
          log("error", "chat_operation_failed");
          send(ws, {
            type: "error",
            error: "Сессия недоступна. Войдите снова.",
          });
          ws.close(1011, "Session unavailable");
        });
    });
    ws.on("error", () => log("error", "websocket_error"));
    ws.on("close", () => {
      const set = sessions.get(req.sessionID);
      set?.delete(ws);
      if (!set?.size) sessions.delete(req.sessionID);
    });
  });
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.alive) {
        ws.terminate();
        continue;
      }
      ws.alive = false;
      ws.ping();
    }
  }, 30000);
  heartbeat.unref();
  function close() {
    clearInterval(heartbeat);
    for (const ws of wss.clients) ws.terminate();
    wss.close();
  }
  return { wss, close };
}
module.exports = { attachChat };
