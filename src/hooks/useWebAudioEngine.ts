/**
 * useWebAudioEngine — Real spatial audio engine using Web Audio API
 *
 * Graph per stem:
 *
 *   AudioBufferSourceNode
 *        │
 *   BiquadFilterNode (HPF)
 *        │
 *   BiquadFilterNode (LPF)
 *        │
 *   BiquadFilterNode (Low shelf EQ)
 *        │
 *   BiquadFilterNode (Mid peaking EQ)
 *        │
 *   BiquadFilterNode (High shelf EQ)
 *        │
 *   GainNode (volume × distanceGain)
 *        │
 *   StereoPannerNode  (equal-power panning from angle)
 *        │──────────────────────────────────┐
 *        │                                  │
 *   GainNode (dry)                   GainNode (reverbSend)
 *        │                                  │
 *        └──────────┐           ConvolverNode (room IR)
 *                   │                  │
 *              DestinationNode ← GainNode (wet)
 *
 * When a real file is imported: AudioBuffer is decoded from the File object
 * and played back with looping disabled. Each stem gets a GAIN offset that
 * simulates coming from a different "part" of the stereo mix.
 *
 * For true multi-stem separation wire in the AI engine results, each stem
 * gets its own AudioBuffer decoded from the separated file.
 */

import { useRef, useCallback, useEffect } from "react";
import type { Stem } from "@/types/spatialMixer";
import {
  distanceToGain,
  angleToPan,
  distanceToReverb,
} from "@/lib/spatialMixerUtils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StemNodes {
  source:    AudioBufferSourceNode | OscillatorNode;
  hpf:       BiquadFilterNode;
  lpf:       BiquadFilterNode;
  eqLow:     BiquadFilterNode;
  eqMid:     BiquadFilterNode;
  eqHigh:    BiquadFilterNode;
  gainNode:  GainNode;
  panner:    StereoPannerNode;
  dryGain:   GainNode;
  reverbSend:GainNode;
}

export interface WebAudioEngine {
  /** Load all stems. Pass the decoded AudioBuffer for the whole song (for demo),
   *  or individual buffers per stem after separation. */
  loadStems: (stems: Stem[], buffer?: AudioBuffer) => void;
  /** Apply updated spatial/mix params for one stem in real-time */
  updateStemParams: (stem: Stem) => void;
  play:   () => void;
  pause:  () => void;
  stop:   () => void;
  seekTo: (sec: number) => void;
  getCurrentTime: () => number;
  /** Export the current mix as a WAV Blob */
  exportWav: (durationSec: number) => Promise<Blob>;
  dispose:   () => void;
  isReady:   () => boolean;
}

// ── Impulse response builder (simple synthetic room IR) ──────────────────────

function buildRoomIR(ctx: AudioContext, durationSec = 2.5, decay = 3.0): AudioBuffer {
  const rate    = ctx.sampleRate;
  const length  = Math.floor(rate * durationSec);
  const ir      = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] =
        (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return ir;
}

// ── Demo oscillator tones (one per stem when no real audio is loaded) ─────────

