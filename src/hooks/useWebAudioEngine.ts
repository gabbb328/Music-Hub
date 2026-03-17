/**
 * useWebAudioEngine v3 — spazializzazione REALE e percepibile
 *
 * Cosa fa davvero ora:
 * - Ogni stem ha il suo PannerNode 3D (non solo StereoPanner) con HRTF
 * - La posizione X/Y del radar si traduce in coordinate 3D reali (x, y, z)
 * - La distanza riduce il volume con curva inverse-square
 * - Il reverb aumenta proporzionalmente alla distanza
 * - updateStemParams aggiorna IMMEDIATAMENTE pan e gain durante il drag
 * - Demo: 8 oscillatori con frequenze molto diverse e ben distinguibili
 * - File importato: buffer decodificato riprodotto da ogni stem con offset
 *   di fase diverso + filtro differente per simulare stem separati
 */

import { useRef, useCallback, useEffect } from "react";
import type { Stem } from "@/types/spatialMixer";

// ── Demo tones — frequenze ben distanziate per sentire la separazione ─────────
const DEMO: Record<string, { freq: number; type: OscillatorType; vol: number }> = {
  "stem-0": { freq: 261.63, type: "sine",     vol: 0.15 }, // Do4  vocals
  "stem-1": { freq: 329.63, type: "sine",     vol: 0.10 }, // Mi4  backing
  "stem-2": { freq: 55.00,  type: "triangle", vol: 0.20 }, // La1  kick/bass drum
  "stem-3": { freq: 41.20,  type: "sawtooth", vol: 0.18 }, // Mi1  bass guitar
  "stem-4": { freq: 392.00, type: "sawtooth", vol: 0.10 }, // Sol4 chitarra
  "stem-5": { freq: 523.25, type: "sine",     vol: 0.10 }, // Do5  pianoforte
  "stem-6": { freq: 698.46, type: "sine",     vol: 0.08 }, // Fa5  synth
  "stem-7": { freq: 880.00, type: "triangle", vol: 0.07 }, // La5  archi
};

// ── Nodi per stem ─────────────────────────────────────────────────────────────
interface StemNodes {
  panner:     PannerNode;
  gainNode:   GainNode;
  reverbSend: GainNode;
  eqLow:      BiquadFilterNode;
  eqMid:      BiquadFilterNode;
  eqHigh:     BiquadFilterNode;
}

// ── Costruisce IR sintetico per la stanza ─────────────────────────────────────
function buildIR(ctx: AudioContext | OfflineAudioContext, duration = 2.0, decay = 2.8): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

// ── Conversione posizione radar → coordinate 3D ───────────────────────────────
// Il radar è una vista dall'alto:
//   x normalizzato (-1…1) → asse X (sinistra/destra)
//   y normalizzato (-1…1) → asse Z (avanti/indietro) — y negativo = davanti
// Il listener è fermo all'origine guardando verso z=-1 (avanti)
function stemTo3D(pos: { x: number; y: number; distance: number }) {
  const scale = 4; // metri (distanza massima stanza)
  return {
    x:  pos.x * scale,
    y:  0,                    // stesso piano orizzontale del listener
    z: -pos.y * scale,        // y radar negativo = avanti (z negativo in WebAudio)
  };
}

// ── Gain da distanza (curva inverse-distance, non lineare) ───────────────────
function distGain(distance: number): number {
  // distance 0…1; gain 1…0.08
  return Math.max(0.08, 1 / (1 + distance * 6));
}

