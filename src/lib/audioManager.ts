import { SparkOrderType } from '../types';
import { safeStorage as localStorage } from './safeStorage';


export type SoundCategory = 'Shop & Deliver' | 'Curbside Pickup' | 'Dotcom Delivery';

export function getAudioCategory(type: string): SoundCategory {
  if (type.includes('Shop') || type.includes('Service') || type.includes('Bag')) {
    return 'Shop & Deliver';
  }
  if (type.includes('Pickup') || type.includes('Delivery Only') || type.includes('Delivery') || type.includes('Courier') || type.includes('Pack') || type.includes('Block') || type.includes('Trip')) {
    return 'Curbside Pickup';
  }
  return 'Dotcom Delivery';
}

// Structure to preserve the user's custom alert settings across browser refreshes
export interface OfferSoundConfig {
  type: 'preset' | 'custom';
  selectedPreset: string;
  customFileBase64: string | null;
  customFileName: string | null;
  muted?: boolean;
}

// Global cached audio buffers for pre-decoded custom uploaded sounds
const audioBufferCache: Record<string, AudioBuffer> = {};

// Default configurations
const DEFAULT_CONFIGS: Record<SoundCategory, OfferSoundConfig> = {
  'Shop & Deliver': {
    type: 'preset',
    selectedPreset: 'arcade_magic',
    customFileBase64: null,
    customFileName: null,
    muted: false,
  },
  'Curbside Pickup': {
    type: 'preset',
    selectedPreset: 'steady_pulse',
    customFileBase64: null,
    customFileName: null,
    muted: false,
  },
  'Dotcom Delivery': {
    type: 'preset',
    selectedPreset: 'staccato_loop',
    customFileBase64: null,
    customFileName: null,
    muted: false,
  }
};

// Store keys for local storage persistence
const STORAGE_KEY = 'spark_bot_offer_sound_configs_v1';
const MASTER_MUTE_KEY = 'spark_bot_master_mute_v1';

export function isMasterMuted(): boolean {
  try {
    return localStorage.getItem(MASTER_MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setMasterMute(muted: boolean) {
  try {
    localStorage.setItem(MASTER_MUTE_KEY, muted ? 'true' : 'false');
  } catch (e) {
    console.warn('Failed to set master mute:', e);
  }
}

// Preset lists for the UI selection
export const SOUND_PRESETS: Record<SoundCategory, { id: string; name: string }[]> = {
  'Shop & Deliver': [
    { id: 'arcade_magic', name: '🎮 Arcade Magic' },
    { id: 'bell_chime', name: '🔔 Bell Chime' },
    { id: 'future_laser', name: '⚡ Future Laser' },
  ],
  'Curbside Pickup': [
    { id: 'steady_pulse', name: '🛰️ Steady Pulse' },
    { id: 'techno_ping', name: '🎵 Techno Ping' },
    { id: 'smooth_sweep', name: '📡 Smooth Sweep' },
  ],
  'Dotcom Delivery': [
    { id: 'staccato_loop', name: '💬 Staccato Loop' },
    { id: 'bass_hub', name: '🎹 Bass Hub' },
    { id: 'elevator_ping', name: '🏢 Elevator Ping' },
  ]
};

// Retrieve sound configuration from cache or localStorage
export function getSoundConfigs(): Record<SoundCategory, OfferSoundConfig> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all keys exist
      return {
        ...DEFAULT_CONFIGS,
        ...parsed
      };
    }
  } catch (e) {
    console.warn('Failed to parse sound configs:', e);
  }
  return { ...DEFAULT_CONFIGS };
}

// Write the current settings to localStorage
export function saveSoundConfigs(configs: Record<SoundCategory, OfferSoundConfig>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (e) {
    console.warn('Failed to persist sound configs:', e);
  }
}

// Convert Base64 string to ArrayBuffer for Web Audio API input
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Strip data URL prefixes if they exist
  const base64Clean = base64.split(',')[1] || base64;
  const binaryString = window.atob(base64Clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Global shared AudioContext to prevent play blocking and reuse locked contexts
let sharedAudioCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
  // @ts-ignore
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new AudioCtx();
    } catch (e) {
      console.warn('AudioContext failed to instantiate because of sandbox iframe restrictions:', e);
      return null;
    }
  }
  return sharedAudioCtx;
}

export function unlockAudioContext() {
  const ctx = getSharedAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      console.log('🔈 AudioContext successfully bypassed and unlocked on user gesture!');
      // Play a very quick, silent diagnostic click so browser processes it instantly
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.06);
    }).catch(err => {
      console.warn('Silent fallback: AudioContext unlock was delayed:', err);
    });
  } else if (ctx) {
    // If already running, test playing a faint tick to warm up the physical speakers
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.05);
    } catch {}
  }
}

// Prefetch and decode all custom audio files stored in base64 on boot
export async function preDecodeCustomSounds() {
  const configs = getSoundConfigs();
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  let tempCtx: AudioContext;
  try {
    tempCtx = new AudioCtx();
  } catch (e) {
    console.warn('Silent fallback: AudioContext instantiation restricted or blocked:', e);
    return;
  }
  
  for (const offerType of Object.keys(configs) as SoundCategory[]) {
    const cfg = configs[offerType];
    if (cfg.type === 'custom' && cfg.customFileBase64) {
      try {
        const buffer = base64ToArrayBuffer(cfg.customFileBase64);
        tempCtx.decodeAudioData(
          buffer,
          (decoded) => {
            audioBufferCache[offerType] = decoded;
          },
          (err) => console.error(`Error pre-decoding ${offerType} sound:`, err)
        );
      } catch (err) {
        console.warn(`Failed to process base64 for ${offerType}:`, err);
      }
    }
  }
}

