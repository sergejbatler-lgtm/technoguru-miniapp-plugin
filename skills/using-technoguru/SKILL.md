---
name: using-technoguru
description: "Bootstrap skill. Loaded at session start. Defines when to use technoguru-miniapp skills instead of default behaviors."
---

# TechnoGuru Plugin — правила запуска скиллов

Этот файл загружается при старте сессии и устанавливает приоритеты.

## Когда использовать miniapp-welcome

Немедленно вызывай скилл `technoguru-miniapp:miniapp-welcome` если пользователь пишет что-то из этого списка:

- хочу мини-апп
- хочу mini app
- собрать мини-апп
- сделать мини-апп
- создать мини-апп
- сделай мини-апп
- собери мини-апп
- telegram mini app
- miniapp
- мини апп для клуба
- мини апп для проекта
- хочу бота с мини-аппом
- хочу собрать
- давай соберём

**Не запускай brainstorming. Не задавай уточняющих вопросов. Сразу запускай miniapp-welcome.**

## Когда использовать deploy-vps

Вызывай `technoguru-miniapp:deploy-vps` если пользователь пишет:

- задеплой
- деплой
- залить на сервер
- выгрузить на сервер
- настроить сервер
- запустить на сервере

## Когда использовать miniapp-events

Вызывай `technoguru-miniapp:miniapp-events` если пользователь пишет:

- добавь афишу
- сделай афишу
- афиша событий
- добавь события
- раздел события
