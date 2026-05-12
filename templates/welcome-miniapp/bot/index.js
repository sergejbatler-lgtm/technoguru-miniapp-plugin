require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Telegraf, Markup } = require('telegraf');
const { HttpsProxyAgent } = require('https-proxy-agent');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const crypto = require('crypto');

// ── Конфиг ────────────────────────────────────────────────────────────────────
const BOT_TOKEN    = process.env.BOT_TOKEN;
const MINIAPP_URL  = process.env.MINIAPP_URL;
const PORT         = process.env.PORT || 3001;
const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID); // ID вашей группы

// ── Бот ───────────────────────────────────────────────────────────────────────
const proxyAgent = process.env.TELEGRAM_PROXY_URL
  ? new HttpsProxyAgent(process.env.TELEGRAM_PROXY_URL)
  : undefined;

const bot = new Telegraf(BOT_TOKEN, {
  telegram: { agent: proxyAgent },
});

// ── Файлы данных ──────────────────────────────────────────────────────────────
const ADMIN_FILE        = path.join(__dirname, '../admin.json');
const LAST_WELCOME_FILE = path.join(__dirname, '../last_welcome.json');
const EVENTS_FILE       = path.join(__dirname, '../events.json');
const STATS_FILE        = path.join(__dirname, '../stats.json');
const PARTICIPANTS_FILE = path.join(__dirname, '../participants.json');

// ── Хелперы ───────────────────────────────────────────────────────────────────
const readJson = (file, def) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return def; }
};
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const getAdminId     = () => readJson(ADMIN_FILE, {}).id ?? null;
const getLastWelcome = () => readJson(LAST_WELCOME_FILE, null);
const saveLastWelcome = (chatId, messageId) => writeJson(LAST_WELCOME_FILE, { chatId, messageId });
const getEvents      = () => readJson(EVENTS_FILE, []);
const saveEvents     = (v) => writeJson(EVENTS_FILE, v);
const getStats       = () => readJson(STATS_FILE, { memberCount: 0, todayJoins: 0, todayLeaves: 0, todayMessages: 0 });
const saveStats      = (v) => writeJson(STATS_FILE, v);
const getParticipants = () => readJson(PARTICIPANTS_FILE, {});
const saveParticipants = (v) => writeJson(PARTICIPANTS_FILE, v);

// ── Валидация initData (HMAC-SHA256) ──────────────────────────────────────────
function validateInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const data = Object.fromEntries(params.entries());
    const receivedHash = data.hash;
    delete data.hash;
    if (!receivedHash || !data.auth_date) return { valid: false };

    const now = Math.floor(Date.now() / 1000);
    if (now - Number(data.auth_date) > 86400) return { valid: false, error: 'expired' };

    const dataCheckString = Object.keys(data).sort().map(k => `${k}=${data[k]}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== receivedHash) return { valid: false, error: 'invalid_hash' };
    return { valid: true, user: JSON.parse(data.user) };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../miniapp')));

app.get('/api/stats', (req, res) => {
  const s = getStats();
  res.json({ memberCount: s.memberCount });
});

app.get('/api/events', (req, res) => res.json(getEvents()));

app.post('/api/auth', (req, res) => {
  const { initData } = req.body;

  // Dev-режим: открыто не в Telegram
  if (!initData) {
    return res.json({ ok: true, user: { id: 0, first_name: 'Гость', username: '' }, dev: true });
  }

  const result = validateInitData(initData);
  if (!result.valid) return res.status(401).json({ ok: false, error: result.error });

  const { user } = result;
  const today = new Date().toISOString().slice(0, 10);
  const participants = getParticipants();
  const id = String(user.id);
  if (!participants[id]) {
    participants[id] = { id: user.id, firstName: user.first_name, username: user.username || '', firstSeen: today, lastSeen: today, openCount: 1 };
  } else {
    participants[id].lastSeen = today;
    participants[id].openCount = (participants[id].openCount || 0) + 1;
  }
  saveParticipants(participants);
  res.json({ ok: true, user: participants[id] });
});

app.listen(PORT, () => console.log(`Express запущен на порту ${PORT}`));

// ── Клавиатуры ────────────────────────────────────────────────────────────────

// Для личных сообщений — web_app кнопка (открывает мини-апп внутри Telegram)
const privateKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.webApp('🚀 Открыть меню', MINIAPP_URL)],
  ]);

// Для группы — URL кнопка (web_app не работает в группах!)
// Замени BOT_USERNAME и SHORT_NAME на свои (BotFather → /setmenubutton)
const groupKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.url('🚀 Открыть меню', `https://t.me/BOT_USERNAME/SHORT_NAME`)],
  ]);

