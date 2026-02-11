# 🚀 Quick Start - Harmony Hub

## Setup Rapido (5 minuti)

### Metodo 1: Script Automatico (Raccomandato) 

**Windows:**
1. Doppio click su `setup.bat`
2. Segui le istruzioni a schermo
3. Inserisci il tuo Client ID di Spotify
4. Fine!

**PowerShell:**
```powershell
.\setup.ps1
```

### Metodo 2: Setup Manuale

1. **Crea App Spotify** (2 minuti)
   - Vai su https://developer.spotify.com/dashboard
   - Login → Create app
   - Nome: `Harmony Hub`
   - Redirect URI: `http://localhost:5173/callback`
   - Copia il **Client ID**

2. **Configura Progetto** (1 minuto)
   ```bash
   # Crea il file .env
   echo VITE_SPOTIFY_CLIENT_ID=tuo_client_id > .env
   echo VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback >> .env
   ```

3. **Installa e Avvia** (2 minuti)
   ```bash
   npm install
   npm run dev
   ```

4. **Apri Browser**
   - Vai su http://localhost:5173
   - Fai login con Spotify
   - Enjoy! 🎵

## ⚠️ Cose Importanti da Sapere

### Account Spotify Premium
- **Necessario** per riprodurre musica nel browser
- Account free: puoi vedere i dati ma non riprodurre

### Redirect URI
Deve essere **ESATTAMENTE**:
```
http://localhost:5173/callback
```
(Niente spazi, niente slash finale)

### Browser Supportati
✅ Chrome (migliore)
✅ Firefox  
✅ Edge
⚠️ Safari (con limitazioni)

## 🔥 Comandi Utili

```bash
npm run dev      # Avvia in dev mode
npm run build    # Build per produzione
npm run preview  # Preview build
```

## 🐛 Problemi Comuni

**"Invalid client"**
→ Client ID sbagliato in `.env`

**"Redirect URI mismatch"**  
→ Controlla che sia `http://localhost:5173/callback` nel dashboard Spotify

**"Player non funziona"**
→ Serve Spotify Premium

**"Nessun dispositivo"**
→ Ricarica la pagina e riprova

## 📚 Documentazione Completa

- `SETUP_COMPLETO.md` - Guida dettagliata passo-passo
- `README_SPOTIFY.md` - Documentazione tecnica completa

## 🆘 Supporto

Problemi? Controlla:
1. Console browser (F12)
2. File `.env` creato correttamente
3. Spotify Dashboard configurato

---

**Fatto! Ora goditi la tua musica! 🎶**
