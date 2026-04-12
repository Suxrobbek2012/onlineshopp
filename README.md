# 🛍 SHOP — Pro E-Commerce Platform

Full-stack online shop with Telegram bot, admin panel, multi-language support.

---

## 🚀 Qanday ishga tushirish (Run qilish)

### 1. Talablar (Requirements)
- [Node.js](https://nodejs.org) v18+
- MongoDB Atlas yoki local MongoDB
- Telegram Bot token (@BotFather dan)

### 2. O'rnatish (Install)

```bash
# Backend dependencies o'rnatish
cd backend
npm install
```

### 3. .env sozlash

Root papkadagi `.env` faylini oching va to'ldiring:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/online-shop

# JWT (o'zgartiring!)
JWT_SECRET=your_super_secret_key_here_change_this

# Telegram Bot (@BotFather dan oling)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=your_telegram_chat_id

# Frontend URL
FRONTEND_URL=http://localhost:5500
```

> **Telegram Chat ID olish:** @userinfobot ga `/start` yuboring

### 4. Serverni ishga tushirish

```bash
cd backend
npm start
# yoki development uchun:
npm run dev
```

Server: `http://localhost:5000`

### 5. Frontend ochish

**VS Code Live Server** bilan:
- `frontend/index.html` ni o'ng tugma → "Open with Live Server"
- Yoki: `http://localhost:5500`

**Yoki oddiy HTTP server:**
```bash
npx serve frontend -p 5500
```

---

## 👤 Admin hisob yaratish

Birinchi marta ishga tushirgandan so'ng, MongoDB da admin yaratish:

```bash
cd backend
node config/seed.js
```

Yoki MongoDB Compass / Atlas da `users` collectionida biror userning `role` ni `"admin"` ga o'zgartiring.

**Default admin (seed dan):**
- Username: `admin`
- Password: `admin123`

> ⚠️ Ishga tushirgandan so'ng parolni o'zgartiring!

---

## 🤖 Telegram Bot buyruqlari

| Buyruq | Tavsif |
|--------|--------|
| `/start` | Asosiy menyu |
| `/link <username>` | Do'kon hisobini ulash |
| `/orders` | Buyurtmalarim |
| `/profile` | Profilim |
| `/catalog` | Kategoriyalar |
| `/find <nom>` | Mahsulot qidirish |
| `/admin` | Admin statistika (faqat admin) |
| `/help` | Yordam |

---

## 📁 Loyiha tuzilmasi

```
├── backend/
│   ├── bot/           # Telegram bot
│   ├── config/        # DB, seed
│   ├── controllers/   # API controllers
│   ├── middleware/     # Auth, upload, validate
│   ├── models/        # MongoDB models
│   ├── routes/        # Express routes
│   ├── uploads/       # Yuklangan rasmlar
│   └── server.js      # Entry point
├── frontend/
│   ├── admin/         # Admin panel
│   ├── css/           # Styles
│   ├── i18n/          # UZ/RU/EN translations
│   ├── js/            # Frontend JS
│   └── *.html         # Pages
├── .env               # Environment variables
└── vercel.json        # Vercel deployment config
```

---

## 🌐 Vercel ga deploy qilish

1. [Vercel](https://vercel.com) ga login qiling
2. GitHub repo ni import qiling
3. Environment variables ni Vercel dashboard da qo'shing (`.env` dagi barcha qiymatlar)
4. Deploy!

> ⚠️ Vercel serverless — `uploads/` papkasi saqlanmaydi. Production uchun [Cloudinary](https://cloudinary.com) yoki AWS S3 ishlating.

---

## 🔐 Xavfsizlik

- JWT token authentication
- bcrypt password hashing (12 rounds)
- Rate limiting: 200 req/15min (global), 20 req/15min (login)
- Helmet.js security headers
- Admin-only routes server-side himoyalangan
- Ban/unban foydalanuvchilar

---

## 📱 Sahifalar

| Sahifa | URL |
|--------|-----|
| Bosh sahifa | `/index.html` |
| Do'kon | `/shop.html` |
| Savat | `/cart.html` |
| Profil | `/profile.html` |
| Yangiliklar | `/news.html` |
| Chegirmalar | `/discounts.html` |
| Admin | `/admin/index.html` |
