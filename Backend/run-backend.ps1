param(
    [switch]$Watch
)

Write-Host "Restoring dependencies..." -ForegroundColor Cyan
dotnet restore | Out-Host

if ($LASTEXITCODE -ne 0) {
    Write-Error "dotnet restore failed. Aborting."
    exit $LASTEXITCODE
}

if ($Watch) {
    Write-Host "Starting Backend in watch mode (auto rebuild on file changes)..." -ForegroundColor Green
    dotnet watch run --no-restore
} else {
    Write-Host "Starting Backend (press Ctrl+C to stop)..." -ForegroundColor Green
    dotnet run --no-restore
}
