import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api";
export default function AuthPage({ signup = false }) {
  const { user, setUser, loading, error: sessionError, refresh } = useAuth();
  const [params] = useSearchParams();
  const [role, setRole] = useState(
    params.get("role") === "sitter" ? "sitter" : "parent",
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate(),
    location = useLocation();
  if (user) return <Navigate to="/profile" replace />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (signup) values.role = role;
    try {
      const data = await api(signup ? "/auth/signup" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setUser(data.user);
      navigate(
        location.state?.from?.startsWith("/") &&
          !location.state.from.startsWith("//")
          ? location.state.from
          : "/profile",
        { replace: true },
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="container auth-layout">
      <div className="auth-story">
        <img src="/images/cat.jpg" alt="Домашняя кошка" />
        <div>
          <span className="eyebrow">ВАША ИСТОРИЯ ЗАБОТЫ</span>
          <h2>
            Большая дружба
            <br />
            начинается с малого.
          </h2>
          <p>
            Расскажите о себе и о тех,
            <br />
            кто делает ваш день теплее.
          </p>
        </div>
      </div>
      <div className="auth-form">
        <span className="eyebrow">ДОБРО ПОЖАЛОВАТЬ</span>
        <h1>{signup ? "Давайте знакомиться" : "Рады видеть вас снова"}</h1>
        <p className="muted">
          {signup
            ? "Создайте свой уголок в Pet&Travel."
            : "Войдите, чтобы вернуться к своим питомцам и сообщениям."}
        </p>
        <form onSubmit={submit}>
          {signup && (
            <>
              <fieldset className="role-choice">
                <legend>Кто вы?</legend>
                {[
                  ["parent", "Владелец питомца"],
                  ["sitter", "Петситтер"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className={role === value ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <label>
                Имя
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="given-name"
                  placeholder="Как к вам обращаться"
                />
              </label>
            </>
          )}
          <label>
            Электронная почта
            <input
              type="email"
              name="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              name="password"
              required
              minLength={signup ? 12 : 1}
              maxLength={72}
              autoComplete={signup ? "new-password" : "current-password"}
              aria-describedby={signup ? "password-hint" : undefined}
            />
          </label>
          {signup && (
            <p id="password-hint" className="field-hint">
              От 12 символов, не более 72 байт. Используйте уникальный пароль.
            </p>
          )}
          {(error || sessionError) && (
            <p className="error" role="alert">
              {error || sessionError}
            </p>
          )}
          {sessionError && (
            <button type="button" className="secondary" onClick={refresh}>
              Повторить подключение
            </button>
          )}
          <button className="wide" disabled={busy || loading || !!sessionError}>
            {busy ? "Подождите…" : signup ? "Создать аккаунт" : "Войти"}
          </button>
        </form>
        <p className="auth-switch">
          {signup ? "Уже знакомы?" : "Ещё нет аккаунта?"}{" "}
          <Link to={signup ? "/signin" : "/signup"}>
            {signup ? "Войти" : "Присоединиться"}
          </Link>
        </p>
      </div>
    </section>
  );
}
