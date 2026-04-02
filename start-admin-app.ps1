Set-Location 'C:\Users\Gold\Documents\Project Zero\admin-app'
Write-Host 'Installing admin-app dependencies...' -ForegroundColor Cyan
npm install
Write-Host 'Starting admin-app on port 3002...' -ForegroundColor Green
npm run dev