// ── Тексты ────────────────────────────────────────────────────────────────────
// Замени на тексты из утверждённого брифа
const welcomeText = (name) =>
  `${name}, привет! Рады, что ты с нами 🙌\n\n` +
  `[ПРИВЕТСТВЕННЫЙ ТЕКСТ ИЗ БРИФА]\n\n` +
  `По кнопке ниже — всё о нашем сообществе 👇`;

const startText = (name) =>
  `${name}, привет! 👋\n\n` +
  `[КРАТКОЕ ОПИСАНИЕ ПРОЕКТА]\n\n` +
  `Нажми кнопку ниже 👇`;

// ── Обработчики новых участников ──────────────────────────────────────────────

// Вариант 1: явное добавление через интерфейс
bot.on('new_chat_members', async (ctx) => {
  for (const member of ctx.message.new_chat_members) {
    if (member.is_bot) continue;
    await handleNewMember(member, ctx.chat.id);
  }
});

// Вариант 2: вступление по invite-ссылке (ОСНОВНОЙ сценарий)
// chat_member по умолчанию ИСКЛЮЧЁН из Telegram polling — добавлен в allowedUpdates ниже
bot.on('chat_member', async (ctx) => {
  const update = ctx.chatMember;
  if (!update || update.chat.id !== GROUP_CHAT_ID) return;

  const oldStatus = update.old_chat_member?.status;
  const newStatus = update.new_chat_member?.status;
  const member    = update.new_chat_member?.user;

  const joined = ['member', 'administrator'].includes(newStatus) &&
                 ['left', 'kicked', 'restricted'].includes(oldStatus);
  if (!joined || !member || member.is_bot) return;

  await handleNewMember(member, update.chat.id);
});

async function handleNewMember(member, chatId) {
  const name = member.first_name;
  console.log(`[welcome] Новый участник: ${name}`);

  // Обновляем статистику
  try {
    const stats = getStats();
    stats.todayJoins += 1;
    stats.memberCount = await bot.telegram.getChatMembersCount(GROUP_CHAT_ID);
    saveStats(stats);
  } catch (e) { console.error('[stats]', e.message); }

  // Удаляем предыдущее приветствие и отправляем новое
  try {
    const prev = getLastWelcome();
    if (prev) await bot.telegram.deleteMessage(prev.chatId, prev.messageId).catch(() => {});
    const sent = await bot.telegram.sendMessage(GROUP_CHAT_ID, welcomeText(name), {
      parse_mode: 'Markdown',
      ...groupKeyboard()
    });
    saveLastWelcome(GROUP_CHAT_ID, sent.message_id);
    console.log(`[welcome] Отправлено, message_id=${sent.message_id}`);
  } catch (e) { console.error('[welcome]', e.message); }
}

// ── Участник вышел ────────────────────────────────────────────────────────────
bot.on('left_chat_member', async (ctx) => {
  if (ctx.message.left_chat_member.is_bot) return;
  const stats = getStats();
  stats.todayLeaves += 1;
  try { stats.memberCount = await bot.telegram.getChatMembersCount(GROUP_CHAT_ID); } catch {}
  saveStats(stats);
});

