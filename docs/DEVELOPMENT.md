# Разработка и локальный запуск

## Требования

- Node.js **24.22.3 LTS** из `.nvmrc`; поддерживаемый диапазон проекта `>=24.15.0 <25`.
- npm **11 или 12**, приёмка выполнена на **12.2.3**. Устанавливать зависимости из корня, не отдельно в client/server.
- PostgreSQL **17**, проверено на **17.12**. Другие версии не входят в проведённую приёмку.
- Для E2E — Chromium/Chrome и свободный localhost-порт **3187**.

Команды ниже предназначены для Ubuntu в WSL2 с уже установленными Node.js/npm и работающей PostgreSQL. В ходе разработки проверка выполнена в Windows с отдельным локальным PostgreSQL; WSL и системные службы не настраивались.

## Подготовка чистой среды Ubuntu/WSL2

```bash
git clone https://github.com/Andrew-Kotlov/Pet-Travel.git
cd Pet-Travel
git switch main
# Если используете nvm:
nvm install
nvm use
node --version
npm --version
npm ci
```

Для новой локальной БД создайте отдельную роль и базу. Команды предназначены только для новой лабораторной среды; существующие базы не удаляются:

```bash
sudo -u postgres createuser --pwprompt pet_travel
sudo -u postgres createdb --owner=pet_travel pet_travel
cp .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

В `.env` замените `DATABASE_URL` на свою строку подключения и `SESSION_SECRET` на полученное случайное значение. Пароль роли PostgreSQL выбираете вы; `local_password` из примера не является рабочим секретом. Специальные символы пароля в URL нужно percent-encode. Не коммитьте `.env`.

```bash
npm run db:migrate
npm run dev
```

Страница — `http://127.0.0.1:5173`; API — `http://127.0.0.1:3001`. Vite проксирует `/api` и `/ws`, поэтому frontend использует относительные URL. При смене API-порта достаточно `PORT` в корневом `.env`; для отдельного адреса можно задать `API_PROXY_TARGET`. Если меняете origin frontend, добавьте его в `ALLOWED_ORIGINS`.

`npm run dev` владеет обоими дочерними процессами и останавливает их при Ctrl+C/ошибке одного из процессов. Vite поддерживает HMR. Backend в общем запуске нужно перезапустить после изменения файлов. Для отдельной работы в двух терминалах доступны:

```bash
npm run dev --workspace server
npm run dev --workspace client
```

У серверного workspace есть `--watch`; останавливайте оба терминала. Frontend `preview` — только просмотр сборки Vite, полноценное приложение проверяйте через Express:

```bash
npm run build
npm start
curl --fail http://127.0.0.1:3001/health/live
curl --fail http://127.0.0.1:3001/health/ready
curl --fail http://127.0.0.1:3001/version
```

Откройте `http://127.0.0.1:3001`. Для локального HTTP оставьте `NODE_ENV=development`; production включает Secure cookie и требует HTTPS-origin. Для прямого запуска без npm из корня: `node --env-file=.env server/src/index.js`.

## Миграции и вымышленные данные

`npm run db:migrate` применяет только отсутствующие миграции. Повторный запуск безопасен. Все 9 миграций и обновление со старых 8 проверены на настоящей БД. Данные не стираются. Старую схему сначала проверяйте на копии БД: новые ограничения могут выявить дубликаты email/профилей, неправильные роли, возраст или пустые связи. Ошибка откатывает транзакцию; устранение неоднозначных данных — отдельное осознанное решение владельца.

Seed необязателен. Он создаёт только `owner@example.test`, `sitter@example.test`, вымышленные профили и «Демо Барсика». Для Ubuntu:

```bash
read -rsp 'Пароль вымышленных аккаунтов (12–72 байта): ' DEMO_PASSWORD
printf '\n'
export DEMO_PASSWORD
ALLOW_DEMO_SEED=true npm run db:seed
unset DEMO_PASSWORD
```

В PowerShell можно временно задать `$env:ALLOW_DEMO_SEED='true'` и `$env:DEMO_PASSWORD` в своей сессии, затем удалить эти переменные. Seed отказывается запускаться без явного флага или в production. Повторный запуск не дублирует записи и не меняет пароль уже существующего demo-аккаунта. Пароли не выводятся в лог и не заданы в коде. Для регистрации новых аккаунтов seed не нужен.

## Тестовая БД

Создайте отдельную роль, не имеющую доступа к рабочей БД:

```bash
sudo -u postgres createuser --pwprompt pet_travel_test
sudo -u postgres createdb --owner=pet_travel_test pet_travel_test
cp .env.test.example .env.test
```

Задайте в `.env.test` собственный `TEST_DATABASE_URL`. Имя БД обязано оканчиваться на `_test`. Роль должна иметь право создавать схемы в этой тестовой БД. Тесты создают случайные `pt_test_<hex>` схемы, применяют миграции и удаляют только свои схемы. Нельзя указывать рабочую БД, даже переименованную под шаблон. При аварийном завершении процесса схема может остаться; сначала выясните принадлежность, не очищайте всю БД автоматически.

```bash
npm run lint
npm test
npm run build
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
npm audit
```

E2E запускает собственный Express на `127.0.0.1:3187` и тестовую схему; основной dev-сервер ему не нужен. Перед ним нужна актуальная сборка `client/dist`. Если зависимости браузера Ubuntu отсутствуют, их установку выполняет владелец среды. Для уже установленного браузера задайте `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` полным путём. Снимки и трассы пишутся в игнорируемый `test-results/`.

## Типовые проблемы

| Симптом | Что проверить |
|---|---|
| `startup_failed`, код выхода 1 | Обязательные env, длину секрета, доступность host/port; значения не пишутся в журнал |
| `/health/live` 200, `/health/ready` 503 | Доступность PostgreSQL, права и выполненные миграции |
| Вход не сохраняется | Одинаковый origin браузера, allowlist, cookie; в production HTTPS и корректный `TRUST_PROXY` |
| 403 после истечения сессии | Перезагрузить страницу, получить новый CSRF и войти снова |
| Vite не стартует | Порт 5173 занят; `strictPort` предотвращает незаметную смену origin |
| Ошибка миграции | Сначала копия/бэкап, затем проверка legacy-данных; не удалять таблицы |
| `TEST_DATABASE_URL` отсутствует | Создать `.env.test`; тесты намеренно завершаются ошибкой, а не пропускаются |

Точные версии дерева закреплены в корневом `package-lock.json`. `npm ci` воспроизведён; нельзя заменять его на принудительный `npm audit fix --force`.
