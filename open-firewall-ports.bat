@echo off
:: Auto-elevate to admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Opening firewall ports for Hotel QR System...
netsh advfirewall firewall delete rule name="Hotel Customer App 3000" >nul 2>&1
netsh advfirewall firewall delete rule name="Hotel Backend API 8080" >nul 2>&1
netsh advfirewall firewall delete rule name="Hotel Kitchen App 3001" >nul 2>&1
netsh advfirewall firewall delete rule name="Hotel Admin App 3002" >nul 2>&1

netsh advfirewall firewall add rule name="Hotel Customer App 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Hotel Backend API 8080"  dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="Hotel Kitchen App 3001"  dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="Hotel Admin App 3002"    dir=in action=allow protocol=TCP localport=3002

echo.
echo Done! All ports are now open for local network access.
echo   Customer : http://10.0.2.24:3000
echo   Backend  : http://10.0.2.24:8080
pause
