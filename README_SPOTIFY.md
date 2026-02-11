# Harmony Hub - Spotify Music Player

Un'applicazione web moderna per la riproduzione di musica da Spotify con funzionalità avanzate.

## 🎵 Funzionalità

- ✅ Autenticazione Spotify OAuth 2.0
- ✅ Riproduzione musica tramite Spotify Web Playback SDK
- ✅ Controlli completi del player (play, pause, next, previous, seek, volume)
- ✅ Visualizzazione brani in riproduzione
- ✅ Gestione playlist
- ✅ Ricerca brani, artisti, album
- ✅ Statistiche di ascolto
- ✅ Gestione dispositivi
- ✅ Coda di riproduzione
- ✅ Visualizzatore audio
- ✅ Testi sincronizzati
- ✅ AI DJ per raccomandazioni personalizzate
- ✅ Radio basata su brani/artisti

## 🚀 Setup

### 1. Registra la tua applicazione su Spotify

1. Vai su [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Accedi con il tuo account Spotify
3. Clicca su "Create an App"
4. Compila i dettagli:
   - **App Name**: Harmony Hub
   - **App Description**: Modern music player powered by Spotify
5. Accetta i Terms of Service
6. Una volta creata l'app, vai nelle impostazioni
7. Aggiungi il Redirect URI:
   - Per sviluppo locale: `http://localhost:5173/callback`
   - Per produzione: `https://tuodominio.com/callback`
8. Copia il **Client ID**

### 2. Configura le variabili d'ambiente

1. Crea un file `.env` nella root del progetto:

```bash
cp .env.example .env
```

2. Apri il file `.env` e inserisci le tue credenziali:

```env
VITE_SPOTIFY_CLIENT_ID=tuo_client_id_qui
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
```

### 3. Installa le dipendenze

```bash
npm install
```

### 4. Avvia l'applicazione

```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

## 📱 Come usare

1. **Login**: Clicca su "Login with Spotify" nella pagina di login
2. **Autorizza**: Accetta le permessi richiesti da Spotify
3. **Riproduci**: Inizia a cercare e riprodurre la tua musica preferita!

## 🛠️ Tecnologie utilizzate

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **Spotify Web API** - Music data
- **Spotify Web Playback SDK** - Audio playback
- **React Query** - Data fetching
- **Zustand** - State management
- **Framer Motion** - Animations

## 📦 Scripts disponibili

```bash
npm run dev          # Avvia il server di sviluppo
npm run build        # Crea la build di produzione
npm run preview      # Preview della build di produzione
npm run lint         # Esegue il linter
npm run test         # Esegue i test
```

## 🎨 Struttura del progetto

```
src/
├── components/       # Componenti React
│   ├── ui/          # Componenti UI di base
│   └── ...          # Feature components
├── contexts/        # React contexts
├── hooks/           # Custom hooks
├── pages/           # Pagine dell'app
├── services/        # Servizi API
│   ├── spotify-auth.ts    # Gestione autenticazione
│   └── spotify-api.ts     # Chiamate API Spotify
├── types/           # TypeScript types
└── lib/            # Utilities

```

## 🔐 Permessi richiesti

L'app richiede i seguenti permessi Spotify:

- `user-read-currently-playing` - Vedere cosa stai ascoltando
- `user-read-playback-state` - Leggere lo stato di riproduzione
- `user-modify-playback-state` - Controllare la riproduzione
- `user-read-recently-played` - Vedere i brani recenti
- `user-top-read` - Vedere le tue preferenze
- `user-library-read` - Leggere la tua libreria
- `user-library-modify` - Modificare la tua libreria
- `playlist-read-private` - Leggere le playlist private
- `playlist-modify-public` - Modificare playlist pubbliche
- `playlist-modify-private` - Modificare playlist private
- `streaming` - Riprodurre musica tramite Web Playback SDK
- `user-read-email` - Leggere la tua email
- `user-read-private` - Leggere i dati del profilo

## 🐛 Troubleshooting

### Il player non si connette

1. Verifica di avere un account Spotify Premium (necessario per Web Playback SDK)
2. Controlla che il browser supporti Web Playback SDK (Chrome, Firefox, Edge, Safari)
3. Verifica che le credenziali in `.env` siano corrette
4. Controlla la console del browser per eventuali errori

### Errore di autenticazione

1. Verifica che il Redirect URI in Spotify Dashboard corrisponda a quello in `.env`
2. Controlla che il Client ID sia corretto
3. Prova a fare logout e login di nuovo

### La musica non parte

1. Verifica di avere Spotify Premium
2. Controlla che il dispositivo sia selezionato correttamente
3. Prova a trasferire la riproduzione ad un altro dispositivo

## 📄 Licenza

MIT

## 🤝 Contribuire

I contributi sono benvenuti! Sentiti libero di aprire issue o pull request.

## 📞 Supporto

Per problemi o domande, apri una issue su GitHub.

---

Sviluppato con ❤️ usando Spotify Web API
