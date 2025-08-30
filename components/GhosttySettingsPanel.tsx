/**
 * Simplified Settings Panel for Ghostty-style ASCII conversion
 * Focuses on essential options while maintaining authentic Ghostty behavior
 */

'use client';

import { ConversionSettings } from '@/lib/types';

interface GhosttySettingsPanelProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
  disabled: boolean;
}

export default function GhosttySettingsPanel({
  settings,
  onSettingsChange,
  disabled
}: GhosttySettingsPanelProps) {
  const updateSetting = <K extends keyof ConversionSettings>(
    key: K,
    value: ConversionSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Ghostty Conversion Settings</h3>
        <div className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
          Authentic Ghostty Algorithm
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Frame Rate - Core Ghostty setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frame Rate
          </label>
          <div className="flex space-x-4">
            {[12, 24].map((fps) => (
              <label key={fps} className="flex items-center">
                <input
                  type="radio"
                  name="frameRate"
                  value={fps}
                  checked={settings.frameRate === fps}
                  onChange={(e) => updateSetting('frameRate', parseInt(e.target.value) as 12 | 24)}
                  disabled={disabled}
                  className="mr-2 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  {fps} FPS {fps === 24 && <span className="text-xs text-blue-600">(Ghostty default)</span>}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher FPS provides smoother animation but increases processing time
          </p>
        </div>

        {/* Resolution Scale - Performance optimization */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolution Scale
          </label>
          <div className="flex space-x-4">
            {[
              { value: 0.5, label: '50%', desc: 'Fast' },
              { value: 0.75, label: '75%', desc: 'Balanced' },
              { value: 1.0, label: '100%', desc: 'Full Quality' }
            ].map(({ value, label, desc }) => (
              <label key={value} className="flex items-center">
                <input
                  type="radio"
                  name="resolutionScale"
                  value={value}
                  checked={settings.resolutionScale === value}
                  onChange={(e) => updateSetting('resolutionScale', parseFloat(e.target.value) as 0.5 | 0.75 | 1.0)}
                  disabled={disabled}
                  className="mr-2 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  {label} <span className="text-xs text-gray-500">({desc})</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Lower resolution processes faster while maintaining the Ghostty character mapping
          </p>
        </div>

        {/* Color Mode - Simplified options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Mode
          </label>
          <div className="space-y-3">
            {[
              { 
                value: 'blackwhite', 
                label: 'Classic ASCII', 
                desc: 'Pure monochrome ASCII art with Ghostty character mapping' 
              },
              { 
                value: 'twotone', 
                label: 'Two-Tone', 
                desc: 'Blue highlights for detected colors (authentic Ghostty style)' 
              },
              { 
                value: 'fullcolor', 
                label: 'Full Color', 
                desc: 'Preserve original colors with ASCII characters' 
              }
            ].map(({ value, label, desc }) => (
              <label key={value} className="flex items-start">
                <input
                  type="radio"
                  name="colorMode"
                  value={value}
                  checked={settings.colorMode === value}
                  onChange={(e) => updateSetting('colorMode', e.target.value as 'blackwhite' | 'twotone' | 'fullcolor')}
                  disabled={disabled}
                  className="mr-3 mt-0.5 text-blue-600"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Two-tone color picker - only show when two-tone is selected */}
        {settings.colorMode === 'twotone' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Two-Tone Colors
            </label>
            <div className="flex space-x-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dark Color</label>
                <input
                  type="color"
                  value={settings.twoToneColors?.[0] || '#000000'}
                  onChange={(e) => {
                    const newColors: [string, string] = [
                      e.target.value,
                      settings.twoToneColors?.[1] || '#0066ff'
                    ];
                    updateSetting('twoToneColors', newColors);
                  }}
                  disabled={disabled}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Blue Highlight</label>
                <input
                  type="color"
                  value={settings.twoToneColors?.[1] || '#0066ff'}
                  onChange={(e) => {
                    const newColors: [string, string] = [
                      settings.twoToneColors?.[0] || '#000000',
                      e.target.value
                    ];
                    updateSetting('twoToneColors', newColors);
                  }}
                  disabled={disabled}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Blue highlights will be applied to colors detected by Ghostty's algorithm
            </p>
          </div>
        )}

        {/* Background - Simple option */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background
          </label>
          <div className="flex space-x-4">
            {[
              { value: 'transparent', label: 'Transparent' },
              { value: 'black', label: 'Black' },
              { value: 'white', label: 'White' }
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="radio"
                  name="background"
                  value={value}
                  checked={settings.background === value}
                  onChange={(e) => updateSetting('background', e.target.value as 'transparent' | 'black' | 'white')}
                  disabled={disabled}
                  className="mr-2 text-blue-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ghostty Algorithm Info */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Ghostty Algorithm Details</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Character Set:</strong> ·~ox+=*%$@ (luminance-based mapping)</p>
            <p><strong>Color Detection:</strong> Manhattan distance for blue (0,0,230) and white (215,215,215)</p>
            <p><strong>Output:</strong> 100 columns max, 0.44 font ratio for proper terminal display</p>
            <p><strong>Luminance Formula:</strong> 0.2126*R + 0.7152*G + 0.0722*B</p>
          </div>
        </div>
      </div>
    </div>
  );
}