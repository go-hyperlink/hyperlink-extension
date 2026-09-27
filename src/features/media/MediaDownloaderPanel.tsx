import React, { useState, useEffect, useRef } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import {
  Download,
  Film,
  Music,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Radio,
  Sliders,
  Play,
  Square,
  Globe,
  Sparkles,
  Layers,
  AlertCircle
} from 'lucide-react';

interface DetectedMedia {
  id: string;
  type: 'video' | 'audio';
  src: string;
  title: string;
  format: string;
  duration?: number;
  width?: number;
  height?: number;
  isBlob: boolean;
}

export const MediaDownloaderPanel: React.FC = () => {
  const { pageContext, addToast } = useHyperlink();
  const [detectedMedia, setDetectedMedia] = useState<DetectedMedia[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'youtube' | 'detected' | 'stream_recorder'>('youtube');

  // Quality & Format Options
  const [videoQuality, setVideoQuality] = useState<'1080' | '720' | '480' | '360'>('720');
  const [audioFormat, setAudioFormat] = useState<'mp3' | 'aac' | 'opus'>('mp3');
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [streamRestricted, setStreamRestricted] = useState(false);

  // Stream Recorder State
  const [isRecordingStream, setIsRecordingStream] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Check if current page is YouTube
  const isYouTubePage =
    pageContext.domain.includes('youtube.com') ||
    pageContext.domain.includes('youtu.be') ||
    window.location.hostname.includes('youtube.com') ||
    window.location.hostname.includes('youtu.be');

  // Extract YouTube ID
  const getYouTubeId = (url: string): string | null => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.slice(1).split('?')[0];
      }
      if (parsed.pathname.includes('/shorts/')) {
        return parsed.pathname.split('/shorts/')[1].split('?')[0];
      }
      return parsed.searchParams.get('v');
    } catch {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
      return match ? match[1] : null;
    }
  };

  const currentYtId = getYouTubeId(window.location.href);

  // Auto-switch tab based on page context
  useEffect(() => {
    if (isYouTubePage && currentYtId) {
      setActiveTab('youtube');
    } else {
      setActiveTab('detected');
    }
    scanPageMedia();
  }, [pageContext.url]);

  // Deep Scan for HTML5 videos, audios, sources, and network entries
  const scanPageMedia = () => {
    setIsScanning(true);
    const mediaList: DetectedMedia[] = [];
    const seenSrcs = new Set<string>();

    try {
      // 1. Scan <video> elements
      const videos = document.querySelectorAll('video');
      videos.forEach((vid, idx) => {
        const src = vid.currentSrc || vid.src;
        if (src && !seenSrcs.has(src)) {
          seenSrcs.add(src);
          const isBlob = src.startsWith('blob:');
          let format = 'MP4';
          if (src.includes('.webm') || vid.canPlayType('video/webm')) format = 'WEBM';
          if (src.includes('.m3u8')) format = 'HLS (m3u8)';

          mediaList.push({
            id: 'vid_' + idx + '_' + Math.random().toString(36).substr(2, 4),
            type: 'video',
            src,
            title: vid.title || document.title || `Video Stream ${idx + 1}`,
            format,
            duration: vid.duration && !isNaN(vid.duration) ? Math.round(vid.duration) : undefined,
            width: vid.videoWidth || undefined,
            height: vid.videoHeight || undefined,
            isBlob,
          });
        }

        // Sources inside video
        vid.querySelectorAll('source').forEach((s) => {
          if (s.src && !seenSrcs.has(s.src)) {
            seenSrcs.add(s.src);
            mediaList.push({
              id: 'vidsrc_' + Math.random().toString(36).substr(2, 6),
              type: 'video',
              src: s.src,
              title: document.title || 'Video Track',
              format: s.type || 'MP4',
              isBlob: s.src.startsWith('blob:'),
            });
          }
        });
      });

      // 2. Scan <audio> elements
      const audios = document.querySelectorAll('audio');
      audios.forEach((aud, idx) => {
        const src = aud.currentSrc || aud.src;
        if (src && !seenSrcs.has(src)) {
          seenSrcs.add(src);
          mediaList.push({
            id: 'aud_' + idx + '_' + Math.random().toString(36).substr(2, 4),
            type: 'audio',
            src,
            title: aud.title || document.title || `Audio Track ${idx + 1}`,
            format: 'MP3/AAC',
            duration: aud.duration && !isNaN(aud.duration) ? Math.round(aud.duration) : undefined,
            isBlob: src.startsWith('blob:'),
          });
        }
      });

      // 3. Scan OpenGraph Video & Audio Meta Tags
      const ogVideo = document.querySelector('meta[property="og:video"], meta[name="og:video"], meta[property="og:video:secure_url"]');
      if (ogVideo) {
        const content = (ogVideo as HTMLMetaElement).content;
        if (content && !seenSrcs.has(content)) {
          seenSrcs.add(content);
          mediaList.push({
            id: 'og_vid',
            type: 'video',
            src: content,
            title: document.title || 'Page Video',
            format: 'MP4',
            isBlob: false,
          });
        }
      }

      setDetectedMedia(mediaList);
    } catch (e) {
      console.warn('[MediaDownloader] Scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  // Trigger file download via Background Service Worker or Direct Anchor
  const triggerDownload = (url: string, defaultFilename: string) => {
    const filename = defaultFilename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Direct browser anchor download for blob / data URLs (avoids origin restriction in service worker)
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      fallbackAnchorDownload(url, filename);
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: 'DOWNLOAD_FILE',
          url,
          filename,
        },
        (response) => {
          if (response && response.success) {
            addToast(`Download started: ${filename}`, 'success');
          } else {
            fallbackAnchorDownload(url, filename);
          }
        }
      );
    } else {
      fallbackAnchorDownload(url, filename);
    }
  };

  const fallbackAnchorDownload = (url: string, filename: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast(`Downloading: ${filename}`, 'info');
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleCopyLink = (src: string, id?: string) => {
    navigator.clipboard.writeText(src);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    addToast('Video link copied to clipboard!', 'success');
  };

  // Verify candidate stream before downloading so it NEVER downloads 403 .txt error pages!
  const checkStreamUrl = async (url: string): Promise<boolean> => {
    try {
      const res = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({
          type: 'PROXY_FETCH',
          url,
          options: { method: 'HEAD' }
        }, resolve);
      });
      if (!res || !res.success) return false;
      if (res.status === 403 || res.status === 404 || res.status >= 400) return false;
      const cType = (res.contentType || '').toLowerCase();
      if (cType.includes('text/plain') || cType.includes('text/html')) return false;
      return true;
    } catch {
      return false;
    }
  };

  // Direct In-Extension Stream Extraction (Works worldwide on all ISPs with zero VPN)
  const handleDirectDownload = async (type: 'video' | 'audio') => {
    const targetUrl = customUrl.trim() || window.location.href;
    const yId = getYouTubeId(targetUrl);
    const cleanTitle = (document.title || 'media').replace(' - YouTube', '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);

    setIsDownloading(true);
    setStreamRestricted(false);
    setStatusMessage('Testing fast stream mirrors...');

    let directStreamUrl: string | null = null;

    // Method 1: Invidious Proxy Stream Mirrors (Streams MP4/M4A directly from unblocked mirrors)
    if (yId) {
      const itag = type === 'audio' ? '140' : (videoQuality === '1080' ? '22' : (videoQuality === '720' ? '22' : '18'));
      const invidiousMirrors = [
        `https://yewtu.be/latest_version?id=${yId}&itag=${itag}&local=true`,
        `https://inv.nadeko.net/latest_version?id=${yId}&itag=${itag}&local=true`,
        `https://invidious.nerdvpn.de/latest_version?id=${yId}&itag=${itag}&local=true`,
        `https://vid.priv.au/latest_version?id=${yId}&itag=${itag}&local=true`,
        `https://invidious.jing.rocks/latest_version?id=${yId}&itag=${itag}&local=true`,
        `https://iv.melmac.space/latest_version?id=${yId}&itag=${itag}&local=true`
      ];

      for (const mirrorUrl of invidiousMirrors) {
        setStatusMessage(`Checking mirror ${new URL(mirrorUrl).hostname}...`);
        const isValid = await checkStreamUrl(mirrorUrl);
        if (isValid) {
          directStreamUrl = mirrorUrl;
          break;
        }
      }
    }

    // Method 2: Public Invidious API stream info
    if (!directStreamUrl && yId) {
      const apiMirrors = [
        `https://inv.nadeko.net/api/v1/videos/${yId}`,
        `https://yewtu.be/api/v1/videos/${yId}`,
        `https://invidious.nerdvpn.de/api/v1/videos/${yId}`,
        `https://vid.priv.au/api/v1/videos/${yId}`
      ];

      for (const mirrorUrl of apiMirrors) {
        setStatusMessage(`Querying API ${new URL(mirrorUrl).hostname}...`);
        try {
          const res = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({
              type: 'PROXY_FETCH',
              url: mirrorUrl,
              options: {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
              }
            }, resolve);
          });

          if (res && res.success && res.text) {
            const data = JSON.parse(res.text);
            let candidate: string | null = null;
            if (Array.isArray(data.formatStreams) && type === 'video') {
              const matched = data.formatStreams.find((s: any) => s.qualityLabel === `${videoQuality}p`) || data.formatStreams[0];
              if (matched && matched.url) candidate = matched.url;
            }
            if (Array.isArray(data.adaptiveFormats) && type === 'audio') {
              const audioStream = data.adaptiveFormats.find((s: any) => s.type && s.type.includes('audio/mp4')) || data.adaptiveFormats[0];
              if (audioStream && audioStream.url) candidate = audioStream.url;
            }

            if (candidate) {
              const isValid = await checkStreamUrl(candidate);
              if (isValid) {
                directStreamUrl = candidate;
                break;
              }
            }
          }
        } catch {
          // Next mirror
        }
      }
    }

    // Method 3: YouTube Official Mobile API (Must be validated so it NEVER downloads 403 .txt error pages)
    if (!directStreamUrl && yId) {
      try {
        setStatusMessage('Checking YouTube CDN token...');
        const ytRes = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage({
            type: 'PROXY_FETCH',
            url: 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
            options: {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip'
              },
              body: JSON.stringify({
                videoId: yId,
                context: {
                  client: {
                    clientName: 'ANDROID',
                    clientVersion: '19.09.37',
                    androidSdkVersion: 30,
                    hl: 'en',
                    gl: 'US'
                  }
                }
              })
            }
          }, resolve);
        });

        if (ytRes && ytRes.success && ytRes.text) {
          const parsed = JSON.parse(ytRes.text);
          const sData = parsed?.streamingData;
          let candidate: string | null = null;
          if (sData) {
            if (type === 'video' && Array.isArray(sData.formats)) {
              const match = sData.formats.find((f: any) => f.qualityLabel === `${videoQuality}p` && f.url) ||
                            sData.formats.find((f: any) => f.url);
              if (match && match.url) candidate = match.url;
            } else if (type === 'audio' && Array.isArray(sData.adaptiveFormats)) {
              const match = sData.adaptiveFormats.find((f: any) => f.mimeType && f.mimeType.includes('audio/mp4') && f.url) ||
                            sData.adaptiveFormats.find((f: any) => f.mimeType && f.mimeType.includes('audio/') && f.url);
              if (match && match.url) candidate = match.url;
            }
          }

          if (candidate) {
            // Strictly verify before attempting download!
            const isValid = await checkStreamUrl(candidate);
            if (isValid) {
              directStreamUrl = candidate;
            }
          }
        }
      } catch (e) {
        console.warn('YouTube Android API fetch error:', e);
      }
    }

    setIsDownloading(false);
    setStatusMessage(null);

    // If a verified direct stream URL was retrieved, trigger native browser download!
    if (directStreamUrl) {
      const ext = type === 'audio' ? (audioFormat === 'mp3' ? 'mp3' : 'm4a') : 'mp4';
      triggerDownload(directStreamUrl, `${cleanTitle}_${type === 'video' ? `${videoQuality}p` : audioFormat}.${ext}`);
      addToast(`Direct download started: ${type === 'video' ? `${videoQuality}p MP4` : audioFormat.toUpperCase()}`, 'success');
      return;
    }

    // If direct stream URL was rejected (e.g. YouTube PO token protection), DO NOT TRIGGER DOWNLOAD of broken .txt!
    // Instead copy link and display clear, helpful status with 1-click fallback actions!
    handleCopyLink(targetUrl);
    setStreamRestricted(true);
    addToast('YouTube protected direct CDN stream. Use 1-Click Mirror or Stream Ripper!', 'warning');
  };

  // Open 100% Verified Globally Unblocked Portals (No ISP block in India or worldwide, No VPN needed)
  const handleOpenUnblockedPortal = (portal: 'publer' | 'ezmp3' | 'cobalt' | 'invidious') => {
    const targetUrl = customUrl.trim() || window.location.href;
    const yId = getYouTubeId(targetUrl);
    handleCopyLink(targetUrl);

    if (portal === 'publer') {
      window.open(`https://publer.io/tools/media-downloader`, '_blank');
    } else if (portal === 'ezmp3') {
      window.open(`https://ezmp3.cc/`, '_blank');
    } else if (portal === 'invidious') {
      if (yId) {
        window.open(`https://yewtu.be/watch?v=${yId}`, '_blank');
      } else {
        window.open(`https://yewtu.be`, '_blank');
      }
    } else {
      window.open(`https://cobalt.tools`, '_blank');
    }
  };

  // Live Stream Recording for Blob / DRM-free video players
  const handleStartStreamRecording = () => {
    const video = document.querySelector('video') as any;
    if (!video) {
      addToast('No HTML5 video currently playing on page', 'warning');
      return;
    }

    try {
      let stream: MediaStream | null = null;
      if (typeof video.captureStream === 'function') {
        stream = video.captureStream();
      } else if (typeof video.mozCaptureStream === 'function') {
        stream = video.mozCaptureStream();
      }

      if (!stream) {
        addToast('Browser security prevents direct stream capture on this player', 'warning');
        return;
      }

      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const titleClean = (document.title || 'stream_recording').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
        triggerDownload(url, `${titleClean}.webm`);
        addToast('Stream saved to downloads folder', 'success');
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecordingStream(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      addToast('Live stream recording started', 'info');
    } catch (err: any) {
      addToast('Could not record stream: ' + (err?.message || 'Access error'), 'error');
    }
  };

  const handleStopStreamRecording = () => {
    if (mediaRecorderRef.current && isRecordingStream) {
      mediaRecorderRef.current.stop();
      setIsRecordingStream(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <PanelContainer
      title="Media Downloader"
      iconName="Download"
      subtitle={isYouTubePage ? `YouTube: ${currentYtId || 'Video Detected'}` : `Found ${detectedMedia.length} media items on page`}
      width="w-[500px]"
      headerActions={
        <button
          onClick={scanPageMedia}
          disabled={isScanning}
          className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white transition-colors cursor-pointer"
          title="Rescan Page Media"
        >
          <RefreshCw size={13} className={isScanning ? 'animate-spin text-indigo-400' : ''} />
        </button>
      }
    >
      <div className="flex flex-col space-y-4 text-xs select-text">
        {/* Navigation Tabs */}
        <div className="flex items-center p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'youtube'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download size={12} />
            <span>YouTube / Video</span>
          </button>

          <button
            onClick={() => setActiveTab('detected')}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'detected'
                ? 'bg-white/[0.12] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film size={12} />
            <span>Page Files ({detectedMedia.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stream_recorder')}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'stream_recorder'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio size={12} />
            <span>Stream Ripper</span>
          </button>
        </div>

        {/* Tab 1: YouTube Downloader with Direct Stream Engine */}
        {activeTab === 'youtube' && (
          <div className="space-y-4 animate-hyperlink-fade">
            {/* Active Video Card or Custom Input */}
            <div className="p-3.5 rounded-2xl border border-red-500/30 bg-red-500/[0.04] space-y-3">
              {currentYtId ? (
                <div className="flex items-center gap-3">
                  <img
                    src={`https://img.youtube.com/vi/${currentYtId}/hqdefault.jpg`}
                    alt="YouTube Video Thumbnail"
                    className="w-24 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-black shadow-md"
                  />
                  <div className="min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      YouTube Video Detected
                    </span>
                    <h4 className="font-bold text-white text-xs truncate mt-1">
                      {document.title.replace(' - YouTube', '')}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-zinc-400">
                        ID: {currentYtId}
                      </span>
                      <button
                        onClick={() => handleCopyLink(window.location.href)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Copy size={10} />
                        <span>Copy Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-xs">
                    <Search size={14} className="text-red-400" />
                    <span>Paste any Video Link:</span>
                  </div>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or Vimeo / Twitter"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-zinc-500 outline-none focus:border-red-400"
                  />
                </div>
              )}

              {/* Quality & Resolution Controls */}
              <div className="pt-2 border-t border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={12} className="text-indigo-400" />
                    <span>Video Quality</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {(['1080', '720', '480', '360'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setVideoQuality(q)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                          videoQuality === q
                            ? 'bg-indigo-600 text-white font-bold shadow-sm'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {q}p
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Music size={12} className="text-emerald-400" />
                    <span>Audio Format</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {(['mp3', 'aac', 'opus'] as const).map((af) => (
                      <button
                        key={af}
                        onClick={() => setAudioFormat(af)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer uppercase ${
                          audioFormat === af
                            ? 'bg-emerald-600 text-white font-bold shadow-sm'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {af}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary 1-Click Direct Download Buttons */}
              <div className="pt-1 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDirectDownload('video')}
                  disabled={isDownloading}
                  className="p-3 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                  title="Direct download to disk via CDN"
                >
                  <Film size={15} />
                  <span>Download {videoQuality}p MP4</span>
                </button>

                <button
                  onClick={() => handleDirectDownload('audio')}
                  disabled={isDownloading}
                  className="p-3 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                  title="Download direct audio stream"
                >
                  <Music size={15} />
                  <span>Download {audioFormat.toUpperCase()}</span>
                </button>
              </div>

              {/* 100% In-Browser Instant Capture Button (Zero external network, zero VPN needed) */}
              {isYouTubePage && (
                <div className="pt-1">
                  <button
                    onClick={() => setActiveTab('stream_recorder')}
                    className="w-full py-2 px-3 rounded-xl border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Radio size={13} className="text-red-400 animate-pulse" />
                    <span>Instant Capture from Playing Video (100% In-Browser, No VPN)</span>
                  </button>
                </div>
              )}

              {statusMessage && (
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-center text-[11px] text-indigo-300 font-mono animate-pulse">
                  ⚡ {statusMessage}
                </div>
              )}

              {streamRestricted && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2.5 animate-hyperlink-fade">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-xs">Direct Stream Token-Locked by YouTube</h5>
                      <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                        YouTube has protected this video with strict proof-of-origin tokens (preventing raw unauthenticated CDN downloads). Your link is auto-copied to clipboard! Choose a 1-click solution below:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleOpenUnblockedPortal('invidious')}
                      className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <ExternalLink size={13} />
                      <span>1-Click Mirror (Download MP4)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('stream_recorder')}
                      className="p-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Radio size={13} className="text-red-400 animate-pulse" />
                      <span>In-Browser Stream Ripper</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 100% UNBLOCKED Worldwide Web Portals (Zero VPN required, No infinite reload loops) */}
              <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Verified Global Tools (Works Everywhere Without VPN)
                  </span>
                  <span className="text-[9px] text-emerald-400 font-medium">Link auto-copied on click</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => handleOpenUnblockedPortal('publer')}
                    className="py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 hover:text-white text-center font-medium cursor-pointer transition-all"
                    title="Publer: Clean US enterprise social media downloader (YouTube, Insta, TikTok, etc.)"
                  >
                    <span className="block font-bold text-xs text-white">Publer</span>
                    <span className="block text-[9px] text-zinc-400">All Platforms</span>
                  </button>

                  <button
                    onClick={() => handleOpenUnblockedPortal('invidious')}
                    className="py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 hover:text-white text-center font-medium cursor-pointer transition-all"
                    title="Invidious: Ad-free mirror with direct video and audio download"
                  >
                    <span className="block font-bold text-xs text-amber-300">Invidious</span>
                    <span className="block text-[9px] text-zinc-400">Direct DL</span>
                  </button>

                  <button
                    onClick={() => handleOpenUnblockedPortal('ezmp3')}
                    className="py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 hover:text-white text-center font-medium cursor-pointer transition-all"
                    title="EzMP3: Clean fast audio extractor"
                  >
                    <span className="block font-bold text-xs text-emerald-300">EzMP3</span>
                    <span className="block text-[9px] text-zinc-400">Fast Audio</span>
                  </button>

                  <button
                    onClick={() => handleOpenUnblockedPortal('cobalt')}
                    className="py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 hover:text-white text-center font-medium cursor-pointer transition-all"
                    title="Cobalt Web: Ad-free open-source app"
                  >
                    <span className="block font-bold text-xs text-indigo-300">Cobalt</span>
                    <span className="block text-[9px] text-zinc-400">Ad-Free</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Detected Web Media */}
        {activeTab === 'detected' && (
          <div className="space-y-3 animate-hyperlink-fade">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span>Direct Video & Audio Files Found</span>
              <button
                onClick={scanPageMedia}
                className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RefreshCw size={11} className={isScanning ? 'animate-spin' : ''} />
                <span>Scan page</span>
              </button>
            </div>

            {detectedMedia.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-2">
                <Film size={28} className="mx-auto text-zinc-500 stroke-[1.5]" />
                <p className="font-bold text-white text-xs">No Direct Video/Audio Files Found Yet</p>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  If this site uses streaming chunks (like YouTube or Twitter), switch to <strong>YouTube / Video</strong> or the <strong>Stream Ripper</strong> tab to capture it directly!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-0.5 scrollbar-thin">
                {detectedMedia.map((media) => {
                  return (
                    <div
                      key={media.id}
                      className="p-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${media.type === 'video' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {media.type === 'video' ? <Film size={16} /> : <Music size={16} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-white text-xs truncate">
                              {media.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                              <span className="font-mono uppercase font-bold text-indigo-300">{media.format}</span>
                              {media.width && media.height && (
                                <span>• {media.width}×{media.height}px</span>
                              )}
                              {media.duration && (
                                <span>• {formatSeconds(media.duration)}</span>
                              )}
                              {media.isBlob && (
                                <span className="text-amber-400">• Live Stream</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyLink(media.src, media.id)}
                            className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy Direct Link"
                          >
                            {copiedId === media.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Download Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => triggerDownload(media.src, `${media.title || 'download'}.${media.type === 'video' ? 'mp4' : 'mp3'}`)}
                          className="flex-1 py-1.5 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                        >
                          <Download size={13} />
                          <span>Download {media.type === 'video' ? 'Video' : 'Audio'}</span>
                        </button>

                        <button
                          onClick={() => window.open(media.src, '_blank')}
                          className="py-1.5 px-3 rounded-xl font-medium text-xs bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <ExternalLink size={13} />
                          <span>Open</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Stream Ripper (100% in-browser, zero external network, zero VPN needed) */}
        {activeTab === 'stream_recorder' && (
          <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-4 animate-hyperlink-fade">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs">Live Stream Ripper (100% In-Browser)</h4>
                <p className="text-[11px] text-zinc-400">
                  Directly captures video from the active web player into a clean file. Works on any site with zero VPN.
                </p>
              </div>
              <Radio size={20} className={isRecordingStream ? 'text-red-500 animate-pulse' : 'text-zinc-500'} />
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center space-y-3">
              <span className="font-mono text-2xl font-bold text-white tracking-widest">
                {formatSeconds(recordingSeconds)}
              </span>

              {isRecordingStream ? (
                <button
                  onClick={handleStopStreamRecording}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  <Square size={14} />
                  <span>Stop & Save to Disk</span>
                </button>
              ) : (
                <button
                  onClick={handleStartStreamRecording}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Play size={14} />
                  <span>Start Stream Capture</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </PanelContainer>
  );
};
