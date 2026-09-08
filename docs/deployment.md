# Деплой TOPиелтор на сервер

Инструкция для первого продакшн-деплоя монорепо `toptrealty-site` (Next.js + Strapi + PostgreSQL) на обычный Linux-сервер (VPS). Рассчитана на масштаб проекта — один сайт риелтора, без нужды в Kubernetes/serverless-инфраструктуре: обычный VPS с процесс-менеджером и Nginx полностью справится.

## 1. Архитектура и что нужно от сервера

Три процесса на одной машине:

- **apps/web** — Next.js (Node.js), слушает порт 3001, отдаёт сайт
- **apps/cms** — Strapi (Node.js), слушает порт 1337, отдаёт админку и API
- **PostgreSQL** — база данных для Strapi

Перед ними — Nginx как reverse proxy с SSL-сертификатом, который отдаёт домен наружу и проксирует на 3001/1337.

### Требования к серверу

| Параметр | Бюджетный (со свопом) | Комфортно |
|---|---|---|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 2 ГБ + 2 ГБ swap | 4 ГБ (swap всё равно не помешает) |
| Диск | 30 ГБ NVMe/SSD | 40+ ГБ |
| ОС | Ubuntu 22.04/24.04 LTS | — |

В рабочем режиме Next.js + Strapi + Postgres вместе занимают около 700 МБ–1 ГБ RAM — 2 ГБ для этого достаточно. Риск не в этом, а в моменте **сборки**: `strapi build` компилирует всю админку (тяжёлый React-билд), а `next build` генерирует статику по всем ЖК/квартирам/статьям — оба процесса могут кратковременно требовать 1,5–2 ГБ. На чистых 2 ГБ без свопа сборка может упасть с out-of-memory. Своп-файл (шаг ниже) полностью закрывает этот риск ценой того, что сама сборка может идти на несколько минут дольше — для сайта с редкими деплоями это нормальный компромисс.

Диск: 30 ГБ хватает с запасом — фото ЖК раздаются напрямую с CDN застройщиков, на сервере не хранятся; место уходит только на систему, `node_modules` и базу.

### Провайдер

Так как часть фото застройщиков уже раздаётся с `s3.timeweb.cloud`, разумно смотреть на российских провайдеров с VPS + управляемым PostgreSQL в одном месте — например **Timeweb Cloud**, **Selectel** или **VK Cloud**. Подойдёт любой VPS-провайдер с Ubuntu-образом; управляемая база данных не обязательна, но снимает с вас бэкапы и апдейты PostgreSQL.

## 2. Домен и DNS

1. Купите домен (например, `toprieltor.ru`).
2. В DNS-панели домена добавьте A-запись, указывающую на IP сервера:
   ```
   @    A    <IP сервера>
   www  A    <IP сервера>
   ```
3. Дайте записи разойтись (обычно от 10 минут до нескольких часов).

## 3. Подготовка сервера

Подключитесь по SSH и выполните:

```bash
# Обновить систему
apt update && apt upgrade -y

# Своп-файл — обязателен на серверах с 2 ГБ RAM, не помешает и на 4 ГБ.
# Без него сборка Strapi/Next.js может упасть с out-of-memory.
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Node.js 22 LTS (через nvm — проще всего обновлять версию в будущем)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Nginx + certbot для SSL
apt install -y nginx certbot python3-certbot-nginx

# PM2 — процесс-менеджер для Node-приложений
npm install -g pm2

# git
apt install -y git
```

### PostgreSQL: создать базу и пользователя

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE toprieltor;
CREATE USER toprieltor WITH ENCRYPTED PASSWORD 'сгенерируйте-длинный-случайный-пароль';
GRANT ALL PRIVILEGES ON DATABASE toprieltor TO toprieltor;
\q
```

Не используйте dev-пароль `toprieltor` из `docker-compose.yml` — это только для локальной разработки.

## 4. Первый деплой кода

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/neatstudio1/toprieltor.git
cd toprieltor
npm install
```

### 4.1. Переменные окружения — `apps/cms/.env`

Создайте `apps/cms/.env` со своими значениями. Секреты (`APP_KEYS`, `*_SALT`, `ENCRYPTION_KEY`, `ADMIN_JWT_SECRET`) — **обязательно новые**, не копируйте dev-значения из локальной машины:

```bash
# Сгенерировать один случайный секрет:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```ini
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

APP_KEYS=<сгенерированный,через-запятую-можно-4-штуки>
API_TOKEN_SALT=<сгенерированный>
ADMIN_JWT_SECRET=<сгенерированный>
TRANSFER_TOKEN_SALT=<сгенерированный>
ENCRYPTION_KEY=<сгенерированный>

DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=toprieltor
DATABASE_USERNAME=toprieltor
DATABASE_PASSWORD=<пароль из шага 3>
DATABASE_SSL=false