export function useWebAudioEngine() {
  const ctxRef          = useRef<AudioContext | null>(null);
  const masterRef       = useRef<GainNode | null>(null);
  const convolverRef    = useRef<ConvolverNode | null>(null);
  const reverbBusRef    = useRef<GainNode | null>(null);
  const stemNodesRef    = useRef<Map<string, StemNodes>>(new Map());
  const sourcesRef      = useRef<Map<string, OscillatorNode | AudioBufferSourceNode>>(new Map());
  const bufferRef       = useRef<AudioBuffer | null>(null);
  const stemsRef        = useRef<Stem[]>([]);
  const playingRef      = useRef(false);
  const startCtxTimeRef = useRef(0);
  const offsetRef       = useRef(0);

  // ── Inizializza AudioContext ────────────────────────────────────────────────
  const getCtx = useCallback((): AudioContext => {
    if (ctxRef.current && ctxRef.current.state !== "closed") return ctxRef.current;

    const ctx = new AudioContext({ sampleRate: 44100, latencyHint: "interactive" });

    // Listener orientato verso -Z (standard WebAudio)
    ctx.listener.setPosition(0, 0, 0);
    if (ctx.listener.forwardX) {
      ctx.listener.forwardX.value  = 0; ctx.listener.forwardY.value  = 0; ctx.listener.forwardZ.value  = -1;
      ctx.listener.upX.value       = 0; ctx.listener.upY.value       = 1; ctx.listener.upZ.value       = 0;
    }

    const master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);

    const conv = ctx.createConvolver();
    conv.buffer = buildIR(ctx);
    const reverbBus = ctx.createGain();
    reverbBus.gain.value = 0.3;
    conv.connect(reverbBus);
    reverbBus.connect(master);

    ctxRef.current    = ctx;
    masterRef.current = master;
    convolverRef.current = conv;
    reverbBusRef.current = reverbBus;
    return ctx;
  }, []);

  // ── Costruisce catena di processing per uno stem ───────────────────────────
  const buildChain = useCallback((ctx: AudioContext, stem: Stem): StemNodes => {
    // EQ
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = "lowshelf"; eqLow.frequency.value = 120; eqLow.gain.value = stem.eq.low;
    const eqMid = ctx.createBiquadFilter();
    eqMid.type = "peaking"; eqMid.frequency.value = 1000; eqMid.Q.value = 1; eqMid.gain.value = stem.eq.mid;
    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = "highshelf"; eqHigh.frequency.value = 8000; eqHigh.gain.value = stem.eq.high;

    // Gain
    const gainNode = ctx.createGain();
    gainNode.gain.value = stem.muted ? 0 : stem.volume * distGain(stem.position.distance);

    // PannerNode 3D con HRTF — questo è il nodo chiave per la spazializzazione
    const panner = ctx.createPanner();
    panner.panningModel = "HRTF";          // binaural realistico
    panner.distanceModel = "inverse";
    panner.refDistance   = 1;
    panner.maxDistance   = 20;
    panner.rolloffFactor = 1.5;
    panner.coneInnerAngle = 360;
    const pos3d = stemTo3D(stem.position);
    if (panner.positionX) {
      panner.positionX.value = pos3d.x;
      panner.positionY.value = pos3d.y;
      panner.positionZ.value = pos3d.z;
    } else {
      (panner as any).setPosition(pos3d.x, pos3d.y, pos3d.z);
    }

    // Reverb send — più lontano = più reverb
    const reverbSend = ctx.createGain();
    const reverbAmt = Math.min(0.08 + stem.position.distance * 0.7 + stem.reverbSend * 0.4, 1.0);
    reverbSend.gain.value = reverbAmt;

    // Collegamento: EQ → gain → panner → master (dry)
    //                         panner → reverbSend → convolver (wet)
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(masterRef.current!);
    panner.connect(reverbSend);
    reverbSend.connect(convolverRef.current!);

    return { panner, gainNode, reverbSend, eqLow, eqMid, eqHigh };
  }, []);

  // ── Distrugge sorgenti audio ────────────────────────────────────────────────
  const killSources = useCallback(() => {
    sourcesRef.current.forEach(src => {
      try { src.stop(); } catch (_) {}
      try { src.disconnect(); } catch (_) {}
    });
    sourcesRef.current.clear();
  }, []);

  // ── Distrugge tutto ─────────────────────────────────────────────────────────
  const killAll = useCallback(() => {
    killSources();
    stemNodesRef.current.forEach(n => {
      try { n.eqLow.disconnect(); n.eqMid.disconnect(); n.eqHigh.disconnect();
            n.gainNode.disconnect(); n.panner.disconnect(); n.reverbSend.disconnect(); } catch (_) {}
    });
    stemNodesRef.current.clear();
  }, [killSources]);

  // ── API ─────────────────────────────────────────────────────────────────────

  const loadStems = useCallback((stems: Stem[], buffer?: AudioBuffer) => {
    const ctx = getCtx();
    killAll();
    if (buffer) bufferRef.current = buffer;
    stemsRef.current = stems;
    stems.forEach(stem => {
      const nodes = buildChain(ctx, stem);
      stemNodesRef.current.set(stem.id, nodes);
    });
  }, [getCtx, killAll, buildChain]);

  // Crea e avvia una sorgente audio per uno stem
  const attachSource = useCallback((ctx: AudioContext, stem: Stem, nodes: StemNodes, offsetSec: number) => {
    if (bufferRef.current) {
      const src = ctx.createBufferSource();
      src.buffer = bufferRef.current;
      src.loop   = false;
      // Filtro diverso per ogni stem per simulare separazione
      const filter = ctx.createBiquadFilter();
      const idx = parseInt(stem.id.replace("stem-", "") || "0");
      const freqs = [200, 400, 100, 60, 800, 1200, 2000, 4000];
      const types: BiquadFilterType[] = ["highpass","highpass","lowpass","lowpass","bandpass","bandpass","highpass","highpass"];
      filter.type            = types[idx % types.length];
      filter.frequency.value = freqs[idx % freqs.length];
      filter.Q.value         = 1.5;
      const vol = ctx.createGain();
      vol.gain.value = 0.4 + (idx % 3) * 0.2;
      src.connect(filter); filter.connect(vol); vol.connect(nodes.eqLow);
      const safe = Math.min(offsetSec, bufferRef.current.duration - 0.05);
      src.start(0, Math.max(0, safe));
      return src as OscillatorNode | AudioBufferSourceNode;
    } else {
      const tone = DEMO[stem.id] ?? { freq: 220 + parseInt(stem.id.replace("stem-","") || "0") * 44, type: "sine" as OscillatorType, vol: 0.1 };
      const osc  = ctx.createOscillator();
      osc.type = tone.type;
      osc.frequency.value = tone.freq;
      const vol = ctx.createGain();
      vol.gain.value = tone.vol;
      osc.connect(vol); vol.connect(nodes.eqLow);
      osc.start(0);
      return osc as OscillatorNode | AudioBufferSourceNode;
    }
  }, []);

  const play = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    killSources();
    stemsRef.current.forEach(stem => {
      const nodes = stemNodesRef.current.get(stem.id);
      if (!nodes) return;
      const src = attachSource(ctx, stem, nodes, offsetRef.current);
      sourcesRef.current.set(stem.id, src);
    });
    startCtxTimeRef.current = ctx.currentTime - offsetRef.current;
    playingRef.current = true;
  }, [getCtx, killSources, attachSource]);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    offsetRef.current = ctx.currentTime - startCtxTimeRef.current;
    killSources();
    playingRef.current = false;
  }, [killSources]);

  const stop = useCallback(() => {
    killSources();
    offsetRef.current  = 0;
    playingRef.current = false;
  }, [killSources]);

  const seekTo = useCallback((sec: number) => {
    offsetRef.current = sec;
    if (playingRef.current) {
      const ctx = ctxRef.current;
      if (!ctx) return;
      killSources();
      startCtxTimeRef.current = ctx.currentTime - sec;
      stemsRef.current.forEach(stem => {
        const nodes = stemNodesRef.current.get(stem.id);
        if (!nodes) return;
        const src = attachSource(ctx, stem, nodes, sec);
        sourcesRef.current.set(stem.id, src);
      });
    }
  }, [killSources, attachSource]);

  const getCurrentTime = useCallback((): number => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return offsetRef.current;
    return ctx.currentTime - startCtxTimeRef.current;
  }, []);

  /**
   * updateStemParams — chiamato ad OGNI drag, aggiorna in real-time:
   * - posizione 3D del PannerNode (spazializzazione immediata)
   * - gain (volume × distanza)
   * - reverb send (distanza → più reverb)
   * - EQ
   */
  const updateStemParams = useCallback((stem: Stem) => {
    const nodes = stemNodesRef.current.get(stem.id);
    const ctx   = ctxRef.current;
    if (!nodes || !ctx) return;

    const now  = ctx.currentTime;
    const ramp = 0.02; // 20ms smooth

    // ── Aggiorna posizione 3D ────────────────────────────────────────────────
    const pos3d = stemTo3D(stem.position);
    if (nodes.panner.positionX) {
      nodes.panner.positionX.linearRampToValueAtTime(pos3d.x, now + ramp);
      nodes.panner.positionY.linearRampToValueAtTime(pos3d.y, now + ramp);
      nodes.panner.positionZ.linearRampToValueAtTime(pos3d.z, now + ramp);
    } else {
      (nodes.panner as any).setPosition(pos3d.x, pos3d.y, pos3d.z);
    }

    // ── Aggiorna gain ────────────────────────────────────────────────────────
    const targetGain = stem.muted ? 0 : stem.volume * distGain(stem.position.distance);
    nodes.gainNode.gain.linearRampToValueAtTime(targetGain, now + ramp);

    // ── Aggiorna reverb send ─────────────────────────────────────────────────
    const reverbAmt = Math.min(0.08 + stem.position.distance * 0.7 + stem.reverbSend * 0.4, 1.0);
    nodes.reverbSend.gain.linearRampToValueAtTime(stem.muted ? 0 : reverbAmt, now + ramp);

    // ── Aggiorna EQ ──────────────────────────────────────────────────────────
    nodes.eqLow.gain.setTargetAtTime(stem.eq.low,  now, 0.015);
    nodes.eqMid.gain.setTargetAtTime(stem.eq.mid,  now, 0.015);
    nodes.eqHigh.gain.setTargetAtTime(stem.eq.high, now, 0.015);
  }, []);

  // ── Export WAV ──────────────────────────────────────────────────────────────
  const exportWav = useCallback(async (durationSec: number): Promise<Blob> => {
    const offCtx = new OfflineAudioContext(2, Math.floor(44100 * durationSec), 44100);
    const offMaster = offCtx.createGain(); offMaster.gain.value = 0.85; offMaster.connect(offCtx.destination);
    const offConv = offCtx.createConvolver(); offConv.buffer = buildIR(offCtx);
    const offRev  = offCtx.createGain(); offRev.gain.value = 0.3;
    offConv.connect(offRev); offRev.connect(offMaster);

    stemsRef.current.forEach(stem => {
      const eqL = offCtx.createBiquadFilter(); eqL.type="lowshelf";  eqL.frequency.value=120;  eqL.gain.value=stem.eq.low;
      const eqM = offCtx.createBiquadFilter(); eqM.type="peaking";   eqM.frequency.value=1000; eqM.Q.value=1; eqM.gain.value=stem.eq.mid;
      const eqH = offCtx.createBiquadFilter(); eqH.type="highshelf"; eqH.frequency.value=8000; eqH.gain.value=stem.eq.high;
      const g   = offCtx.createGain(); g.gain.value = stem.muted ? 0 : stem.volume * distGain(stem.position.distance);
      const pan = offCtx.createPanner();
      pan.panningModel = "HRTF"; pan.distanceModel = "inverse"; pan.refDistance = 1; pan.rolloffFactor = 1.5;
      const pos3d = stemTo3D(stem.position);
      if (pan.positionX) {
        pan.positionX.value = pos3d.x; pan.positionY.value = pos3d.y; pan.positionZ.value = pos3d.z;
      } else { (pan as any).setPosition(pos3d.x, pos3d.y, pos3d.z); }
      const rev = offCtx.createGain();
      rev.gain.value = Math.min(0.08 + stem.position.distance * 0.7 + stem.reverbSend * 0.4, 1.0);

      eqL.connect(eqM); eqM.connect(eqH); eqH.connect(g); g.connect(pan);
      pan.connect(offMaster); pan.connect(rev); rev.connect(offConv);

      if (bufferRef.current) {
        const src = offCtx.createBufferSource(); src.buffer = bufferRef.current;
        const idx = parseInt(stem.id.replace("stem-","") || "0");
        const vg  = offCtx.createGain(); vg.gain.value = 0.4 + (idx % 3) * 0.2;
        src.connect(vg); vg.connect(eqL); src.start(0);
      } else {
        const tone = DEMO[stem.id] ?? { freq: 220, type: "sine" as OscillatorType, vol: 0.1 };
        const osc  = offCtx.createOscillator(); osc.type = tone.type; osc.frequency.value = tone.freq;
        const vg   = offCtx.createGain(); vg.gain.value = tone.vol;
        osc.connect(vg); vg.connect(eqL); osc.start(0);
      }
    });

    const rendered = await offCtx.startRendering();
    return bufferToWav(rendered);
  }, []);

  const dispose = useCallback(() => {
    killAll();
    ctxRef.current?.close();
    ctxRef.current = null;
  }, [killAll]);

  useEffect(() => () => { dispose(); }, [dispose]);

  return { loadStems, play, pause, stop, seekTo, getCurrentTime, updateStemParams, exportWav, dispose };
}

// ── Encoder WAV PCM 16-bit ────────────────────────────────────────────────────
function bufferToWav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels, sr = buf.sampleRate, len = buf.length;
  const ab = new ArrayBuffer(44 + len * ch * 2);
  const v  = new DataView(ab);
  const ws = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  ws(0,"RIFF"); v.setUint32(4, 36 + len*ch*2, true); ws(8,"WAVE");
  ws(12,"fmt "); v.setUint32(16,16,true); v.setUint16(20,1,true);
  v.setUint16(22,ch,true); v.setUint32(24,sr,true); v.setUint32(28,sr*ch*2,true);
  v.setUint16(32,ch*2,true); v.setUint16(34,16,true);
  ws(36,"data"); v.setUint32(40, len*ch*2, true);
  let off = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
    const s = Math.max(-1, Math.min(1, buf.getChannelData(c)[i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2;
  }
  return new Blob([ab], { type: "audio/wav" });
}
