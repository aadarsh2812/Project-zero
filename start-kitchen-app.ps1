Set-Location 'C:\Users\Gold\Documents\Project Zero\kitchen-app'
Write-Host 'Installing kitchen-app dependencies...' -ForegroundColor Cyan
npm install
Write-Host 'Starting kitchen-app on port 3001...' -ForegroundColor Green
npm run dev
