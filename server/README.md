# School Diary API Server

Бесплатный публичный сервер для электронного дневника.

## Деплой на Vercel (бесплатно)

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите в Vercel:
```bash
vercel login
```

3. Задеплойте из папки server:
```bash
cd server
vercel --prod
```

4. Скопируйте URL сервера (например: https://your-app.vercel.app)

5. Обновите URL в `src/pages/Index.tsx`:
```typescript
const API_BASE = 'https://your-app.vercel.app';
const API_AUTH = `${API_BASE}/auth`;
const API_ADMIN = `${API_BASE}/admin`;
// и т.д.
```

## Альтернатива: Деплой на Railway (бесплатно)

1. Зарегистрируйтесь на railway.app
2. Создайте новый проект из GitHub
3. Выберите папку server
4. Railway автоматически развернет приложение

## Локальный запуск

```bash
cd server
pip install -r requirements.txt
python main.py
```

Сервер запустится на http://localhost:8000
