# Towing Management System

Production-ready full stack towing management monorepo with Laravel backend, React web customer app, and React Native driver app.

## Demo Video
https://www.loom.com/share/7848a5e396fb4bd3addeb7c4e4220b40

## Links
### Customer Web App:
https://web-customer-tareeqk.web.app/

### API Documentation:
https://adhilshan-project44.azoraads.com/api/documentation

### Mobile App (APK Download):
https://drive.google.com/file/d/1QLTPSlkq2-HTjZEp_s0ksZmoYdPOAwxS/view?usp=sharing


## Tech Stack

### Backend
- Laravel 11/12
- MySQL
- Redis
- JWT Authentication
- Laravel Sanctum
- Laravel Passport
- Laravel Echo
- Laravel Reverb
- Laravel L5-Swagger

### Web Customer App
- React
- Vite
- Tailwind CSS
- Axios
- React Router
- React Leaflet
- React Native Web

### Mobile Driver App
- React Native CLI
- Android
- Axios
- React Navigation
- React Leaflet

## Structure

```
root/
├── backend/       # Laravel 11/12 + MySQL
├── web-customer/  # React + Vite
└── mobile-driver/ # React Native CLI (Android)
```

## Prerequisites

- PHP 8.2+, Composer
- MySQL 8+
- Redis
- Node.js 18+
- For Android: Android Studio, JDK 17

## Environment Variables

### Backend (.env)

```env
APP_NAME="Towing Management"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=towing_management
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=          # Run: php artisan jwt:secret

BROADCAST_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_REDIS_HOST:PORT
# Or set individual values:
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_APP_CLUSTER=mt1

RATE_LIMIT_GLOBAL=60
RATE_LIMIT_REQUEST_CREATION=10

MAPTILER_API_KEY=
OSRM_ENDPOINT=https://router.project-osrm.org
```

### Web Customer (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_WS_HOST=localhost
VITE_WS_PORT=6001
VITE_WS_KEY=app-key
VITE_WS_CLUSTER=mt1
VITE_MAPTILER_API_KEY=
```

### Mobile Driver (src/config/env.ts)

Update `API_URL`, `WS_HOST` for your network. Use `10.0.2.2` for Android emulator to reach host machine's `localhost`.

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials
composer install
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan queue:work &
php artisan serve
```

### WebSocket Server (Soketi or Laravel Reverb)

For real-time features, run a WebSocket server:

**Option A: Soketi (Pusher-compatible)**

```bash
npm install -g soketi
soketi start
```

**Option B: Laravel Reverb** (if using Laravel 11+)

```bash
cd backend
composer require laravel/reverb
php artisan reverb:install
php artisan reverb:start
```

### Web Customer App

```bash
cd web-customer
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

### Mobile Driver App

```bash
cd mobile-driver
npm install
cd android && ./gradlew clean
cd ..
npx react-native run-android
```

For a physical device, set `API_URL` in `src/config/env.ts` to your machine's IP (e.g. `http://192.168.1.100:8000`).

## Database Migrations

```bash
cd backend
php artisan migrate
```

## WebSocket Setup

1. Ensure Redis is running
2. Start queue worker: `php artisan queue:work`
3. Start WebSocket server (Soketi/Reverb)
4. Configure `BROADCAST_DRIVER=redis` and Pusher vars in .env

## Redis Setup

```bash
# Install Redis (Windows: use WSL or Memurai)
redis-server
```

## API Documentation (Swagger)

```bash
cd backend
php artisan l5-swagger:generate
```

Visit `http://localhost:8000/api/documentation` (after publishing Swagger assets).

## Testing Real-time

1. Start backend, queue worker, WebSocket server
2. Register a customer in web app, create a towing request
3. Login as driver in mobile app
4. Driver should receive notification and see the new request

## Build Android APK

```bash
cd mobile-driver/android
./gradlew assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/auth/register | - | Register (role: customer/driver) |
| POST | /api/v1/auth/login | - | Login |
| POST | /api/v1/auth/logout | JWT | Logout |
| GET | /api/v1/auth/me | JWT | Current user |
| GET | /api/v1/requests | JWT | List requests (role-filtered) |
| POST | /api/v1/requests | JWT | Create request (customer) |
| GET | /api/v1/requests/{id} | JWT | Get request |
| POST | /api/v1/requests/{id}/accept | JWT | Accept request (driver) |

## Standard API Response

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "errors": null
}
```
