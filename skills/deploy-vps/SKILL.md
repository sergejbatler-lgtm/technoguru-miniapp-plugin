---
name: deploy-vps
description: "Use this to deploy a Telegram Mini App project to a VPS server. Handles Ubuntu setup, Node.js, PM2, nginx, SSL, DNS configuration, and Russian server proxy setup."
---

# Деплой Telegram Mini App на VPS

> Перед началом прочитай: `core/telegram-miniapp-fundamentals.md`

---

## Роль

Ты — DevOps-инженер. Берёшь готовый проект (или только что написанный код) и разворачиваешь его на VPS-сервере. Всё делаешь сам через SSH.

---

## Чекпоинт — где мы сейчас

В начале каждого этапа показывай пользователю прогресс:

```
📍 Деплой: Этап N из 10 — [название этапа]
✅ Сделано: [список пройденных этапов]
⏳ Осталось: [список оставшихся]
```

Если сессия прервалась или ушли в сторону — при возврате первым делом восстанови контекст:
какой проект, на каком сервере, на каком этапе остановились.
Пользователь может написать «где мы?» — ответь блоком выше и продолжи с того места.

---

## ЭТАП 1 — Сбор данных

Собирай в четыре независимых трека. Каждый — отдельный вопрос, жди ответа.

---

### Трек А — Сервер

```
🖥 СЕРВЕР:
Есть ли VPS-сервер? (да/нет)
```

**Если нет:**
```
Рекомендую Timeweb.com → Облачные серверы
Тариф: 1 CPU / 1 GB RAM / Ubuntu 22.04 — от 250₽/мес.
Зарегистрируйся, создай сервер, возвращайся с данными.
```

**Если есть — попроси:**
```
— IP-адрес:
— Логин (обычно root):
— Пароль:
— Порт SSH (обычно 22):
```

**Сразу после получения IP уточни:**
```
Сервер в России? (да/нет)
```

Если да — переходи к Треку Б (прокси). Если нет — пропускай.

---

### Трек Б — Прокси (только если сервер в России)

```
⚠️ Сервер в России — нужен HTTPS-прокси для Telegram API.

Telegram блокирует запросы с российских IP-адресов.
Без прокси бот не сможет отправлять сообщения.

Нужен прокси типа HTTPS на зарубежном сервере.
Когда он у тебя будет — пришли адрес в формате:
http://user:password@IP:PORT
```

Жди. Не продолжай пока прокси не получен — без него бот не заработает.

---

### Трек В — Домен

```
🌐 ДОМЕН:
Есть ли домен? (да/нет)
```

**Если нет:**
```
Варианты:
— Купить: Timeweb / reg.ru / nic.ru — от 199₽/год
— Бесплатный поддомен у некоторых хостингов (вида myproject.timeweb.io)

Рекомендую свой домен — дёшево и выглядит профессионально.
```

**Если есть — уточни:**
```
— Какой домен или поддомен использовать?
  (например: myproject.ru или app.myproject.ru)
— У какого регистратора куплен?
  (Timeweb / reg.ru / Beget / Namecheap / GoDaddy / другой)
```

DNS настроим отдельным этапом (1.5) — уже зная IP сервера.

---

### Трек Г — Бот и проект

```
🤖 БОТ:
— Токен (@BotFather → /mybots → API Token):
— Username бота:

📁 ПРОЕКТ:
— Путь к папке на локальной машине:
— Имя проекта на сервере (латиница, без пробелов):
```

---

### Итоговая проверка

Убедись что есть всё:
- ✅ SSH (IP, логин, пароль, порт)
- ✅ Прокси — если сервер в России
- ✅ Домен + регистратор
- ✅ Токен бота

```
⚠️ SSH-данные нужны только для деплоя в этой сессии.
После окончания работы обязательно смени пароль сервера.
```

---

## ЭТАП 1.5 — Настройка DNS (домен → сервер)

> Этот шаг выполняется ДО certbot. SSL не выдастся, если домен не указывает на IP.

**Сначала спроси:** где куплен или зарегистрирован домен?

Дай конкретную инструкцию под ответ пользователя:

---

**Timeweb:**
```
Домены → выбери домен → DNS-записи → Добавить запись
Тип: A
Субдомен: пусто (для основного) или имя поддомена (например: app)
IP: [IP сервера]
Сохранить
```

**reg.ru:**
```
Личный кабинет → Домены → выбери домен → Управление DNS
Добавить запись → Тип A
Имя: @ (основной) или имя поддомена
Адрес: [IP сервера]
Сохранить
```

**Beget:**
```
Домены → выбери домен → DNS-записи → Добавить запись
Тип: A
Хост: @ (основной) или имя поддомена
Значение: [IP сервера]
Сохранить
```

**Namecheap:**
```
Domain List → Manage → Advanced DNS → Add New Record
Type: A Record
Host: @ (основной) или имя поддомена
Value: [IP сервера]
Save All Changes
```

**GoDaddy:**
```
My Products → Domains → Manage → DNS
Add → Type: A
Name: @ (основной) или имя поддомена
Value: [IP сервера]
Save
```

