# TechnoGuru — Telegram Mini App Plugin

Claude Code плагин для сборки Telegram Mini Apps с нуля — от идеи до работающей ссылки.

---

## Что умеет

- Ведёт пользователя по шагам: бриф → дизайн → логика бота → код → деплой
- Задаёт нужные вопросы и сам принимает все технические решения
- Работает с любым уровнем подготовки — объясняет простым языком
- Настраивает сервер, DNS, SSL через SSH — всё сам

---

## Установка

### Шаг 1 — Убедись что установлен Claude Code

```bash
claude --version
```

Если команда не найдена:
```bash
npm install -g @anthropic/claude-code
```

### Шаг 2 — Клонируй плагин

Выбери папку где будет лежать плагин (например, домашняя директория) и выполни:

```bash
git clone https://github.com/sergejbatler-lgtm/technoguru-miniapp-plugin.git
```

Запомни полный путь до папки — он нужен на следующем шаге.

### Шаг 3 — Подключи плагин к Claude Code

Открой файл настроек Claude Code:

**Windows:** `C:\Users\ИМЯ\.claude\settings.json`
**Mac/Linux:** `~/.claude/settings.json`

Добавь в него блок (или создай файл если его нет):

```json
{
  "extraKnownMarketplaces": {
    "technoguru-marketplace": {
      "source": {
        "source": "github",
        "repo": "sergejbatler-lgtm/technoguru-miniapp-plugin"
      }
    }
  },
  "enabledPlugins": {
    "technoguru-miniapp@technoguru-marketplace": true
  }
}
```

Если в файле уже есть другие настройки (например, superpowers) — добавь только новые ключи, не заменяй весь файл.

### Шаг 4 — Перезапусти Claude Code

Закрой и открой Claude Code заново. Плагин загрузится автоматически.

### Шаг 5 — Проверь

Напиши в чате:
```
Хочу собрать Telegram Mini App для своего клуба
```

Claude запустит мастер и начнёт задавать вопросы о проекте.

---

## Скиллы

| Скилл | Триггер | Что делает |
|---|---|---|
| `miniapp-welcome` | «Хочу собрать Mini App» | Полный мастер с нуля до деплоя |
| `miniapp-events` | «Добавь афишу событий» | Афиша с карточками и умными датами |
| `deploy-vps` | «Задеплой проект на сервер» | Ubuntu + PM2 + nginx + SSL |

---

## Обновление

Когда выйдет новая версия — зайди в папку плагина и выполни:

```bash
cd technoguru-miniapp-plugin
git pull
```

Перезапусти Claude Code — новая версия подхватится автоматически.

---

## Стек (фиксированный, без выбора)

| Слой | Технология |
|---|---|
| Бот | Node.js + Telegraf v4 |
| Сервер | Express.js |
| Фронтенд | Vanilla JS + HTML/CSS |
| Процесс | PM2 |
| Прокси | nginx + SSL (Let's Encrypt) |
| Данные | JSON-файлы |