const DEMO_FREQS: Record<string, number> = {
  "stem-0": 261.63,  // C4  – vocals
  "stem-1": 293.66,  // D4  – backing
  "stem-2": 80,      // bass drum area
  "stem-3": 55,      // bass
  "stem-4": 329.63,  // E4  – guitar
  "stem-5": 392.0,   // G4  – piano
  "stem-6": 440.0,   // A4  – synth
  "stem-7": 523.25,  // C5  – strings
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWebAudioEngine(): WebAudioEngine {
  const ctxRef          = useRef<AudioContext | null>(null);
  const masterGainRef   = useRef<GainNode | null>(null);
  const convolverRef    = useRef<ConvolverNode | null>(null);
  const reverbGainRef   = useRef<GainNode | null>(null);
  const stemNodesRef    = useRef<Map<string, StemNodes>>(new Map());
  const audioBufferRef  = useRef<AudioBuffer | null>(null);
  const startTimeRef    = useRef<number>(0);   // AudioContext.currentTime when play() was called
  const offsetRef       = useRef<number>(0);   // seek offset in seconds
  const playingRef      = useRef<boolean>(false);
  const usingRealAudio  = useRef<boolean>(false);

  // ── Lazy init AudioContext ─────────────────────────────────────────────────
  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const ctx = new AudioContext({ sampleRate: 44100 });

      // Master gain
      const master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // Reverb convolver
      const conv = ctx.createConvolver();
      conv.buffer = buildRoomIR(ctx);
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.35;
      conv.connect(reverbGain);
      reverbGain.connect(master);
      convolverRef.current  = conv;
      reverbGainRef.current = reverbGain;

      ctxRef.current = ctx;
    }
    return ctxRef.current;
  }, []);

  // ── Build node chain for one stem ─────────────────────────────────────────
  const buildStemChain = useCallback((
    ctx: AudioContext,
    stem: Stem,
    buffer: AudioBuffer | null,
    offsetSec: number,
  ): StemNodes => {
    // Filters
    const hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = stem.hpf > 0 ? stem.hpf : 20;
    hpf.Q.value = 0.7;

    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = stem.lpf > 0 ? stem.lpf : 20000;
    lpf.Q.value = 0.7;

    const eqLow = ctx.createBiquadFilter();
    eqLow.type = "lowshelf";
    eqLow.frequency.value = 120;
    eqLow.gain.value = stem.eq.low;

    const eqMid = ctx.createBiquadFilter();
    eqMid.type = "peaking";
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 1.0;
    eqMid.gain.value = stem.eq.mid;

    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = "highshelf";
    eqHigh.frequency.value = 8000;
    eqHigh.gain.value = stem.eq.high;

    // Volume × distance attenuation
    const dGain = distanceToGain(stem.position.distance);
    const gainNode = ctx.createGain();
    gainNode.gain.value = stem.muted ? 0 : stem.volume * dGain;

    // Stereo panner
    const panner = ctx.createStereoPanner();
    panner.pan.value = angleToPan(stem.position.angle);

    // Dry / reverb sends
    const dryGain    = ctx.createGain();
    dryGain.gain.value = 1.0;
    const reverbSendGain = ctx.createGain();
    reverbSendGain.gain.value = distanceToReverb(stem.position.distance, stem.reverbSend);

    // Chain: source → hpf → lpf → eqLow → eqMid → eqHigh → gain → panner → dry/wet
    hpf.connect(lpf);
    lpf.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(dryGain);
    panner.connect(reverbSendGain);
    dryGain.connect(masterGainRef.current!);
    if (convolverRef.current) reverbSendGain.connect(convolverRef.current);

    // Source node
    let source: AudioBufferSourceNode | OscillatorNode;

    if (buffer && usingRealAudio.current) {
      // Real audio file – each stem gets the whole buffer (until real separation)
      // with per-stem gain offset simulating stereo position
      const srcNode = ctx.createBufferSource();
      srcNode.buffer = buffer;
      srcNode.loop   = false;
      const stemGainOffset = ctx.createGain();
      // Simulate stem presence by varying gain slightly per stem index
      stemGainOffset.gain.value = 0.5 + Math.random() * 0.5;
      srcNode.connect(stemGainOffset);
      stemGainOffset.connect(hpf);
      srcNode.start(0, offsetSec);
      source = srcNode;
    } else {
      // Demo mode: oscillator tones
      const osc = ctx.createOscillator();
      const stemIdx = stem.id.replace("stem-", "");
      osc.frequency.value = DEMO_FREQS[stem.id] ?? (220 + parseInt(stemIdx || "0") * 55);
      osc.type = "sine";
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.06; // quiet sine waves
      osc.connect(oscGain);
      oscGain.connect(hpf);
      osc.start(0);
      source = osc;
    }

    return { source, hpf, lpf, eqLow, eqMid, eqHigh, gainNode, panner, dryGain, reverbSend: reverbSendGain };
  }, []);

  // ── Tear down all stem nodes ───────────────────────────────────────────────
  const destroyStemNodes = useCallback(() => {
    stemNodesRef.current.forEach((nodes) => {
      try {
        nodes.source.stop();
      } catch (_) {}
      try {
        nodes.source.disconnect();
        nodes.hpf.disconnect();
        nodes.lpf.disconnect();
        nodes.eqLow.disconnect();
        nodes.eqMid.disconnect();
        nodes.eqHigh.disconnect();
        nodes.gainNode.disconnect();
        nodes.panner.disconnect();
        nodes.dryGain.disconnect();
        nodes.reverbSend.disconnect();
      } catch (_) {}
    });
    stemNodesRef.current.clear();
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  const loadStems = useCallback((stems: Stem[], buffer?: AudioBuffer) => {
    const ctx = getCtx();
    destroyStemNodes();
    if (buffer) {
      audioBufferRef.current = buffer;
      usingRealAudio.current = true;
    } else {
      usingRealAudio.current = false;
    }
    stems.forEach((stem) => {
      const nodes = buildStemChain(ctx, stem, audioBufferRef.current, offsetRef.current);
      stemNodesRef.current.set(stem.id, nodes);
    });
  }, [getCtx, destroyStemNodes, buildStemChain]);

  const updateStemParams = useCallback((stem: Stem) => {
    const nodes = stemNodesRef.current.get(stem.id);
    if (!nodes) return;

    const dGain = distanceToGain(stem.position.distance);

    // Smooth parameter updates (20ms ramp to avoid clicks)
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const ramp = 0.02;

    nodes.gainNode.gain.linearRampToValueAtTime(
      stem.muted ? 0 : stem.volume * dGain, now + ramp
    );
    nodes.panner.pan.linearRampToValueAtTime(
      angleToPan(stem.position.angle), now + ramp
    );
    nodes.reverbSend.gain.linearRampToValueAtTime(
      distanceToReverb(stem.position.distance, stem.reverbSend), now + ramp
    );

    // EQ
    nodes.eqLow.gain.setTargetAtTime(stem.eq.low,  now, 0.01);
    nodes.eqMid.gain.setTargetAtTime(stem.eq.mid,  now, 0.01);
    nodes.eqHigh.gain.setTargetAtTime(stem.eq.high, now, 0.01);

    // Filters
    nodes.hpf.frequency.setTargetAtTime(stem.hpf > 0 ? stem.hpf : 20,     now, 0.01);
    nodes.lpf.frequency.setTargetAtTime(stem.lpf > 0 ? stem.lpf : 20000,  now, 0.01);
  }, []);

  const play = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    if (!playingRef.current) {
      // Need to rebuild sources (AudioBufferSourceNode can only be played once)
      const stems = Array.from(stemNodesRef.current.keys());
      if (stems.length === 0) return;
      destroyStemNodes();
      // We need stems data — stored externally; engine just rebuilds with current buffer/offset
      // This is handled by useSpatialMixer calling loadStems again on play
      playingRef.current = true;
      startTimeRef.current = ctx.currentTime - offsetRef.current;
    }
  }, [getCtx, destroyStemNodes]);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    offsetRef.current = ctx.currentTime - startTimeRef.current;
    playingRef.current = false;
    ctx.suspend();
  }, []);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    offsetRef.current = 0;
    playingRef.current = false;
    ctx.suspend();
  }, []);

  const seekTo = useCallback((sec: number) => {
    offsetRef.current = sec;
    if (playingRef.current && ctxRef.current) {
      startTimeRef.current = ctxRef.current.currentTime - sec;
    }
  }, []);

  const getCurrentTime = useCallback((): number => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return offsetRef.current;
    return ctx.currentTime - startTimeRef.current;
  }, []);

  const exportWav = useCallback(async (durationSec: number): Promise<Blob> => {
    const offlineCtx = new OfflineAudioContext(2, 44100 * durationSec, 44100);
    // TODO: render all stems into offline context
    // For now return empty WAV header
    const rendered = await offlineCtx.startRendering();
    return audioBufferToWav(rendered);
  }, []);

  const dispose = useCallback(() => {
    destroyStemNodes();
    ctxRef.current?.close();
    ctxRef.current = null;
  }, [destroyStemNodes]);

  const isReady = useCallback(() => !!ctxRef.current, []);

  // Cleanup on unmount
  useEffect(() => () => { dispose(); }, [dispose]);

  return { loadStems, updateStemParams, play, pause, stop, seekTo, getCurrentTime, exportWav, dispose, isReady };
}

// ── WAV encoder (PCM 16-bit stereo) ──────────────────────────────────────────

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate  = buffer.sampleRate;
  const numSamples  = buffer.length;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign  = numChannels * bytesPerSample;
  const byteRate    = sampleRate * blockAlign;
  const dataSize    = numSamples * blockAlign;
  const headerSize  = 44;

  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4,  36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1,  true);  // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate,  true);
  view.setUint32(28, byteRate,    true);
  view.setUint16(32, blockAlign,  true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