// ── Считаем сообщения участников ──────────────────────────────────────────────
bot.on('message', async (ctx) => {
  if (ctx.chat.id !== GROUP_CHAT_ID) return;
  if (ctx.message.new_chat_members || ctx.message.left_chat_member) return;
  if (!ctx.from) return;
  try {
    const m = await bot.telegram.getChatMember(GROUP_CHAT_ID, ctx.from.id);
    if (['administrator', 'creator'].includes(m.status)) return;
    const stats = getStats();
    stats.todayMessages += 1;
    saveStats(stats);
  } catch {}
});

// ── Ежедневный отчёт (10:00 по МСК) ──────────────────────────────────────────
cron.schedule('0 10 * * *', async () => {
  const adminId = getAdminId();
  if (!adminId) return;
  const stats = getStats();
  let count = stats.memberCount;
  try { count = await bot.telegram.getChatMembersCount(GROUP_CHAT_ID); } catch {}

  await bot.telegram.sendMessage(
    adminId,
    `📊 *Утренний отчёт*\n\n` +
    `👥 Участников: *${count}*\n` +
    `➕ Вступили: *${stats.todayJoins}*\n` +
    `➖ Вышли: *${stats.todayLeaves}*\n` +
    `💬 Сообщений: *${stats.todayMessages}*`,
    { parse_mode: 'Markdown' }
  );

  saveStats({ memberCount: count, todayJoins: 0, todayLeaves: 0, todayMessages: 0 });
}, { timezone: 'Europe/Moscow' });

// ── Команды ───────────────────────────────────────────────────────────────────
bot.command('start', (ctx) => {
  ctx.reply(startText(ctx.from.first_name), { parse_mode: 'Markdown', ...privateKeyboard() });
});

bot.command('chatid', (ctx) => {
  ctx.reply(`Chat ID: \`${ctx.chat.id}\``, { parse_mode: 'Markdown' });
});

bot.command('setadmin', (ctx) => {
  writeJson(ADMIN_FILE, { id: ctx.chat.id });
  ctx.reply('✅ Этот чат установлен как чат администратора. Сюда будут приходить обращения.');
});

// ── Обращения из мини-аппа (web_app_data) ────────────────────────────────────
bot.on('web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);
    if (data.type === 'contact') {
      const { name, message } = data;
      const user = ctx.from;
      const userLink = user.username
        ? `@${user.username}`
        : `[${user.first_name}](tg://user?id=${user.id})`;
      const adminId = getAdminId();
      if (adminId) {
        await bot.telegram.sendMessage(
          adminId,
          `📬 *Новое обращение*\n\n👤 ${userLink}\n📝 Имя: ${name}\n\n💬 *Сообщение:*\n${message}`,
          { parse_mode: 'Markdown' }
        );
      }
      await ctx.reply('✅ Запрос отправлен! Ответим в ближайшее время.');
    }
  } catch (e) { console.error('web_app_data error:', e.message); }
});

// ── Запуск ────────────────────────────────────────────────────────────────────
// ВАЖНО: deleteWebhook до launch, launch НЕ await
(async () => {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: false });
    console.log('✅ Webhook удалён');
  } catch (e) { console.error('deleteWebhook error:', e.message); }

  bot.launch({
    allowedUpdates: [
      'message', 'channel_post', 'callback_query',
      'web_app_data',
      'chat_member'  // ОБЯЗАТЕЛЬНО — иначе вступление по invite-ссылке не поймаем
    ]
  });
  console.log('✅ Бот запущен (polling + chat_member)');

  try {
    const count = await bot.telegram.getChatMembersCount(GROUP_CHAT_ID);
    const stats = getStats();
    stats.memberCount = count;
    saveStats(stats);
    console.log(`Участников в группе: ${count}`);
  } catch (e) { console.error('getChatMembersCount error:', e.message); }
})();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
