@echo off
echo ============================================
echo  Hotel QR Ordering System - Start All
echo ============================================
echo.
echo [1/4] Starting PostgreSQL (make sure they are running)
echo        PostgreSQL: localhost:5432 / DB: hoteldb
echo.
echo [2/4] Starting Spring Boot backend on :8080
start "Backend" cmd /k "cd /d "%~dp0ProjectZero\ProjectZero" && gradlew.bat bootRun"

timeout /t 5

echo [3/4] Starting Customer App on :3000
start "Customer App" cmd /k "cd /d "%~dp0customer-app" && npm install && npm run dev"

echo [4/4] Starting Kitchen App on :3001
start "Kitchen App" cmd /k "cd /d "%~dp0kitchen-app" && npm install && npm run dev"

echo [5/5] Starting Admin App on :3002
start "Admin App" cmd /k "cd /d "%~dp0admin-app" && npm install && npm run dev"

echo.
echo ============================================
echo  All services started!
echo  Customer : http://localhost:3000?hotelId=1^&tableNo=1
echo  Kitchen  : http://localhost:3001
echo  Admin    : http://localhost:3002
echo  Backend  : http://localhost:8080
echo ============================================
pause
