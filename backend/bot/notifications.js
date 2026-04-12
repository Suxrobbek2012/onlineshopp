// ═══════════════════════════════════════════
//   SHOP — Telegram Notification System
// ═══════════════════════════════════════════
let bot = null;

exports.setBot = (botInstance) => { bot = botInstance; };

// ── Helpers ──────────────────────────────────
function statusEmoji(s) {
  return { pending:'⏳', confirmed:'✅', shipped:'🚚', delivered:'📦', cancelled:'❌' }[s] || '📋';
}
function statusText(s) {
  return { pending:'Kutilmoqda', confirmed:'Tasdiqlandi', shipped:'Yuborildi', delivered:'Yetkazildi', cancelled:'Bekor qilindi' }[s] || s;
}
function formatItems(items) {
  return items.map((item, i) =>
    `  ${i+1}. *${item.name}*\n     💵 $${item.price.toFixed(2)} × ${item.quantity} = *$${(item.price*item.quantity).toFixed(2)}*`
  ).join('\n');
}
function shortId(id) { return String(id).slice(-8).toUpperCase(); }
function now() { return new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }); }

async function safeSend(chatId, text, opts = {}) {
  if (!bot || !chatId) return;
  try {
    await bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown', ...opts });
  } catch (e) {
    console.error('Telegram send error:', e.message);
  }
}

// ── New Order → Admin + User ──────────────────
exports.notifyOrderPlaced = async (user, order) => {
  if (!bot) return;
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const itemsList = formatItems(order.items);

  if (adminId) {
    await safeSend(adminId,
`🛒 *YANGI BUYURTMA!*
━━━━━━━━━━━━━━━━━━━━
🆔 \`#${shortId(order._id)}\`
📅 ${now()}

👤 *Mijoz:*
  • ${user.fullName} (@${user.username})
  • 📱 ${user.countryCode || ''} ${user.phone}
${user.telegramId ? `  • 🤖 Telegram ulangan ✅` : `  • 🤖 Telegram ulanmagan`}

📦 *Mahsulotlar (${order.items.length} ta):*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 Jami: $${order.totalPrice.toFixed(2)}
${order.discount > 0 ? `🎟 Chegirma: -$${order.discount.toFixed(2)}\n` : ''}✅ *To'lov: $${order.finalPrice.toFixed(2)}*
${order.promoCode ? `🏷 Promo: \`${order.promoCode}\`` : ''}
${order.shippingAddress ? `📍 Manzil: ${order.shippingAddress}` : ''}
${order.notes ? `📝 Izoh: ${order.notes}` : ''}
📊 ${statusEmoji('pending')} ${statusText('pending')}`
    );
  }

  if (user.telegramId) {
    await safeSend(user.telegramId,
`✅ *Buyurtmangiz qabul qilindi!*
━━━━━━━━━━━━━━━━━━━━
🆔 \`#${shortId(order._id)}\`
📅 ${now()}

📦 *Buyurtma tarkibi:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 Jami: $${order.totalPrice.toFixed(2)}
${order.discount > 0 ? `🎟 Chegirma: -$${order.discount.toFixed(2)}\n` : ''}✅ *To'lov: $${order.finalPrice.toFixed(2)}*

📊 ${statusEmoji('pending')} *${statusText('pending')}*
⏰ Tez orada tasdiqlash xabari keladi!`
    );
  }
};

// ── Order Status Changed → User + Admin ───────
exports.notifyOrderStatus = async (order) => {
  if (!bot) return;
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const emoji = statusEmoji(order.status);
  const text  = statusText(order.status);

  if (order.user && order.user.telegramId) {
    const itemsList = formatItems(order.items);
    let extra = '';
    if (order.status === 'confirmed')  extra = '\n🎉 Buyurtmangiz tasdiqlandi!';
    if (order.status === 'shipped')    extra = '\n🚚 Buyurtmangiz yo\'lda! Tez orada yetib keladi.';
    if (order.status === 'delivered')  extra = '\n🎊 Buyurtmangiz yetib keldi! Xaridingiz uchun rahmat! ❤️';
    if (order.status === 'cancelled')  extra = '\n😔 Buyurtmangiz bekor qilindi. Savollar uchun admin bilan bog\'laning.';

    await safeSend(order.user.telegramId,
`${emoji} *Buyurtma holati yangilandi!*
━━━━━━━━━━━━━━━━━━━━
🆔 \`#${shortId(order._id)}\`

📦 *Mahsulotlar:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 To'lov: *$${order.finalPrice.toFixed(2)}*
📊 Yangi holat: ${emoji} *${text}*${extra}`
    );
  }

  if (adminId) {
    await safeSend(adminId,
`${emoji} *Buyurtma holati o'zgardi*
🆔 \`#${shortId(order._id)}\`
👤 ${order.user ? order.user.fullName : 'Noma\'lum'}
📊 ${emoji} ${text}
💰 $${order.finalPrice.toFixed(2)}`
    );
  }
};

// ── New User Registered → Admin ───────────────
exports.notifyNewUser = async (user) => {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  await safeSend(adminId,
`👤 *Yangi foydalanuvchi!*
━━━━━━━━━━━━━━━━━━━━
📛 ${user.fullName}
🔖 @${user.username}
📱 ${user.countryCode || ''} ${user.phone}
🎂 ${user.age} yosh
📧 ${user.email || '—'}
📅 ${now()}`
  );
};

// ── Low Stock Alert → Admin ───────────────────
exports.notifyLowStock = async (product) => {
  const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  await safeSend(adminId,
`⚠️ *Mahsulot tugayapti!*
📦 *${product.name}*
🏷 Kategoriya: ${product.category}
📊 Qoldi: *${product.stock} ta*
💰 Narx: $${product.price}`
  );
};
