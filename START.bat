@echo off
chcp 65001 >nul
title Harmony Hub - Avvio Rapido

echo.
echo ╔════════════════════════════════════════╗
echo ║     HARMONY HUB - Avvio Rapido        ║
echo ╚════════════════════════════════════════╝
echo.

REM Verifica se node_modules esiste
if not exist node_modules (
    echo [!] Dipendenze non trovate!
    echo.
    echo Installazione dipendenze in corso...
    echo Questo potrebbe richiedere qualche minuto...
    echo.
    call npm install
    echo.
    if errorlevel 1 (
        echo [X] Errore durante l'installazione delle dipendenze!
        echo.
        pause
        exit /b 1
    )
    echo [✓] Dipendenze installate con successo!
    echo.
)

echo [✓] File .env configurato
echo [✓] Client ID: 83f672efe50f439ab7257a753dcc59d9
echo [✓] Redirect URI: http://localhost:5173/callback
echo.

echo ╔════════════════════════════════════════╗
echo ║     IMPORTANTE - LEGGI PRIMA!         ║
echo ╚════════════════════════════════════════╝
echo.
echo Assicurati di aver configurato il Redirect URI
echo nel tuo Spotify Developer Dashboard:
echo.
echo   https://developer.spotify.com/dashboard
echo.
echo Il Redirect URI deve essere ESATTAMENTE:
echo   http://localhost:5173/callback
echo.
echo ════════════════════════════════════════
echo.

pause

echo.
echo [►] Avvio Harmony Hub...
echo.
echo Una volta avviato, apri il browser su:
echo   http://localhost:5173
echo.
echo Per fermare il server, premi CTRL+C in questa finestra.
echo.
echo ════════════════════════════════════════
echo.

npm run dev
