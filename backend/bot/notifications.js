// Telegram Notification — bot instance yoki to'g'ridan HTTP
const https = require('https');

let bot = null;
exports.setBot = (b) => { bot = b; };

// To'g'ridan Telegram API ga xabar yuborish (bot instance bo'lmasa)
function sendDirect(chatId, text) {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !chatId) return resolve();
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => { res.resume(); resolve(); });
    req.on('error', () => resolve());
    req.setTimeout(8000, () => { req.destroy(); resolve(); });
    req.write(body);
    req.end();
  });
}

async function safeSend(chatId, text) {
  if (!chatId) return;
  try {
    if (bot) {
      await bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } else {
      await sendDirect(chatId, text);
    }
  } catch(e) {
    console.error('Telegram error:', e.message);
  }
}

function SE(s) { return {pending:'⏳',confirmed:'✅',shipped:'🚚',delivered:'📦',cancelled:'❌'}[s]||'📋'; }
function ST(s) { return {pending:'Kutilmoqda',confirmed:'Tasdiqlandi',shipped:'Yuborildi',delivered:'Yetkazildi',cancelled:'Bekor'}[s]||s; }
function shortId(id) { return String(id).slice(-8).toUpperCase(); }
function now() { return new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }); }
function fmtItems(items) {
  return items.map((i,n) => `  ${n+1}. *${i.name}* x${i.quantity} = $${(i.price*i.quantity).toFixed(2)}`).join('\n');
}

exports.notifyOrderPlaced = async (user, order) => {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const items = fmtItems(order.items);

  if (adminId) {
    await safeSend(adminId,
`🛒 *YANGI BUYURTMA!*
🆔 \`#${shortId(order._id)}\` | 📅 ${now()}
👤 ${user.fullName} (@${user.username})
📱 ${user.countryCode||''} ${user.phone}
${user.telegramId ? '🤖 Telegram: ulangan ✅' : '🤖 Telegram: ulanmagan'}

📦 Mahsulotlar:
${items}

💰 Jami: $${order.totalPrice.toFixed(2)}
${order.discount>0 ? `🎟 Chegirma: -$${order.discount.toFixed(2)}\n` : ''}✅ *To'lov: $${order.finalPrice.toFixed(2)}*
${order.promoCode ? `🏷 Promo: ${order.promoCode}` : ''}
📊 ${SE('pending')} ${ST('pending')}`);
  }

  if (user.telegramId) {
    await safeSend(user.telegramId,
`✅ *Buyurtmangiz qabul qilindi!*
🆔 \`#${shortId(order._id)}\`

📦 Buyurtma:
${items}

💰 Jami: $${order.totalPrice.toFixed(2)}
${order.discount>0 ? `🎟 -$${order.discount.toFixed(2)}\n` : ''}✅ *$${order.finalPrice.toFixed(2)}*
📊 ${SE('pending')} ${ST('pending')}
⏰ Tez orada tasdiqlash xabari keladi!`);
  }
};

exports.notifyOrderStatus = async (order) => {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const emoji = SE(order.status);
  const text = ST(order.status);

  if (order.user?.telegramId) {
    let extra = '';
    if (order.status==='confirmed') extra = '\n🎉 Tasdiqlandi!';
    if (order.status==='shipped')   extra = '\n🚚 Yo\'lda!';
    if (order.status==='delivered') extra = '\n🎊 Yetib keldi! Rahmat!';
    if (order.status==='cancelled') extra = '\n😔 Bekor qilindi.';
    await safeSend(order.user.telegramId,
`${emoji} *Buyurtma holati yangilandi!*
🆔 \`#${shortId(order._id)}\`
💰 $${order.finalPrice.toFixed(2)}
📊 ${emoji} *${text}*${extra}`);
  }

  if (adminId) {
    await safeSend(adminId,
`${emoji} Buyurtma #${shortId(order._id)} — ${text}
👤 ${order.user?.fullName||'?'} | 💰 $${order.finalPrice.toFixed(2)}`);
  }
};

exports.notifyNewUser = async (user) => {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  await safeSend(adminId,
`👤 *Yangi foydalanuvchi!*
📛 ${user.fullName} | 🔖 @${user.username}
📱 ${user.countryCode||''} ${user.phone}
📅 ${now()}`);
};

exports.notifyLowStock = async (product) => {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  await safeSend(adminId,
`⚠️ *Mahsulot tugayapti!*
📦 ${product.name} | Qoldi: *${product.stock} ta*`);
};
