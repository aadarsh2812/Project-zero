# Run as Administrator - fixes mobile network access
Write-Host "Fixing network access for Hotel QR System..." -ForegroundColor Cyan

# Step 1: Change WiFi network profile from Public to Private
Write-Host "`n[1] Setting WiFi network to Private profile..."
$profiles = Get-NetConnectionProfile
foreach ($p in $profiles) {
    Write-Host "    Interface: $($p.InterfaceAlias) | Category: $($p.NetworkCategory)"
    if ($p.InterfaceAlias -notmatch "Loopback") {
        Set-NetConnectionProfile -InterfaceIndex $p.InterfaceIndex -NetworkCategory Private
        Write-Host "    -> Changed to Private" -ForegroundColor Green
    }
}

# Step 2: Disable firewall for Private profile (allow all inbound on local network)
Write-Host "`n[2] Configuring firewall for Private profile..."
netsh advfirewall set privateprofile firewallpolicy allowinbound,allowoutbound
netsh advfirewall set privateprofile state on
Write-Host "    -> Private profile: AllowInbound" -ForegroundColor Green

# Step 3: Also ensure the rules exist for all profiles
Write-Host "`n[3] Adding explicit firewall allow rules..."
$ports = @(3000, 3001, 3002, 8080)
foreach ($port in $ports) {
    netsh advfirewall firewall delete rule name="Hotel_Port_$port" 2>$null
    netsh advfirewall firewall add rule name="Hotel_Port_$port" dir=in action=allow protocol=TCP localport=$port profile=any
    Write-Host "    -> Port $port allowed" -ForegroundColor Green
}

# Step 4: Show current status
Write-Host "`n[4] Verification..."
Write-Host "    Current profiles:" -ForegroundColor Yellow
Get-NetConnectionProfile | ForEach-Object {
    Write-Host "      $($_.InterfaceAlias): $($_.NetworkCategory)"
}

Write-Host "`n================================================" -ForegroundColor Magenta
Write-Host "  DONE! Try accessing from mobile now:" -ForegroundColor Green
Write-Host "  http://10.0.2.24:3000?hotelId=1&tableNo=1" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Magenta
Read-Host "`nPress Enter to close"
