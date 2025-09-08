'use client';

import { useState } from 'react';

export interface VideoProcessingSettings {
  contrast: number;
  brightness: number;
  width: number;
}

interface VideoSettingsProps {
  settings: VideoProcessingSettings;
  onSettingsChange: (settings: VideoProcessingSettings) => void;
  disabled?: boolean;
}

export default function VideoSettings({ settings, onSettingsChange, disabled }: VideoSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = <K extends keyof VideoProcessingSettings>(
    key: K,
    value: VideoProcessingSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
        disabled={disabled}
      >
        <h3 className="text-sm font-medium text-gray-900">
          Advanced Settings (Optional)
        </h3>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
            <label className="block text-xs font-medium text-gray-700 mb-2">
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>80 (compact)</span>
              <span>120 (optimal)</span>
              <span>160 (detailed)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5 (soft)</span>
              <span>1.0 (normal)</span>
              <span>2.0 (high)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-50 (darker)</span>
              <span>0 (normal)</span>
              <span>+50 (brighter)</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="text-xs font-medium text-blue-900 mb-1">Tips for Best Results:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Dark videos:</strong> Increase brightness (+20 to +40)</li>
              <li>• <strong>Low contrast videos:</strong> Increase contrast (1.3 to 1.8)</li>
              <li>• <strong>Detailed content:</strong> Use higher width (140-160)</li>
              <li>• <strong>Simple animations:</strong> Use lower width (80-100)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}