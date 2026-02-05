'use client';

import { useState } from 'react';
import { OPTIMIZED_CHARACTER_SET, VideoProcessingSettings } from '@/lib/types';

interface VideoSettingsProps {
  settings: VideoProcessingSettings;
  onSettingsChange: (settings: VideoProcessingSettings) => void;
  disabled?: boolean;
}

export default function VideoSettings({ settings, onSettingsChange, disabled }: VideoSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [characterSetError, setCharacterSetError] = useState<string>('');

  const updateSetting = <K extends keyof VideoProcessingSettings>(
    key: K,
    value: VideoProcessingSettings[K]
  ) => {
    // Validate custom character set
    if (key === 'customCharacterSet') {
      const charSet = value as string;
      if (charSet.length < 2) {
        setCharacterSetError('Character set must have at least 2 characters');
      } else if (charSet.length > 100) {
        setCharacterSetError('Character set cannot exceed 100 characters');
      } else if (new Set(charSet).size !== charSet.length) {
        setCharacterSetError('Character set cannot contain duplicate characters');
      } else {
        setCharacterSetError('');
      }
    }
    
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
        disabled={disabled}
      >
        <h3 className="text-sm font-medium text-white font-mono tracking-widest">
          ADVANCED SETTINGS
        </h3>
        <svg
          className={`w-4 h-4 text-white/70 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/80 mb-2 font-mono">
              Width: {settings.width} columns
            </label>
            <input
              type="range"
              min="80"
              max="160"
              step="10"
              value={settings.width}
              onChange={(e) => updateSetting('width', parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-green-400"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1 font-mono">
              <span>80</span>
              <span>120</span>
              <span>160</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-2 font-mono">
              Contrast: {settings.contrast.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.contrast}
              onChange={(e) => updateSetting('contrast', parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-green-400"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1 font-mono">
              <span>0.5</span>
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-2 font-mono">
              Brightness: {settings.brightness > 0 ? '+' : ''}{settings.brightness}
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={settings.brightness}
              onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-green-400"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1 font-mono">
              <span>-50</span>
              <span>0</span>
              <span>+50</span>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                id="useCustomCharacterSet"
                checked={settings.useCustomCharacterSet}
                onChange={(e) => updateSetting('useCustomCharacterSet', e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 text-green-400 bg-black/50 border-white/30 rounded focus:ring-green-400 accent-green-400"
              />
              <label htmlFor="useCustomCharacterSet" className="text-xs font-medium text-white/80 font-mono">
                Use Custom Character Set
              </label>
            </div>

            {settings.useCustomCharacterSet && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-white/80 font-mono">
                      Characters ({settings.customCharacterSet.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => updateSetting('customCharacterSet', OPTIMIZED_CHARACTER_SET)}
                      disabled={disabled}
                      className="text-xs text-green-400 hover:text-green-300 underline font-mono"
                    >
                      Reset
                    </button>
                  </div>
                  <textarea
                    value={settings.customCharacterSet}
                    onChange={(e) => updateSetting('customCharacterSet', e.target.value)}
                    disabled={disabled}
                    placeholder="Enter custom characters (e.g., .:-=+*#%@)"
                    className="w-full px-3 py-2 text-sm border border-white/30 rounded-md bg-black/50 text-white font-mono focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none placeholder:text-white/30"
                    rows={2}
                  />
                  {characterSetError && (
                    <p className="text-xs text-red-400 mt-1 font-mono">{characterSetError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}