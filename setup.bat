@echo off
chcp 65001 >nul
title Harmony Hub - Setup Wizard

echo.
echo ==================================
echo   Harmony Hub - Setup Wizard
echo ==================================
echo.

REM Controlla se .env esiste
if exist .env (
    echo File .env già esistente!
    set /p overwrite="Vuoi sovrascriverlo? (s/n): "
    if /i not "%overwrite%"=="s" (
        echo Setup annullato.
        pause
        exit /b
    )
)

echo Per completare il setup, hai bisogno di:
echo 1. Un account Spotify
echo 2. Un'app registrata su Spotify Developer Dashboard
echo.
echo Segui questi passi:
echo 1. Vai su: https://developer.spotify.com/dashboard
echo 2. Fai login con il tuo account Spotify
echo 3. Clicca su 'Create app'
echo 4. Compila il form:
echo    - App name: Harmony Hub
echo    - App description: Modern music player
echo    - Redirect URIs: http://localhost:5173/callback
echo 5. Dopo aver creato l'app, vai in Settings e copia il Client ID
echo.

set /p clientId="Inserisci il tuo Spotify Client ID: "

if "%clientId%"=="" (
    echo Client ID non valido!
    pause
    exit /b
)

echo.
set /p redirectUri="Inserisci il Redirect URI [default: http://localhost:5173/callback]: "
if "%redirectUri%"=="" set redirectUri=http://localhost:5173/callback

REM Crea il file .env
echo VITE_SPOTIFY_CLIENT_ID=%clientId%> .env
echo VITE_SPOTIFY_REDIRECT_URI=%redirectUri%>> .env

echo.
echo ==================================
echo   File .env creato con successo!
echo ==================================
echo.
echo Contenuto del file .env:
echo VITE_SPOTIFY_CLIENT_ID=%clientId%
echo VITE_SPOTIFY_REDIRECT_URI=%redirectUri%
echo.

REM Controlla se node_modules esiste
if not exist node_modules (
    echo Le dipendenze non sono installate.
    set /p install="Vuoi installarle ora? (s/n): "
    if /i "%install%"=="s" (
        echo Installazione dipendenze in corso...
        call npm install
    )
)

echo.
echo Setup completato!
echo.
echo Per avviare l'applicazione, esegui:
echo   npm run dev
echo.
echo L'app sarà disponibile su: http://localhost:5173
echo.
echo IMPORTANTE:
echo - Assicurati che il Redirect URI nel Spotify Dashboard sia esattamente: %redirectUri%
echo - Per riprodurre musica è necessario un account Spotify Premium
echo.

pause
