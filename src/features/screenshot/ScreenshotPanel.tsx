import React, { useState } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { screenshotService } from '../../services/capture/screenshotService';
import { aiService } from '../../services/ai/AIService';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';
import { MarkdownView } from '../../components/common/MarkdownView';
import { Camera, Crop, Sparkles, Copy, Download, Bookmark, Share2, RotateCcw } from 'lucide-react';

export const ScreenshotPanel: React.FC = () => {
  const { pageContext, openFeatureWithProps, showToast, featureProps } = useHyperlink();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  React.useEffect(() => {
    if (featureProps?.capturedImage) {
      setCapturedImage(featureProps.capturedImage);
    } else if (featureProps?.autoCapture && !capturedImage) {
      handleCaptureViewport();
    }
  }, [featureProps?._ts]);

  const handleCaptureViewport = async () => {
    setLoading(true);
    setAiAnalysis(null);
    try {
      const dataUrl = await screenshotService.captureViewport();
      setCapturedImage(dataUrl);
      showToast({ type: 'success', title: 'Screenshot Captured' });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Capture Failed', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureArea = async () => {
    setLoading(true);
    setAiAnalysis(null);
    try {
      showToast({
        type: 'info',
        title: 'Area Selection Active',
        message: 'Click and drag on the webpage to capture an area. Press ESC to cancel.'
      });
      const dataUrl = await screenshotService.captureAreaInteractive();
      setCapturedImage(dataUrl);
      showToast({ type: 'success', title: 'Selected Area Captured' });
    } catch (e: any) {
      if (e.message && !e.message.includes('cancelled')) {
        showToast({ type: 'info', title: 'Area Capture', message: e.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!capturedImage) return;
    const ok = await screenshotService.copyToClipboard(capturedImage);
    if (ok) {
      showToast({ type: 'success', title: 'Copied to Clipboard' });
    } else {
      showToast({ type: 'warning', title: 'Clipboard Access Restricted' });
    }
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const filename = `hyperlink-${pageContext.domain}-${Date.now()}.png`;
    screenshotService.downloadImage(capturedImage, filename);
    showToast({ type: 'success', title: 'Downloaded Screenshot' });
  };

  const handleAskAI = async (promptText = 'Analyze this screenshot and explain the key elements and text.') => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const result = await aiService.vision(capturedImage, promptText);
      setAiAnalysis(result);
    } catch (e: any) {
      showToast({ type: 'error', title: 'AI Vision Error', message: e.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!capturedImage) return;
    openFeatureWithProps('save', {
      type: 'screenshot',
      title: `Screenshot of ${pageContext.title}`,
      thumbnail: capturedImage,
      initialText: aiAnalysis || 'Screenshot captured on ' + pageContext.url
    });
  };

  const handleShare = async () => {
    if (navigator.share && capturedImage) {
      try {
        const blob = await (await fetch(capturedImage)).blob();
        const file = new File([blob], 'screenshot.png', { type: 'image/png' });
        await navigator.share({
          title: pageContext.title,
          text: 'Captured via Hyperlink',
          files: [file]
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <PanelContainer
      title="Screenshot Studio"
      iconName="Camera"
      subtitle="Capture, annotate, extract text & analyze"
    >
      <div className="space-y-4">
        {/* Capture Mode Triggers */}
        {!capturedImage ? (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-300">Choose Capture Mode:</span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCaptureViewport}
                disabled={loading}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-400/40 text-zinc-200 transition-all duration-150 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all mb-2">
                  <Camera size={20} />
                </div>
                <span className="text-xs font-semibold text-white">Visible Viewport</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Current screen area</span>
              </button>

              <button
                onClick={handleCaptureArea}
                disabled={loading}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-violet-400/40 text-zinc-200 transition-all duration-150 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 group-hover:scale-105 transition-all mb-2">
                  <Crop size={20} />
                </div>
                <span className="text-xs font-semibold text-white">Selected Area</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Crop custom frame</span>
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 p-4 text-xs text-indigo-400">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                <span>Capturing clean high-resolution frame...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Captured Image Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-black/40 group shadow-lg">
              <img
                src={capturedImage}
                alt="Captured screen"
                className="w-full h-auto max-h-60 object-cover object-top"
              />
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => setCapturedImage(null)}
                  className="px-2.5 py-1 rounded-xl bg-black/70 hover:bg-black/90 text-[11px] text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RotateCcw size={12} />
                  <span>Retake</span>
                </button>
              </div>
            </div>

            {/* Post Capture Action Bar */}
            <div className="grid grid-cols-3 gap-2">
              <HyperlinkButton onClick={handleCopy} variant="secondary" size="sm" icon="Copy">
                Copy
              </HyperlinkButton>

              <HyperlinkButton onClick={handleDownload} variant="secondary" size="sm" icon="Download">
                Download
              </HyperlinkButton>

              <HyperlinkButton onClick={handleSave} variant="secondary" size="sm" icon="Bookmark">
                Save
              </HyperlinkButton>
            </div>

            <div className="flex gap-2">
              <HyperlinkButton
                onClick={() => handleAskAI('Explain this screenshot and summarize visible text')}
                variant="primary"
                size="sm"
                icon="Sparkles"
                className="flex-1"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing with Vision...' : 'Ask AI / OCR'}
              </HyperlinkButton>

              <HyperlinkButton onClick={handleShare} variant="secondary" size="sm" icon="Share2">
                Share
              </HyperlinkButton>
            </div>

            {/* AI Vision Results */}
            {aiAnalysis && (
              <div className="p-3.5 rounded-2xl bg-white/[0.035] border border-white/[0.08] text-xs text-zinc-200 leading-relaxed space-y-2 shadow-md">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400">
                  <Sparkles size={13} />
                  <span>AI Visual Intelligence</span>
                </div>
                <div className="select-text cursor-text text-zinc-100">
                  <MarkdownView content={aiAnalysis} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PanelContainer>
  );
};
