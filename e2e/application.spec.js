const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { randomUUID } = require("node:crypto");
async function accessible(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
}
test("registration, profile, pets, session recovery and two-person chat", async ({
  browser,
}) => {
  const owner = await browser.newContext(),
    sitter = await browser.newContext();
  const a = await owner.newPage(),
    b = await sitter.newPage();
  const errors = [];
  a.on("pageerror", (e) => errors.push(e.message));
  b.on("pageerror", (e) => errors.push(e.message));
  const suffix = randomUUID();
  async function signup(page, role, name) {
    await page.goto("/signup?role=" + role);
    await page.getByLabel("Имя", { exact: true }).fill(name);
    await page
      .getByLabel("Электронная почта")
      .fill(role + "-" + suffix + "@example.test");
    await page
      .getByLabel("Пароль", { exact: true })
      .fill("fictional-e2e-password");
    await page.getByRole("button", { name: "Создать аккаунт" }).click();
    await expect(
      page.getByRole("heading", { name: "Привет, " + name + "!" }),
    ).toBeVisible();
  }
  await signup(a, "parent", "Demo Owner");
  await signup(b, "sitter", "Demo Sitter");
  for (const page of [a, b]) {
    await page.getByLabel("Страна", { exact: true }).fill("Test");
    await page.getByLabel("Город", { exact: true }).fill("Demo City");
  }
  await a.getByLabel("Заголовок профиля").fill("Our fictional home");
  await a.getByRole("button", { name: "Сохранить профиль" }).click();
  await expect(a.getByText("Профиль сохранён", { exact: true })).toBeVisible();
  await b
    .getByLabel("Ваш опыт и подход")
    .fill("Fictional experience for acceptance checks");
  await b.getByLabel("Кошки", { exact: true }).check();
  await b.getByRole("button", { name: "Сохранить профиль" }).click();
  await expect(b.getByText("Профиль сохранён", { exact: true })).toBeVisible();
  for (const page of [a, b]) {
    await page.setViewportSize({ width: 360, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await accessible(page);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  await a.getByRole("button", { name: "Добавить питомца" }).click();
  await a.getByLabel("Имя питомца").fill("Demo Cat");
  await a.getByLabel("Возраст, лет").fill("3");
  await a.getByRole("button", { name: "Сохранить питомца" }).click();
  await expect(a.getByRole("heading", { name: "Demo Cat" })).toBeVisible();
  await a.reload();
  await expect(a.getByRole("heading", { name: "Demo Cat" })).toBeVisible();
  await a.getByRole("button", { name: "Изменить", exact: true }).click();
  await a.getByLabel("Имя питомца").fill("Demo Cat Updated");
  await a.getByRole("button", { name: "Сохранить питомца" }).click();
  await expect(
    a.getByRole("heading", { name: "Demo Cat Updated" }),
  ).toBeVisible();
  const ownerId = (await a.locator(".id-card strong").innerText()).slice(1),
    sitterId = (await b.locator(".id-card strong").innerText()).slice(1);
  await a.goto("/chat");
  await b.goto("/chat");
  for (const [page, id] of [
    [a, sitterId],
    [b, ownerId],
  ]) {
    await page.getByLabel("ID собеседника").fill(id);
    await page.getByRole("button", { name: "Открыть диалог" }).click();
    await expect(
      page.getByText("Соединение установлено", { exact: true }),
    ).toBeVisible();
  }
  await a
    .getByLabel("Сообщение", { exact: true })
    .fill("Hello from a fictional owner");
  await a.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(b.getByRole("log")).toContainText(
    "Hello from a fictional owner",
  );
  await b
    .getByLabel("Сообщение", { exact: true })
    .fill("Hello from a fictional sitter");
  await b.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(a.getByRole("log")).toContainText(
    "Hello from a fictional sitter",
  );
  await a.setViewportSize({ width: 360, height: 900 });
  expect(
    await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await accessible(a);
  await a.setViewportSize({ width: 1280, height: 900 });
  await b.reload();
  await b.getByLabel("ID собеседника").fill(ownerId);
  await b.getByRole("button", { name: "Открыть диалог" }).click();
  await expect(b.getByRole("log")).toContainText(
    "Hello from a fictional owner",
  );
  await a.goto("/profile");
  await a.getByRole("button", { name: "Удалить", exact: true }).click();
  await a.getByRole("button", { name: "Да, удалить", exact: true }).click();
  await expect(
    a.getByRole("heading", { name: "Здесь появятся ваши любимцы" }),
  ).toBeVisible();
  await a.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(
    a.getByRole("heading", { name: "Рады видеть вас снова" }),
  ).toBeVisible();
  await a
    .getByLabel("Электронная почта")
    .fill("parent-" + suffix + "@example.test");
  await a.getByLabel("Пароль", { exact: true }).fill("fictional-e2e-password");
  await a.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(
    a.getByRole("heading", { name: "Привет, Demo Owner!" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await owner.close();
  await sitter.close();
});
for (const width of [360, 768, 1280]) {
  test(
    "responsive public routes and accessibility at " + width + "px",
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "/",
        "/articles",
        "/cat-sitters",
        "/dog-sitters",
        "/aboutus",
        "/signup",
        "/signin",
        "/missing",
      ]) {
        await page.goto(path);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await expect(page.locator("main")).toBeVisible();
        for (const img of await page.locator("img:visible").all()) {
          await img.scrollIntoViewIfNeeded();
          await expect
            .poll(() => img.evaluate((i) => i.complete && i.naturalWidth > 0))
            .toBe(true);
        }
        if (["/signin", "/signup", "/cat-sitters"].includes(path))
          await accessible(page);
      }
      await page.goto("/");
      await page.screenshot({
        path: "test-results/home-" + width + ".png",
        fullPage: true,
      });
      await accessible(page);
    },
  );
}
test("all nine legacy article routes and keyboard skip navigation", async ({
  page,
}) => {
  for (const path of [
    "/reasons-birds-make-perfect-pets",
    "/how-to-take-great-pet-photos",
    "/7-top-tips-for-senior-pets",
    "/male-vs-female-dogs",
    "/dogs-that-dont-shed",
    "/how-to-show-love-in-dog-language",
    "/top-5-dog-sitting-tips",
    "/cat-sitters",
    "/dog-sitters",
  ]) {
    await page.goto(path);
    await expect(page.locator(".article-prose")).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
  }
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Перейти к содержимому" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
