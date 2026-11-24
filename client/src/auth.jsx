import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "./api";
const Auth = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const inFlight = useRef(null);
  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    setLoading(true);
    inFlight.current = api("/auth/session")
      .then((data) => {
        setUser(data.user);
        setError("");
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => {
        inFlight.current = null;
        setLoading(false);
      });
    return inFlight.current;
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    await refresh();
  };
  return (
    <Auth.Provider value={{ user, setUser, loading, error, refresh, logout }}>
      {children}
    </Auth.Provider>
  );
}
export const useAuth = () => useContext(Auth);
export function Protected({ children }) {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="empty" role="status">
        Проверяем вход…
      </div>
    );
  if (error)
    return (
      <div className="empty">
        <p role="alert">{error}</p>
        <button onClick={refresh}>Повторить</button>
      </div>
    );
  return user ? (
    children
  ) : (
    <Navigate to="/signin" state={{ from: location.pathname }} replace />
  );
}
