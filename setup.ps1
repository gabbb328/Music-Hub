# Script di setup automatico per Harmony Hub
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Harmony Hub - Setup Wizard" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Controlla se .env esiste già
if (Test-Path ".env") {
    Write-Host "File .env già esistente!" -ForegroundColor Yellow
    $overwrite = Read-Host "Vuoi sovrascriverlo? (s/n)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "Setup annullato." -ForegroundColor Red
        exit
    }
}

Write-Host "Per completare il setup, hai bisogno di:" -ForegroundColor Yellow
Write-Host "1. Un account Spotify (anche free va bene)" -ForegroundColor White
Write-Host "2. Un'app registrata su Spotify Developer Dashboard" -ForegroundColor White
Write-Host ""

Write-Host "Segui questi passi:" -ForegroundColor Green
Write-Host "1. Vai su: https://developer.spotify.com/dashboard" -ForegroundColor White
Write-Host "2. Fai login con il tuo account Spotify" -ForegroundColor White
Write-Host "3. Clicca su 'Create app'" -ForegroundColor White
Write-Host "4. Compila il form:" -ForegroundColor White
Write-Host "   - App name: Harmony Hub" -ForegroundColor Gray
Write-Host "   - App description: Modern music player" -ForegroundColor Gray
Write-Host "   - Redirect URIs: http://localhost:5173/callback" -ForegroundColor Gray
Write-Host "5. Dopo aver creato l'app, vai in Settings e copia il Client ID" -ForegroundColor White
Write-Host ""

# Chiedi il Client ID
$clientId = Read-Host "Inserisci il tuo Spotify Client ID"

if ([string]::IsNullOrWhiteSpace($clientId)) {
    Write-Host "Client ID non valido!" -ForegroundColor Red
    exit
}

# Chiedi il Redirect URI (con default)
Write-Host ""
$redirectUri = Read-Host "Inserisci il Redirect URI [default: http://localhost:5173/callback]"
if ([string]::IsNullOrWhiteSpace($redirectUri)) {
    $redirectUri = "http://localhost:5173/callback"
}

# Crea il file .env
$envContent = @"
VITE_SPOTIFY_CLIENT_ID=$clientId
VITE_SPOTIFY_REDIRECT_URI=$redirectUri
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "  File .env creato con successo!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Contenuto del file .env:" -ForegroundColor Yellow
Write-Host $envContent -ForegroundColor Gray
Write-Host ""

# Controlla se node_modules esiste
if (-not (Test-Path "node_modules")) {
    Write-Host "Le dipendenze non sono installate." -ForegroundColor Yellow
    $install = Read-Host "Vuoi installarle ora? (s/n)"
    if ($install -eq "s" -or $install -eq "S") {
        Write-Host "Installazione dipendenze in corso..." -ForegroundColor Cyan
        npm install
    }
}

Write-Host ""
Write-Host "Setup completato! " -ForegroundColor Green
Write-Host ""
Write-Host "Per avviare l'applicazione, esegui:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "L'app sarà disponibile su: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Red
Write-Host "- Assicurati che il Redirect URI nel Spotify Dashboard sia esattamente: $redirectUri" -ForegroundColor Yellow
Write-Host "- Per riprodurre musica è necessario un account Spotify Premium" -ForegroundColor Yellow
Write-Host ""

Read-Host "Premi ENTER per uscire"
