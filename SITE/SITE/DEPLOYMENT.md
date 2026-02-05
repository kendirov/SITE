# 🚀 Деплой MOEX Screener

## 📋 Варианты размещения

### 1️⃣ Vercel (Рекомендуется для Vite + React)

#### Преимущества:
- ✅ Бесплатный хостинг
- ✅ Автоматический деплой из Git
- ✅ CDN по всему миру
- ✅ Нулевая конфигурация для Vite
- ✅ HTTPS из коробки

#### Инструкция:

```bash
# 1. Установите Vercel CLI
npm install -g vercel

# 2. Залогиньтесь
vercel login

# 3. Деплой
vercel
```

Или через GitHub:
1. Загрузите проект на GitHub
2. Зайдите на https://vercel.com
3. Нажмите "Import Project"
4. Выберите ваш репозиторий
5. Vercel автоматически определит Vite и задеплоит

#### Environment Variables в Vercel:

```
Settings → Environment Variables:
VITE_MOEX_API_BASE_URL=https://iss.moex.com
VITE_MOEX_API_KEY=your_key
VITE_MOEX_API_SECRET=your_secret
```

---

### 2️⃣ Netlify

#### Преимущества:
- ✅ Бесплатный хостинг
- ✅ Drag & Drop деплой
- ✅ Простая настройка

#### Инструкция:

```bash
# 1. Build проект
npm run build

# 2. Загрузите папку dist/ на Netlify
```

Или через Netlify CLI:

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

### 3️⃣ GitHub Pages

#### Инструкция:

1. Установите gh-pages:
```bash
npm install -D gh-pages
```

2. Добавьте в `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://ваш_username.github.io/moex-screener"
}
```

3. Измените `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/moex-screener/', // Имя репозитория
  // ... остальное
})
```

4. Деплой:
```bash
npm run deploy
```

---

### 4️⃣ Локальный сервер (VPS/Dedicated)

#### Nginx конфигурация:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/moex-screener/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

#### PM2 для SSR (опционально):

```bash
# Если нужен SSR, конвертируйте в Next.js
# Или используйте простой Express сервер:

npm install express compression
```

`server.js`:
```javascript
const express = require('express')
const compression = require('compression')
const path = require('path')

const app = express()
app.use(compression())
app.use(express.static('dist'))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

```bash
pm2 start server.js --name moex-screener
pm2 save
pm2 startup
```

---

### 5️⃣ Docker

#### Dockerfile:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml:

```yaml
version: '3.8'
services:
  moex-screener:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_MOEX_API_BASE_URL=https://iss.moex.com
      - VITE_MOEX_API_KEY=${MOEX_API_KEY}
      - VITE_MOEX_API_SECRET=${MOEX_API_SECRET}
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

## 🔒 Безопасность для Production

### 1. Environment Variables

**НИКОГДА** не коммитьте `.env` файлы!

```bash
# .gitignore должен содержать:
.env
.env.local
.env.production
API
```

### 2. API Keys Protection

Для production используйте backend proxy:

```
Frontend (Browser)
    ↓
Backend API (Node.js/Express)
    ↓
MOEX ISS API
```

Это скрывает ваши ключи от пользователей.

### 3. CORS

Настройте CORS для вашего домена в бэкенде.

### 4. Rate Limiting

Добавьте rate limiting на стороне бэкенда:

```bash
npm install express-rate-limit
```

---

## 📊 Performance Optimization

### 1. Code Splitting

Vite автоматически делает code splitting, но можно улучшить:

```typescript
// Lazy loading страниц
const StockScreener = lazy(() => import('./pages/StockScreener'))
const FuturesScreener = lazy(() => import('./pages/FuturesScreener'))
```

### 2. Image Optimization

```bash
npm install vite-plugin-imagemin -D
```

### 3. Bundle Analysis

```bash
npm install rollup-plugin-visualizer -D
```

`vite.config.ts`:
```typescript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
})
```

### 4. Compression

```bash
npm install vite-plugin-compression -D
```

---

## 📈 Monitoring

### Vercel Analytics

```bash
npm install @vercel/analytics
```

`main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

// В <App>
<Analytics />
```

### Google Analytics

```bash
npm install react-ga4
```

---

## ✅ Pre-Deploy Checklist

- [ ] Проверить все переменные окружения
- [ ] Удалить console.log из production кода
- [ ] Настроить robots.txt и sitemap.xml
- [ ] Добавить Open Graph meta tags
- [ ] Проверить mobile responsive
- [ ] Протестировать в разных браузерах
- [ ] Настроить error boundary
- [ ] Добавить loading states
- [ ] Настроить SEO (title, description, keywords)
- [ ] Проверить lighthouse score (90+)

---

## 🌍 CDN для статики

Если нужен CDN для изображений/ассетов:

- Cloudflare CDN (бесплатно)
- AWS CloudFront
- Bunny CDN (дешево)

---

## 📱 PWA (Progressive Web App)

Для мобильного опыта:

```bash
npm install vite-plugin-pwa -D
```

`vite.config.ts`:
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MOEX Screener',
        short_name: 'MOEX',
        theme_color: '#0ea5e9',
        background_color: '#0a0a0a',
        icons: [/* ваши иконки */]
      }
    })
  ]
})
```

---

**Готово к деплою! 🚀**
