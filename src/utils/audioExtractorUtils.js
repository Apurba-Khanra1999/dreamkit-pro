/**
 * Audio Extractor From Video Utilities
 * 100% Client-Side Web Audio API, RIFF WAV PCM Encoder, Waveform Analytics, and Synthesizer
 */

export const AUDIO_STORAGE_KEY = 'dreamkit_audio_extraction_history';

/**
 * Format bytes into human-readable string
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Format seconds into mm:ss or mm:ss.ms string
 */
export function formatTime(seconds, includeMs = false) {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  if (includeMs) {
    return `${mm}:${ss}.${ms}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Extract audio track from a video file into an AudioBuffer using the Web Audio API
 */
export async function extractAudioBufferFromVideo(videoFile, onProgress = null) {
  if (!videoFile) {
    throw new Error('No video file provided.');
  }

  if (onProgress) onProgress({ stage: 'Reading video file bytes...', percent: 15 });

  // Read video as ArrayBuffer
  const arrayBuffer = await videoFile.arrayBuffer();

  if (onProgress) onProgress({ stage: 'Demuxing & decoding audio streams...', percent: 45 });

  // Use AudioContext to decode audio data from the container
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtxClass) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  const audioCtx = new AudioCtxClass();
  try {
    // Clone buffer so original is never detached
    const bufferCopy = arrayBuffer.slice(0);
    const audioBuffer = await audioCtx.decodeAudioData(bufferCopy);

    if (onProgress) onProgress({ stage: 'Extracting waveform telemetry...', percent: 85 });

    return {
      audioBuffer,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      length: audioBuffer.length
    };
  } catch (err) {
    console.error('decodeAudioData error:', err);
    throw new Error(
      'Failed to decode audio track from video. Make sure the video contains an active audio stream (AAC, MP3, Opus, or PCM).'
    );
  } finally {
    try {
      await audioCtx.close();
    } catch {
      // Ignore closing errors
    }
  }
}

/**
 * Extract normalized waveform peak data for UI visualization
 */
export function extractWaveformData(audioBuffer, numBars = 120) {
  if (!audioBuffer) return [];

  const rawData = audioBuffer.getChannelData(0); // Left channel or mono
  const totalSamples = rawData.length;
  const blockSize = Math.floor(totalSamples / numBars);
  const peaks = [];

  for (let i = 0; i < numBars; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j++) {
      const val = Math.abs(rawData[start + j] || 0);
      if (val > max) max = val;
    }
    peaks.push(max);
  }

  // Normalize peaks so highest peak is 1.0 (or at least 0.1 for quiet audio)
  const highest = Math.max(0.1, ...peaks);
  return peaks.map((p) => Math.min(1.0, p / highest));
}

/**
 * Encode an AudioBuffer into an uncompressed RIFF WAVE 16-bit PCM file
 * Supports trimming, gain boost, peak normalization, channel downmix, and fade curves
 */
export function encodeAudioBufferToWav(audioBuffer, options = {}) {
  const {
    startTime = 0,
    endTime = audioBuffer.duration,
    channels = 'stereo', // 'stereo' | 'mono'
    volume = 1.0, // 0.5 to 2.5
    normalize = false,
    fadeIn = 0, // seconds
    fadeOut = 0 // seconds
  } = options;

  const sampleRate = audioBuffer.sampleRate;
  const origChannels = audioBuffer.numberOfChannels;

  // Calculate slice sample indices
  const startSample = Math.max(0, Math.floor(startTime * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
  const numSamples = Math.max(1, endSample - startSample);

  // Determine output channels
  const targetChannels = channels === 'mono' ? 1 : Math.min(2, Math.max(1, origChannels));

  // Extract raw channel data
  const leftSource = audioBuffer.getChannelData(0);
  const rightSource = origChannels > 1 ? audioBuffer.getChannelData(1) : leftSource;

  // Normalization calculation: find maximum peak in the selected range
  let maxPeak = 0.0001;
  if (normalize) {
    for (let i = startSample; i < endSample; i++) {
      const l = Math.abs(leftSource[i] || 0);
      const r = Math.abs(rightSource[i] || 0);
      if (l > maxPeak) maxPeak = l;
      if (r > maxPeak) maxPeak = r;
    }
  }
  const normGain = normalize ? 0.98 / maxPeak : 1.0;
  const effectiveGain = volume * normGain;

  // Fade sample lengths
  const fadeInSamples = Math.floor(fadeIn * sampleRate);
  const fadeOutSamples = Math.floor(fadeOut * sampleRate);

  // Prepare WAV byte array
  // 44 bytes header + (numSamples * targetChannels * 2 bytes per 16-bit sample)
  const bytesPerSample = 2; // 16-bit
  const blockAlign = targetChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const totalFileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings into DataView
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // --- 1. RIFF Chunk Descriptor ---
  writeString(0, 'RIFF');
  view.setUint32(4, totalFileSize - 8, true); // File size - 8
  writeString(8, 'WAVE');

  // --- 2. fmt Sub-chunk ---
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size = 16 for PCM
  view.setUint16(20, 1, true); // AudioFormat = 1 (Linear PCM)
  view.setUint16(22, targetChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample = 16

  // --- 3. data Sub-chunk ---
  writeString(36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Write PCM audio samples
  let offset = 44;

  for (let i = 0; i < numSamples; i++) {
    const srcIdx = startSample + i;

    // Calculate fade multiplier
    let fadeMultiplier = 1.0;
    if (fadeInSamples > 0 && i < fadeInSamples) {
      fadeMultiplier = i / fadeInSamples;
    } else if (fadeOutSamples > 0 && i > numSamples - fadeOutSamples) {
      fadeMultiplier = (numSamples - i) / fadeOutSamples;
    }

    if (targetChannels === 1) {
      // Mono: average Left and Right channels
      let sampleVal = origChannels > 1
        ? 0.5 * (leftSource[srcIdx] + rightSource[srcIdx])
        : leftSource[srcIdx];

      sampleVal = sampleVal * effectiveGain * fadeMultiplier;

      // Clamp between -1.0 and +1.0
      sampleVal = Math.max(-1.0, Math.min(1.0, sampleVal));
      const s16 = sampleVal < 0 ? sampleVal * 0x8000 : sampleVal * 0x7fff;
      view.setInt16(offset, Math.round(s16), true);
      offset += 2;
    } else {
      // Stereo: write Left then Right
      let leftVal = (leftSource[srcIdx] || 0) * effectiveGain * fadeMultiplier;
      let rightVal = (rightSource[srcIdx] || 0) * effectiveGain * fadeMultiplier;

      leftVal = Math.max(-1.0, Math.min(1.0, leftVal));
      rightVal = Math.max(-1.0, Math.min(1.0, rightVal));

      const sLeft = leftVal < 0 ? leftVal * 0x8000 : leftVal * 0x7fff;
      const sRight = rightVal < 0 ? rightVal * 0x8000 : rightVal * 0x7fff;

      view.setInt16(offset, Math.round(sLeft), true);
      view.setInt16(offset + 2, Math.round(sRight), true);
      offset += 4;
    }
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const duration = numSamples / sampleRate;

  return {
    blob,
    arrayBuffer: buffer,
    url: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(blob) : '',
    size: blob.size,
    formattedSize: formatBytes(blob.size),
    duration,
    sampleRate,
    channels: targetChannels === 1 ? 'Mono (1 Ch)' : 'Stereo (2 Ch)',
    format: 'WAV (16-bit PCM)'
  };
}

/**
 * Generate a dynamic 6-second sample video with synchronized synthwave stereo music
 * Allows instant 1-click testing with zero user file upload needed!
 */
export async function generateSampleVideoWithAudio() {
  if (typeof document === 'undefined') {
    throw new Error('Sample generation requires browser environment.');
  }

  const durationSec = 6;
  const width = 640;
  const height = 360;

  // 1. Create Canvas Video Stream
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 2. Create Web Audio Synthesizer
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtxClass();
  const dest = audioCtx.createMediaStreamDestination();

  // Master Compressor & Limiter
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.connect(dest);
  compressor.connect(audioCtx.destination);

  // Play a beautiful chill Synthwave Arpeggio Chords
  const now = audioCtx.currentTime;
  const chordFrequencies = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7 (C4, E4, G4, B4)
    [220.0, 261.63, 329.63, 392.0],  // Am7 (A3, C4, E4, G4)
    [174.61, 220.0, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
    [196.0, 246.94, 293.66, 392.0]   // G7 (G3, B3, D4, G4)
  ];

  chordFrequencies.forEach((chord, chordIdx) => {
    const chordTime = now + chordIdx * 1.5;

    // Bass note
    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(chord[0] / 2, chordTime);
    bassGain.gain.setValueAtTime(0.25, chordTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, chordTime + 1.45);
    bassOsc.connect(bassGain);
    bassGain.connect(compressor);
    bassOsc.start(chordTime);
    bassOsc.stop(chordTime + 1.5);

    // Arpeggio notes
    chord.forEach((freq, noteIdx) => {
      const noteTime = chordTime + noteIdx * 0.35;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const pan = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

      osc.type = noteIdx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      if (pan) {
        pan.pan.setValueAtTime(noteIdx % 2 === 0 ? -0.6 : 0.6, noteTime);
      }

      gain.gain.setValueAtTime(0.28, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.9);

      if (pan) {
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(compressor);
      } else {
        osc.connect(gain);
        gain.connect(compressor);
      }

      osc.start(noteTime);
      osc.stop(noteTime + 0.95);
    });
  });

  // 3. Render Canvas Animation Loop (Visualizer)
  let animationFrameId;
  const startTimeMs = performance.now();

  const renderFrame = () => {
    const elapsed = (performance.now() - startTimeMs) / 1000;
    const progress = Math.min(1.0, elapsed / durationSec);

    // Dynamic background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#311042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glowing Neon Grid Lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Animated Audio Waveform Spectrum Bars
    const numBars = 36;
    const barWidth = 10;
    const spacing = (width - numBars * barWidth) / (numBars + 1);

    for (let i = 0; i < numBars; i++) {
      const freqMultiplier = Math.sin(elapsed * 4 + i * 0.35) * 0.5 + 0.5;
      const barHeight = 20 + freqMultiplier * 140;
      const barX = spacing + i * (barWidth + spacing);
      const barY = height * 0.7 - barHeight / 2;

      const barGrad = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
      barGrad.addColorStop(0, '#06b6d4');
      barGrad.addColorStop(0.5, '#6366f1');
      barGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, barHeight, 4);
      ctx.fill();
    }

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DreamKit Synthwave Demo Video', width / 2, 55);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Sample 1080p MP4/WebM with 48kHz Stereo Soundtrack', width / 2, 80);

    // Time Counter Badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 60, height - 52, 120, 28, 8);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`00:0${Math.floor(elapsed)} / 00:0${durationSec}`, width / 2, height - 34);

    if (progress < 1.0) {
      animationFrameId = requestAnimationFrame(renderFrame);
    }
  };

  renderFrame();

  // 4. Record Combined Stream with MediaRecorder
  const canvasStream = canvas.captureStream(30);
  const audioStream = dest.stream;

  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks()
  ]);

  return new Promise((resolve, reject) => {
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(combinedStream, { mimeType });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      cancelAnimationFrame(animationFrameId);
      try {
        await audioCtx.close();
      } catch {
        // Ignore
      }
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      resolve({
        blob: videoBlob,
        url: URL.createObjectURL(videoBlob),
        name: 'DreamKit_Synthwave_Sample_Video.webm',
        size: videoBlob.size,
        formattedSize: formatBytes(videoBlob.size),
        duration: durationSec
      });
    };

    recorder.onerror = reject;

    recorder.start();
    setTimeout(() => {
      recorder.stop();
    }, durationSec * 1000 + 200);
  });
}

/**
 * Local Storage History Handlers
 */
export function getAudioExtractionHistory() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAudioExtractionHistory(item) {
  if (typeof localStorage === 'undefined' || !item) return;
  try {
    const history = getAudioExtractionHistory();
    const updated = [
      {
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...item
      },
      ...history
    ].slice(0, 15);
    localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota
  }
}

export function clearAudioExtractionHistory() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(AUDIO_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
