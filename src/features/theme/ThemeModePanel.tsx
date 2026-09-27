import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { themeService, PageThemeConfig, PageThemePreset } from '../../services/theme/themeService';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';
import { RotateCcw, Check, Sliders, Sun, Eye, BookOpen, Moon } from 'lucide-react';

export const ThemeModePanel: React.FC = () => {
  const { pageContext, showToast } = useHyperlink();
  const [config, setConfig] = useState<PageThemeConfig>(themeService.getConfig());

  useEffect(() => {
    return themeService.subscribe((newConfig) => {
      setConfig(newConfig);
    });
  }, []);

  const handleSelectPreset = async (preset: PageThemePreset) => {
    await themeService.setPreset(preset);
    showToast({
      type: 'info',
      title: preset === 'default' ? 'Default Theme Restored' : `${preset.charAt(0).toUpperCase() + preset.slice(1).replace('_', ' ')} Applied`,
      message: `Active on ${pageContext.domain}`,
    });
  };

  const handleSliderChange = async (key: keyof PageThemeConfig, value: number) => {
    await themeService.updateCustom({ [key]: value });
  };

  const handleToggleRemember = async () => {
    const nextVal = !config.rememberForSite;
    await themeService.setRememberForSite(nextVal);
    showToast({
      type: 'success',
      title: nextVal ? 'Remembered for Site' : 'Session Only',
      message: nextVal ? `Will automatically apply on ${pageContext.domain}` : undefined,
    });
  };

  const presets: Array<{
    id: PageThemePreset;
    title: string;
    description: string;
    icon: string;
    previewBg: string;
  }> = [
    {
      id: 'default',
      title: 'Original / Default',
      description: 'Native website styles without modification',
      icon: 'RotateCcw',
      previewBg: 'bg-white/10 text-zinc-300',
    },
    {
      id: 'dark',
      title: 'Smart Dark Mode',
      description: 'Intelligent dark palette with media color protection',
      icon: 'Moon',
      previewBg: 'bg-[#0f131f] text-indigo-300 border border-indigo-500/30',
    },
    {
      id: 'amoled',
      title: 'AMOLED Black',
      description: 'Pure pitch black (#000000) for OLED displays',
      icon: 'Zap',
      previewBg: 'bg-black text-white border border-white/20',
    },
    {
      id: 'sepia',
      title: 'Sepia Reading Mode',
      description: 'Warm paper tint for relaxed long-form reading',
      icon: 'BookOpen',
      previewBg: 'bg-[#f6efe2] text-[#433422] border border-amber-400/40',
    },
    {
      id: 'midnight',
      title: 'Midnight Blue',
      description: 'Deep navy cyberpunk atmosphere for night browsing',
      icon: 'Sparkles',
      previewBg: 'bg-[#070d1e] text-blue-200 border border-blue-500/30',
    },
    {
      id: 'high_contrast',
      title: 'High Contrast',
      description: 'Sharp crisp contrast for maximum text legibility',
      icon: 'Eye',
      previewBg: 'bg-white text-black font-bold border border-emerald-500/40',
    },
    {
      id: 'grayscale',
      title: 'Grayscale Focus',
      description: 'Monochrome view to remove visual noise & distraction',
      icon: 'Filter',
      previewBg: 'bg-zinc-800 text-zinc-300 border border-zinc-600',
    },
  ];

  return (
    <PanelContainer
      title="Page Theme Studio"
      iconName="Palette"
      subtitle={`Live website appearance for ${pageContext.domain}`}
    >
      <div className="space-y-4 text-xs">
        {/* Active Domain Indicator & Site Memory Switch */}
        <div className="flex items-center justify-between p-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="font-semibold text-zinc-300">
              Site: <strong className="font-mono text-white">{pageContext.domain}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleRemember}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              config.rememberForSite
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shadow-sm shadow-indigo-500/10'
                : 'bg-white/[0.04] text-zinc-400 border border-white/[0.08] hover:text-zinc-200'
            }`}
          >
            {config.rememberForSite ? <Check size={12} /> : null}
            <span>{config.rememberForSite ? 'Saved for site' : 'Session only'}</span>
          </button>
        </div>

        {/* Presets Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-bold px-0.5 text-zinc-300">
            <span>Theme Presets</span>
            {config.preset !== 'default' && (
              <button
                type="button"
                onClick={() => handleSelectPreset('default')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <RotateCcw size={11} />
                <span>Reset Original</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {presets.map((preset) => {
              const isSelected = config.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-150 text-left border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-500/[0.12] border-indigo-400/50 shadow-md shadow-indigo-500/10'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 shadow-sm ${preset.previewBg}`}>
                      <HyperlinkIcon name={preset.icon} size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                          {preset.title}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 text-[9px] rounded-md uppercase font-mono tracking-wider font-bold bg-indigo-400/20 text-indigo-300 border border-indigo-400/40">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 text-zinc-400">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isSelected
                      ? 'text-indigo-300 bg-indigo-500/20 border border-indigo-400/30'
                      : 'text-zinc-500'
                  }`}>
                    {isSelected ? <Check size={13} /> : <HyperlinkIcon name="ChevronRight" size={13} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fine-Tuning Custom Controls */}
        <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="font-bold flex items-center gap-1.5 text-zinc-200">
              <Sliders size={13} className="text-indigo-400" />
              <span>Fine-Tuning Controls</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Realtime CSS Filter</span>
          </div>

          {/* Brightness Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
              <span className="flex items-center gap-1">
                <Sun size={12} className="text-amber-400" />
                <span>Brightness</span>
              </span>
              <span className="font-mono text-indigo-400 font-bold">{config.brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={config.brightness}
              onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
              className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Contrast Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
              <span className="flex items-center gap-1">
                <Eye size={12} className="text-emerald-400" />
                <span>Contrast</span>
              </span>
              <span className="font-mono text-indigo-400 font-bold">{config.contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={config.contrast}
              onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
              className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Sepia / Warmth Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
              <span className="flex items-center gap-1">
                <BookOpen size={12} className="text-amber-500" />
                <span>Warmth / Sepia</span>
              </span>
              <span className="font-mono text-indigo-400 font-bold">{config.sepia}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.sepia}
              onChange={(e) => handleSliderChange('sepia', Number(e.target.value))}
              className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Invert Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
              <span className="flex items-center gap-1">
                <Moon size={12} className="text-indigo-400" />
                <span>Invert Colors</span>
              </span>
              <span className="font-mono text-indigo-400 font-bold">{config.invert}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.invert}
              onChange={(e) => handleSliderChange('invert', Number(e.target.value))}
              className="w-full h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>
    </PanelContainer>
  );
};

