---
name: miniapp-events
description: "Use this to add or improve an events calendar section in an existing Telegram Mini App. Handles event cards, nearest event on home screen, smart date labels (TODAY / TOMORROW / IN N DAYS)."
---

# Афиша событий для Telegram Mini App

> Перед началом прочитай: `core/telegram-miniapp-fundamentals.md`

---

## Роль

Ты добавляешь или улучшаешь раздел «Афиша событий» в существующем Telegram Mini App. Умеешь: карточки событий, ближайшее событие на главном экране, умные метки дат (СЕГОДНЯ / ЗАВТРА / ЧЕРЕЗ N ДН.).

---

## ЭТАП 1 — Бриф

```
Давай настроим афишу событий.

Несколько вопросов:

1. Есть ли уже events.json с событиями?
   Если да — пришли содержимое файла.
   Если нет — добавлю пустой шаблон.

2. Какие поля нужны в карточке события?
   По умолчанию: название, дата, время, формат (онлайн/офлайн), описание, статус.
   Что добавить или убрать?

3. Должна ли быть кнопка "Записаться" или "Подробнее"?
   Если да — куда она ведёт? (ссылка, форма, написать боту)

4. Нужен ли фильтр по типу событий?
   (например: онлайн / офлайн / все)
```

---

## ЭТАП 2 — Структура events.json

Стандартная структура:

```json
[
  {
    "id": 1,
    "title": "Название события",
    "date": "15 мая",
    "time": "19:00",
    "format": "Онлайн",
    "desc": "Краткое описание события",
    "status": "open",
    "link": "https://..."
  }
]
```

Поля `status`:
- `open` — идёт запись, кнопка «Записаться» активна
- `closed` — запись закрыта
- `past` — событие прошло (скрыть или показать серым)

---

## ЭТАП 3 — Реализация

### API endpoint (bot/index.js)

```javascript
app.get('/api/events', (req, res) => {
  try {
    const events = JSON.parse(fs.readFileSync(path.join(__dirname, '../events.json'), 'utf-8'));
    res.json(events);
  } catch (e) {
    res.json([]);
  }
});
```

### Парсинг дат (miniapp/index.html)

```javascript
const MONTHS = {
  'ЯНВАРЯ':0, 'ФЕВРАЛЯ':1, 'МАРТА':2, 'АПРЕЛЯ':3,
  'МАЯ':4, 'ИЮНЯ':5, 'ИЮЛЯ':6, 'АВГУСТА':7,
  'СЕНТЯБРЯ':8, 'ОКТЯБРЯ':9, 'НОЯБРЯ':10, 'ДЕКАБРЯ':11
};

function parseEventDate(dateStr, timeStr) {
  const parts = (dateStr || '').trim().toUpperCase().split(' ');
  const day = parseInt(parts[0]);
  const month = MONTHS[parts[1]];
  if (isNaN(day) || month === undefined) return null;
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return new Date(new Date().getFullYear(), month, day, h, m);
}
```

### Умные метки дат

```javascript
function smartWhen(eventDate, timeStr) {
  const now = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const evDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  const t = timeStr || eventDate.toTimeString().slice(0, 5);

  if (evDay.getTime() === today.getTime())    return `СЕГОДНЯ · ${t}`;
  if (evDay.getTime() === tomorrow.getTime()) return `ЗАВТРА · ${t}`;
  const diff = Math.round((evDay - today) / 86400000);
  if (diff > 1 && diff < 7) return `ЧЕРЕЗ ${diff} ДН. · ${t}`;

  const dayNum   = eventDate.getDate();
  const monthKey = Object.keys(MONTHS).find(k => MONTHS[k] === eventDate.getMonth()) || '';
  return `${dayNum} ${monthKey} · ${t}`;
}
```

### Ближайшее событие на главном экране

```javascript
function renderNextEvent(events) {
  const now = new Date();
  const upcoming = events
    .map(ev => ({ ev, date: parseEventDate(ev.date, ev.time) }))
    .filter(({ date }) => date && date > now)
    .sort((a, b) => a.date - b.date);

  const el = document.getElementById('next-event');
  if (!el) return;

  if (!upcoming.length) {
    el.innerHTML = '<p class="muted">Ближайших событий нет</p>';
    return;
  }

  const { ev, date } = upcoming[0];
  el.innerHTML = `
    <div class="next-event-card" onclick="go('events')">
      <div class="next-event-when">${smartWhen(date, ev.time)}</div>
      <div class="next-event-title">${ev.title}</div>
      <div class="next-event-format">${ev.format || ''}</div>
    </div>
  `;
}
```

### Карточки афиши

```javascript
function renderEvents(events) {
  const container = document.getElementById('events-list');
  if (!container) return;

  const now = new Date();
  const active = events.filter(ev => {
    const d = parseEventDate(ev.date, ev.time);
    return d && d > now && ev.status !== 'past';
  });

  if (!active.length) {
    container.innerHTML = '<p class="muted">Событий пока нет</p>';
    return;
  }

  container.innerHTML = active.map(ev => {
    const d = parseEventDate(ev.date, ev.time);
    const when = d ? smartWhen(d, ev.time) : `${ev.date} · ${ev.time}`;
    const btn = ev.status === 'open' && ev.link
      ? `<a href="${ev.link}" class="btn-secondary" onclick="tg.openLink('${ev.link}'); return false;">Записаться</a>`
      : ev.status === 'closed'
        ? `<span class="badge-closed">Запись закрыта</span>`
        : '';
    return `
      <div class="event-card">
        <div class="event-when">${when}</div>
        <div class="event-title">${ev.title}</div>
        <div class="event-desc">${ev.desc || ''}</div>
        <div class="event-footer">
          <span class="event-format">${ev.format || ''}</span>
          ${btn}
        </div>
      </div>
    `;
  }).join('');
}
```

---

## ЭТАП 4 — CSS для карточек

```css
.event-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
}
.event-when {
  font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
  color: var(--accent); text-transform: uppercase; margin-bottom: 6px;
}
.event-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; line-height: 1.3; }
.event-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5; }
.event-footer { display: flex; align-items: center; justify-content: space-between; }
.event-format { font-size: 12px; color: var(--text-secondary); background: var(--tag-bg); padding: 3px 10px; border-radius: 20px; }
.next-event-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 16px; cursor: pointer; }
.next-event-when { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: var(--accent); text-transform: uppercase; margin-bottom: 4px; }
.next-event-title { font-size: 16px; font-weight: 600; }
.next-event-format { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
```

---

## ЭТАП 5 — Обновление событий

Подскажи пользователю как добавлять события:

```
Чтобы добавить новое событие — отредактируй events.json:

{
  "id": 2,
  "title": "Название мастер-класса",
  "date": "20 мая",
  "time": "18:00",
  "format": "Онлайн",
  "desc": "Описание что будет на встрече",
  "status": "open",
  "link": "https://ссылка-на-регистрацию"
}

Дата в формате: "20 мая", "3 июня" — прописными, с пробелом.
После изменения файла — бот читает его сам, перезапуск не нужен.
```
