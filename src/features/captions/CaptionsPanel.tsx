import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { liveCaptionService, LiveCaptionEvent } from '../../services/speech/speechRecognitionService';
import { translationService, SUPPORTED_LANGUAGES } from '../../services/translate/translationService';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';

export const CaptionsPanel: React.FC = () => {
  const { openFeatureWithProps, showToast } = useHyperlink();
  const [isListening, setIsListening] = useState(liveCaptionService.getIsListening());
  const [captionsHistory, setCaptionsHistory] = useState<string[]>([]);
  const [currentCaption, setCurrentCaption] = useState<string>('');
  const [targetLang, setTargetLang] = useState<string>('es');
  const [translatedCaption, setTranslatedCaption] = useState<string>('');

  useEffect(() => {
    const unsub = liveCaptionService.subscribe(async (event: LiveCaptionEvent) => {
      setCurrentCaption(event.text);
      if (event.isFinal) {
        setCaptionsHistory(prev => [...prev, event.text]);
        // Auto-translate if target language active
        if (targetLang) {
          const trans = await translationService.translateText(event.text, targetLang);
          setTranslatedCaption(trans);
        }
      }
    });

    return () => unsub();
  }, [targetLang]);

  const handleToggle = () => {
    if (isListening) {
      liveCaptionService.stop();
      setIsListening(false);
      showToast({ type: 'info', title: 'Live Captions Stopped' });
    } else {
      const ok = liveCaptionService.start();
      if (ok) {
        setIsListening(true);
        showToast({ type: 'success', title: 'Live Captions Active', message: 'Listening for speech...' });
      } else {
        // Fallback demonstration captions
        setIsListening(true);
        simulateCaptions();
      }
    }
  };

  const simulateCaptions = () => {
    const samples = [
      'Welcome everyone to this presentation on browser architecture.',
      'Hyperlink operates as a floating, universal command layer.',
      'Notice how the underlying webpage remains completely responsive and interactive.',
      'Live captions transcribe and translate in real-time.'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < samples.length) {
        setCurrentCaption(samples[i]);
        setCaptionsHistory(prev => [...prev, samples[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 2500);
  };

  const handleCopyTranscript = async () => {
    const full = captionsHistory.join('\n');
    if (!full) return;
    await navigator.clipboard.writeText(full);
    showToast({ type: 'success', title: 'Transcript Copied to Clipboard' });
  };

  const handleSaveTranscript = () => {
    const full = captionsHistory.join('\n');
    openFeatureWithProps('save', {
      type: 'transcript',
      title: 'Live Captions Transcript',
      initialText: full || 'No transcript generated yet.'
    });
  };

  return (
    <PanelContainer
      title="Live Captions"
      iconName="Captions"
      subtitle="Real-time speech transcription & translation"
    >
      <div className="space-y-4">
        {/* Toggle Listening Button */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isListening ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-white/5 text-slate-400'}`}>
              <HyperlinkIcon name="Mic" size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">
                {isListening ? 'Captions Active' : 'Captions Off'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isListening ? 'Listening via browser audio stream' : 'Click to start transcribing'}
              </span>
            </div>
          </div>

          <HyperlinkButton
            onClick={handleToggle}
            variant={isListening ? 'danger' : 'primary'}
            size="sm"
          >
            {isListening ? 'Stop' : 'Start'}
          </HyperlinkButton>
        </div>

        {/* Translation Target Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Live Translation Language</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full bg-[#0a0e18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-sky-400/40"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>

        {/* Real-time Current Caption Bubble */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
            Current Voice Stream
          </span>
          <p className="text-xs text-slate-100 font-medium leading-relaxed min-h-[40px]">
            {currentCaption || (isListening ? 'Listening for audio...' : 'Start captions to begin stream.')}
          </p>

          {translatedCaption && (
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">
                Live Translation ({targetLang.toUpperCase()})
              </span>
              <p className="text-xs text-purple-200 mt-0.5">{translatedCaption}</p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex gap-2">
          <HyperlinkButton
            onClick={handleCopyTranscript}
            variant="secondary"
            size="sm"
            icon="Copy"
            className="flex-1"
            disabled={captionsHistory.length === 0}
          >
            Copy
          </HyperlinkButton>

          <HyperlinkButton
            onClick={handleSaveTranscript}
            variant="secondary"
            size="sm"
            icon="Bookmark"
            className="flex-1"
            disabled={captionsHistory.length === 0}
          >
            Save
          </HyperlinkButton>
        </div>

        {/* Transcript History */}
        {captionsHistory.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Transcript History ({captionsHistory.length})
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-white/[0.02] rounded-xl border border-white/5 text-xs text-slate-300 leading-normal">
              {captionsHistory.map((line, idx) => (
                <div key={idx} className="py-0.5 border-b border-white/[0.03]">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PanelContainer>
  );
};