**Cloudflare:**
```
Выбери домен → DNS → Records → Add record
Type: A
Name: @ (основной) или имя поддомена
IPv4 address: [IP сервера]
Proxy status: DNS only (серое облако, НЕ оранжевое — иначе certbot не пройдёт)
Save
```

**Другой регистратор:**
```
Нужно создать A-запись в DNS-панели домена.
Скажи где куплен домен — найдём вместе.

Ищи раздел: DNS / DNS-записи / Управление зоной.
Тип: A, Имя: @ или поддомен, Адрес: IP сервера, TTL: 3600
```

---

**Поддомен vs основной домен:**
```
myproject.ru        → имя записи: @
app.myproject.ru    → имя записи: app
bot.myproject.ru    → имя записи: bot
```

**Проверить что DNS разошёлся:**
```bash
ping your-domain.com   # должен вернуть IP сервера
# Онлайн: https://dnschecker.org → тип A
```

> ⚠️ DNS расходится обычно 5–30 минут, иногда до 24 часов.
> Cloudflare: proxy должен быть выключен (серое облако), иначе certbot не пройдёт.

---

## ЭТАП 2 — Подключение и диагностика

```bash
lsb_release -a   # версия Ubuntu
node -v          # Node.js установлен?
nginx -v         # nginx установлен?
pm2 -v           # PM2 установлен?
df -h /          # свободное место
```

Сообщи пользователю что нашёл. Чего нет — устанавливаем на следующем этапе.

---

## ЭТАП 3 — Подготовка сервера

```bash
apt update && apt upgrade -y

# Node.js 20 (если нет или < 18)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

npm install -g pm2
apt install -y nginx certbot python3-certbot-nginx
```

Проверка после установки:
```bash
node -v   # v20.x.x
pm2 -v
nginx -v
```

---

## ЭТАП 4 — Копирование файлов

```bash
mkdir -p /var/www/PROJECT_NAME
```

```bash
# Windows (pscp из PuTTY)
pscp -r "C:\путь\к\проекту\*" root@IP:/var/www/PROJECT_NAME/

# Mac/Linux
scp -r /путь/к/проекту/* root@IP:/var/www/PROJECT_NAME/
```

Копировать: `bot/`, `miniapp/`, `*.json`, `package.json`
НЕ копировать: `node_modules/`, `.env`

---

## ЭТАП 5 — Настройка проекта

```bash
cd /var/www/PROJECT_NAME
npm install
```

**Без прокси:**
```bash
cat > .env << 'EOF'
BOT_TOKEN=ТОКЕН_БОТА
MINIAPP_URL=https://ДОМЕН
PORT=3001
GROUP_CHAT_ID=CHAT_ID_ГРУППЫ
EOF
```

**С прокси (сервер в России):**
```bash
cat > .env << 'EOF'
BOT_TOKEN=ТОКЕН_БОТА
MINIAPP_URL=https://ДОМЕН
PORT=3001
GROUP_CHAT_ID=CHAT_ID_ГРУППЫ
TELEGRAM_PROXY_URL=http://user:password@IP:PORT
EOF
```

---

## ЭТАП 6 — Настройка nginx

```bash
cat > /etc/nginx/sites-available/PROJECT_NAME << 'EOF'
server {
    listen 80;
    server_name ДОМЕН;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/PROJECT_NAME /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## ЭТАП 7 — SSL сертификат

```bash
certbot --nginx -d ДОМЕН --non-interactive --agree-tos -m admin@ДОМЕН
curl -I https://ДОМЕН   # должно вернуть HTTP/2 200
```

---

## ЭТАП 8 — Запуск через PM2

```bash
cd /var/www/PROJECT_NAME
pm2 start bot/index.js --name PROJECT_NAME
pm2 save && pm2 startup
```

Проверка:
```bash
pm2 status
pm2 logs PROJECT_NAME --lines 20
```

Лог должен содержать: `✅ Webhook удалён` и `✅ Бот запущен`

---

## ЭТАП 9 — Настройка кнопки меню в BotFather

```
1. Telegram → @BotFather → /setmenubutton
2. Выбери бота
3. Web App
4. URL: https://ДОМЕН
5. Название: Меню
```

---

## ЭТАП 10 — Сдача

```
✅ Деплой завершён!

🌐 Мини-апп: https://ДОМЕН
🤖 Бот: @BOT_USERNAME

📊 Управление:
   pm2 status / pm2 logs PROJECT_NAME / pm2 restart PROJECT_NAME

🔄 Обновление кода:
   Скопировать файлы → pm2 restart PROJECT_NAME

⚠️ Не забудь сменить пароль сервера!
```

---

## Типичные ошибки

| Ошибка | Причина | Решение |
|---|---|---|
| nginx: 502 Bad Gateway | Бот не запущен или порт не тот | Проверить `pm2 status` и PORT в .env |
| certbot: ошибка DNS | Домен не указывает на IP | Добавить A-запись, подождать 15 мин |
| MODULE_NOT_FOUND | npm install не запускался | `cd /var/www/PROJECT_NAME && npm install` |
| Бот не отвечает | Старый webhook | `deleteWebhook()` уже в коде, перезапустить |
| SSL не обновляется | Certbot cron не работает | `certbot renew --dry-run` |
