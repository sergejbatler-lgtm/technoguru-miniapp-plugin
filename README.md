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

Скопируй эти две строки и вставь в Claude Code:

```
/plugin marketplace add sergejbatler-lgtm/technoguru-miniapp-plugin
/plugin install technoguru-miniapp@technoguru-marketplace
```

Всё. Плагин готов к работе.

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
