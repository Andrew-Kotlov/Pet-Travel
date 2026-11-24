import { beforeEach, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { AuthProvider } from "../auth";
import { articles } from "../articles";
let sessionUser = null;
beforeEach(() => {
  sessionUser = null;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      const path = url.replace("/api", "");
      let data = { user: sessionUser, csrfToken: "test-token" };
      if (path === "/auth/signup") {
        const values = JSON.parse(options.body);
        sessionUser = { id: 1, name: values.name, role: values.role };
        data = { user: sessionUser, csrfToken: "rotated" };
      }
      if (path === "/profile") data = { user: sessionUser, profile: null };
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});
const mount = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
it("StrictMode shares the initial session request to avoid CSRF cookie races", async () => {
  render(
    <StrictMode>
      <MemoryRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </StrictMode>,
  );
  await waitFor(() =>
    expect(
      fetch.mock.calls.filter(([url]) => url.endsWith("/auth/session")),
    ).toHaveLength(1),
  );
});
it("home presents existing features without booking or payments", async () => {
  mount();
  expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
    "Спокойно вам",
  );
  expect(
    screen.getByRole("link", { name: "Создать свой профиль" }),
  ).toHaveAttribute("href", "/signup");
  expect(
    screen.queryByRole("button", { name: /забронировать/i }),
  ).not.toBeInTheDocument();
});
it.each(articles)(
  "legacy article route remains available: $slug",
  async (article) => {
    mount("/" + article.slug);
    expect(
      await screen.findByRole("heading", { level: 1, name: article.title }),
    ).toBeInTheDocument();
    expect(
      document.querySelector(".article-prose").textContent.length,
    ).toBeGreaterThan(1000);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  },
);
it("article search and category filters have real empty states", async () => {
  const user = userEvent.setup();
  mount("/articles");
  await screen.findByText("Статей: 9");
  await user.click(screen.getByRole("button", { name: "Кошки", exact: true }));
  expect(screen.getByText("Статей: 1")).toBeInTheDocument();
  await user.type(screen.getByRole("searchbox"), "несуществующий запрос");
  expect(screen.getByText("Статей: 0")).toBeInTheDocument();
  expect(screen.getByText(/Таких статей пока нет/)).toBeInTheDocument();
});
it("protected profile redirects to the login form", async () => {
  mount("/profile");
  expect(
    await screen.findByRole("heading", { name: "Рады видеть вас снова" }),
  ).toBeInTheDocument();
});
it("registration honors role and opens profile after a successful API response", async () => {
  const user = userEvent.setup();
  mount("/signup?role=sitter");
  expect(screen.getByRole("radio", { name: "Петситтер" })).toBeChecked();
  await user.type(screen.getByLabelText("Имя"), "Demo sitter");
  await user.type(
    screen.getByLabelText("Электронная почта"),
    "sitter@example.test",
  );
  await user.type(screen.getByLabelText("Пароль"), "fictional-password");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Создать аккаунт" }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));
  expect(
    await screen.findByRole("heading", { name: "Привет, Demo sitter!" }),
  ).toBeInTheDocument();
  expect(await screen.findByLabelText("Ваш опыт и подход")).toBeInTheDocument();
  const call = fetch.mock.calls.find(([url]) => url.endsWith("/signup"));
  expect(JSON.parse(call[1].body).role).toBe("sitter");
});
it("login displays server errors and allows another attempt", async () => {
  const user = userEvent.setup();
  mount("/signin");
  await user.type(
    screen.getByLabelText("Электронная почта"),
    "owner@example.test",
  );
  await user.type(screen.getByLabelText("Пароль"), "wrong");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Войти", exact: true }),
    ).toBeEnabled(),
  );
  fetch.mockImplementationOnce(
    async () =>
      new Response(JSON.stringify({ error: "Неверная почта или пароль" }), {
        status: 401,
      }),
  );
  await user.click(screen.getByRole("button", { name: "Войти", exact: true }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Неверная почта или пароль",
  );
  expect(
    screen.getByRole("button", { name: "Войти", exact: true }),
  ).toBeEnabled();
});
it("session loading failure offers a retry on private pages", async () => {
  fetch.mockRejectedValueOnce(new Error("Сервис недоступен"));
  mount("/profile");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Сервис недоступен",
  );
  expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
});
it("unknown pages have a working home link", async () => {
  mount("/not-a-page");
  expect(
    await screen.findByRole("heading", {
      name: "Кажется, здесь никто не прятался",
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "На главную" })).toHaveAttribute(
    "href",
    "/",
  );
});
it("mobile menu exposes expanded state and closes on navigation", async () => {
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole("button", { name: "Меню" }));
  expect(screen.getByRole("button", { name: "Меню" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await user.click(
    screen.getAllByRole("link", { name: "О проекте", exact: true })[0],
  );
  expect(screen.getByRole("button", { name: "Меню" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
