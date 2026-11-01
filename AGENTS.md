# AGENTS.md — toptrealty-site

> Этот файл читает любой AI-агент перед началом работы с проектом.

## Что это

Сайт недвижимости (TopRealty). Монорепо: `apps/web` (Next.js) + `apps/cms` (Strapi). Скрипты импорта спарсенных данных в `scripts/`, данные в `data/parsed` (в git не входят).

## Правила

1. Репозиторий: `github.com/neatstudio1/toprieltor`. Результат работы коммитить и пушить.
2. `.env` и данные парсеров (`data/parsed/`) не коммитить — в `.gitignore`.
3. Docker: `docker-compose.yml` поднимает связку локально.
4. Перед правками проверить `git status` — могут быть незапушенные изменения других сессий.
