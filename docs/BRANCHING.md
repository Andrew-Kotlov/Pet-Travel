# Ветки и сохранение истории

## Рабочая схема

- `main` — прошедшее приёмку приложение, точка передачи DevOps.
- `develop` — интеграционная ветка, после выпуска синхронизируется с main fast-forward.
- `feature/*` — новый функционал, `fix/*` — исправления, `docs/*` — документация. Ветка этой модернизации — `codex/pet-travel-modernization`.
- Изменения поступают в develop через PR; выпуск — PR develop → main. Проверки выбираются по затронутой функциональности, перечень в [TESTING](TESTING.md).
- Опубликованную историю не переписывать. Никакого force-push, reset общих веток или обхода защиты. Архивные теги не перемещать.

## Ревизия 24 ноября 2026

До работы было восемь удалённых веток. `main` содержала документацию, основной код находился в `dev`. Относительно dev у footer был один уникальный коммит, у main — четыре документирующих коммита; остальные исходные головы уже входили в историю dev. На момент ревизии открытых PR не было, доступных check runs у исходной головы dev — 0. Других удалённых веток в первоначальном fetch не обнаружено.

До интеграции все головы сохранены в тегах `archive/2026-11-24/<ветка>`, отправлены в origin и сверены по SHA через `git ls-remote`. Рабочая ветка создана от dev; footer и main включены merge-коммитами. Поэтому авторские коммиты всех восьми веток доступны не только в архиве, но и в истории приложения. README обновлён по фактическим возможностям; `docs/CODEX_TASK.md` не менялся.

| Старая ветка | Новый статус | Проверенный архив / исходный SHA | Что вошло в продукт |
|---|---|---|---|
| main | Стабильное приложение после release PR | [archive/main](https://github.com/Andrew-Kotlov/Pet-Travel/tree/archive/2026-11-24/main), `27d9020d49bf9ce58e1fa68160733849541d78a5` | README, LICENSE, полное задание; стиль README сохранён и актуализирован |
| dev | Сохранена как историческая ветка; развитие в develop | [archive/dev](https://github.com/Andrew-Kotlov/Pet-Travel/tree/archive/2026-11-24/dev), `6daafbffed10c1a87ad34ef58f2b90913cf0d2c4` | Исходная структура client/server, статьи, модели и миграции; основа модернизации |
| authBranch | Историческая, не удалена; была предком dev | [archive/authBranch](https://github.com/Andrew-Kotlov/Pet-Travel/tree/archive/2026-11-24/authBranch), `cc8725adb9a2ab7aa26191d4cf01e7d5dd7ed52b` | Назначение форм/ролей; регистрация заменена проверенным API и UI |
| chat | Историческая, не удалена; была предком dev | [archive/chat](https://github.com/Andrew-Kotlov/Pet-Travel/tree/archive/2026-11-24/chat), `12951e60cb6d3ed4652be3101a232eea61ba73bc` | Идея общения; экспериментальный обработчик и фиктивные сообщения заменены работающим WS |
| databaseBranch | Историческая, не удалена; была предком dev | [archive/databaseBranch](https://github.com/Andrew-Kotlov/Pet-Travel/tree/archive/2026-11-24/databaseBranch), `64df8bf8f408d8917ce67c934a7d31bb9d5747d9` | Восемь моделей/миграций, связи и графические исходники |
| footer | Уникальный коммит объединён; ветка сохранена | [archive/footer](https://github.com/Andrew-Kotlov/Pet-Travel/tree/archive/2026-11-24/footer), `e20816fe93a356ff00aedac7002c95e18403830e` | Ссылки на материалы и навигационное назначение; вёрстка обновлена |
| mainpage | Историческая, не удалена; была предком dev | [archive/mainpage](https://github.com/Andrew-Kotlov/Pet-Travel/tree/archive/2026-11-24/mainpage), `b812a5db8ce8fffd13a10a148bfffa382b01c066` | Все девять статей и URL; удалены пустые фото/ложные обещания услуг |
| navbar | Историческая, не удалена; была предком dev | [archive/navbar](https://github.com/Andrew-Kotlov/Pet-Travel/tree/archive/2026-11-24/navbar), `1bdbfbbc6bd85b92a6c72c646414c22ea16b93dd` | Структура навигации; ссылки соединены с реальными маршрутами |

Старые ветки намеренно оставлены: они доступны для сравнения, но не являются актуальными рабочими ветками. Удалять их для запуска приложения не требуется. `develop` создана от исходной main, чтобы модернизация вошла в интеграционную ветку целиком через PR. Используются обычные merge-коммиты, сохраняющие историю, без squash/rebase опубликованных веток.

## Проверка сохранности

Из клона с полученными тегами:

```bash
git fetch origin --tags
git log --graph --oneline --all
git ls-remote --tags origin 'archive/2026-11-24/*'
git merge-base --is-ancestor archive/2026-11-24/dev origin/main
git merge-base --is-ancestor archive/2026-11-24/footer origin/main
```

Та же проверка ancestry выполнена для всех восьми архивных голов. Успешный `merge-base --is-ancestor` возвращает 0 без вывода. Не путать сохранение коммитов с сохранением всех старых реализаций в актуальном дереве: сломанный код заменён, исходники остаются в истории.

Коммиты реализации: [API/БД/WS](https://github.com/Andrew-Kotlov/Pet-Travel/commit/2b7901f), [сессии и завершение процессов](https://github.com/Andrew-Kotlov/Pet-Travel/commit/1996a8a), [интерфейс и E2E](https://github.com/Andrew-Kotlov/Pet-Travel/commit/45b30f5). Итоговые PR доступны в [истории Pull Request](https://github.com/Andrew-Kotlov/Pet-Travel/pulls?q=is%3Apr+is%3Amerged).
