let token;
export async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "X-CSRF-Token": token } : {}),
      ...options.headers,
    },
  });
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.error || "Сервис временно недоступен. Попробуйте ещё раз.",
    );
  if (data?.csrfToken) token = data.csrfToken;
  return data;
}
