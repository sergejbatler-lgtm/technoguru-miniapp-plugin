# Telegram Mini Apps Plugin for Claude Code

Плагин для Claude Code, который ведёт разработчика от идеи до работающего Telegram Mini App.

---

## Что внутри

```
telegram-miniapp-plugin/
├── core/
│   └── telegram-miniapp-fundamentals.md   # Технический фундамент — стек, архитектура, паттерны
├── skills/
│   ├── miniapp-welcome.md                 # Мастер: сборка Welcome Mini App с нуля
│   ├── miniapp-events.md                  # Добавление афиши событий
│   └── deploy-vps.md                      # Деплой на VPS (Ubuntu/Debian)
├── templates/
│   └── welcome-miniapp/                   # Готовый стартовый шаблон
│       ├── bot/index.js
│       ├── miniapp/index.html
│       ├── stats.json
│       ├── events.json
│       ├── participants.json
│       ├── admin.json
│       ├── last_welcome.json
│       └── package.json
├── CHANGELOG.md
└── README.md
```

---

## Скиллы

| Скилл | Для чего |
|---|---|
| `miniapp-welcome` | Собрать Mini App для Telegram-группы/клуба с нуля. Бот приветствует новых участников, есть главный экран, кнопки навигации. |
| `miniapp-events` | Добавить раздел «Афиша» с карточками событий, ближайшим событием на главном экране. |
| `deploy-vps` | Задеплоить готовый проект на VPS-сервер (Ubuntu). Nginx + SSL + PM2. |

---

## Установка

### 1. Клонировать репозиторий

```bash
git clone https://github.com/YOUR_USERNAME/telegram-miniapp-plugin.git
```

### 2. Указать путь в Claude Code

Добавь в настройки Claude Code (`.claude/settings.json` или `CLAUDE.md` проекта):

```json
{
  "plugins": [
    "/path/to/telegram-miniapp-plugin"
  ]
}
```

Или положи папку плагина рядом с проектом и укажи относительный путь.

### 3. Готово

Напиши в чате: **"Хочу собрать Telegram Mini App для своего клуба"** — плагин запустит мастер.

---

## Обновление

```bash
cd telegram-miniapp-plugin
git pull
```

---

## Стек (всегда этот, не требует выбора)

- **Бот:** Node.js + Telegraf v4
- **Сервер:** Express.js
- **Фронтенд:** Vanilla JS + HTML/CSS (один файл)
- **Процесс:** PM2
- **Прокси:** nginx + SSL (Let's Encrypt)
- **Данные:** JSON-файлы

---

## Принципы плагина

- Claude принимает все технические решения сам — пользователю не задаются вопросы о стеке
- Код пишется только после двух явных утверждений: дизайн + логика бота
- Язык объяснений — простой, без жаргона, подходит для новичков
- Деплой делает Claude через SSH, если есть доступ
