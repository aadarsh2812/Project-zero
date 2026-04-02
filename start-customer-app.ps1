Set-Location 'C:\Users\Gold\Documents\Project Zero\customer-app'
Write-Host 'Installing customer-app dependencies...' -ForegroundColor Cyan
npm install
Write-Host 'Starting customer-app on port 3000...' -ForegroundColor Green
npm run dev
