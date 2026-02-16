# 📱 ANDROID APK - GUIDA COMPLETA

## ✅ PREPARAZIONE COMPLETATA

### File Aggiornati:
1. ✅ `capacitor.config.ts` - Config Android ottimizzata
2. ✅ `src/index.css` - CSS mobile-friendly
3. ✅ `android/app/src/main/AndroidManifest.xml` - Permessi corretti
4. ✅ `.env` - Redirect URI per Android
5. ✅ `BUILD_ANDROID.bat` - Script automatico

---

## 🚀 BUILD APK

### Opzione 1: AUTOMATICO (Raccomandato)
```bash
BUILD_ANDROID.bat
```

Questo script:
1. Builda il progetto (`npm run build`)
2. Sincronizza Capacitor (`npx cap sync android`)
3. Copia assets
4. Aggiorna progetto Android
5. **Apre Android Studio automaticamente**

### Opzione 2: MANUALE
```bash
# 1. Build
npm run build

# 2. Sync
npx cap sync android

# 3. Apri Android Studio
npx cap open android
```

---

## 📱 IN ANDROID STUDIO

### 1. Attendi indicizzazione
Android Studio deve indicizzare il progetto (barra in basso)

### 2. Build APK
**Menu:** Build > Build Bundle(s) / APK(s) > Build APK(s)

**O shortcut:** `Ctrl + Shift + A` → digita "Build APK"

### 3. Trova APK
Dopo il build, click su **"locate"** nel popup
Oppure: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Installa su telefono
- USB: Copia APK su telefono
- Oppure: Run > Run 'app' (se telefono connesso)

---

## 🎨 OTTIMIZZAZIONI MOBILE

### ✅ Implementate:
- **Touch targets:** Min 48x48px
- **Scrollbar:** 6px sottile
- **Font size:** 16px (previene zoom iOS)
- **Safe areas:** Notch/gesture bars
- **No bounce:** Overscroll disabilitato
- **Tap highlight:** Trasparente
- **Hardware acceleration:** Attivato
- **Clear text traffic:** Abilitato (per debug)

### ✅ CSS Ottimizzato:
- Smooth scroll
- Momentum scrolling
- No text selection (tranne input)
- Fixed body (no scroll page)
- Touch-action: pan-y

---

## 🔧 SPOTIFY SETUP ANDROID

### Dashboard Spotify:
1. Vai su: https://developer.spotify.com/dashboard
2. Apri la tua app
3. Edit Settings
4. **Aggiungi Redirect URI:**
   ```
   com.musichub.app://callback
   ```
5. Save

### File .env:
Già configurato con:
```
VITE_SPOTIFY_REDIRECT_URI=com.musichub.app://callback
```

---

## 🐛 TROUBLESHOOTING

### Android Studio non si apre:
```bash
# Controlla che Android Studio sia installato
# Path: C:\Program Files\Android\Android Studio\bin\studio64.exe
```

### Build fallisce:
```bash
# 1. Pulisci cache
npm run build
npx cap sync android --force

# 2. In Android Studio:
Build > Clean Project
Build > Rebuild Project
```

### APK non installa:
- Abilita "Installa app sconosciute" nelle impostazioni
- Settings > Security > Unknown sources

### App crasha:
```bash
# Debug con logcat in Android Studio
View > Tool Windows > Logcat
Filtra: "Capacitor" o "Chromium"
```

### Spotify non funziona:
1. ✅ Verifica Redirect URI in Spotify Dashboard
2. ✅ Controlla `.env` ha URI corretto
3. ✅ Rebuilda dopo cambio `.env`
4. ✅ Testa login

---

## 📦 RELEASE APK (Firmato)

### Per pubblicare su Play Store:

1. **Genera keystore:**
```bash
keytool -genkey -v -keystore music-hub.keystore -alias music-hub -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configura in Android Studio:**
   - Build > Generate Signed Bundle/APK
   - Seleziona keystore
   - Build Release APK

3. **File:** `android/app/build/outputs/apk/release/app-release.apk`

---

## ✅ CHECKLIST

Prima di buildare:
- [ ] `.env` ha `com.musichub.app://callback`
- [ ] Spotify Dashboard ha lo stesso URI
- [ ] `npm run build` funziona
- [ ] Android Studio installato
- [ ] USB debugging abilitato (per test device)

Dopo build:
- [ ] APK installato su telefono
- [ ] App si apre senza crash
- [ ] Login Spotify funziona
- [ ] Musica si riproduce
- [ ] UI è responsive
- [ ] Scrolling fluido

---

## 🎉 RISULTATO

### App Android con:
✅ UI mobile-ottimizzata
✅ Touch targets corretti
✅ Scrolling fluido
✅ Safe areas per notch
✅ Spotify OAuth funzionante
✅ Performance ottimizzate
✅ No bounce/overscroll

---

**Esegui BUILD_ANDROID.bat per iniziare!**