# Публичный адрес сайта — используется для CORS/CSP
WEB_APP_URL=https://toprieltor.ru
```

### 4.2. Переменные окружения — `apps/web/.env.local`

```ini
STRAPI_URL=https://cms.toprieltor.ru
NEXT_PUBLIC_STRAPI_URL=https://cms.toprieltor.ru
NEXT_PUBLIC_SITE_URL=https://toprieltor.ru
```

Strapi должен быть доступен на отдельном публичном хосте (`cms.toprieltor.ru`) с реальным HTTPS — так next/image сможет проксировать загруженные в Strapi фото без специального `dangerouslyAllowLocalIP`, который в `next.config.ts` включается только для localhost.

### 4.3. Сборка и первый запуск Strapi

```bash
cd apps/cms
npm run build
node ../../scripts/bootstrap-strapi.js   # создаёт admin-пользователя и API-токены — сохраните вывод
```

Токен из вывода `bootstrap-strapi.js` пропишите в `apps/cms/.env` / `scripts/.env` как `STRAPI_IMPORT_TOKEN` (см. `.env.example` в корне репозитория) — он нужен для последующего импорта каталога.

### 4.4. Импорт каталога и контента

```bash
cd /var/www/toprieltor
node scripts/sync-parsed.js      # если есть свежие спарсенные данные застройщиков
npm run import:catalog
npm run seed:content              # тексты главной страницы (можно пропустить, если уже заполнено вручную)
```

### 4.5. Сборка Next.js

```bash
cd apps/web
npm run build
```

## 5. Запуск через PM2

Создайте `ecosystem.config.js` в корне репозитория:

```js
module.exports = {
  apps: [
    {
      name: "strapi",
      cwd: "/var/www/toprieltor/apps/cms",
      script: "npm",
      args: "run start",
      env: { NODE_ENV: "production" },
    },
    {
      name: "web",
      cwd: "/var/www/toprieltor/apps/web",
      script: "npm",
      args: "run start",
      env: { NODE_ENV: "production", PORT: 3001 },
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # выполнить команду, которую PM2 покажет — автозапуск после перезагрузки сервера
```

## 6. Nginx: reverse proxy + SSL

`/etc/nginx/sites-available/toprieltor`:

```nginx
# Зоны для ограничения частоты запросов — держим наверху файла (вне server{}),
# используются в location-ах ниже. Особенно важно для /admin/login (см. раздел 6.1).
limit_req_zone $binary_remote_addr zone=admin_login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=admin_panel:10m rate=30r/m;

server {
    listen 80;
    server_name toprieltor.ru www.toprieltor.ru;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name cms.toprieltor.ru;

    # Форма логина админки — самый частый объект перебора. Нжинх режет
    # запросы ДО того, как они дойдут до Node — это первый рубеж защиты,
    # Strapi сам ограничивает попытки логина дальше (см. раздел 6.1).
    location /admin/login {
        limit_req zone=admin_login burst=3 nodelay;
        limit_req_status 429;
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Остальная админка и API — более мягкий общий лимит от массового
    # автоматического сканирования/DDoS.
    location / {
        limit_req zone=admin_panel burst=20 nodelay;
        limit_req_status 429;
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;   # загрузка фото в Strapi Media Library
    }
}
```

### 6.1. Защита админки от подбора пароля и ботов

Три независимых слоя, каждый закрывает то, что не закрывает предыдущий:

1. **Встроенная защита Strapi** (уже работает, ничего настраивать не нужно) — на `/admin/login` у Strapi «из коробки» включён лимит **5 попыток за 5 минут** на комбинацию email+IP (`admin::rateLimit` в ядре Strapi). Пароль администратора Strapi также обязан содержать заглавную, строчную буквы и цифру, минимум 8 символов — это тоже встроено и не отключается.
2. **Nginx-лимит выше** — режет запросы к `/admin/login` ещё раньше, на уровне веб-сервера, и не привязан к конкретному email — так что если бот перебирает пароли для *разных* учётных записей или просто заваливает форму запросами, он упрётся в лимит Nginx независимо от того, что делает Strapi.
3. **Ограничение по email+IP в Strapi (п. 1) не защищает от ботнета, атакующего с тысяч разных IP одну и ту же почту** — при таком сценарии у каждого IP свой лимит на 5 попыток, и суммарно их может быть очень много. Если это реальный риск (а для публичной админки — да), самый надёжный вариант — закрыть `/admin` по IP или через VPN, см. ниже.

**Вариант A — ограничить доступ к админке по IP** (самая сильная защита, рекомендуется, если вы и Яна заходите в админку с известных адресов или через VPN):

```nginx
location /admin {
    allow 1.2.3.4;       # ваш IP
    allow 5.6.7.8;        # IP Яны
    deny all;
    limit_req zone=admin_panel burst=20 nodelay;
    proxy_pass http://127.0.0.1:1337;
    # ...остальные proxy_set_header как выше
}
```

Если IP не статичный (домашний интернет, мобильная связь) — вместо этого поставьте Wireguard/OpenVPN на сервер и пускайте в `/admin` только из VPN-подсети.

**Вариант B — Cloudflare перед сайтом** (проще всего, бесплатно, отдельно решает вопрос ботнетов): подключите домен через Cloudflare (просто смена NS-серверов у регистратора), включите «Bot Fight Mode» в настройках Security — Cloudflare сам отсекает известные ботнеты и сканеры ещё до того, как запрос дойдёт до вашего сервера. Не конфликтует с вариантами A и Nginx-лимитом выше, можно включить всё сразу.

**Дополнительно** (не обязательно, но полезно): `fail2ban` с фильтром на 401-ответы от `/admin/login` в логе Nginx — банит IP на уровне файрвола после N неудачных попыток, а не просто отвечает 429. Настройка занимает отдельный шаг, скажите — распишу конфиг, если понадобится.

```bash
ln -s /etc/nginx/sites-available/toprieltor /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Не забудьте добавить cms.toprieltor.ru A-записью в DNS так же, как основной домен
certbot --nginx -d toprieltor.ru -d www.toprieltor.ru -d cms.toprieltor.ru
```

Certbot сам пропишет HTTPS-редиректы в конфиг и настроит автопродление сертификата.

### 6.2. Обязательно: редирект www → без www

Certbot оставляет `www` и основной домен в одном `server`-блоке, и оба отвечают `200`. Google это переваривает по `rel="canonical"`, а Яндекс считает их **разными зеркалами** и не может выбрать главное — сайт может месяцами висеть без индексации. Уберите `www` из основного блока (`server_name toprieltor.ru;`) и добавьте отдельный:

```nginx
server {
    listen 443 ssl;
    server_name www.toprieltor.ru;

    ssl_certificate /etc/letsencrypt/live/toprieltor.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/toprieltor.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://toprieltor.ru$request_uri;
}
```

Проверка — `https://www.<домен>/` должен отдавать `301` на версию без `www`, а не `200`:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.toprieltor.ru/
```

## 7. Обновление сайта после первого деплоя

Скрипт `deploy.sh` в корне репозитория для последующих обновлений:

```bash
#!/bin/bash
set -e
cd /var/www/toprieltor
git pull origin main
npm install

cd apps/cms && npm run build && cd ../..
cd apps/web && npm run build && cd ../..

pm2 restart strapi
pm2 restart web
```

## 8. Бэкапы

Минимум — ежедневный дамп базы и архив загруженных файлов Strapi:

```bash
# Добавить в cron (crontab -e)
0 3 * * * pg_dump -U toprieltor toprieltor | gzip > /var/backups/toprieltor-$(date +\%F).sql.gz
0 3 * * * tar -czf /var/backups/uploads-$(date +\%F).tar.gz /var/www/toprieltor/apps/cms/public/uploads
```

Храните бэкапы вне сервера (S3-совместимое хранилище, отдельный диск) — иначе они не спасут при потере всей машины.

## 9. Обязательно перед запуском в продакшн

- [x] Реквизиты оператора персональных данных в [lib/privacy-policy.ts](file:///Users/sergej/dev/toptrealty-site/apps/web/lib/privacy-policy.ts) — вписаны (ИП Хакимьянов С. В., ИНН 665893651809, г. Екатеринбург, info@neat-studio.ru).
- [ ] Все секреты в `apps/cms/.env` — новые, не скопированные с dev-машины.
- [ ] `NEXT_PUBLIC_SITE_URL` и `WEB_APP_URL` указывают на реальный домен с `https://`.
- [ ] Пароль администратора Strapi — сохранён в менеджере паролей, не в открытом виде.
- [ ] Порты 1337 и 3001 закрыты для внешнего доступа напрямую (только через Nginx) — проверить `ufw`/firewall провайдера.
- [ ] Настроена защита `/admin/login` от перебора — см. раздел 6.1 (Nginx-лимит как минимум; IP-allowlist или Cloudflare — если нужна защита от ботнета).

## 10. После деплоя — регистрация в поисковиках

Без этого шага Google и Яндекс не узнают о сайте сами, даже если он технически безупречно настроен под SEO:

1. **Google Search Console** ([search.google.com/search-console](https://search.google.com/search-console)) — добавить домен, подтвердить владение (через DNS-TXT запись или файл), отправить `https://toprieltor.ru/sitemap.xml`.
2. **Яндекс.Вебмастер** ([webmaster.yandex.ru](https://webmaster.yandex.ru)) — то же самое: добавить сайт, подтвердить, отправить `sitemap.xml`. Для аудитории Екатеринбурга это не менее важно, чем Google.
3. Проверить, что `robots.txt` (`https://toprieltor.ru/robots.txt`) отдаётся корректно и ссылается на правильный `sitemap.xml` — после смены домена это подхватится автоматически из `NEXT_PUBLIC_SITE_URL`, но стоит проверить глазами один раз.
4. Индексация первых страниц обычно занимает от нескольких дней до 2–3 недель — это нормально, не повод паниковать в первую неделю после запуска.
