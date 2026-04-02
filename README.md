# SHOP — Online Shop Web Application

## Stack
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Frontend**: HTML/CSS/Vanilla JS (multi-page)
- **Auth**: JWT + bcrypt
- **Bot**: Telegraf.js (Telegram Bot API)
- **File Upload**: Multer

## Folder Structure
```
shop/
├── backend/
│   ├── config/         # DB connection, env config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, role, upload
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── uploads/        # Uploaded images
│   ├── bot/            # Telegram bot
│   └── server.js
├── frontend/
│   ├── assets/         # Images, icons
│   ├── css/            # Stylesheets
│   ├── js/             # 
│   ├── i18n/           # Translation JSON files
│   ├── admin/          # Admin panel pages
│   └── *.html          # Pages
└── .env.example
```

## Setup

### 1. Install dependencies
```bash
cd backend && npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your values
```

### 3. Start backend
```bash
cd backend && npm run dev
```

### 4. Open frontend
Open `frontend/index.html` in browser or serve with any static server.

## Environment Variables
See `.env.example` for all required variables.

## Default Admin
After first run, create admin via:
```
POST /api/auth/register
{ "username": "admin", "password": "...", "role": "admin" }
```
Or seed via `node backend/config/seed.js`
