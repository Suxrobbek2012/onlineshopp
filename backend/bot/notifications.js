// ═══════════════════════════════════════════
//   SHOP — Telegram Notification System
// ═══════════════════════════════════════════
let bot = null;

exports.setBot = (botInstance) => { bot = botInstance; };

// ── Helpers ──────────────────────────────────
function statusEmoji(status) {
  return { pending:'⏳', confirmed:'✅', shipped:'🚚', delivered:'📦', cancelled:'❌' }[status] || '📋';
}

function statusText(status) {
  return { pending:'Kutilmoqda', confirmed:'Tasdiqlandi', shipped:'Yuborildi', delivered:'Yetkazildi', cancelled:'Bekor qilindi' }[status] || status;
}

function formatItems(items) {
  return items.map((item, i) =>
    `  ${i + 1}. ${item.name}\n     💵 $${item.price.toFixed(2)} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');
}

function shortId(id) {
  return String(id).slice(-8).toUpperCase();
}

// ── New Order → Admin + User ──────────────────
exports.notifyOrderPlaced = async (user, order) => {
  if (!bot) return;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  const itemsList = formatItems(order.items);
  const date = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

  // ── Admin xabari ──
  if (adminChatId) {
    const adminMsg =
`🛒 *YANGI BUYURTMA!*
━━━━━━━━━━━━━━━━━━━━
🆔 Buyurtma: \`#${shortId(order._id)}\`
📅 Sana: ${date}

👤 *Mijoz:*
  • Ism: ${user.fullName}
  • Username: @${user.username}
  • Telefon: ${user.countryCode || ''} ${user.phone}

📦 *Mahsulotlar (${order.items.length} ta):*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 Jami: $${order.totalPrice.toFixed(2)}
${order.discount > 0 ? `🎟 Chegirma: -$${order.discount.toFixed(2)}\n` : ''}✅ *To'lov: $${order.finalPrice.toFixed(2)}*
${order.promoCode ? `🏷 Promo: ${order.promoCode}` : ''}
📊 Holat: ${statusEmoji('pending')} ${statusText('pending')}`;

    await bot.telegram.sendMessage(adminChatId, adminMsg, { parse_mode: 'Markdown' });
  }

  // ── Foydalanuvchi xabari ──
  if (user.telegramId) {
    const userMsg =
`✅ *Buyurtmangiz qabul qilindi!*
━━━━━━━━━━━━━━━━━━━━
🆔 Buyurtma: \`#${shortId(order._id)}\`

📦 *Siz buyurtma qildingiz:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 Jami: $${order.totalPrice.toFixed(2)}
${order.discount > 0 ? `🎟 Chegirma: -$${order.discount.toFixed(2)}\n` : ''}✅ *To'lov: $${order.finalPrice.toFixed(2)}*

📊 Holat: ${statusEmoji('pending')} ${statusText('pending')}
⏰ Tez orada tasdiqlash xabari keladi!`;

    await bot.telegram.sendMessage(user.telegramId, userMsg, { parse_mode: 'Markdown' });
  }
};

// ── Order Status Changed → User ───────────────
exports.notifyOrderStatus = async (order) => {
  if (!bot) return;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const emoji = statusEmoji(order.status);
  const text  = statusText(order.status);

  // Foydalanuvchiga xabar
  if (order.user && order.user.telegramId) {
    const itemsList = formatItems(order.items);
    const userMsg =
`${emoji} *Buyurtma holati yangilandi!*
━━━━━━━━━━━━━━━━━━━━
🆔 Buyurtma: \`#${shortId(order._id)}\`

📦 *Mahsulotlar:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 To'lov: $${order.finalPrice.toFixed(2)}
📊 Yangi holat: ${emoji} *${text}*
${order.status === 'shipped'  ? '\n🚚 Buyurtmangiz yo\'lda!' : ''}
${order.status === 'delivered'? '\n🎉 Buyurtmangiz yetib keldi! Xaridingiz uchun rahmat!' : ''}
${order.status === 'cancelled'? '\n😔 Buyurtmangiz bekor qilindi. Savollar uchun bog\'laning.' : ''}`;

    await bot.telegram.sendMessage(order.user.telegramId, userMsg, { parse_mode: 'Markdown' });
  }

  // Adminga ham xabar (status o'zgarganda)
  if (adminChatId) {
    const adminMsg =
`${emoji} *Buyurtma holati o'zgardi*
🆔 #${shortId(order._id)}
👤 ${order.user ? order.user.fullName : 'Noma\'lum'}
📊 ${text}
💰 $${order.finalPrice.toFixed(2)}`;

    await bot.telegram.sendMessage(adminChatId, adminMsg, { parse_mode: 'Markdown' });
  }
};

// ── New User Registered → Admin ───────────────
exports.notifyNewUser = async (user) => {
  if (!bot) return;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) return;

  const msg =
`👤 *Yangi foydalanuvchi ro'yxatdan o'tdi!*
━━━━━━━━━━━━━━━━━━━━
📛 Ism: ${user.fullName}
🔖 Username: @${user.username}
📱 Telefon: ${user.countryCode || ''} ${user.phone}
🎂 Yosh: ${user.age}
📧 Email: ${user.email || '—'}
📅 Sana: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

  await bot.telegram.sendMessage(adminChatId, msg, { parse_mode: 'Markdown' });
};

// ── Low Stock Alert → Admin ───────────────────
exports.notifyLowStock = async (product) => {
  if (!bot) return;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) return;

  const msg =
`⚠️ *Mahsulot tugayapti!*
📦 ${product.name}
🏷 Kategoriya: ${product.category}
📊 Qoldi: ${product.stock} ta
💰 Narx: $${product.price}`;

  await bot.telegram.sendMessage(adminChatId, msg, { parse_mode: 'Markdown' });
};
