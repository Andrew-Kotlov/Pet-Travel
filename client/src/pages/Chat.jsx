import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
const mergeMessages = (a, b) =>
  [...new Map([...a, ...b].map((m) => [m.id, m])).values()].sort(
    (a, b) => a.id - b.id,
  );
export default function Chat() {
  const { user } = useAuth();
  const [recipient, setRecipient] = useState(null),
    [contactId, setContactId] = useState(""),
    [messages, setMessages] = useState([]),
    [text, setText] = useState("");
  const [connection, setConnection] = useState("connecting"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [pending, setPending] = useState(false),
    [hasMore, setHasMore] = useState(false);
  const socket = useRef(null),
    selected = useRef(null),
    pendingMessage = useRef(null),
    ackTimer = useRef(null);
  useEffect(() => {
    selected.current = recipient;
  }, [recipient]);
  useEffect(() => {
    let disposed = false,
      timer,
      attempt = 0;
    async function syncHistory() {
      const contact = selected.current;
      if (!contact) return;
      try {
        const data = await api("/chat/messages/" + contact.id);
        if (!disposed && selected.current?.id === contact.id) {
          setMessages((old) => mergeMessages(old, data.messages));
          setHasMore(data.hasMore);
        }
      } catch (e) {
        if (!disposed) setError(e.message);
      }
    }
    function connect() {
      if (disposed) return;
      setConnection("connecting");
      const ws = new WebSocket(
        (location.protocol === "https:" ? "wss://" : "ws://") +
          location.host +
          "/ws",
      );
      socket.current = ws;
      ws.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (data.type === "ready") {
          attempt = 0;
          setConnection("online");
          syncHistory();
        }
        if (data.type === "error") {
          setError(data.error);
          setPending(false);
          pendingMessage.current = null;
          clearTimeout(ackTimer.current);
        }
        if (data.type === "message") {
          const m = data.message,
            current = selected.current;
          if (
            current &&
            ((m.senderId === current.id && m.recipientId === user.id) ||
              (m.senderId === user.id && m.recipientId === current.id))
          )
            setMessages((old) => mergeMessages(old, [m]));
          if (
            m.senderId === user.id &&
            m.recipientId === pendingMessage.current?.recipientId &&
            m.text === pendingMessage.current?.text
          ) {
            setText("");
            setPending(false);
            pendingMessage.current = null;
            clearTimeout(ackTimer.current);
          }
        }
      };
      ws.onerror = () => {
        if (!disposed) setConnection("offline");
      };
      ws.onclose = (event) => {
        if (disposed) return;
        setConnection("offline");
        setPending(false);
        pendingMessage.current = null;
        clearTimeout(ackTimer.current);
        if (event.code === 1008) {
          setError("Сессия завершена. Войдите в аккаунт заново.");
          return;
        }
        timer = setTimeout(connect, Math.min(1000 * 2 ** attempt++, 15000));
      };
    }
    connect();
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(ackTimer.current);
      socket.current?.close();
    };
  }, [user.id]);
  async function choose(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/chat/contacts/" + encodeURIComponent(contactId));
      const history = await api("/chat/messages/" + data.user.id);
      setRecipient(data.user);
      selected.current = data.user;
      setMessages(history.messages);
      setHasMore(history.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function older() {
    if (!messages.length) return;
    setLoading(true);
    try {
      const data = await api(
        "/chat/messages/" + recipient.id + "?before=" + messages[0].id,
      );
      setMessages((old) => mergeMessages(data.messages, old));
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  function send(e) {
    e.preventDefault();
    if (!text.trim() || pending) return;
    if (socket.current?.readyState !== WebSocket.OPEN) {
      setError("Дождитесь восстановления соединения");
      return;
    }
    const payload = {
      type: "message",
      recipientId: recipient.id,
      text: text.trim(),
    };
    pendingMessage.current = payload;
    setPending(true);
    setError("");
    socket.current.send(JSON.stringify(payload));
    ackTimer.current = setTimeout(() => {
      setPending(false);
      pendingMessage.current = null;
      setError(
        "Подтверждение не получено. Проверьте историю перед повторной отправкой.",
      );
    }, 10000);
  }
  return (
    <section className="container page-section">
      <span className="eyebrow">БЫТЬ НА СВЯЗИ</span>
      <h1>Личные сообщения</h1>
      <p className="lead">Обсудите то, что важно для вашего питомца.</p>
      <div className="chat-layout">
        <aside className="panel contact-panel">
          <h2>Начать разговор</h2>
          <p>Попросите собеседника поделиться ID из его профиля.</p>
          <form onSubmit={choose}>
            <label>
              ID собеседника
              <input
                type="number"
                min="1"
                max="2147483647"
                step="1"
                required
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                placeholder="Например, 2"
              />
            </label>
            <button disabled={loading || pending}>
              {loading ? "Открываем…" : "Открыть диалог"}
            </button>
          </form>
          <div className="my-chat-id">
            Ваш ID: <strong>#{user.id}</strong>
          </div>
          <p className="field-hint">
            Сообщения сохраняются. После переподключения история появится снова.
          </p>
        </aside>
        <div className="panel conversation">
          <div className="conversation-heading">
            <div>
              <h2>{recipient ? recipient.name : "Ваш разговор"}</h2>
              {recipient && (
                <span className="muted">
                  {recipient.role === "sitter" ? "Петситтер" : "Владелец"} · #
                  {recipient.id}
                </span>
              )}
            </div>
            <span className={"connection " + connection} role="status">
              {connection === "online"
                ? "Соединение установлено"
                : connection === "connecting"
                  ? "Подключаемся…"
                  : "Нет соединения"}
            </span>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {recipient ? (
            <>
              {hasMore && (
                <button
                  className="secondary"
                  disabled={loading}
                  onClick={older}
                >
                  Предыдущие сообщения
                </button>
              )}
              <div
                className="messages"
                role="log"
                aria-label="История сообщений"
                aria-live="polite"
              >
                {!messages.length && (
                  <div className="empty">
                    <h3>Самое время познакомиться</h3>
                    <p>Расскажите о себе и начните разговор.</p>
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      "message " + (m.senderId === user.id ? "own" : "")
                    }
                  >
                    <p>{m.text}</p>
                    <time dateTime={m.createdAt}>
                      {new Date(m.createdAt).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                ))}
              </div>
              <form className="message-form" onSubmit={send}>
                <label>
                  Сообщение
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={2000}
                    required
                    disabled={pending}
                    placeholder="Напишите что-нибудь доброе…"
                  />
                </label>
                <button
                  disabled={connection !== "online" || pending || !text.trim()}
                >
                  {pending ? "Отправляем…" : "Отправить"}
                </button>
              </form>
            </>
          ) : (
            <div className="empty conversation-empty">
              <span aria-hidden="true">♡</span>
              <h3>Знакомство начинается с «привет»</h3>
              <p>Введите ID, чтобы открыть личный диалог.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