// Decode and cache a specific uploaded audio snippet on-demand
export async function decodeAndCacheSound(offerType: SoundCategory, base64: string): Promise<boolean> {
  return new Promise((resolve) => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      resolve(false);
      return;
    }

    try {
      const ctx = new AudioCtx();
      const buffer = base64ToArrayBuffer(base64);
      
      ctx.decodeAudioData(
        buffer,
        (decoded) => {
          audioBufferCache[offerType] = decoded;
          resolve(true);
        },
        (err) => {
          console.error(`Decoding failed for typed dispatch header ${offerType}:`, err);
          resolve(false);
        }
      );
    } catch (e) {
      console.warn('Audio decoding block threw exception:', e);
      resolve(false);
    }
  });
}

// Play custom audio structure, falls back to elegant Web Audio synth preset if unavailable
export function playOfferAlert(offerType: string, isHighPaying?: boolean) {
  try {
    if (isMasterMuted()) {
      return;
    }

    const category = getAudioCategory(offerType);
    const configs = getSoundConfigs();
    const config = configs[category] || DEFAULT_CONFIGS[category];
    
    if (config && config.muted === true) {
      // Return early because this specific individual offer category is muted
      return;
    }
    
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // A. CUSTOM AUDIO DECODED FILE PLAYBACK
    if (config.type === 'custom' && audioBufferCache[category]) {
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = audioBufferCache[category];
      
      // Ample volume but safe margin
      gainNode.gain.setValueAtTime(isHighPaying ? 0.25 : 0.18, ctx.currentTime);
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start(0);
      return;
    }

    // B. WEB AUDIO SYNTHESIZER PRESET PLAYBACK
    const now = ctx.currentTime;
    const selectedPreset = config.selectedPreset;

    if (category === 'Shop & Deliver') {
      // PREMIUM SHOPPING ENVELOPE TYPES
      if (selectedPreset === 'arcade_magic') {
        const notes = [
          { freq: 440, delay: 0.0, dur: 0.05, type: 'triangle' },
          { freq: 554.37, delay: 0.05, dur: 0.05, type: 'triangle' },
          { freq: 659.25, delay: 0.10, dur: 0.05, type: 'triangle' },
          { freq: 880, delay: 0.15, dur: 0.15, type: 'sine' },
        ];
        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = n.type as OscillatorType;
          osc.frequency.setValueAtTime(n.freq, now + n.delay);
          gain.gain.setValueAtTime(0.08, now + n.delay);
          gain.gain.exponentialRampToValueAtTime(0.005, now + n.delay + n.dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + n.delay);
          osc.stop(now + n.delay + n.dur + 0.05);
        });
      } else if (selectedPreset === 'bell_chime') {
        const osc = ctx.createOscillator();
        const decayNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.4);
        
        // Ringing metallic tone mod
        const metalOsc = ctx.createOscillator();
        const metalGain = ctx.createGain();
        metalOsc.frequency.value = 1480;
        metalGain.gain.value = 15;
        metalOsc.connect(metalGain);
        metalGain.connect(osc.frequency);
        
        decayNode.gain.setValueAtTime(0.12, now);
        decayNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        osc.connect(decayNode);
        decayNode.connect(ctx.destination);
        
        metalOsc.start(now);
        osc.start(now);
        metalOsc.stop(now + 0.6);
        osc.stop(now + 0.6);
      } else { // future_laser
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);
        
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } 
    else if (category === 'Curbside Pickup') {
      // CURBSIDE FREQUENCY LOGS
      if (selectedPreset === 'steady_pulse') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0.09, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.2);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(523.25, now + 0.12); // Pulse again
        gain2.gain.setValueAtTime(0.09, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.32);
      } else if (selectedPreset === 'techno_ping') {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(293.66, now + 0.08); // D4
        
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      } else { // smooth_sweep
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } 
    else {
      // MULTI-STOP DOTCOM ROUTING ALERTS
      if (selectedPreset === 'staccato_loop') {
        [0, 0.06, 0.12].forEach((delay, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = 698.46 - (idx * 60); // F5 -> descending tone loop
          
          gainNode.gain.setValueAtTime(0.03, now + delay);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start(now + delay);
          osc.stop(now + delay + 0.05);
        });
      } else if (selectedPreset === 'bass_hub') {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now); // Low A2
        osc.frequency.setValueAtTime(130, now + 0.1);
        
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else { // elevator_ping
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1318.51, now); // E6
        
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    }
  } catch (e) {
    console.error('Spark Offer Alert Playback error:', e);
  }
}

// Play premium Web Audio synth alert specifically for Webex bot events
export function playWebexAlert(type: 'disconnected' | 'high_latency') {
  try {
    if (isMasterMuted()) {
      return;
    }

    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    if (type === 'disconnected') {
      // Alarm/Siren or distinct warning buzz: descending dual-voice buzzes
      [0, 0.15].forEach((delay) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(220, now + delay);
        osc1.frequency.linearRampToValueAtTime(140, now + delay + 0.12);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(222, now + delay);
        osc2.frequency.linearRampToValueAtTime(142, now + delay + 0.12);

        gainNode.gain.setValueAtTime(0.07, now + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now + delay);
        osc2.start(now + delay);
        osc1.stop(now + delay + 0.15);
        osc2.stop(now + delay + 0.15);
      });
    } else {
      // High latency alert: short fast warning pips
      [0, 0.08, 0.16].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now + delay); // B5 high alert-beep

        gainNode.gain.setValueAtTime(0.05, now + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.07);
      });
    }
  } catch (e) {
    console.error('Webex alert playback error:', e);
  }
}
