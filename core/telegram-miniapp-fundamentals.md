# Telegram Mini Apps — Технический фундамент

> Этот файл читается автоматически всеми скиллами плагина как базовый контекст.
> Не редактируй вручную — обновляется через `git pull`.

---

## Что такое Telegram Mini App

Веб-приложение, которое запускается внутри Telegram. Пользователь нажимает кнопку в боте — открывается интерфейс прямо в мессенджере. Без установки, без браузера, без регистрации.

Применяется для: клубов, личных кабинетов, афиш, записи, оплат, CRM-сценариев, бот-воронок.

---

## Стек (всегда этот, не спрашивать у пользователя)

| Слой | Технология |
|---|---|
| Бот | Node.js + Telegraf v4 |
| Сервер | Express.js |
| Фронтенд | Vanilla JS + HTML/CSS (один файл) |
| Процесс | PM2 |
| Прокси | nginx + SSL (Let's Encrypt) |
| Данные | JSON-файлы (stats.json, events.json, participants.json) |

---

## Архитектура

```
Пользователь в Telegram
        │
        ▼
   [Telegram Bot]  ←── Telegraf polling (не webhook)
        │
        ▼
   [Express Server]  ←── порт 3001
   ├── /api/stats
   ├── /api/events
   ├── /api/auth        ← валидация initData
   └── /miniapp/        ← статика (index.html)
        │
        ▼
   [nginx]  ←── порт 443, SSL
        │
        ▼
   https://your-domain.com
```

---

## Два типа клавиатур — критично

В группах `web_app` кнопка не работает. Только URL-кнопка.

```javascript
// Для личных сообщений (DM)
const privateKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.webApp('🚀 Открыть меню', MINIAPP_URL)]
  ]);

// Для группы (ТОЛЬКО URL, не web_app!)
const groupKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.url('🚀 Открыть меню', 'https://t.me/BOT_USERNAME/menu')]
  ]);
```

---

## Запуск бота — правильный порядок

```javascript
// ВАЖНО: сначала deleteWebhook, потом launch
// chat_member нужно запрашивать явно — по умолчанию исключён Telegram
(async () => {
  await bot.telegram.deleteWebhook({ drop_pending_updates: false });
  bot.launch({
    allowedUpdates: [
      'message', 'channel_post', 'callback_query',
      'web_app_data', 'chat_member'
    ]
  });
})();
```

---

## Приём новых участников — два события

```javascript
// 1. Когда добавили явно (через интерфейс)
bot.on('new_chat_members', async (ctx) => {
  for (const member of ctx.message.new_chat_members) {
    if (member.is_bot) continue;
    // обработка
  }
});

// 2. Когда вступили по invite-ссылке (основной сценарий!)
// chat_member по умолчанию ИСКЛЮЧЁН из Telegram polling
// Нужно явно указать в allowedUpdates (см. выше)
bot.on('chat_member', async (ctx) => {
  const { old_chat_member, new_chat_member } = ctx.chatMember;
  const joined = ['member', 'administrator'].includes(new_chat_member.status) &&
                 ['left', 'kicked', 'restricted'].includes(old_chat_member.status);
  if (!joined || new_chat_member.user.is_bot) return;
  // обработка
});
```

---

## Валидация initData (HMAC-SHA256)

```javascript
const crypto = require('crypto');

function validateInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const data = Object.fromEntries(params.entries());
    const receivedHash = data.hash;
    delete data.hash;

    if (!receivedHash || !data.auth_date) return { valid: false };

    // Проверка свежести (не старше 24 часов)
    const now = Math.floor(Date.now() / 1000);
    if (now - Number(data.auth_date) > 86400) return { valid: false, error: 'expired' };

    const dataCheckString = Object.keys(data).sort()
      .map(k => `${k}=${data[k]}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN).digest();

    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString).digest('hex');

    if (calculatedHash !== receivedHash) return { valid: false, error: 'invalid_hash' };

    return { valid: true, user: JSON.parse(data.user) };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}
```

> ⚠️ НИКОГДА не доверяй `initDataUnsafe` на backend. Только `initData` с проверкой hash.

---

## Telegram WebApp SDK — основные методы

```javascript
const tg = window.Telegram.WebApp;

tg.ready();    // сообщить Telegram что приложение готово
tg.expand();   // развернуть на весь экран

// Данные пользователя (только для UI, не для авторизации!)
tg.initDataUnsafe.user.first_name
tg.initDataUnsafe.user.username
tg.initDataUnsafe.user.photo_url

// Строка для авторизации на backend
tg.initData

// Тема
tg.colorScheme          // 'light' | 'dark'
tg.themeParams.bg_color

// Нативные кнопки
tg.BackButton.show()
tg.BackButton.hide()
tg.BackButton.onClick(callback)

tg.MainButton.setText('Текст')
tg.MainButton.show()
tg.MainButton.hide()
tg.MainButton.onClick(callback)

// Открыть ссылку внутри Telegram
tg.openLink('https://...')

// Отправить данные боту (закрывает мини-апп)
tg.sendData(JSON.stringify({ type: 'contact', ... }))
```

---

## Структура файлов проекта

```
project/
├── bot/
│   └── index.js          # бот + express в одном процессе
├── miniapp/
│   └── index.html        # весь фронтенд в одном файле
├── stats.json            # { memberCount, todayJoins, todayLeaves, todayMessages }
├── events.json           # [ { id, date, time, format, title, desc, status } ]
├── participants.json     # { userId: { firstName, username, ... } }
├── admin.json            # { id: adminChatId }
├── last_welcome.json     # { chatId, messageId } — для удаления предыдущего
├── .env                  # BOT_TOKEN, MINIAPP_URL, PORT, TELEGRAM_PROXY_URL
└── package.json
```

---

## .env структура

```
BOT_TOKEN=1234567890:ABC...
MINIAPP_URL=https://your-domain.com
PORT=3001
TELEGRAM_PROXY_URL=http://IP:PORT   # только если сервер в РФ
```

---

## Деплой — чеклист

```bash
# На сервере (Ubuntu/Debian)
apt update && apt install -y nodejs npm nginx certbot python3-certbot-nginx

cd /var/www/YOUR_PROJECT
npm install
pm2 start bot/index.js --name your-bot
pm2 save
pm2 startup

# nginx конфиг → /etc/nginx/sites-available/miniapp
# certbot --nginx -d your-domain.com
```

nginx конфиг:
```nginx
server {
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## Частые ошибки

| Ошибка | Причина | Решение |
|---|---|---|
| `BUTTON_TYPE_INVALID` | web_app кнопка в группе | Использовать URL-кнопку для группы |
| `new_chat_members` не приходит | Люди вступают по ссылке | Добавить `chat_member` в allowedUpdates |
| Polling не получает события | Старый webhook висит | `deleteWebhook()` перед `bot.launch()` |
| `initData` пустой в браузере | Открыто не через Telegram | Добавить dev-режим с mock-данными |
| SSL ошибка | Нет сертификата | `certbot --nginx -d domain.com` |
