import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { recordingService, RecordedVideoData, RecordingStatus } from '../../services/capture/recordingService';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';

export const RecorderPanel: React.FC = () => {
  const { pageContext, openFeatureWithProps, showToast } = useHyperlink();
  const [status, setStatus] = useState<RecordingStatus>(recordingService.getStatus());
  const [elapsed, setElapsed] = useState<number>(recordingService.getElapsedSeconds());
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [recordedData, setRecordedData] = useState<RecordedVideoData | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = recordingService.subscribe((newStatus, newElapsed) => {
      setStatus(newStatus);
      setElapsed(newElapsed);
      if (newStatus === 'idle') {
        setIsMinimized(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async (mode: 'tab' | 'screen' | 'window') => {
    setRecordedData(null);
    const ok = await recordingService.startRecording({
      mode,
      mic: micEnabled,
      audio: audioEnabled,
      cursor: 'always'
    });

    if (ok) {
      setIsMinimized(true);
      showToast({
        type: 'info',
        title: 'Recording Active',
        message: 'Hyperlink minimized to a floating pill so your screen view is clean.'
      });
    } else {
      showToast({
        type: 'warning',
        title: 'Recording Not Started',
        message: 'Permission was cancelled or unsupported on this system.'
      });
    }
  };

  const handleStop = async () => {
    const result = await recordingService.stopRecording();
    setIsMinimized(false);
    if (result) {
      setRecordedData(result);
      showToast({ type: 'success', title: 'Recording Complete' });
    }
  };

  const handleDownload = () => {
    if (!recordedData) return;
    recordingService.downloadRecording(
      recordedData.blob,
      `hyperlink-recording-${Date.now()}.webm`
    );
    showToast({ type: 'success', title: 'Downloading Recording' });
  };

  const handleSave = () => {
    if (!recordedData) return;
    openFeatureWithProps('save', {
      type: 'transcript',
      title: `Recording of ${pageContext.title}`,
      initialText: `Recorded video (${formatTimer(recordedData.duration)}) on ${pageContext.url}`
    });
  };

  // Minimized Floating Pill Mode while recording
  if (isMinimized && (status === 'recording' || status === 'paused')) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2147483647] flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#0a0e18]/95 backdrop-blur-2xl border border-rose-500/50 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(244,63,94,0.3)] text-white select-none animate-fade-in">
        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
        <span className="text-sm font-mono font-bold tracking-wider">{formatTimer(elapsed)}</span>
        <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">
          {status === 'recording' ? 'REC' : 'PAUSED'}
        </span>

        <div className="h-4 w-px bg-white/20 mx-1" />

        <button
          onClick={() => status === 'recording' ? recordingService.pauseRecording() : recordingService.resumeRecording()}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={status === 'recording' ? 'Pause Recording' : 'Resume Recording'}
        >
          <HyperlinkIcon name={status === 'recording' ? 'Pause' : 'Play'} size={14} />
        </button>

        <button
          onClick={handleStop}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/40 transition-all cursor-pointer"
          title="Stop Recording & Open Preview"
        >
          <span className="w-2.5 h-2.5 bg-white rounded-xs" />
          <span>Stop</span>
        </button>

        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer ml-1"
          title="Expand Panel"
        >
          <HyperlinkIcon name="Maximize2" size={14} />
        </button>
      </div>
    );
  }

  return (
    <PanelContainer
      title="Screen Recorder"
      iconName="Video"
      subtitle="High-fidelity tab & screen recording"
    >
      <div className="space-y-4">
        {status === 'idle' && !recordedData && (
          <div className="space-y-4">
            <span className="text-xs font-semibold text-slate-300">Target Mode:</span>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleStart('tab')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 text-slate-200 transition-all duration-150 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-all mb-2">
                  <HyperlinkIcon name="Layers" size={20} />
                </div>
                <span className="text-xs font-semibold">Current Tab</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Isolated browser view</span>
              </button>

              <button
                onClick={() => handleStart('screen')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 text-slate-200 transition-all duration-150 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-all mb-2">
                  <HyperlinkIcon name="Monitor" size={20} />
                </div>
                <span className="text-xs font-semibold">Entire Screen</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Full display desktop</span>
              </button>
            </div>

            {/* Audio Options */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Audio Stream Inputs
              </span>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-slate-300 flex items-center gap-2">
                  <HyperlinkIcon name="Mic" size={14} className="text-cyan-400" />
                  Microphone Narration
                </span>
                <input
                  type="checkbox"
                  checked={micEnabled}
                  onChange={(e) => setMicEnabled(e.target.checked)}
                  className="rounded accent-cyan-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-slate-300 flex items-center gap-2">
                  <HyperlinkIcon name="Volume2" size={14} className="text-emerald-400" />
                  System / Tab Audio
                </span>
                <input
                  type="checkbox"
                  checked={audioEnabled}
                  onChange={(e) => setAudioEnabled(e.target.checked)}
                  className="rounded accent-cyan-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Active Recording State (Expanded) */}
        {(status === 'recording' || status === 'paused') && (
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-2xl font-mono font-bold text-white tracking-widest">
                {formatTimer(elapsed)}
              </span>
            </div>

            <p className="text-xs text-slate-300">
              {status === 'recording' ? 'Capturing screen and audio...' : 'Recording paused'}
            </p>

            <div className="flex items-center gap-2">
              {status === 'recording' ? (
                <HyperlinkButton
                  onClick={() => recordingService.pauseRecording()}
                  variant="secondary"
                  size="sm"
                  icon="Pause"
                >
                  Pause
                </HyperlinkButton>
              ) : (
                <HyperlinkButton
                  onClick={() => recordingService.resumeRecording()}
                  variant="secondary"
                  size="sm"
                  icon="Play"
                >
                  Resume
                </HyperlinkButton>
              )}

              <HyperlinkButton
                onClick={handleStop}
                variant="danger"
                size="sm"
                icon="Square"
              >
                Stop & Finish
              </HyperlinkButton>
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 mt-2 cursor-pointer"
            >
              <HyperlinkIcon name="Minimize2" size={12} />
              <span>Minimize to floating pill</span>
            </button>
          </div>
        )}

        {/* Completed Recording Preview */}
        {recordedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold px-1">
              <span className="flex items-center gap-1.5">
                <HyperlinkIcon name="Check" size={14} />
                Recording complete
              </span>
              <span className="text-slate-400 font-mono">
                {formatTimer(recordedData.duration)} ({(recordedData.size / (1024 * 1024)).toFixed(1)} MB)
              </span>
            </div>

            <video
              src={recordedData.url}
              controls
              className="w-full rounded-2xl border border-white/10 bg-black/60 max-h-52 object-contain"
            />

            <div className="grid grid-cols-2 gap-2">
              <HyperlinkButton
                onClick={handleDownload}
                variant="primary"
                size="sm"
                icon="Download"
              >
                Download WebM
              </HyperlinkButton>

              <HyperlinkButton
                onClick={handleSave}
                variant="secondary"
                size="sm"
                icon="Bookmark"
              >
                Save to Library
              </HyperlinkButton>
            </div>

            <HyperlinkButton
              onClick={() => setRecordedData(null)}
              variant="ghost"
              size="sm"
              icon="RotateCcw"
              className="w-full"
            >
              Start New Recording
            </HyperlinkButton>
          </div>
        )}
      </div>
    </PanelContainer>
  );
};
