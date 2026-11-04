import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Volume2,
  Music,
  Video,
  Download,
  Upload,
  Scissors,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  History,
  Trash2,
  Sliders,
  ExternalLink
} from 'lucide-react';
import {
  extractAudioBufferFromVideo,
  encodeAudioBufferToWav,
  extractWaveformData,
  formatBytes,
  formatTime,
  generateSampleVideoWithAudio,
  getAudioExtractionHistory,
  saveAudioExtractionHistory,
  clearAudioExtractionHistory
} from '../utils/audioExtractorUtils';

export default function AudioExtractorSuite({ _theme = 'dark', onNotify }) {
  // Video Source State
  const [videoFile, setVideoFile] = useState(null); // { name, size, formattedSize, url, duration, width, height, rawFile }
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Decoded Audio Telemetry
  const [decodedAudio, setDecodedAudio] = useState(null); // { audioBuffer, duration, sampleRate, numberOfChannels, length }
  const [waveformData, setWaveformData] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ stage: '', percent: 0 });

  // Trimming & Audio Enhancement Controls
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [channels, setChannels] = useState('stereo'); // 'stereo' | 'mono'
  const [volume, setVolume] = useState(1.0); // 0.5 to 2.5
  const [normalize, setNormalize] = useState(true);
  const [fadeIn, setFadeIn] = useState(0); // 0 to 5s
  const [fadeOut, setFadeOut] = useState(0); // 0 to 5s

  // Audio Playback Preview State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Final Extracted Audio State
  const [extractedResult, setExtractedResult] = useState(null); // { blob, url, size, formattedSize, duration, channels, format }

  // History State
  const [historyList, setHistoryList] = useState(() => getAudioExtractionHistory());
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // DOM Refs
  const fileInputRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const audioPreviewRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Notification helper
  const notify = useCallback((msg, type = 'success') => {
    if (onNotify) {
      if (typeof onNotify === 'function') {
        onNotify(msg, type);
      }
    }
  }, [onNotify]);

  // Handle Video File Ingestion
  const handleLoadVideoFile = useCallback(async (file, customName = null) => {
    setIsLoadingVideo(true);
    setErrorMessage(null);
    setExtractedResult(null);
    setDecodedAudio(null);
    setWaveformData([]);
    setIsPlayingAudio(false);

    try {
      const videoUrl = URL.createObjectURL(file);
      const filename = customName || file.name || 'video_clip.mp4';

      // Load into a temporary video element to get dimensions & duration
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = videoUrl;

      await new Promise((resolve, reject) => {
        tempVideo.onloadedmetadata = () => resolve();
        tempVideo.onerror = () => reject(new Error('Failed to load video metadata. Invalid video container.'));
        setTimeout(() => resolve(), 3000); // safety fallback
      });

      const duration = tempVideo.duration || 0;
      const width = tempVideo.videoWidth || 0;
      const height = tempVideo.videoHeight || 0;

      setVideoFile({
        name: filename,
        size: file.size,
        formattedSize: formatBytes(file.size),
        url: videoUrl,
        duration,
        width,
        height,
        rawFile: file
      });

      // Automatically decode the audio track
      setIsExtracting(true);
      const decoded = await extractAudioBufferFromVideo(file, (p) => setProgressInfo(p));
      setDecodedAudio(decoded);

      // Compute waveform peaks
      const peaks = extractWaveformData(decoded.audioBuffer, 140);
      setWaveformData(peaks);

      // Initialize trim markers
      setTrimStart(0);
      setTrimEnd(Math.round(decoded.duration * 10) / 10);

      notify(`Loaded "${filename}" (${formatTime(decoded.duration)} audio track decoded)`, 'success');
    } catch (err) {
      console.error('Failed to load video for audio extraction:', err);
      setErrorMessage(err.message || 'Failed to inspect and demux video file.');
      notify('Failed to extract audio from video.', 'error');
    } finally {
      setIsLoadingVideo(false);
      setIsExtracting(false);
    }
  }, [notify]);

  // 1-Click Load Sample Video
  const handleLoadSampleVideo = async () => {
    setIsGeneratingSample(true);
    setErrorMessage(null);
    try {
      notify('Synthesizing 6-second demo video with stereo audio...', 'info');
      const sample = await generateSampleVideoWithAudio();
      await handleLoadVideoFile(sample.blob, sample.name);
    } catch (err) {
      console.error('Failed to generate sample video:', err);
      setErrorMessage(err.message || 'Failed to synthesize sample video.');
    } finally {
      setIsGeneratingSample(false);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v|flv)$/i)) {
      notify('Please select a valid video file (MP4, WebM, MOV, MKV).', 'error');
      return;
    }

    handleLoadVideoFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleLoadVideoFile(file);
    }
  };

  // Execute Final Audio Track Extraction & 16-Bit WAV Encoding
  const handleExtractAudio = async () => {
    if (!decodedAudio?.audioBuffer) return;

    setIsExtracting(true);
    setProgressInfo({ stage: 'Applying volume gain & normalization...', percent: 20 });

    try {
      const sTime = isTrimming ? Math.min(trimStart, trimEnd) : 0;
      const eTime = isTrimming ? Math.max(trimStart, trimEnd) : decodedAudio.duration;

      setTimeout(() => {
        setProgressInfo({ stage: 'Encoding uncompressed 16-bit PCM WAV...', percent: 65 });

        const result = encodeAudioBufferToWav(decodedAudio.audioBuffer, {
          startTime: sTime,
          endTime: eTime,
          channels,
          volume,
          normalize,
          fadeIn,
          fadeOut
        });

        setProgressInfo({ stage: 'Finalizing audio package...', percent: 100 });
        setExtractedResult(result);

        // Save extraction to localStorage history
        saveAudioExtractionHistory({
          name: videoFile?.name || 'video_clip.mp4',
          originalSize: videoFile?.formattedSize || '0 B',
          audioSize: result.formattedSize,
          duration: formatTime(result.duration),
          channels: result.channels,
          format: result.format
        });
        setHistoryList(getAudioExtractionHistory());

        setIsExtracting(false);
        notify(`Extracted audio successfully (${result.formattedSize})`, 'success');
      }, 120);
    } catch (err) {
      console.error('Audio extraction failed:', err);
      notify('Audio extraction failed.', 'error');
      setIsExtracting(false);
    }
  };

  // Download Extracted Audio File
  const handleDownloadAudio = () => {
    if (!extractedResult?.blob) return;

    const baseName = videoFile?.name?.replace(/\.[^/.]+$/, '') || 'audio_track';
    const a = document.createElement('a');
    a.href = extractedResult.url;
    a.download = `${baseName}_audio.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    notify('WAV audio file downloaded.', 'info');
  };

  // Open Extracted Audio in a New Tab
  const handleOpenInNewTab = () => {
    if (!extractedResult?.url) return;
    window.open(extractedResult.url, '_blank');
  };

  // Render Interactive Waveform on Canvas
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const totalBars = waveformData.length;
    const barWidth = w / totalBars - 1.5;
    const totalDuration = decodedAudio?.duration || 1;

    // Draw Amplitude Bars
    waveformData.forEach((peak, i) => {
      const x = i * (barWidth + 1.5);
      const barHeight = Math.max(4, peak * (h - 16));
      const y = (h - barHeight) / 2;

      const barTime = (i / totalBars) * totalDuration;
      const isInsideTrim = !isTrimming || (barTime >= trimStart && barTime <= trimEnd);
      const isPastPlayhead = isPlayingAudio && barTime <= audioCurrentTime;

      // Color selection based on playhead and trim
      if (isPastPlayhead) {
        ctx.fillStyle = '#10b981'; // Green active playhead
      } else if (isInsideTrim) {
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#6366f1'); // Indigo
        grad.addColorStop(1, '#a855f7'); // Purple
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)'; // Dimmed trimmed out
      }

      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(1, barWidth), barHeight, 2);
      ctx.fill();
    });

    // Draw Trim Region Markers if trimming is enabled
    if (isTrimming && totalDuration > 0) {
      const startX = (trimStart / totalDuration) * w;
      const endX = (trimEnd / totalDuration) * w;

      // Shaded out areas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(0, 0, startX, h);
      ctx.fillRect(endX, 0, w - endX, h);

      // Start Handle Line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, h);
      ctx.stroke();

      // End Handle Line
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, h);
      ctx.stroke();
    }
  }, [waveformData, decodedAudio, isTrimming, trimStart, trimEnd, isPlayingAudio, audioCurrentTime]);

  // Clean up Object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoFile?.url) URL.revokeObjectURL(videoFile.url);
      if (extractedResult?.url) URL.revokeObjectURL(extractedResult.url);
    };
  }, [videoFile, extractedResult]);

  // Trimmed Selection Duration
  const selectedDuration = useMemo(() => {
    if (!decodedAudio) return 0;
    if (!isTrimming) return decodedAudio.duration;
    return Math.max(0, Math.abs(trimEnd - trimStart));
  }, [decodedAudio, isTrimming, trimStart, trimEnd]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Action & Status Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Left: Badges & Capability Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            Lossless 16-bit WAV
          </span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Client-Side Private • Zero Server Uploads</span>
          </div>
        </div>

        {/* Right: History & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>History</span>
            {historyList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-500 text-white font-mono">
                {historyList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Upload & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Video Player */}
        <div className="lg:col-span-5 space-y-6">
          {/* Video Dropzone & Loaded Card */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-500" />
                <span>Source Video File</span>
              </h2>
              {videoFile && (
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setDecodedAudio(null);
                    setExtractedResult(null);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {!videoFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Click to upload or drag & drop video
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Supports MP4, WebM, MOV, MKV, AVI. Decoded 100% locally in your browser.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isGeneratingSample}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSampleVideo();
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
                    >
                      {isGeneratingSample ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Sample Video...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Try Sample Synthwave Video (with Music)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Embedded Video Preview Player */}
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner">
                  <video
                    ref={videoPreviewRef}
                    src={videoFile.url}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Video Metadata Pills */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {videoFile.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {videoFile.formattedSize}
                    </span>
                    <span>•</span>
                    <span>{formatTime(videoFile.duration)}</span>
                    {videoFile.width > 0 && (
                      <>
                        <span>•</span>
                        <span>{videoFile.width} × {videoFile.height} px</span>
                      </>
                    )}
                    {decodedAudio && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {decodedAudio.sampleRate} Hz ({decodedAudio.numberOfChannels === 1 ? 'Mono' : 'Stereo'})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Video loaded and audio demuxed</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Replace Video
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.mkv,.avi"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {isLoadingVideo && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-indigo-600 dark:text-indigo-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Demuxing video container and reading audio streams...</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Audio Mastering & Channels Box */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Audio Mastering & Channel Controls</span>
            </h2>

            {/* Channels Switch: Stereo vs Mono */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Output Channels
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setChannels('stereo')}
                  className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                    channels === 'stereo'
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  Stereo (2 Channels)
                </button>
                <button
                  type="button"
                  onClick={() => setChannels('mono')}
                  className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                    channels === 'mono'
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  Mono (1 Channel Downmix)
                </button>
              </div>
            </div>

            {/* Volume Boost Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Volume Gain</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>50% (-6dB)</span>
                <span>Normal (100%)</span>
                <span>Boost 250% (+8dB)</span>
              </div>
            </div>

            {/* Peak Normalization Checkbox */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={normalize}
                  onChange={(e) => setNormalize(e.target.checked)}
                  className="rounded mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Smart Peak Normalization (-0.2 dBFS)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automatically maximizes dynamic range and volume without clipping or distortion.
                  </p>
                </div>
              </label>
            </div>

            {/* Fade In & Fade Out Sliders */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Fade In</span>
                  <span className="font-mono">{fadeIn}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={fadeIn}
                  onChange={(e) => setFadeIn(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Fade Out</span>
                  <span className="font-mono">{fadeOut}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={fadeOut}
                  onChange={(e) => setFadeOut(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Waveform Trimmer, Visualizer & Results */}
        <div className="lg:col-span-7 space-y-6">
          {/* Waveform Visualizer & Trimmer Card */}
          <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Audio Waveform & Range Trimmer
                </h2>
              </div>

              {/* Trim Range Toggle */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsTrimming((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                    isTrimming
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>{isTrimming ? 'Trim Active' : 'Trim Audio Segment'}</span>
                </button>
              </div>
            </div>

            {/* Waveform Canvas Viewport */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 p-4 border border-slate-800">
              {decodedAudio ? (
                <div className="space-y-3">
                  <canvas
                    ref={waveformCanvasRef}
                    width={640}
                    height={120}
                    className="w-full h-28 cursor-pointer rounded"
                  />

                  {/* Waveform Time Marks */}
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 select-none">
                    <span>00:00.0</span>
                    <span>{formatTime(decodedAudio.duration / 2, true)}</span>
                    <span>{formatTime(decodedAudio.duration, true)}</span>
                  </div>
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                  <Music className="w-8 h-8 opacity-30" />
                  <p>Upload a video or try the sample to visualize sound waveforms</p>
                </div>
              )}
            </div>

            {/* Interactive Trimmer Range Controls */}
            {isTrimming && decodedAudio && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Selected Segment Duration:
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatTime(selectedDuration, true)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 font-medium">Start Marker (s)</label>
                    <input
                      type="range"
                      min="0"
                      max={decodedAudio.duration}
                      step="0.1"
                      value={trimStart}
                      onChange={(e) => setTrimStart(Math.min(parseFloat(e.target.value), trimEnd - 0.2))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="text-right text-[11px] font-mono text-emerald-500 font-bold">
                      {formatTime(trimStart, true)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 font-medium">End Marker (s)</label>
                    <input
                      type="range"
                      min="0"
                      max={decodedAudio.duration}
                      step="0.1"
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(Math.max(parseFloat(e.target.value), trimStart + 0.2))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <div className="text-right text-[11px] font-mono text-rose-500 font-bold">
                      {formatTime(trimEnd, true)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button: Extract Audio */}
            <div>
              <button
                type="button"
                disabled={!decodedAudio || isExtracting}
                onClick={handleExtractAudio}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  !decodedAudio || isExtracting
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 active:scale-[0.99]'
                }`}
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Audio Track ({progressInfo.percent}%)...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>
                      {isTrimming
                        ? `Extract Selected Audio Segment (${formatTime(selectedDuration)})`
                        : `Extract Full Audio Track (${formatTime(decodedAudio?.duration || 0)})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted Audio Results Dashboard */}
          {extractedResult && (
            <div className="bg-white dark:bg-[#111622] rounded-2xl border border-indigo-500/40 p-6 shadow-md space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Audio Extraction Complete</span>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Lossless WAV
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ready for download, playback, or importing into your digital audio workstation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Tab</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAudio}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download WAV File</span>
                  </button>
                </div>
              </div>

              {/* Native Audio Preview Player */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Preview Extracted Audio Track
                  </span>
                  <span className="font-mono text-slate-500">{formatTime(extractedResult.duration)}</span>
                </div>
                <audio
                  ref={audioPreviewRef}
                  src={extractedResult.url}
                  controls
                  className="w-full h-10"
                  onPlay={() => setIsPlayingAudio(true)}
                  onPause={() => setIsPlayingAudio(false)}
                  onEnded={() => setIsPlayingAudio(false)}
                  onTimeUpdate={(e) => {
                    const base = isTrimming ? trimStart : 0;
                    setAudioCurrentTime(base + e.currentTarget.currentTime);
                  }}
                />
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">Video Size</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {videoFile?.formattedSize}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">Extracted Audio</p>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {extractedResult.formattedSize}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">Channels</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {extractedResult.channels}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">Sample Rate</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {extractedResult.sampleRate} Hz
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Audio Extractions
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {historyList.length > 0 && (
                  <button
                    onClick={() => {
                      clearAudioExtractionHistory();
                      setHistoryList([]);
                      notify('Extraction history cleared.', 'info');
                    }}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {historyList.length === 0 ? (
                <div className="py-12 text-center space-y-2 text-slate-400 text-xs">
                  <History className="w-8 h-8 mx-auto opacity-30" />
                  <p>No audio extraction history recorded yet.</p>
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{item.duration}</span>
                        <span>•</span>
                        <span className="font-medium text-indigo-500">{item.channels}</span>
                        <span>•</span>
                        <span>{item.format}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-emerald-500 font-bold font-mono">{item.audioSize}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
