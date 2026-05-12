# TechnoGuru — Telegram Mini App Plugin

Claude Code плагин для сборки Telegram Mini Apps с нуля — от идеи до работающей ссылки.

## Установка — скопируй и вставь в Claude Code

```
/plugin marketplace add sergejbatler-lgtm/technoguru-miniapp-plugin
/plugin install technoguru-miniapp@technoguru-marketplace
```

---

## Что умеет

- Ведёт пользователя по шагам: бриф → дизайн → логика бота → код → деплой
- Задаёт нужные вопросы и сам принимает все технические решения
- Работает с любым уровнем подготовки — объясняет простым языком
- Настраивает сервер, DNS, SSL через SSH — всё сам

## Как пользоваться

После установки напиши в Claude Code:

```
Хочу собрать Telegram Mini App для своего клуба
```

Мастер запустится и начнёт задавать вопросы о проекте.

## Обновление

```
/plugin update technoguru-miniapp@technoguru-marketplace
```

## Стек (фиксированный)

Node.js + Telegraf v4 · Express · Vanilla JS · PM2 · nginx + SSL
