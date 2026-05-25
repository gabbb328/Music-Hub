# 🎵 Music Hub

Un moderno music player web integrato con Spotify, costruito con React, TypeScript e TailwindCSS.

![Music Hub](https://img.shields.io/badge/Spotify-Integrated-1DB954?style=for-the-badge&logo=spotify)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

## Caratteristiche

-**Riproduzione Spotify** - Player integrato con Web Playback SDK
-**Ricerca Avanzata** - Cerca brani, artisti, album e playlist
-**Gestione Libreria** - Accedi alle tue playlist e brani salvati
-**Statistiche** - Visualizza le tue abitudini di ascolto
-**Visualizzatore Audio** - Animazioni sincronizzate con la musica
-**Multi-Device** - Controlla la riproduzione su tutti i tuoi dispositivi
-**Queue Management** - Gestisci la coda di riproduzione
-**AI DJ** - Raccomandazioni musicali intelligenti
-**Testi Sincronizzati** - Visualizza i testi mentre ascolti
-**Controlli Completi** - Play, pause, skip, volume, shuffle, repeat
-**Raggruppamento Recenti** - Visualizza i brani ascoltati più volte con un moltiplicatore (es. x2)

## Prerequisiti

- **Node.js** 18+ 
- **Account Spotify** (Premium consigliato per la riproduzione)
- **Ngrok** (gratuito) [Link](https://ngrok.com/)

## Quick Start

1. **Installa le librerie necessarie:**
   ```bash
   npm install
   ```

2. **Apri la cartella del progetto**
   ```bash
   cd harmony-hub-84
   ```

3. **Avvia l'app:**
   ```bash
   npm run dev
   ```

4. **Avvia il servizio di hosting temporaneo ngrok:**
   ```bash
   ngrok http 8080
   ```

## Tecnologie

- **Frontend:** React 18, TypeScript
- **Styling:** TailwindCSS, shadcn/ui
- **State Management:** React Query, Zustand
- **API:** Spotify Web API, Spotify Web Playback SDK
- **Animations:** Framer Motion
- **Build Tool:** Vite

## Struttura Progetto

```
music-hub-84/
├── src/
│   ├── components/       # Componenti UI
│   ├── hooks/           # Custom hooks
│   ├── services/        # Servizi API Spotify
│   ├── contexts/        # React contexts
│   ├── types/           # TypeScript types
│   ├── pages/           # Pagine dell'app
│   └── lib/             # Utilities
├── public/              # Asset statici
└── .env                 # Configurazione (da creare)

```

## Funzionalità Disponibili

### Con Account Spotify (anche Free):
- Visualizzazione brani recenti
- Top tracks e artisti
- Gestione playlist
- Ricerca completa
- Visualizzazione statistiche

### Solo con Spotify Premium:
- Riproduzione musica nel browser
- Controllo completo del player
- Trasferimento tra dispositivi
- Web Playback SDK

## Privacy & Sicurezza

- Le credenziali sono salvate solo nel tuo browser
- Nessun dato viene inviato a server esterni
- OAuth 2.0 per autenticazione sicura
- Puoi revocare i permessi in qualsiasi momento dalle impostazioni Spotify


## Troubleshooting

### Il player non funziona
1. Verifica di avere Spotify Premium
2. Controlla che il browser sia supportato
3. Verifica le credenziali in `.env`

### Errore di autenticazione
1. Verifica il Client ID
2. Controlla il Redirect URI nel Spotify Dashboard
3. Prova a fare logout e login

## Contribuire

I contributi sono benvenuti! Sentiti libero di:
- Aprire issue per bug o feature request
- Proporre pull request
- Migliorare la documentazione

## Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli

## Crediti

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

## Supporto

Hai problemi? 
1. Controlla la [documentazione](SETUP_COMPLETO.md)
2. Cerca nelle [issue esistenti](../../issues)
3. Apri una nuova issue

---
