# 🎵 Guida Completa all'Installazione di Harmony Hub

## Passo 1: Configurazione App Spotify

### 1.1 Crea un'App su Spotify Developer Dashboard

1. Vai su https://developer.spotify.com/dashboard
2. Fai login con il tuo account Spotify
3. Clicca su "Create app"
4. Compila il form:
   - **App name**: Harmony Hub
   - **App description**: Modern music player powered by Spotify
   - **Redirect URIs**: `http://localhost:5173/callback`
   - **Website**: (lascia vuoto o inserisci il tuo sito)
   - **API/SDKs**: Seleziona "Web API" e "Web Playback SDK"
5. Accetta i Terms of Service
6. Clicca "Save"

### 1.2 Ottieni le credenziali

1. Nella dashboard della tua app appena creata, clicca su "Settings"
2. Copia il **Client ID** (lo userai nel prossimo step)
3. **NON** serve il Client Secret per questa applicazione (usiamo OAuth 2.0 Implicit Grant)

## Passo 2: Configurazione Progetto

### 2.1 Crea il file .env

Nella root del progetto (C:\Users\194246\Desktop\harmony-hub-84), crea un file chiamato `.env`:

```env
VITE_SPOTIFY_CLIENT_ID=inserisci_qui_il_tuo_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
```

**IMPORTANTE**: Sostituisci `inserisci_qui_il_tuo_client_id` con il Client ID che hai copiato nel passo precedente.

### 2.2 Installa le dipendenze

Apri il terminale nella cartella del progetto e esegui:

```bash
npm install
```

## Passo 3: Avvia l'Applicazione

Nel terminale, esegui:

```bash
npm run dev
```

L'applicazione sarà disponibile su: http://localhost:5173

## Passo 4: Primo Login

1. Apri il browser e vai su http://localhost:5173
2. Vedrai la pagina di login
3. Clicca su "Login with Spotify"
4. Spotify ti chiederà di autorizzare l'app - clicca "Agree"
5. Verrai reindirizzato automaticamente all'app

## ⚠️ Requisiti Importanti

### Account Spotify Premium
**ATTENZIONE**: Per usare il Web Playback SDK di Spotify (riproduzione nel browser) è NECESSARIO avere un account Spotify Premium. Con un account gratuito potrai:
- ✅ Vedere i tuoi dati (playlist, brani salvati, cronologia)
- ✅ Cercare musica
- ✅ Visualizzare le informazioni
- ❌ NON potrai riprodurre musica nel browser

### Browser Supportati
- Google Chrome (consigliato)
- Firefox
- Microsoft Edge
- Safari (con limitazioni)

## 🔧 Risoluzione Problemi

### Errore "Invalid Client"
- Verifica che il Client ID in `.env` sia corretto
- Assicurati di aver salvato il file `.env`
- Riavvia il server di sviluppo

### Errore "Redirect URI mismatch"
- Controlla che nel Spotify Dashboard il Redirect URI sia esattamente: `http://localhost:5173/callback`
- Attenzione a non mettere spazi o caratteri extra

### Il player non funziona
- Verifica di avere Spotify Premium
- Controlla la console del browser per errori
- Prova a ricaricare la pagina
- Assicurati che JavaScript sia abilitato

### La ricerca non restituisce risultati
- Verifica di essere connesso a internet
- Controlla che il token sia valido (prova a fare logout e login)
- Assicurati che l'account Spotify sia attivo

## 📁 Struttura File Creati

```
harmony-hub-84/
├── .env                          # ← CREA QUESTO FILE (credenziali)
├── .env.example                  # Template per .env
├── src/
│   ├── services/
│   │   ├── spotify-auth.ts      # Gestione autenticazione
│   │   └── spotify-api.ts       # API calls a Spotify
│   ├── hooks/
│   │   ├── useSpotify.ts        # Hook per dati Spotify
│   │   └── useSpotifyPlayer.ts  # Hook per Web Playback SDK
│   ├── types/
│   │   └── spotify.ts           # TypeScript types
│   ├── contexts/
│   │   └── SpotifyContext.tsx   # Context globale
│   └── pages/
│       ├── SpotifyLogin.tsx     # Pagina login
│       └── SpotifyCallback.tsx  # Callback OAuth
```

## 🎯 Funzionalità Disponibili

### Con Account Free:
- ✅ Visualizzazione brani recenti
- ✅ Top tracks e artisti
- ✅ Playlist personali
- ✅ Ricerca brani/artisti/album
- ✅ Gestione dispositivi
- ✅ Visualizzazione queue

### Solo con Premium:
- 🎵 Riproduzione musica
- 🎵 Controllo player (play/pause/skip)
- 🎵 Controllo volume
- 🎵 Trasferimento tra dispositivi

## 📝 Note Importanti

1. **Token Expiration**: Il token OAuth scade dopo 1 ora. L'app rileva automaticamente quando scade e ti chiederà di rifare il login.

2. **Privacy**: Le credenziali vengono salvate solo nel tuo browser (localStorage). Non vengono mai inviate a server esterni.

3. **Permessi**: L'app richiede molti permessi per offrirti tutte le funzionalità. Puoi sempre revocarli dalle impostazioni del tuo account Spotify.

## 🆘 Hai bisogno di aiuto?

Se riscontri problemi:
1. Controlla la console del browser (F12)
2. Verifica che tutte le variabili in `.env` siano corrette
3. Assicurati di aver completato tutti i passi in ordine
4. Prova a cancellare la cache del browser e rifare il login

## 🚀 Deploy in Produzione

Quando vorrai deployare l'app online:

1. Aggiorna il Redirect URI nel Spotify Dashboard con il tuo dominio:
   - Esempio: `https://tuodominio.com/callback`

2. Aggiorna il file `.env` con il nuovo URI:
   ```env
   VITE_SPOTIFY_REDIRECT_URI=https://tuodominio.com/callback
   ```

3. Fai il build:
   ```bash
   npm run build
   ```

4. Deploya la cartella `dist` sul tuo hosting

---

**Buon ascolto! 🎶**
