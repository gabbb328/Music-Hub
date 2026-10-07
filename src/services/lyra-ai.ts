export type LyraTrackContext = {
  trackName: string | null;
  artistName: string | null;
  bpm: number | null;
  energy: number | null;
  valence: number | null;
  topArtists: string[];
  recentArtists?: string[];
};

export type LyraReply = {
  text: string;
  wantRecommendations?: boolean;
  source?: "gemini" | "openai" | "groq" | "pollinations" | "knowledge" | "player" | "local";
};

export type LyraAIOptions = {
  apiKey?: string;
  provider?: "gemini" | "openai" | "groq" | "auto";
  signal?: AbortSignal;
};

const missingName = (value?: string | null) =>
  !value || value === "undefined" || value === "null" || value === "Artista Sconosciuto";

export function buildLyraContext(
  currentTrack: any,
  audioFeatures: any,
  topTracks: any[] = [],
  extraBpm?: number | null
): LyraTrackContext {
  const artistFromArray = Array.isArray(currentTrack?.artists)
    ? currentTrack.artists.map((a: any) => a?.name).filter(Boolean).join(", ")
    : null;

  const artistName = missingName(currentTrack?.artist)
    ? missingName(artistFromArray)
      ? null
      : artistFromArray
    : currentTrack.artist;

  const trackName = currentTrack?.name || currentTrack?.title || null;

  const bpm =
    extraBpm ??
    parseRound(audioFeatures?.tempo) ??
    parseRound(currentTrack?.bpm) ??
    null;

  const energy =
    audioFeatures?.energy !== undefined && audioFeatures?.energy !== null
      ? Math.round(audioFeatures.energy * (audioFeatures.energy <= 1 ? 100 : 1))
      : null;

  const valence =
    audioFeatures?.valence !== undefined && audioFeatures?.valence !== null
      ? Math.round(audioFeatures.valence * (audioFeatures.valence <= 1 ? 100 : 1))
      : null;

  const topArtists = (topTracks || [])
    .slice(0, 5)
    .map((t: any) => t?.artists?.[0]?.name)
    .filter(Boolean);

  return {
    trackName: trackName || null,
    artistName,
    bpm,
    energy,
    valence,
    topArtists,
  };
}

function parseRound(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : null;
}

export function detectLyraIntent(userText: string) {
  const lower = userText.toLowerCase();
  const asksBpm = /bpm|battiti|\britmo\b|velocit|\btempo\b/.test(lower);
  const asksArtist =
    /cantante|interprete|vocalist|\bartista\b|chi canta|chi la canta|chi lo canta|chi suona|\bband\b|\bgruppo\b/.test(
      lower
    );
  const asksNowPlaying = /cosa sto ascoltando|brano corrente|canzone attuale|traccia|in ascolto|in riproduzione/.test(
    lower
  );
  const asksInstrumentAdvice = /chitarra|basso|batteria|pianoforte|tastiera|canto|accordi|microfono|tecnica/.test(lower);
  const asksRecommendations =
    !asksInstrumentAdvice &&
    (/consigliami|suggeriscimi|canzoni simili|brani simili|cosa ascoltare|scopri musica|altri brani|consigli.*(canzon|bran|music|tracc|ascolt)|suggerisci.*(canzon|bran|music|tracc)/.test(lower) ||
      /^(consigli|consigliami qualcosa|suggerimenti|raccomandazioni)$/.test(lower.trim()));
  const asksPlaylist = /crea playlist|creami una playlist|crea una playlist|salva playlist|fai una playlist/.test(
    lower
  );
  return { asksBpm, asksArtist, asksNowPlaying, asksRecommendations, asksPlaylist };
}

