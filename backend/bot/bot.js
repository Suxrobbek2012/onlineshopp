const { Telegraf, Markup } = require('telegraf');
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');
const User    = require('../models/User');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Coupon  = require('../models/Coupon');
const News    = require('../models/News');
const { setBot } = require('./notifications');

let bot = null;

// ── Cache ─────────────────────────────────────────────────────
const _c = new Map();
const cache = {
  get(k) { const i=_c.get(k); if(!i||Date.now()-i.t>30000){_c.delete(k);return null;} return i.d; },
  set(k,d) { _c.set(k,{d,t:Date.now()}); },
  del(k) { k?_c.delete(k):_c.clear(); }
};

// ── State ─────────────────────────────────────────────────────
const state = new Map();
const setState = (id,s) => state.set(String(id),s);
const getState = (id) => state.get(String(id));
const clearState = (id) => state.delete(String(id));

// ── Helpers ───────────────────────────────────────────────────
const SHOP = () => process.env.FRONTEND_URL || 'http://localhost:5500';
const isAdm = (ctx) => String(ctx.from.id) === String(process.env.TELEGRAM_ADMIN_CHAT_ID);
const SE = {pending:'⏳',confirmed:'✅',shipped:'🚚',delivered:'📦',cancelled:'❌'};
const ST = {pending:'Kutilmoqda',confirmed:'Tasdiqlandi',shipped:'Yuborildi',delivered:'Yetkazildi',cancelled:'Bekor'};

const MAIN_KB = Markup.keyboard([
  ['🛍 Buyurtmalarim','👤 Profilim'],
  ['📦 Katalog','💰 Chegirmalar'],
  ['🔍 Qidirish','📰 Yangiliklar'],
  ['🎟 Kupon','❓ Yordam'],
  ['🔗 Hisob ulash','🚪 Chiqish']
]).resize();

const ADMIN_KB = Markup.keyboard([
  ['🛍 Buyurtmalarim','👤 Profilim'],
  ['📦 Katalog','💰 Chegirmalar'],
  ['🔍 Qidirish','📰 Yangiliklar'],
  ['🎟 Kupon','❓ Yordam'],
  ['📊 Statistika','📢 Xabar yuborish'],
  ['🔗 Hisob ulash','🚪 Chiqish']
]).resize();

async function getUser(id) {
  const k=`u_${id}`; let u=cache.get(k);
  if(!u){u=await User.findOne({telegramId:String(id)}).lean();if(u)cache.set(k,u);}
  return u;
}
async function requireUser(ctx) {
  const u=await getUser(ctx.from.id);
  if(!u){await ctx.reply('❌ *Hisob ulanmagan!*\n\nUlash: `/link <username>`',{parse_mode:'Markdown',...MAIN_KB});return null;}
  return u;
}
function priceFmt(p){
  return p.discount>0?`$${(p.price*(1-p.discount/100)).toFixed(2)} (-${p.discount}%)`:`$${p.price.toFixed(2)}`;
}

// ── Proxy orqali ulanish ─────────────────────────────────────
const FREE_PROXIES = [
  'http://103.149.162.195:80',
  'http://185.162.231.106:80',
  'http://20.206.106.192:80',
  'http://51.79.50.31:9300',
  'http://47.74.152.29:8888',
];

function testConn(token, proxyUrl) {
  return new Promise((resolve) => {
    const opts = { timeout: 5000 };
    if (proxyUrl) opts.agent = new HttpsProxyAgent(proxyUrl);
    const req = https.get(`https://api.telegram.org/bot${token}/getMe`, opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d).ok === true); } catch { resolve(false); } });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function findProxy(token) {
  if (await testConn(token, null)) return null; // to'g'ridan ishlaydi
  for (const p of FREE_PROXIES) {
    if (await testConn(token, p)) return p;
  }
  return false;
}

// ── Internet tekshirish va botni ishga tushirish ──────────────
exports.initBot = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes('your_telegram')) {
    console.log('⚠️  Bot token yo\'q — bot o\'chirildi');
    return null;
  }

  console.log('🔍 Telegram API tekshirilmoqda...');
  const proxy = await findProxy(token);

  if (proxy === false) {
    console.log('⚠️  Telegram API ga ulanib bo\'lmadi. Bot o\'chirildi, sayt ishlayveradi.');
    setBot(null);
    return null;
  }

  if (proxy) console.log(`🌐 Proxy orqali ulandi: ${proxy}`);
  else console.log('🌐 To\'g\'ridan ulandi');

  startBot(token, proxy);
};

