import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEME_PRESETS, applyThemePreset } from './ThemeCustomizer';
import { safeStorage as localStorage } from '../lib/safeStorage';

interface HeaderThemeSwitcherProps {
  className?: string;
  compact?: boolean;
}

export default function HeaderThemeSwitcher({ className = '', compact = false }: HeaderThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    return localStorage.getItem('hgt_theme_preset_id') || 'cyberpunk';
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (presetId: string) => {
    setActivePresetId(presetId);
    localStorage.setItem('hgt_theme_preset_id', presetId);
    applyThemePreset(presetId);
    setIsOpen(false);
  };

  const currentPreset = THEME_PRESETS.find(p => p.id === activePresetId) || THEME_PRESETS[0];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        id="btn-header-theme-switcher"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-cyan-500/40 rounded-lg text-xs font-mono text-neutral-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
        title="Toggle custom color palette presets"
      >
        <Palette className="w-3.5 h-3.5 text-cyan-400" />
        {!compact && (
          <span className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full border border-white/30 inline-block shrink-0"
              style={{ backgroundColor: currentPreset.accentColor }}
            />
            {currentPreset.name}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-[1100] p-2 space-y-1 font-mono text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-1.5 border-b border-neutral-900 flex items-center justify-between text-[9px] text-neutral-500 uppercase font-bold tracking-wider">
            <span>Color Palettes</span>
            <span className="text-cyan-400">5 Presets</span>
          </div>

          {THEME_PRESETS.map((preset) => {
            const isSelected = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`w-full p-2 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer border ${
                  isSelected
                    ? 'bg-neutral-900 border-cyan-500/50 text-white'
                    : 'bg-neutral-950/60 hover:bg-neutral-900/80 border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0 shadow-sm"
                    style={{ backgroundColor: preset.accentColor }}
                  />
                  <div>
                    <div className="text-[11px] font-bold leading-none">{preset.name}</div>
                    <div className="text-[8.5px] text-neutral-500 mt-1 font-sans truncate max-w-[140px]">
                      {preset.description}
                    </div>
                  </div>
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