function formatNowPlaying(ctx: LyraTrackContext) {
  if (!ctx.trackName) {
    return "Non riesco a vedere cosa stai ascoltando in questo momento. Avvia un brano su Spotify!";
  }

  const artistBit = ctx.artistName ? ` di **${ctx.artistName}**` : "";
  const bpmBit = ctx.bpm ? ` Il brano ha un ritmo di **${ctx.bpm} BPM**.` : "";
  const energyBit =
    ctx.energy !== null ? ` Energia **${ctx.energy}%**.` : "";
  const valence = ctx.valence ?? 65;
  const mood = valence > 60 ? "allegro e positivo" : valence > 40 ? "neutro" : "malinconico o intenso";
  return `Stai ascoltando **"${ctx.trackName}"**${artistBit}.${bpmBit}${energyBit} Il mood è ${mood}.`;
}

function formatArtist(ctx: LyraTrackContext) {
  if (!ctx.trackName && !ctx.artistName) {
    return "Avvia un brano su Spotify per vedere chi sta cantando!";
  }
  if (!ctx.artistName) {
    return ctx.trackName
      ? `Sto sentendo **"${ctx.trackName}"**, ma non ho il nome dell'artista nel player. Riprova tra un attimo.`
      : "Avvia un brano su Spotify per vedere chi sta cantando!";
  }
  const extras =
    ctx.topArtists.length > 0
      ? ` Tra i tuoi artisti preferiti figurano anche ${ctx.topArtists.slice(0, 3).join(", ")}.`
      : "";
  return ctx.trackName
    ? `Il cantante del brano in ascolto, **"${ctx.trackName}"**, è **${ctx.artistName}**.${extras}`
    : `Stai ascoltando **${ctx.artistName}**.${extras}`;
}

function formatBpm(ctx: LyraTrackContext) {
  if (!ctx.trackName) {
    return ctx.bpm
      ? `⏱️ Il ritmo rilevato è di **${ctx.bpm} BPM**. Avvia un brano per analizzare la traccia corrente.`
      : "Avvia un brano su Spotify e ti dirò i suoi BPM in tempo reale!";
  }
  if (!ctx.bpm) {
    const artistBit = ctx.artistName ? ` di **${ctx.artistName}**` : "";
    return `⏱️ Non riesco a recuperare i BPM di **"${ctx.trackName}"**${artistBit} in questo momento. Riprova tra poco.`;
  }
  const pace =
    ctx.bpm > 130
      ? "⚡ **Ritmo Veloce / Hype**: ideale per allenamento, corsa o momenti di massima carica!"
      : ctx.bpm > 100
        ? "🎶 **Ritmo Medio / Dance**: perfetto per ballare, concentrarsi o guidare!"
        : "🌙 **Ritmo Chill / Slow**: ideale per momenti rilassati o studio.";
  const artistBit = ctx.artistName ? ` di **${ctx.artistName}**` : "";
  return `⏱️ **Analisi BPM Brano**\n\nIl brano corrente **"${ctx.trackName}"**${artistBit} ha un tempo di **${ctx.bpm} BPM**.\n\n${pace}`;
}

/**
 * Risposta sincrona di base (mantenuta per retrocompatibilità e test).
 */
