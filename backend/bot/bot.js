const { Telegraf, Markup } = require('telegraf');
const User = require('../models/User');
const Order = require('../models/Order');
const { setBot } = require('./notifications');

let bot = null;

exports.initBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes('your_telegram')) {
    console.log('⚠️  Telegram bot token not set — bot disabled');
    return null;
  }
  console.log('🤖 Starting Telegram bot...');

  bot = new Telegraf(token);
  setBot(bot);

  bot.start(async (ctx) => {
    const name = ctx.from.first_name || 'Mehmon';
    await ctx.reply(
      `👋 Salom, *${name}*! SHOP botiga xush kelibsiz! 🛍\n\n` +
      `Bu bot orqali:\n` +
      `✅ Buyurtmalaringizni kuzating\n` +
      `📦 Holat o'zgarganda xabar oling\n` +
      `👤 Profil ma'lumotlarini ko'ring\n\n` +
      `Boshlash uchun hisobingizni ulang:`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['🛍 My Orders', '👤 My Profile'],
          ['🔗 Link Account', '❓ Help']
        ]).resize()
      }
    );
  });

  // /help
  bot.hears(['❓ Help', '/help'], async (ctx) => {
    await ctx.reply(
      `📋 *Mavjud buyruqlar:*\n\n` +
      `/start — Asosiy menyu\n` +
      `/orders — Buyurtmalarim\n` +
      `/profile — Profilim\n` +
      `/linkuser <username> — Hisobni ulash\n` +
      `/help — Yordam\n\n` +
      `🌐 Do'kon: ${process.env.FRONTEND_URL || 'http://localhost:5500'}`,
      { parse_mode: 'Markdown' }
    );
  });

  // Link account
  bot.hears(['🔗 Link Account', '/link'], async (ctx) => {
    await ctx.reply(
      `🔗 *Hisobni ulash*\n\n` +
      `Do'kondagi username ingizni yozing:\n\n` +
      `/linkuser <username>`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('linkuser', async (ctx) => {
    const parts = ctx.message.text.split(' ');
    if (parts.length < 2) return ctx.reply('❌ Foydalanish: /linkuser <username>');
    const username = parts[1].toLowerCase();
    const user = await User.findOne({ username });
    if (!user) return ctx.reply('❌ Foydalanuvchi topilmadi. Username ni tekshiring.');
    user.telegramId = String(ctx.from.id);
    await user.save();
    await ctx.reply(
      `✅ *Hisob ulandi!*\n\nSalom, ${user.fullName}! 👋\nEndi buyurtma berganda xabar olasiz.`,
      { parse_mode: 'Markdown' }
    );
  });

  // My Orders
  bot.hears(['🛍 My Orders', '/orders'], async (ctx) => {
    const user = await User.findOne({ telegramId: String(ctx.from.id) });
    if (!user) return ctx.reply('❌ Hisob ulanmagan. /linkuser <username> yozing');

    const orders = await Order.find({ user: user._id }).sort('-createdAt').limit(5);
    if (!orders.length) return ctx.reply('📭 Hali buyurtma yo\'q.');

    const statusEmoji = { pending:'⏳', confirmed:'✅', shipped:'🚚', delivered:'📦', cancelled:'❌' };
    const statusText  = { pending:'Kutilmoqda', confirmed:'Tasdiqlandi', shipped:'Yuborildi', delivered:'Yetkazildi', cancelled:'Bekor qilindi' };

    let text = `🛍 *Oxirgi ${orders.length} ta buyurtma:*\n`;
    for (const o of orders) {
      text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      text += `🆔 \`#${String(o._id).slice(-8).toUpperCase()}\`\n`;
      text += `📅 ${new Date(o.createdAt).toLocaleDateString('uz-UZ')}\n`;
      text += `📦 Mahsulotlar:\n`;
      o.items.forEach((item, i) => {
        text += `  ${i+1}. ${item.name} × ${item.quantity} — $${(item.price * item.quantity).toFixed(2)}\n`;
      });
      text += `💰 Jami: *$${o.finalPrice.toFixed(2)}*\n`;
      text += `📊 ${statusEmoji[o.status] || '📋'} ${statusText[o.status] || o.status}`;
    }

    await ctx.reply(text, { parse_mode: 'Markdown' });
  });

  // My Profile
  bot.hears(['👤 My Profile', '/profile'], async (ctx) => {
    const user = await User.findOne({ telegramId: String(ctx.from.id) });
    if (!user) return ctx.reply('❌ Hisob ulanmagan. /linkuser <username> yozing');

    const orderCount = await Order.countDocuments({ user: user._id });
    const delivered  = await Order.countDocuments({ user: user._id, status: 'delivered' });

    await ctx.reply(
      `👤 *Mening profilim*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📛 Ism: ${user.fullName}\n` +
      `🔖 Username: @${user.username}\n` +
      `📱 Telefon: ${user.countryCode || ''} ${user.phone}\n` +
      `📧 Email: ${user.email || '—'}\n` +
      `🎂 Yosh: ${user.age}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 Jami buyurtmalar: ${orderCount}\n` +
      `✅ Yetkazilgan: ${delivered}`,
      { parse_mode: 'Markdown' }
    );
  });

  // Launch bot (Telegraf 4.x launch() never resolves — runs in background)
  bot.launch();
  console.log('🤖 Telegram bot @shop_store_uz_bot is running!');

  bot.catch((err) => {
    console.error('Bot error:', err.message);
  });

  // Graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
};
