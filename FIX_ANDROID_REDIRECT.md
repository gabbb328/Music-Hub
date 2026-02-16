# ⚠️ FIX: Invalid Redirect URL su Android

## 🔴 PROBLEMA
`invalid_client: invalid redirect url` su Android APK

## ✅ SOLUZIONE

### 1. Apri Spotify Dashboard
https://developer.spotify.com/dashboard

### 2. Seleziona la tua App
Click sulla tua app "Music Hub" (o nome app)

### 3. Edit Settings
Pulsante verde "Edit Settings" in alto a destra

### 4. Aggiungi Redirect URI
Nella sezione **Redirect URIs**, aggiungi ESATTAMENTE:

```
com.musichub.app://callback
```

⚠️ **IMPORTANTE:** 
- NO spazi
- NO maiuscole diverse
- ESATTAMENTE come scritto sopra
- Click su "ADD" dopo averlo inserito

### 5. Scroll in basso e SAVE
Click su "SAVE" in fondo alla pagina

---

## 📝 REDIRECT URI COMPLETI

Il tuo Spotify Dashboard dovrebbe avere TUTTI questi URI:

```
http://localhost:8080/callback
http://localhost:5173/callback
https://intercausative-soo-edgingly.ngrok-free.dev/callback
com.musichub.app://callback
```

**L'ultimo è per Android!**

---

## 🔄 DOPO AVER AGGIUNTO

### NON serve rebuilddare l'app!

1. ✅ Salva in Spotify Dashboard
2. ✅ Chiudi app sul telefono (force close)
3. ✅ Riapri app
4. ✅ Prova login

---

## 🐛 SE ANCORA NON FUNZIONA

### Verifica che `.env` abbia:
```
VITE_SPOTIFY_REDIRECT_URI=com.musichub.app://callback
```

### Se è diverso:
1. Cambia `.env`
2. Rebuilda:
   ```bash
   npm run build
   npx cap sync android
   ```
3. In Android Studio: Build > Rebuild Project
4. Build nuovo APK
5. Reinstalla su telefono

---

## ✅ CHECKLIST VELOCE

- [ ] Spotify Dashboard aperto
- [ ] App selezionata
- [ ] Edit Settings
- [ ] Aggiunto: `com.musichub.app://callback`
- [ ] Click ADD
- [ ] Scroll e SAVE
- [ ] App chiusa su telefono
- [ ] App riaperta
- [ ] Test login

---

## 🎯 SCREENSHOT SPOTIFY DASHBOARD

Dovresti vedere nella sezione Redirect URIs:

```
✓ http://localhost:8080/callback
✓ http://localhost:5173/callback  
✓ https://intercausative-soo-edgingly.ngrok-free.dev/callback
✓ com.musichub.app://callback  ← QUESTO PER ANDROID
```

---

**Aggiungi `com.musichub.app://callback` in Spotify Dashboard e riprova!**
