$env:JAVA_HOME = 'C:\Program Files\Java\jdk-25.0.2'
$env:PATH = 'C:\Program Files\Java\jdk-25.0.2\bin;' + $env:PATH
Set-Location 'C:\Users\Gold\Documents\Project Zero\ProjectZero\ProjectZero'
Write-Host 'Building and starting backend...' -ForegroundColor Cyan
.\gradlew.bat bootRun