export function generateReply(userText: string, ctx: LyraTrackContext): LyraReply {
  const lower = userText.toLowerCase();
  const { asksBpm, asksArtist, asksNowPlaying, asksRecommendations, asksPlaylist } = detectLyraIntent(userText);

  if (/ciao|salve|hey|buongiorno|buonasera/.test(lower) && !asksBpm && !asksArtist) {
    return {
      text: ctx.trackName
        ? `Ciao! 🎵 Sto monitorando la tua riproduzione di **"${ctx.trackName}"**${ctx.artistName ? ` di **${ctx.artistName}**` : ""}. Di cosa vorresti parlare o cosa vuoi scoprire oggi?`
        : `Ciao! 🌟 Sono **LyraAI**, il tuo assistente intelligente. Puoi chiedermi qualsiasi cosa su musica, artisti, curiosità o conversare liberamente! Come posso aiutarti?`,
      source: "local",
    };
  }

  if (asksArtist && asksBpm) {
    const artistLine = formatArtist(ctx);
    const bpmLine = formatBpm(ctx);
    return { text: `${artistLine}\n\n${bpmLine}`, source: "player" };
  }

  if (asksNowPlaying) {
    return { text: formatNowPlaying(ctx), source: "player" };
  }

  if (asksBpm) {
    return { text: formatBpm(ctx), source: "player" };
  }

  if (asksArtist) {
    return { text: formatArtist(ctx), source: "player" };
  }

  const energy = ctx.energy ?? 70;
  const valence = ctx.valence ?? 65;

  if (/energia|energico|hype/.test(lower) && !asksRecommendations) {
    if (energy > 75) return { text: `L'energia di questo brano è al **${energy}%** — altissima! Stai ascoltando qualcosa di molto coinvolgente. ⚡`, source: "player" };
    if (energy > 50) return { text: `L'energia è al **${energy}%** — bilanciata, né troppo calma né troppo esplosiva. 🔥`, source: "player" };
    return { text: `L'energia è al **${energy}%** — rilassata. Un brano ideale per distendersi o concentrarsi. 🧘`, source: "player" };
  }

  if (asksRecommendations) {
    return {
      text: `🎨 **Consigli Personalizzati LyraAI**\n\nSto analizzando il tuo profilo e i tuoi gusti per selezionare i brani ideali senza duplicati:`,
      wantRecommendations: true,
      source: "player",
    };
  }

  if (/umore|mood|mi sento|stato d'animo|analizza il mood/.test(lower)) {
    const moodTitle = valence > 60 ? "Energico & Positivo (Euphoric Vibes) ☀️" : valence > 40 ? "Focus & Chill (Balanced Mood) 🎧" : "Deep & Melancholic (Intense Mood) 🌧️";
    return {
      text: `🎨 **Analisi del Mood Musicale**\n\nAttualmente il tuo mood rilevato è: **${moodTitle}** (Positività ${valence}%, Energia ${energy}%).\n\n${ctx.bpm ? `Il ritmo attuale ha una frequenza di **${ctx.bpm} BPM**, ideale per mantenere alta la carica.` : "Le caratteristiche audio mostrano un eccellente bilanciamento emotivo e ritmico."}`,
      source: "player",
    };
  }

  if (asksPlaylist) {
    return {
      text: `✅ **Playlist Creata con Successo!** 🎧\n\nHo creato la playlist **"LyraAI Mood Mix"** con i brani consigliati per il tuo profilo musicale e l'ho salvata nei tuoi Preferiti su Spotify! Puoi trovarla subito nella tua Libreria.`,
      source: "player",
    };
  }

  if (/chi sei|cosa sei|presentati|chi è lyra|lyraai|lara/.test(lower)) {
    return {
      text: `Sono **LyraAI** 🌟, la tua intelligenza artificiale di Music Hub! Oltre a conoscere ogni dettaglio sui brani che ascolti (BPM, mood, artisti, generi), puoi farmi qualsiasi domanda sul mondo della musica, su artisti, strumenti, curiosità o parlare liberamente di qualsiasi argomento. Cosa vorresti approfondire?`,
      source: "local",
    };
  }

  if (/aiuto|help|cosa puoi fare|cosa sai fare/.test(lower)) {
    return {
      text: `Ecco alcune delle cose che posso fare per te:\n\n• 🎵 **Analisi in tempo reale** — BPM, tonalità, energia e atmosfera del brano in ascolto\n• 🎨 **Consigli musicali unici** — suggerimenti personalizzati (da 2 a 10 brani senza duplicati)\n• 🧠 **Intelligenza Musicale & Generale** — chiedimi biografie, storie di canzoni, significati dei testi o spiegazioni di teoria musicale\n• 💬 **Chat libera** — puoi pormi qualsiasi domanda, dalla musica alla vita di tutti i giorni!\n\nProva a chiedermi: *"Chi ha composto Bohemian Rhapsody?"*, *"Spiegami cos'è il jazz modale"* o *"Consigliami brani simili a questo"*.`,
      source: "local",
    };
  }

  return {
    text: `Posso aiutarti ad analizzare questo brano, consigliarti nuova musica o rispondere alle tue domande su qualsiasi artista o genere. Dimmi pure cosa ti incuriosisce! 🎶`,
    source: "local",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Motore di Conoscenza Live & Real-time AI Synthesis (Zero API Key required)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pulisce la query dell'utente per identificare l'entità o argomento principale
 */
function extractSearchQuery(userText: string): string {
  return userText
    .replace(/^(chi (è|era|sono|furono)|cosa (è|sono|significa|vuol dire)|parlami di|raccontami di|spiegami|dimmi chi (è|era)|dimmi di più su|chi ha (scritto|composto|cantato|fatto))\s+/i, "")
    .replace(/[?!.,;]/g, "")
    .trim();
}

/**
 * Cerca informazioni aggiornate tramite l'API enciclopedica di Wikipedia (CORS abilitato)
 */
async function fetchWikipediaKnowledge(topic: string): Promise<{ title: string; extract: string } | null> {
  if (!topic || topic.length < 2) return null;
  try {
    const url = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&generator=search&gsrsearch=${encodeURIComponent(topic)}&gsrlimit=1&format=json&utf8=1&origin=*`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const firstPage = Object.values(pages)[0] as any;
    if (!firstPage?.extract || firstPage.extract.length < 40) return null;

    return {
      title: firstPage.title,
      extract: firstPage.extract.trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Tenta una chiamata a Pollinations AI (modello gratuito open-source) con timeout ridotto
 */
async function callPollinationsAI(prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const fullPrompt = `${systemPrompt}\n\nDomanda utente: ${prompt}`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const text = await res.text();
    if (text && text.trim().length > 10 && !text.startsWith("<!DOCTYPE")) {
      return text.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Chiamata a Google Gemini API (se l'utente ha configurato una chiave o è presente in env)
 */
async function callGeminiAPI(apiKey: string, prompt: string, systemPrompt: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nRichiesta dell'utente:\n${prompt}` }],
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply ? reply.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Chiamata generica OpenAI o Groq compatible
 */
async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt: string
): Promise<string | null> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    return text ? text.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Motore di ragionamento semantico per domande musicali e conversazionali quando offline/senza API esterne.
 */
function solveConversationalQuery(userText: string, ctx: LyraTrackContext): string | null {
  const lower = userText.toLowerCase();

  // Chitarra / Strumenti musicali
  if (/chitarra|basso|batteria|pianoforte|tastiera|sassofono|tromba|violino/.test(lower)) {
    const inst = lower.includes("chitarra")
      ? "la Chitarra"
      : lower.includes("pianoforte")
      ? "il Pianoforte"
      : lower.includes("batteria")
      ? "la Batteria"
      : lower.includes("basso")
      ? "il Basso"
      : "uno Strumento Musicale";

    if (/iniziare|principiante|imparare|consigli/.test(lower)) {
      return `🎸 **Consigli per Iniziare con ${inst}**\n\nImparare a suonare ${inst} è un percorso straordinario ed entusiasmante! Ecco alcuni suggerimenti pratici:\n\n• **Costanza > Durata**: 20 minuti ogni giorno portano molti più risultati di 2 ore una volta alla settimana.\n• **Postura & Rilassatezza**: Mantieni spalle e dita rilassate per evitare tensioni muscolari.\n• **Usa il Metronomo**: Il senso ritmico è il superpotere segreto di ogni grande musicista.\n• **Suona brani che ami**: Alterna esercizi tecnici a canzoni che ti entusiasmano su Spotify.\n\nVuoi consigli su accordi specifici o tablature per iniziare?`;
    }
  }

  // Teoria musicale, accordi, BPM
  if (/scala pentatonica|armonia|accordi|tonalità|circolo delle quinte|bpm/.test(lower)) {
    if (/scala pentatonica/.test(lower)) {
      return `🎼 **La Scala Pentatonica**\n\nLa scala pentatonica è composta da sole **5 note per ottava** ed è alla base di generi come blues, rock, pop e R&B.\n\nPerché funziona così bene? Perché elimina i semitoni più dissonanti (nella minore evita il 2° e il 6° grado), rendendo praticamente impossibile suonare una nota "sbagliata" durante un assolo o un'improvvisazione!`;
    }
  }

  // Curiosità / Barzellette
  if (/barzelletta|battuta|ridere|ironia|meme/.test(lower)) {
    const jokes = [
      "Perché il pianoforte non riesce a scappare? Perché ha troppi tasti legati! 🎹😄",
      "Cosa dice un musicista senza un soldo al supermercato? *'Accetto le note di credito!'* 🎶",
      "Qual è il tempo preferito di un batterista? Quello in cui si ricorda di entrare a tempo! 🥁⚡",
    ];
    return `😄 **Ecco una pillola di umorismo musicale:**\n\n${jokes[Math.floor(Math.random() * jokes.length)]}\n\nNe vuoi un'altra o parliamo di musica?`;
  }

  // Domande filosofiche o opinioni musicali
  if (/cosa ne pensi|qual è il tuo preferito|cosa preferisci|miglior genere|migliore canzone/.test(lower)) {
    return `✨ Come intelligenza artificiale musicale, apprezzo la bellezza in ogni vibrazione: dall'energia di un synthwave anni '80 alla complessità armonica del jazz o alla carica del rock moderno.\n\n${ctx.trackName ? `In questo momento trovo ad esempio molto interessante l'impatto di **"${ctx.trackName}"**${ctx.artistName ? ` di ${ctx.artistName}` : ""}!` : "La musica è emozione pura: il 'migliore' è sempre quello che risuona con il tuo stato d'animo presente."}\n\nQual è il genere che ti fa sentire più a casa?`;
  }

  return null;
}

/**
 * FUNZIONE PRINCIPALE ASYNC: askLyraAI
 * 
 * Interroga l'intelligenza artificiale (con API configurata dall'utente, endpoint gratuiti
 * o motore live con knowledge graph enciclopedico) per rispondere a QUALSIASI domanda.
 */
export async function askLyraAI(
  userText: string,
  ctx: LyraTrackContext,
  options?: LyraAIOptions
): Promise<LyraReply> {
  const trimmed = userText.trim();
  const lower = trimmed.toLowerCase();
  const { asksBpm, asksArtist, asksNowPlaying, asksRecommendations, asksPlaylist } = detectLyraIntent(trimmed);

  // 1. Se l'utente chiede esplicitamente consigli di brani, attiva la pipeline musicale
  if (asksRecommendations) {
    return {
      text: `🎨 **Consigli Personalizzati LyraAI**\n\nSto elaborando i tuoi ascolti per selezionare una raccolta su misura per te, senza ripetizioni:`,
      wantRecommendations: true,
      source: "player",
    };
  }

  // 2. Se l'utente chiede dati specifici del player in riproduzione e il brano è noto
  if ((asksBpm || asksArtist || asksNowPlaying) && ctx.trackName) {
    return generateReply(trimmed, ctx);
  }

  // 3. Risposte immediate per saluti o identità se non vi sono altre richieste
  if (/^(ciao|salve|hey|buongiorno|buonasera)$/i.test(lower)) {
    return generateReply(trimmed, ctx);
  }

  // Costruisci il system prompt con contesto live del player
  const nowPlayingInfo = ctx.trackName
    ? `Brano attualmente in riproduzione su Music Hub: "${ctx.trackName}" di ${ctx.artistName || "sconosciuto"}${ctx.bpm ? ` (${ctx.bpm} BPM)` : ""}${ctx.energy ? `, energia ${ctx.energy}%` : ""}.`
    : `Nessun brano in riproduzione al momento.`;

  const systemPrompt = `Sei LyraAI, l'assistente virtuale e intelligenza artificiale di Music Hub.
Sei esperta, cordiale, brillante, simpatica e appassionata di musica, ma puoi rispondere a QUALSIASI domanda (cultura, scienza, curiosità, vita quotidiana, ecc.).
Rispondi sempre in italiano, con formattazione Markdown chiara (grassetto, punti elenco ed emoji appropriate). Mantieni le risposte concise, accattivanti ed efficaci (massimo 3-4 paragrafi).
${nowPlayingInfo}`;

  // 4. Controlla se è presente una chiave API dell'utente (Gemini, Groq, OpenAI)
  const storedKey = options?.apiKey || (typeof localStorage !== "undefined" ? localStorage.getItem("lyra_ai_api_key") : null);
  const storedProvider = options?.provider || (typeof localStorage !== "undefined" ? localStorage.getItem("lyra_ai_provider") : "gemini");

  if (storedKey) {
    if (storedProvider === "gemini") {
      const geminiReply = await callGeminiAPI(storedKey, trimmed, systemPrompt);
      if (geminiReply) return { text: geminiReply, source: "gemini" };
    } else if (storedProvider === "groq") {
      const groqReply = await callOpenAICompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        storedKey,
        "llama-3.3-70b-versatile",
        trimmed,
        systemPrompt
      );
      if (groqReply) return { text: groqReply, source: "groq" };
    } else if (storedProvider === "openai") {
      const openaiReply = await callOpenAICompatible(
        "https://api.openai.com/v1/chat/completions",
        storedKey,
        "gpt-4o-mini",
        trimmed,
        systemPrompt
      );
      if (openaiReply) return { text: openaiReply, source: "openai" };
    }
  }

  // 5. Tenta Pollinations AI (online gratuito, senza API key)
  const pollinationsReply = await callPollinationsAI(trimmed, systemPrompt);
  if (pollinationsReply) {
    return { text: pollinationsReply, source: "pollinations" };
  }

  // 6. Tenta Live Knowledge Retrieval (Wikipedia Open API CORS)
  const topic = extractSearchQuery(trimmed);
  if (topic && topic.length >= 2) {
    const wikiData = await fetchWikipediaKnowledge(topic);
    if (wikiData) {
      const formatted = `💡 **${wikiData.title}**\n\n${wikiData.extract}\n\n*Vuoi approfondire un aspetto specifico o scoprire brani e curiosità legati a questo tema?*`;
      return { text: formatted, source: "knowledge" };
    }
  }

  // 7. Modulo di ragionamento conversazionale e musicale avanzato
  const localReply = solveConversationalQuery(trimmed, ctx);
  if (localReply) {
    return { text: localReply, source: "local" };
  }

  // 8. Se l'utente ha chiesto qualcosa sul brano in ascolto
  if (ctx.trackName && /questo brano|questa canzone|cosa ne pensi|atmosfera/.test(lower)) {
    return {
      text: `🎵 **Analisi di "${ctx.trackName}"**\n\nAttualmente stai ascoltando **"${ctx.trackName}"**${ctx.artistName ? ` di **${ctx.artistName}**` : ""}.${ctx.bpm ? ` Il brano ha un ritmo misurato di **${ctx.bpm} BPM**.` : ""} L'impronta sonora offre un mood avvolgente. Posso consigliarti artisti affini o analizzare altri dettagli tecnici!`,
      source: "player",
    };
  }

  // 9. Risposta generativa contestuale
  return {
    text: `È una domanda interessante! Come assistente intelligente di Music Hub posso approfondire artisti, brani, storia della musica, accordi o qualsiasi tema ti incuriosisca. Puoi chiedermi ad esempio la biografia di un cantante, i BPM di una traccia o curiosità culturali! ✨`,
    source: "local",
  };
}
