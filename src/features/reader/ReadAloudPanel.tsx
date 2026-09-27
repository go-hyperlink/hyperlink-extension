import React, { useState, useEffect, useRef } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { ttsService, TTSVoiceOption } from '../../services/speech/ttsService';
import { readerModeService } from '../../services/reader/readerModeService';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sliders, 
  FileText, 
  MousePointer, 
  Sparkles,
  Check
} from 'lucide-react';

export const ReadAloudPanel: React.FC = () => {
  const { pageContext, featureProps, addToast } = useHyperlink();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const [voices, setVoices] = useState<TTSVoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [mode, setMode] = useState<'selection' | 'article' | 'page'>('article');
  
  // Sentence queue state
  const [sentences, setSentences] = useState<string[]>([]);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);
  const [highlightWord, setHighlightWord] = useState<string>('');

  const activeSentenceRef = useRef<HTMLDivElement | null>(null);

  // Load available system voices
  useEffect(() => {
    const loadVoices = () => {
      const v = ttsService.getVoices();
      setVoices(v);
      if (v.length > 0 && !selectedVoice) {
        // Try to pick a natural or English voice as default
        const natural = v.find(item => item.name.includes('Natural') || item.name.includes('Google') || item.lang.startsWith('en'));
        setSelectedVoice(natural ? natural.name : v[0].name);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      ttsService.stop();
    };
  }, []);

  // Prepare text content based on selected scope
  const prepareSentences = (targetMode = mode, customText?: string) => {
    let rawText = '';
    if (customText) {
      rawText = customText;
    } else if (targetMode === 'selection' && pageContext.selectedText) {
      rawText = pageContext.selectedText;
    } else if (targetMode === 'article') {
      const art = readerModeService.extractArticle();
      rawText = art.textContent || ttsService.extractCleanReadableText();
    } else {
      rawText = ttsService.extractCleanReadableText();
    }

    const s = ttsService.splitIntoSentences(rawText);
    setSentences(s);
    setActiveSentenceIndex(0);
    return s;
  };

  // Initial load or handle incoming featureProps
  useEffect(() => {
    if (featureProps.text) {
      setMode('selection');
      const s = prepareSentences('selection', featureProps.text);
      if (featureProps.autoPlay && s.length > 0) {
        startPlayback(s, 0);
      }
    } else if (pageContext.selectedText) {
      setMode('selection');
      prepareSentences('selection');
    } else {
      setMode('article');
      prepareSentences('article');
    }
  }, [featureProps.text, featureProps.autoPlay, featureProps._ts]);

  // Keep active sentence scrolled into view
  useEffect(() => {
    if (activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeSentenceIndex]);

  const startPlayback = (sentenceList = sentences, startIndex = activeSentenceIndex) => {
    if (sentenceList.length === 0) {
      addToast('No text available to read aloud', 'warning');
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);

    ttsService.speakQueue(sentenceList, startIndex, {
      rate,
      voiceName: selectedVoice,
      onSentenceChange: (idx, text) => {
        setActiveSentenceIndex(idx);
        setHighlightWord('');
      },
      onBoundary: (charIndex, charLength, sentenceText) => {
        const word = sentenceText.substring(charIndex, charIndex + (charLength || 6));
        setHighlightWord(word.trim());
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveSentenceIndex(0);
        setHighlightWord('');
        addToast('Finished reading', 'info');
      },
      onError: () => {
        setIsPlaying(false);
        setIsPaused(false);
      }
    });
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      startPlayback(sentences, activeSentenceIndex);
    } else if (isPaused) {
      ttsService.resume();
      setIsPaused(false);
    } else {
      ttsService.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    ttsService.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentenceIndex(0);
    setHighlightWord('');
  };

  const handleSkipPrev = () => {
    if (activeSentenceIndex > 0) {
      const newIndex = activeSentenceIndex - 1;
      setActiveSentenceIndex(newIndex);
      if (isPlaying) {
        ttsService.jumpToSentence(newIndex);
      }
    }
  };

  const handleSkipNext = () => {
    if (activeSentenceIndex + 1 < sentences.length) {
      const newIndex = activeSentenceIndex + 1;
      setActiveSentenceIndex(newIndex);
      if (isPlaying) {
        ttsService.jumpToSentence(newIndex);
      }
    }
  };

  const handleSelectSentence = (index: number) => {
    setActiveSentenceIndex(index);
    if (isPlaying) {
      ttsService.jumpToSentence(index);
    } else {
      startPlayback(sentences, index);
    }
  };

  const handleModeChange = (newMode: 'selection' | 'article' | 'page') => {
    handleStop();
    setMode(newMode);
    prepareSentences(newMode);
  };

  const handleSpeedChange = (newRate: number) => {
    setRate(newRate);
    ttsService.setRate(newRate);
  };

  const progressPercent = sentences.length > 0 
    ? Math.round(((activeSentenceIndex + 1) / sentences.length) * 100)
    : 0;

  return (
    <PanelContainer
      title="Read Aloud"
      iconName="Volume2"
      subtitle={sentences.length > 0 ? `${sentences.length} sentences ready` : 'Text-to-speech reader'}
      headerActions={
        <button
          onClick={() => prepareSentences(mode)}
          title="Reload Page Text"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="space-y-4">
        {/* Source Scope Selection Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] rounded-xl border border-white/5">
          {pageContext.selectedText && (
            <button
              onClick={() => handleModeChange('selection')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'selection'
                  ? 'bg-sky-500/25 border border-sky-400/40 text-sky-200 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MousePointer className="w-3 h-3 text-sky-400" />
              <span>Selection</span>
            </button>
          )}

          <button
            onClick={() => handleModeChange('article')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'article'
                ? 'bg-sky-500/25 border border-sky-400/40 text-sky-200 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Article Text</span>
          </button>

          <button
            onClick={() => handleModeChange('page')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'page'
                ? 'bg-sky-500/25 border border-sky-400/40 text-sky-200 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3 h-3 text-sky-400" />
            <span>Full Page</span>
          </button>
        </div>

        {/* HERO PLAYER CARD */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 space-y-4 shadow-xl">
          {/* Progress Bar & Status Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-semibold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPlaying && !isPaused ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                {isPlaying 
                  ? isPaused 
                    ? 'Paused' 
                    : 'Speaking...' 
                  : 'Ready'}
              </span>
              <span className="font-mono text-sky-400 text-xs">
                {sentences.length > 0 ? `${activeSentenceIndex + 1} / ${sentences.length}` : '0 / 0'} ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Active Speaking Sentence Banner */}
          <div className="min-h-[56px] p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
            <Volume2 className={`w-4 h-4 mt-0.5 shrink-0 ${isPlaying && !isPaused ? 'text-sky-400 animate-pulse' : 'text-slate-500'}`} />
            <div className="min-w-0 flex-1">
              {sentences.length > 0 ? (
                <p className="text-xs text-slate-100 font-medium leading-relaxed">
                  {sentences[activeSentenceIndex] || 'Select play to start.'}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic">No sentences found on this page.</p>
              )}
            </div>
          </div>

          {/* Primary Audio Transport Controls */}
          <div className="flex items-center justify-center gap-4 pt-1">
            {/* Previous Sentence */}
            <button
              onClick={handleSkipPrev}
              disabled={activeSentenceIndex <= 0 || sentences.length === 0}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Previous sentence"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              onClick={handlePlayPause}
              disabled={sentences.length === 0}
              className="w-13 h-13 rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer"
              title={isPlaying && !isPaused ? 'Pause' : 'Play'}
            >
              {isPlaying && !isPaused ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            {/* Next Sentence */}
            <button
              onClick={handleSkipNext}
              disabled={activeSentenceIndex >= sentences.length - 1 || sentences.length === 0}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Next sentence"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Stop Button */}
            <button
              onClick={handleStop}
              disabled={!isPlaying && activeSentenceIndex === 0}
              className="p-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Stop & reset"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Speed Quick Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Speech Speed</span>
            <span className="font-mono text-sky-400 text-xs">{rate}x</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((speedVal) => (
              <button
                key={speedVal}
                onClick={() => handleSpeedChange(speedVal)}
                className={`py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  rate === speedVal
                    ? 'bg-sky-500/25 border border-sky-400/40 text-sky-200 font-bold'
                    : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {speedVal === 1.0 ? '1x Normal' : `${speedVal}x`}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Selector */}
        {voices.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Voice Synthesis</label>
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                ttsService.setVoice(e.target.value);
              }}
              className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400 cursor-pointer"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name} className="bg-slate-900 text-white">
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Interactive Sentence Transcript (Click any sentence to listen from there) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Transcript (Click to jump)</span>
            <span>{sentences.length} sentences</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-xl bg-black/30 border border-white/10 text-xs">
            {sentences.length === 0 ? (
              <div className="text-center py-6 text-slate-500">No sentences found</div>
            ) : (
              sentences.map((sent, idx) => {
                const isCurrent = idx === activeSentenceIndex;
                return (
                  <div
                    key={idx}
                    ref={isCurrent ? activeSentenceRef : null}
                    onClick={() => handleSelectSentence(idx)}
                    className={`p-2 rounded-lg cursor-pointer transition-all leading-relaxed ${
                      isCurrent
                        ? 'bg-sky-500/20 border border-sky-400/40 text-white font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-slate-500 mr-1.5">
                      #{idx + 1}
                    </span>
                    <span>{sent}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PanelContainer>
  );
};
