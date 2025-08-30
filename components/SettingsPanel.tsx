'use client';

import { SettingsPanelProps, ConversionSettings } from '@/lib/types';

export default function SettingsPanel({
  settings,
  onSettingsChange,
  disabled
}: SettingsPanelProps) {
  const updateSetting = <K extends keyof ConversionSettings>(
    key: K,
    value: ConversionSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleColorChange = (index: 0 | 1, color: string) => {
    if (settings.twoToneColors) {
      const newColors: [string, string] = [...settings.twoToneColors];
      newColors[index] = color;
      updateSetting('twoToneColors', newColors);
    } else {
      updateSetting('twoToneColors', index === 0 ? [color, '#ffffff'] : ['#000000', color]);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Settings</h3>
      
      <div className="space-y-6">
        {/* Frame Rate */}
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
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{fps} FPS</span>
              </label>
            ))}
          </div>
        </div>

        {/* Resolution Scale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolution Scale
          </label>
          <div className="flex space-x-4">
            {[
              { value: 0.5, label: '50%' },
              { value: 0.75, label: '75%' },
              { value: 1.0, label: '100%' }
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="radio"
                  name="resolutionScale"
                  value={value}
                  checked={settings.resolutionScale === value}
                  onChange={(e) => updateSetting('resolutionScale', parseFloat(e.target.value) as 0.5 | 0.75 | 1.0)}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Character Set */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Character Set
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="characterSet"
                value="default"
                checked={settings.characterSet === 'default'}
                onChange={(e) => updateSetting('characterSet', e.target.value as 'default')}
                disabled={disabled}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Default ( .:-=+*#%@)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="characterSet"
                value="custom"
                checked={settings.characterSet === 'custom'}
                onChange={(e) => updateSetting('characterSet', e.target.value as 'custom')}
                disabled={disabled}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Custom</span>
            </label>
            
            {settings.characterSet === 'custom' && (
              <input
                type="text"
                placeholder="Enter custom characters (e.g., .oO@)"
                value={settings.customCharacters || ''}
                onChange={(e) => updateSetting('customCharacters', e.target.value)}
                disabled={disabled}
                className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                maxLength={50}
              />
            )}
          </div>
        </div>

        {/* Color Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Mode
          </label>
          <div className="space-y-3">
            {[
              { value: 'blackwhite', label: 'Black & White' },
              { value: 'twotone', label: 'Two-tone' },
              { value: 'fullcolor', label: 'Full-color approximation' }
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="radio"
                  name="colorMode"
                  value={value}
                  checked={settings.colorMode === value}
                  onChange={(e) => updateSetting('colorMode', e.target.value as 'blackwhite' | 'twotone' | 'fullcolor')}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          
          {settings.colorMode === 'twotone' && (
            <div className="mt-3 flex space-x-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Color 1</label>
                <input
                  type="color"
                  value={settings.twoToneColors?.[0] || '#000000'}
                  onChange={(e) => handleColorChange(0, e.target.value)}
                  disabled={disabled}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Color 2</label>
                <input
                  type="color"
                  value={settings.twoToneColors?.[1] || '#ffffff'}
                  onChange={(e) => handleColorChange(1, e.target.value)}
                  disabled={disabled}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Background */}
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
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}