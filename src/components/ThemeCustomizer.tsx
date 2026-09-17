import React, { useState, useEffect } from 'react';
import { safeStorage as localStorage } from '../lib/safeStorage';
import { Palette, Check, Sparkles, RefreshCw } from 'lucide-react';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  bgDark: string;
  cardBg: string;
  borderColor: string;
  textColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Signature glowing cyan accents over deep cyber-glass containers',
    accentColor: '#00f2ff',
    bgDark: '#0a0a0c',
    cardBg: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(0, 242, 255, 0.25)',
    textColor: '#00f2ff'
  },
  {
    id: 'high-contrast',
    name: 'High Contrast Gold',
    description: 'Ultra-sharp pitch black background with vivid neon yellow indicators',
    accentColor: '#ffee00',
    bgDark: '#000000',
    cardBg: '#111111',
    borderColor: '#ffee00',
    textColor: '#ffee00'
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Deep electric navy slate paired with intense cobalt blue highlights',
    accentColor: '#3a86ff',
    bgDark: '#070d1e',
    cardBg: '#0f172a',
    borderColor: '#1e293b',
    textColor: '#38bdf8'
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    description: 'Tactical terminal obsidian frame with high-yield green indicators',
    accentColor: '#10b981',
    bgDark: '#03120e',
    cardBg: '#062019',
    borderColor: '#059669',
    textColor: '#34d399'
  },
  {
    id: 'sunset-crimson',
    name: 'Sunset Crimson',
    description: 'Dark velvet obsidian with fiery crimson order dispatch highlights',
    accentColor: '#f43f5e',
    bgDark: '#12070a',
    cardBg: '#210c12',
    borderColor: '#e11d48',
    textColor: '#fb7185'
  }
];

export function applyThemePreset(presetId: string) {
  const preset = THEME_PRESETS.find(p => p.id === presetId) || THEME_PRESETS[0];
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme-preset', preset.id);
    document.documentElement.style.setProperty('--theme-accent', preset.accentColor);
    document.documentElement.style.setProperty('--theme-bg-dark', preset.bgDark);
    document.documentElement.style.setProperty('--theme-card-bg', preset.cardBg);
    document.documentElement.style.setProperty('--theme-border', preset.borderColor);
    document.documentElement.style.setProperty('--theme-text', preset.textColor);
  }
}

interface ThemeCustomizerProps {
  onAddLog?: (type: any, msg: string, offerId?: string, badge?: string) => void;
}

export default function ThemeCustomizer({ onAddLog }: ThemeCustomizerProps) {
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    return localStorage.getItem('hgt_theme_preset_id') || 'cyberpunk';
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    applyThemePreset(activePresetId);
  }, [activePresetId]);

  const handleSelectPreset = (preset: ThemePreset) => {
    setActivePresetId(preset.id);
    localStorage.setItem('hgt_theme_preset_id', preset.id);
    applyThemePreset(preset.id);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);

    if (onAddLog) {
      onAddLog('info', `🎨 THEME BRANDING: UI preset updated to "${preset.name}" (${preset.accentColor}). Saved to local storage.`, undefined, 'THEME_UPDATE');
    }
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-xl">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-sans font-bold text-white uppercase tracking-wider">UI Theme & Branding Profiles</h3>
        </div>
        <span className="text-[9px] font-mono text-neutral-400 bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded">
          Saved in Local Storage
        </span>
      </div>

      <p className="text-xs text-neutral-400 mb-4 font-sans leading-relaxed">
        Personalize your HGT Multi-Bot interface. Choose a color profile preset to customize status indicators, charts, glow effects, and borders across the entire hub.
      </p>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {THEME_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-full relative overflow-hidden group ${
                isSelected 
                  ? 'bg-neutral-950 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
              }`}
            >
              <div>
                {/* Color Swatches */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div 
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0" 
                    style={{ backgroundColor: preset.accentColor }} 
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0" 
                    style={{ backgroundColor: preset.bgDark }} 
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0" 
                    style={{ backgroundColor: preset.borderColor }} 
                  />
                </div>

                <h4 className="text-xs font-mono font-bold text-white group-hover:text-amber-400 transition-colors">
                  {preset.name}
                </h4>
                <p className="text-[9px] text-neutral-500 font-sans mt-1 leading-normal">
                  {preset.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-900 flex items-center justify-between">
                <span className="text-[8px] font-mono text-neutral-500 uppercase">
                  {preset.accentColor}
                </span>
                {isSelected && (
                  <span className="flex items-center gap-1 text-[8px] font-mono text-amber-400 font-bold">
                    <Check className="w-3 h-3" /> ACTIVE
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="mt-3 p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Theme preset saved into local storage! UI branding synchronized across all modules.</span>
        </div>
      )}
    </div>
  );
}
