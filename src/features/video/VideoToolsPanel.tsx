import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';

export const VideoToolsPanel: React.FC = () => {
  const { pageContext, openFeatureWithProps, showToast } = useHyperlink();
  const [hasVideo, setHasVideo] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bookmarks, setBookmarks] = useState<Array<{ time: number; note: string }>>([]);

  const getVideoElement = (): HTMLVideoElement | null => {
    return document.querySelector('video');
  };

  useEffect(() => {
    const video = getVideoElement();
    if (video) {
      setHasVideo(true);
      setPlaybackRate(video.playbackRate || 1);
      setIsLooping(video.loop || false);
      setCurrentTime(video.currentTime || 0);

      const timeUpdate = () => setCurrentTime(video.currentTime);
      video.addEventListener('timeupdate', timeUpdate);
      return () => video.removeEventListener('timeupdate', timeUpdate);
    } else {
      setHasVideo(false);
    }
  }, []);

  const handleSetSpeed = (speed: number) => {
    const video = getVideoElement();
    if (video) {
      video.playbackRate = speed;
      setPlaybackRate(speed);
      showToast({ type: 'info', title: `Playback Speed: ${speed}x` });
    } else {
      showToast({ type: 'warning', title: 'No active video element detected on page' });
    }
  };

  const handleTogglePiP = async () => {
    const video = getVideoElement();
    if (!video) {
      showToast({ type: 'warning', title: 'No video element found' });
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
        showToast({ type: 'success', title: 'Picture-in-Picture Activated' });
      }
    } catch (e: any) {
      showToast({
        type: 'warning',
        title: 'Picture-in-Picture Restricted',
        message: 'This video or browser restricts detached overlay playback.'
      });
    }
  };

  const handleToggleLoop = () => {
    const video = getVideoElement();
    if (video) {
      video.loop = !video.loop;
      setIsLooping(video.loop);
      showToast({ type: 'info', title: video.loop ? 'Video Loop Enabled' : 'Video Loop Disabled' });
    }
  };

  const handleCaptureFrame = () => {
    const video = getVideoElement();
    if (!video) {
      showToast({ type: 'warning', title: 'No video detected' });
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        openFeatureWithProps('screenshot', { capturedImage: dataUrl });
        showToast({ type: 'success', title: 'Video Frame Captured' });
      }
    } catch {
      showToast({
        type: 'warning',
        title: 'Protected Video Stream',
        message: 'CORS or DRM restrictions prevent direct frame extraction on this player.'
      });
    }
  };

  const handleAddBookmark = () => {
    const time = Math.floor(currentTime);
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

    setBookmarks(prev => [
      ...prev,
      { time, note: `Bookmark at ${timeFormatted}` }
    ]);
    showToast({ type: 'success', title: `Bookmark Saved at ${timeFormatted}` });
  };

  const handleJumpToTime = (time: number) => {
    const video = getVideoElement();
    if (video) {
      video.currentTime = time;
    }
  };

  return (
    <PanelContainer
      title="Video Tools"
      iconName="PlaySquare"
      subtitle={hasVideo ? `Active on ${pageContext.domain}` : 'No HTML5 video detected'}
    >
      <div className="space-y-4">
        {!hasVideo && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
            <span className="font-semibold block mb-1">No Video Element Found</span>
            Ensure a video is actively loaded or playing on this page.
          </div>
        )}

        {/* Playback Speed Controls */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Playback Speed</label>
          <div className="grid grid-cols-5 gap-1.5">
            {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSetSpeed(speed)}
                className={`py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  playbackRate === speed
                    ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Quick Media Actions */}
        <div className="grid grid-cols-2 gap-2">
          <HyperlinkButton
            onClick={handleTogglePiP}
            variant="secondary"
            size="sm"
            icon="Maximize2"
          >
            Picture-in-Picture
          </HyperlinkButton>

          <HyperlinkButton
            onClick={handleToggleLoop}
            variant={isLooping ? 'primary' : 'secondary'}
            size="sm"
            icon="RotateCcw"
          >
            {isLooping ? 'Loop: ON' : 'Loop: OFF'}
          </HyperlinkButton>

          <HyperlinkButton
            onClick={handleCaptureFrame}
            variant="secondary"
            size="sm"
            icon="Camera"
          >
            Capture Frame
          </HyperlinkButton>

          <HyperlinkButton
            onClick={handleAddBookmark}
            variant="secondary"
            size="sm"
            icon="Bookmark"
          >
            Bookmark Timestamp
          </HyperlinkButton>
        </div>

        {/* Saved Bookmarks */}
        {bookmarks.length > 0 && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Timestamped Notes
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {bookmarks.map((bm, i) => (
                <div
                  key={i}
                  onClick={() => handleJumpToTime(bm.time)}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer text-xs transition-colors"
                >
                  <span className="text-slate-300">{bm.note}</span>
                  <span className="font-mono text-[10px] text-sky-400 bg-sky-500/20 px-1.5 py-0.5 rounded">
                    Jump
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related AI Actions */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <HyperlinkButton
            onClick={() => openFeatureWithProps('summarize', { mode: 'video' })}
            variant="accent"
            size="sm"
            icon="Sparkles"
            className="w-full"
          >
            Summarize Video Content with AI
          </HyperlinkButton>
        </div>
      </div>
    </PanelContainer>
  );
};
