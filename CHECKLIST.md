# ✅ Checklist di Verifica - Harmony Hub

Usa questa checklist per verificare che tutto sia configurato correttamente.

## 📋 Pre-Setup

- [ ] Ho Node.js 18+ installato
  ```bash
  node --version
  ```

- [ ] Ho npm installato
  ```bash
  npm --version
  ```

- [ ] Ho un account Spotify (Premium consigliato)

## 🎵 Configurazione Spotify

- [ ] Ho creato un'app su https://developer.spotify.com/dashboard

- [ ] L'app ha questi parametri:
  - [ ] Nome: Harmony Hub (o simile)
  - [ ] Redirect URI: `http://localhost:5173/callback` (ESATTO!)
  - [ ] Web API selezionata
  - [ ] Web Playback SDK selezionato

- [ ] Ho copiato il Client ID dall'app

## 🔧 Configurazione Progetto

- [ ] Ho creato il file `.env` nella root del progetto

- [ ] Il file `.env` contiene:
  ```env
  VITE_SPOTIFY_CLIENT_ID=il_mio_client_id
  VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
  ```

- [ ] Il Client ID in `.env` è corretto (32 caratteri)

- [ ] Il Redirect URI in `.env` corrisponde a quello nel Spotify Dashboard

- [ ] Ho installato le dipendenze
  ```bash
  npm install
  ```

## 🚀 Test Funzionamento

- [ ] L'app si avvia senza errori
  ```bash
  npm run dev
  ```

- [ ] Posso aprire http://localhost:5173 nel browser

- [ ] Vedo la pagina di login con il bottone "Login with Spotify"

- [ ] Cliccando su "Login with Spotify" vengo reindirizzato a Spotify

- [ ] Dopo aver autorizzato l'app, torno su Harmony Hub

- [ ] Sono loggato e vedo la home page con i miei dati

- [ ] Posso vedere:
  - [ ] Brani recenti
  - [ ] Top tracks
  - [ ] Playlist

- [ ] La ricerca funziona

- [ ] Posso vedere i dispositivi disponibili

## 🎵 Test Riproduzione (Solo con Premium)

Se hai Spotify Premium:

- [ ] Il Web Player si inizializza correttamente

- [ ] Vedo "Harmony Hub Web Player" nella lista dispositivi

- [ ] Posso cliccare play su un brano

- [ ] La musica si sente

- [ ] I controlli funzionano:
  - [ ] Play/Pause
  - [ ] Next/Previous
  - [ ] Volume
  - [ ] Seek bar

- [ ] Posso trasferire la riproduzione tra dispositivi

## 🐛 Verifica Problemi Comuni

- [ ] NON vedo errori nella console del browser (F12)

- [ ] NON vedo errori nel terminale dove gira `npm run dev`

- [ ] Il token NON scade immediatamente (dura almeno 1 ora)

- [ ] Il Redirect URI è ESATTAMENTE `http://localhost:5173/callback`
  - NON `http://localhost:5173/callback/`
  - NON `https://localhost:5173/callback`
  - NON con spazi o altri caratteri

## 📊 Verifica Avanzata

- [ ] Posso vedere le statistiche nella sezione Stats

- [ ] Posso gestire la queue

- [ ] Il visualizzatore audio si anima (se sto riproducendo)

- [ ] Posso aprire la vista "Now Playing"

- [ ] Posso aggiungere brani ai preferiti

## ⚠️ Se qualcosa non funziona

### Checklist Debug

1. **Controlla i log:**
   - [ ] Console browser (F12 → Console)
   - [ ] Terminale npm

2. **Verifica configurazione:**
   - [ ] File `.env` esiste
   - [ ] File `.env` è nella root del progetto
   - [ ] Client ID è corretto
   - [ ] Redirect URI corrisponde

3. **Riprova:**
   - [ ] Cancella cache browser
   - [ ] Riavvia `npm run dev`
   - [ ] Fai logout e login
   - [ ] Prova con un altro browser

4. **Verifica Spotify:**
   - [ ] App attiva nel dashboard
   - [ ] Redirect URI salvato correttamente
   - [ ] Account attivo

## ✅ Tutto OK!

Se hai spuntato tutte le caselle importanti, sei pronto!

🎉 **Congratulazioni! Harmony Hub è configurato correttamente!**

Ora goditi la tua musica! 🎵

---

## 📝 Note

- Spotify Premium è **necessario** solo per la riproduzione
- Con account Free puoi vedere tutti i dati ma non riprodurre
- Il token scade dopo 1 ora (normale, rifai login)
- Puoi revocare i permessi in qualsiasi momento da Spotify

## 🆘 Serve Aiuto?

Se qualcosa non funziona:
1. Leggi [SETUP_COMPLETO.md](SETUP_COMPLETO.md#-troubleshooting)
2. Controlla questa checklist
3. Apri una issue su GitHub