function startBot(token, proxyUrl) {
  const botOpts = { handlerTimeout: 90000 };
  if (proxyUrl) {
    botOpts.telegram = { agent: new HttpsProxyAgent(proxyUrl) };
  }
  bot = new Telegraf(token, botOpts);
  setBot(bot);
  bot.catch((err) => console.error('Bot xato:', err.message));

  // /start
  bot.start(async (ctx) => {
    clearState(ctx.from.id);
    const u = await getUser(ctx.from.id);
    const kb = (u && isAdm(ctx)) ? ADMIN_KB : MAIN_KB;
    if (u) {
      await ctx.replyWithMarkdown(`👋 Qaytib keldingiz, *${u.fullName}*! 🛍`, kb);
    } else {
      await ctx.replyWithMarkdown(
        `👋 Salom, *${ctx.from.first_name||'Mehmon'}*! *SHOP* botiga xush kelibsiz! 🛍\n\n`+
        `✅ Buyurtmalarni kuzating\n📦 Holat o'zgarganda xabar oling\n`+
        `🔍 Mahsulot qidiring\n💰 Chegirmalarni ko'ring\n\n`+
        `Boshlash: \`/link <username>\``, kb
      );
    }
  });

  // Hisob ulash
  bot.hears('🔗 Hisob ulash', async (ctx) => {
    await ctx.replyWithMarkdown('🔗 *Hisobni ulash*\n\nUsername ingizni yuboring:\n`/link <username>`');
  });
  bot.command('link', async (ctx) => {
    const username = ctx.message.text.split(' ')[1]?.toLowerCase().replace('@','');
    if (!username) return ctx.replyWithMarkdown('❌ `/link <username>`');
    const [target, old] = await Promise.all([
      User.findOne({username}).lean(),
      User.findOne({telegramId:String(ctx.from.id)})
    ]);
    if (!target) return ctx.replyWithMarkdown(`❌ *"${username}"* topilmadi.`);
    if (old && old.username!==username) await User.updateOne({_id:old._id},{telegramId:''});
    await User.updateOne({_id:target._id},{telegramId:String(ctx.from.id)});
    cache.del(`u_${ctx.from.id}`);
    const kb = isAdm(ctx) ? ADMIN_KB : MAIN_KB;
    await ctx.replyWithMarkdown(`✅ *Ulandi!*\n\n👤 ${target.fullName}\n🔖 @${target.username}\n\nEndi buyurtma xabarlari keladi! 🎉`, kb);
  });

  // Chiqish
  bot.hears(['🚪 Chiqish','/logout'], async (ctx) => {
    const u = await getUser(ctx.from.id);
    if (!u) return ctx.reply('❌ Hisob ulanmagan.');
    await User.updateOne({_id:u._id},{telegramId:''});
    cache.del(`u_${ctx.from.id}`);
    await ctx.reply('👋 Hisobingiz botdan uzildi.\n\nQayta ulash: /link <username>', Markup.removeKeyboard());
  });

  // Buyurtmalar
  bot.hears(['🛍 Buyurtmalarim','/orders'], async (ctx) => {
    const u = await requireUser(ctx); if (!u) return;
    const [orders, total] = await Promise.all([
      Order.find({user:u._id},'items finalPrice status createdAt discount').sort('-createdAt').limit(8).lean(),
      Order.countDocuments({user:u._id})
    ]);
    if (!orders.length) return ctx.replyWithMarkdown('📭 *Hali buyurtma yo\'q.*',
      Markup.inlineKeyboard([[Markup.button.url('🛍 Do\'konga o\'tish',SHOP()+'/shop.html')]]));
    let text=`🛍 *Buyurtmalarim* (jami: ${total})\n`;
    for(const o of orders){
      const d=new Date(o.createdAt).toLocaleDateString('uz-UZ');
      text+=`\n━━━━━━━━━━━━━━━━━━━━\n`;
      text+=`🆔 \`#${String(o._id).slice(-8).toUpperCase()}\` | 📅 ${d}\n`;
      text+=`📦 ${o.items.slice(0,2).map(i=>`${i.name} ×${i.quantity}`).join(', ')}${o.items.length>2?'...':''}\n`;
      if(o.discount>0) text+=`🎟 -$${o.discount.toFixed(2)}\n`;
      text+=`💰 *$${o.finalPrice.toFixed(2)}* | ${SE[o.status]} ${ST[o.status]}`;
    }
    await ctx.replyWithMarkdown(text, Markup.inlineKeyboard([
      [Markup.button.url('📋 Barchasi',SHOP()+'/profile.html')],
      [Markup.button.callback('🔄 Yangilash','ref_orders')]
    ]));
  });
  bot.action('ref_orders', async (ctx) => {
    await ctx.answerCbQuery('Yangilanmoqda...');
    const u=await getUser(ctx.from.id); if(!u) return ctx.editMessageText('❌ Hisob ulanmagan.');
    const orders=await Order.find({user:u._id},'items finalPrice status createdAt').sort('-createdAt').limit(8).lean();
    let text=`🛍 *Buyurtmalarim* ✅\n`;
    for(const o of orders){
      text+=`\n━━━━━━━━━━━━━━━━━━━━\n`;
      text+=`🆔 \`#${String(o._id).slice(-8).toUpperCase()}\`\n`;
      text+=`📦 ${o.items.slice(0,2).map(i=>`${i.name} ×${i.quantity}`).join(', ')}\n`;
      text+=`💰 *$${o.finalPrice.toFixed(2)}* | ${SE[o.status]} ${ST[o.status]}`;
    }
    await ctx.editMessageText(text,{parse_mode:'Markdown',...Markup.inlineKeyboard([
      [Markup.button.url('📋 Barchasi',SHOP()+'/profile.html')],
      [Markup.button.callback('🔄 Yangilash','ref_orders')]
    ])});
  });

  // Profil
  bot.hears(['👤 Profilim','/profile'], async (ctx) => {
    const u=await requireUser(ctx); if(!u) return;
    const [total,delivered,pending,spent]=await Promise.all([
      Order.countDocuments({user:u._id}),
      Order.countDocuments({user:u._id,status:'delivered'}),
      Order.countDocuments({user:u._id,status:'pending'}),
      Order.aggregate([{$match:{user:u._id,status:{$ne:'cancelled'}}},{$group:{_id:null,s:{$sum:'$finalPrice'}}}])
    ]);
    const days=Math.floor((Date.now()-new Date(u.createdAt))/86400000);
    await ctx.replyWithMarkdown(
      `👤 *Mening profilim*\n━━━━━━━━━━━━━━━━━━━━\n`+
      `📛 ${u.fullName}\n🔖 @${u.username}\n`+
      `📱 ${u.countryCode||''} ${u.phone}\n📧 ${u.email||'—'}\n🎂 ${u.age} yosh\n`+
      `📅 A'zo: ${days} kun\n━━━━━━━━━━━━━━━━━━━━\n`+
      `🛒 Jami: *${total}* | ✅ *${delivered}* | ⏳ *${pending}*\n`+
      `💰 Jami xarid: *$${(spent[0]?.s||0).toFixed(2)}*`,
      Markup.inlineKeyboard([[Markup.button.url('⚙️ Tahrirlash',SHOP()+'/profile.html')]])
    );
  });

  // Katalog
  bot.hears(['📦 Katalog','/catalog'], async (ctx) => {
    let cats=cache.get('cats');
    if(!cats){cats=await Product.distinct('category');cache.set('cats',cats);}
    if(!cats.length) return ctx.reply('📭 Mahsulot yo\'q.');
    const btns=cats.map(c=>[Markup.button.callback(`📂 ${c}`,`cat_${c}`)]);
    btns.push([Markup.button.url('🛍 Do\'konga o\'tish',SHOP()+'/shop.html')]);
    await ctx.replyWithMarkdown(`📦 *Kategoriyalar (${cats.length} ta):*`,Markup.inlineKeyboard(btns));
  });
  bot.action(/^cat_(.+)$/,async (ctx)=>{
    await ctx.answerCbQuery();
    const cat=ctx.match[1];
    let prods=cache.get(`cat_${cat}`);
    if(!prods){prods=await Product.find({category:cat},'name price discount stock isFeatured isOnSale').limit(8).lean();cache.set(`cat_${cat}`,prods);}
    if(!prods.length) return ctx.editMessageText(`📭 *${cat}* bo'sh.`,{parse_mode:'Markdown'});
    let text=`📂 *${cat}* — ${prods.length} ta:\n\n`;
    prods.forEach((p,i)=>{
      const b=p.isOnSale?'🔥':p.isFeatured?'⭐':`${i+1}.`;
      text+=`${b} *${p.name}*\n   💰 ${priceFmt(p)} | 📦 ${p.stock} ta\n\n`;
    });
    await ctx.editMessageText(text,{parse_mode:'Markdown',...Markup.inlineKeyboard([
      [Markup.button.url(`🛍 Ko'rish`,SHOP()+`/shop.html?category=${encodeURIComponent(cat)}`)],
      [Markup.button.callback('⬅️ Orqaga','back_cat')]
    ])});
  });
  bot.action('back_cat',async (ctx)=>{
    await ctx.answerCbQuery();
    let cats=cache.get('cats');
    if(!cats){cats=await Product.distinct('category');cache.set('cats',cats);}
    const btns=cats.map(c=>[Markup.button.callback(`📂 ${c}`,`cat_${c}`)]);
    btns.push([Markup.button.url('🛍 Do\'konga o\'tish',SHOP()+'/shop.html')]);
    await ctx.editMessageText(`📦 *Kategoriyalar:*`,{parse_mode:'Markdown',...Markup.inlineKeyboard(btns)});
  });

  // Chegirmalar
  bot.hears(['💰 Chegirmalar','/sales'],async (ctx)=>{
    let prods=cache.get('sales');
    if(!prods){prods=await Product.find({isOnSale:true,discount:{$gt:0}},'name price discount stock').sort('-discount').limit(10).lean();cache.set('sales',prods);}
    if(!prods.length) return ctx.reply('📭 Chegirma yo\'q.');
    let text=`🔥 *Chegirmadagi mahsulotlar:*\n\n`;
    prods.forEach((p,i)=>{
      const f=(p.price*(1-p.discount/100)).toFixed(2);
      text+=`${i+1}. *${p.name}*\n   💰 $${f} ~~$${p.price.toFixed(2)}~~ *-${p.discount}%* | 📦 ${p.stock}\n\n`;
    });
    await ctx.replyWithMarkdown(text,Markup.inlineKeyboard([[Markup.button.url('🔥 Barcha chegirmalar',SHOP()+'/discounts.html')]]));
  });

  // Yangiliklar
  bot.hears(['📰 Yangiliklar','/news'],async (ctx)=>{
    let list=cache.get('news');
    if(!list){list=await News.find({isPublished:true},'title excerpt createdAt').sort('-createdAt').limit(5).lean();cache.set('news',list);}
    if(!list.length) return ctx.reply('📭 Yangilik yo\'q.');
    let text=`📰 *So\'nggi yangiliklar:*\n\n`;
    list.forEach((n,i)=>{
      const d=new Date(n.createdAt).toLocaleDateString('uz-UZ');
      text+=`${i+1}. *${n.title}*\n   📅 ${d}\n   ${n.excerpt||''}\n\n`;
    });
    await ctx.replyWithMarkdown(text,Markup.inlineKeyboard([[Markup.button.url('📰 Barchasi',SHOP()+'/news.html')]]));
  });

  // Qidirish
  bot.hears(['🔍 Qidirish','/search'],async (ctx)=>{
    setState(ctx.from.id,{action:'search'});
    await ctx.replyWithMarkdown('🔍 *Qidirish*\n\nMahsulot nomini yozing:');
  });
  bot.command('find',async (ctx)=>{
    const q=ctx.message.text.replace('/find','').trim();
    if(!q) return ctx.replyWithMarkdown('❌ `/find <nom>`');
    await doSearch(ctx,q);
  });
  async function doSearch(ctx,q){
    const k=`s_${q.toLowerCase()}`;
    let prods=cache.get(k);
    if(!prods){
      prods=await Product.find({$or:[{name:{$regex:q,$options:'i'}},{tags:{$in:[new RegExp(q,'i')]}}]},'name price discount stock category').limit(6).lean();
      cache.set(k,prods);
    }
    if(!prods.length) return ctx.replyWithMarkdown(`🔍 *"${q}"* topilmadi.`,
      Markup.inlineKeyboard([[Markup.button.url('🔍 Do\'konda qidirish',SHOP()+`/shop.html?search=${encodeURIComponent(q)}`)]]));
    let text=`🔍 *"${q}"* — ${prods.length} natija:\n\n`;
    prods.forEach((p,i)=>{text+=`${i+1}. *${p.name}* (${p.category})\n   💰 ${priceFmt(p)} | 📦 ${p.stock} ta\n\n`;});
    await ctx.replyWithMarkdown(text,Markup.inlineKeyboard([[Markup.button.url('🛍 Ko\'rish',SHOP()+`/shop.html?search=${encodeURIComponent(q)}`)]]));
  }

  // Kupon
  bot.hears(['🎟 Kupon','/coupon'],async (ctx)=>{
    setState(ctx.from.id,{action:'coupon'});
    await ctx.replyWithMarkdown('🎟 *Kupon tekshirish*\n\nKupon kodini yuboring:');
  });
  bot.command('coupon',async (ctx)=>{
    const code=ctx.message.text.replace('/coupon','').trim().toUpperCase();
    if(!code) return ctx.replyWithMarkdown('❌ `/coupon <KOD>`');
    await checkCoupon(ctx,code);
  });
  async function checkCoupon(ctx,code){
    const c=await Coupon.findOne({code,isActive:true}).lean();
    if(!c) return ctx.replyWithMarkdown(`❌ *"${code}"* — noto'g'ri yoki faol emas.`);
    if(c.expiresAt&&new Date(c.expiresAt)<new Date()) return ctx.replyWithMarkdown(`⏰ *"${code}"* — muddati tugagan.`);
    if(c.usedCount>=c.maxUses) return ctx.replyWithMarkdown(`🚫 *"${code}"* — limit tugagan.`);
    const left=c.maxUses-c.usedCount;
    const exp=c.expiresAt?new Date(c.expiresAt).toLocaleDateString('uz-UZ'):'Cheksiz';
    await ctx.replyWithMarkdown(
      `🎟 *Kupon topildi!*\n\nKod: \`${c.code}\`\n💸 Chegirma: *${c.discount}%*\n📊 Qolgan: *${left}* ta\n📅 Muddat: ${exp}`,
      Markup.inlineKeyboard([[Markup.button.url('🛍 Xarid qilish',SHOP()+'/shop.html')]])
    );
  }

  // Yordam
  bot.hears(['❓ Yordam','/help'],async (ctx)=>{
    const extra=isAdm(ctx)?'\n📊 /stats — Statistika\n📢 /broadcast — Xabar yuborish':'';
    await ctx.replyWithMarkdown(
      `📋 *Buyruqlar:*\n\n/start — Asosiy menyu\n/link — Hisob ulash\n/orders — Buyurtmalar\n/profile — Profil\n/catalog — Katalog\n/sales — Chegirmalar\n/news — Yangiliklar\n/find — Qidirish\n/coupon — Kupon\n/logout — Chiqish${extra}\n\n🌐 [Do'kon](${SHOP()})`,
      {disable_web_page_preview:true,...Markup.inlineKeyboard([[Markup.button.url('🛍 Do\'kon',SHOP())]])}
    );
  });

  // Admin statistika
  bot.hears(['📊 Statistika','/stats'],async (ctx)=>{
    if(!isAdm(ctx)) return ctx.reply('❌ Ruxsat yo\'q.');
    const [users,products,orders,revenue,pending,today]=await Promise.all([
      User.countDocuments({role:'user'}),Product.countDocuments(),Order.countDocuments(),
      Order.aggregate([{$match:{status:{$ne:'cancelled'}}},{$group:{_id:null,t:{$sum:'$finalPrice'}}}]),
      Order.countDocuments({status:'pending'}),
      Order.countDocuments({createdAt:{$gte:new Date(new Date().setHours(0,0,0,0))}})
    ]);
    await ctx.replyWithMarkdown(
      `📊 *Admin Statistika*\n━━━━━━━━━━━━━━━━━━━━\n`+
      `👥 Foydalanuvchilar: *${users}*\n📦 Mahsulotlar: *${products}*\n`+
      `🛒 Jami: *${orders}* | 📅 Bugun: *${today}*\n`+
      `⏳ Kutilmoqda: *${pending}*\n💰 Daromad: *$${(revenue[0]?.t||0).toFixed(2)}*`,
      Markup.inlineKeyboard([
        [Markup.button.url('⚙️ Admin Panel',SHOP()+'/admin/index.html')],
        [Markup.button.callback('🔄 Yangilash','ref_stats')]
      ])
    );
  });
  bot.action('ref_stats',async (ctx)=>{
    if(!isAdm(ctx)) return ctx.answerCbQuery('❌ Ruxsat yo\'q.');
    await ctx.answerCbQuery('Yangilanmoqda...');
    cache.del();
    const [users,orders,revenue,pending]=await Promise.all([
      User.countDocuments({role:'user'}),Order.countDocuments(),
      Order.aggregate([{$match:{status:{$ne:'cancelled'}}},{$group:{_id:null,t:{$sum:'$finalPrice'}}}]),
      Order.countDocuments({status:'pending'})
    ]);
    await ctx.editMessageText(
      `📊 *Statistika* ✅\n━━━━━━━━━━━━━━━━━━━━\n👥 *${users}* | 🛒 *${orders}* | ⏳ *${pending}*\n💰 *$${(revenue[0]?.t||0).toFixed(2)}*`,
      {parse_mode:'Markdown',...Markup.inlineKeyboard([[Markup.button.callback('🔄 Yangilash','ref_stats')]])}
    );
  });

  // Broadcast
  bot.hears('📢 Xabar yuborish',async (ctx)=>{
    if(!isAdm(ctx)) return ctx.reply('❌ Ruxsat yo\'q.');
    setState(ctx.from.id,{action:'broadcast'});
    await ctx.replyWithMarkdown('📢 *Broadcast*\n\nBarcha foydalanuvchilarga yuboriladigan xabarni yozing:');
  });
  bot.command('broadcast',async (ctx)=>{
    if(!isAdm(ctx)) return ctx.reply('❌ Ruxsat yo\'q.');
    const msg=ctx.message.text.replace('/broadcast','').trim();
    if(!msg) return ctx.replyWithMarkdown('❌ `/broadcast <xabar>`');
    await doBroadcast(ctx,msg);
  });
  async function doBroadcast(ctx,msg){
    const users=await User.find({telegramId:{$ne:''}},  'telegramId').lean();
    let sent=0,failed=0;
    await ctx.replyWithMarkdown(`📢 *${users.length}* ta foydalanuvchiga yuborilmoqda...`);
    for(const u of users){
      try{await bot.telegram.sendMessage(u.telegramId,`📢 *SHOP xabari:*\n\n${msg}`,{parse_mode:'Markdown'});sent++;}
      catch(_){failed++;}
      if(sent%25===0) await new Promise(r=>setTimeout(r,1000));
    }
    await ctx.replyWithMarkdown(`✅ Yuborildi: *${sent}* | ❌ Xato: *${failed}*`);
  }

  // Matn handler — conversation state + auto search
  bot.on('text',async (ctx)=>{
    const text=ctx.message.text;
    if(text.startsWith('/')) return;
    const s=getState(ctx.from.id);
    if(s?.action==='search'){clearState(ctx.from.id);return doSearch(ctx,text);}
    if(s?.action==='coupon'){clearState(ctx.from.id);return checkCoupon(ctx,text.toUpperCase());}
    if(s?.action==='broadcast'&&isAdm(ctx)){clearState(ctx.from.id);return doBroadcast(ctx,text);}
    if(text.length>=2&&text.length<=50){
      const prods=await Product.find({name:{$regex:text,$options:'i'}},'name price discount stock').limit(4).lean();
      if(prods.length){
        let reply=`🔍 *"${text}"* topildi:\n\n`;
        prods.forEach((p,i)=>{reply+=`${i+1}. *${p.name}* — ${priceFmt(p)}\n`;});
        return ctx.replyWithMarkdown(reply,Markup.inlineKeyboard([[Markup.button.url('🛍 Ko\'rish',SHOP()+`/shop.html?search=${encodeURIComponent(text)}`)]]));
      }
    }
    await ctx.reply('🤔 Tushunmadim. Tugmalardan foydalaning:',MAIN_KB);
  });

  // Podkazka (bot menu)
  bot.telegram.setMyCommands([
    {command:'start',description:'🏠 Asosiy menyu'},
    {command:'orders',description:'🛍 Buyurtmalarim'},
    {command:'profile',description:'👤 Profilim'},
    {command:'catalog',description:'📦 Kategoriyalar'},
    {command:'sales',description:'💰 Chegirmalar'},
    {command:'news',description:'📰 Yangiliklar'},
    {command:'find',description:'🔍 Mahsulot qidirish'},
    {command:'coupon',description:'🎟 Kupon tekshirish'},
    {command:'link',description:'🔗 Hisob ulash'},
    {command:'logout',description:'🚪 Botdan chiqish'},
    {command:'help',description:'❓ Yordam'},
  ]).catch(()=>{});

  bot.launch({dropPendingUpdates:true}).catch((err)=>{
    console.error('⚠️  Bot ishga tushmadi:', err.message);
  });
  console.log('🤖 Telegram bot ishga tushdi!');
  process.once('SIGINT',()=>bot.stop('SIGINT'));
  process.once('SIGTERM',()=>bot.stop('SIGTERM'));
}
