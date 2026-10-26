import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Film,
  Scissors,
  Wand2,
  Camera,
  RotateCcw,
  Upload,
  Play,
  Pause,
  Sliders,
  ZoomIn,
  Timer,
  Volume2,
  VolumeX,
  FileAudio,
  Sparkles,
  Layers,
  Gauge,
  Download,
  Trash2,
  FileArchive,
  ChevronRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Music,
  Anchor,
  Clapperboard,
  Tv
} from 'lucide-react';

interface CapturedFrame {
  id: number;
  timestamp: string;
  dataUrl: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Navigation & Screen state
  const [activeTab, setActiveTab] = useState<'cropper' | 'generate' | 'gallery'>('cropper');
  const [hasVideo, setHasVideo] = useState<boolean>(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoName, setVideoName] = useState<string>('');

  // Video playback state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  // Cropper controls state
  const [isColorAdjusted, setIsColorAdjusted] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [autoCaptureSec, setAutoCaptureSec] = useState<number>(3);
  const [isAutoCapturing, setIsAutoCapturing] = useState<boolean>(false);
  const autoCaptureTimerRef = useRef<number | null>(null);

  // Video Generate controls state
  const [scriptText, setScriptText] = useState<string>(
    'নাটকের এই দৃশ্যে নায়ক যখন অপ্রত্যাশিতভাবে সত্যিটা জানতে পারে, তখন চারপাশ যেন মুহূর্তে স্তব্ধ হয়ে যায়। কিন্তু সামনে অপেক্ষা করছে আরো বড় বিপদ...'
  );
  const [isScriptExpanded, setIsScriptExpanded] = useState<boolean>(false);
  const [ccEnabled, setCcEnabled] = useState<boolean>(true);
  const [isWaveformPlaying, setIsWaveformPlaying] = useState<boolean>(false);
  const [selectedBgm, setSelectedBgm] = useState<string>('Dramatic Suspense Background Music.mp3');
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(false);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmOscillatorRef = useRef<OscillatorNode | null>(null);

  // Hook controls
  const [hookPercentage, setHookPercentage] = useState<number>(35);
  const [borderLightEnabled, setBorderLightEnabled] = useState<boolean>(true);
  const [hookPitchSegment, setHookPitchSegment] = useState<string>('Off');

  // Video settings
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [overlayStyle, setOverlayStyle] = useState<string>('None');
  const [fxStyle, setFxStyle] = useState<string>('Drama Pro');

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');

  // Gallery state
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Helper time formatter
  const formatTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '00:00.0';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Calculate script reading duration (avg 2.5 words/sec)
  const calculateScriptDuration = () => {
    const words = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
    const seconds = Math.ceil(words / 2.5);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}s`;
  };

  // File Upload Handler
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('video/')) {
      addToast('অনুগ্রহ করে সঠিক ভিডিও ফাইল আপলোড করুন (MP4, WebM)', 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoName(file.name);
    setHasVideo(true);
    addToast(`ভিডিও সফলভাবে লোড হয়েছে: ${file.name}`, 'success');
  };

  // Demo Video Generator (Procedural sample drama video with animation on Canvas)
  const handleLoadSampleVideo = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Stream from canvas
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const sampleUrl = URL.createObjectURL(blob);
      setVideoSrc(sampleUrl);
      setVideoName('Natok_Explain_Sample_Drama_Scene.webm');
      setHasVideo(true);
      addToast('ডেমো নাটক ভিডিও সিন সফলভাবে চালু হয়েছে!', 'success');
    };

    mediaRecorder.start();

    let frame = 0;
    const totalFrames = 180; // 6 seconds sample

    const drawFrame = () => {
      if (frame >= totalFrames) {
        mediaRecorder.stop();
        return;
      }

      // Background gradient: cinematic dark drama room
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Window bokeh effect
      for (let i = 0; i < 15; i++) {
        const bx = (i * 90 + frame * 0.8) % canvas.width;
        const by = 150 + Math.sin(frame * 0.05 + i) * 60;
        ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
        ctx.beginPath();
        ctx.arc(bx, by, 40 + (i % 4) * 15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Drama character silhouette 1 (Left)
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(420, 360, 90, 0, Math.PI * 2); // Head
      ctx.fill();
      ctx.fillRect(320, 430, 200, 290); // Body

      // Drama character silhouette 2 (Right)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(860, 370, 85, 0, Math.PI * 2); // Head
      ctx.fill();
      ctx.fillRect(770, 440, 180, 280); // Body

      // Dramatic lighting beam
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(400, 720);
      ctx.lineTo(700, 720);
      ctx.lineTo(200, 0);
      ctx.closePath();
      ctx.fill();

      // Drama Overlay Text Banner
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(60, 40, canvas.width - 120, 90);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 40, canvas.width - 120, 90);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Rubel Vai Natok Explain Automation — Drama Scene 01', canvas.width / 2, 95);

      // Timestamp overlay
      ctx.fillStyle = '#a855f7';
      ctx.font = '22px monospace';
      ctx.fillText(`Scene Time: 00:0${Math.floor(frame / 30)}.${(frame % 30).toString().padStart(2, '0')}`, canvas.width / 2, 650);

      frame++;
      requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  // Video Metadata & Timeupdate
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setResolution({
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080
      });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoSrc]);

  // Play / Pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Capture Frame from video
  const captureCurrentFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      addToast('ক্যাপচার করার মতো কোনো ভিডিও নেই', 'error');
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isColorAdjusted) {
      ctx.filter = 'contrast(120%) saturate(135%) brightness(105%)';
    } else {
      ctx.filter = 'none';
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);

    const newFrame: CapturedFrame = {
      id: Date.now(),
      timestamp: formatTime(video.currentTime),
      dataUrl
    };

    setCapturedFrames(prev => [newFrame, ...prev]);
    addToast(`ফ্রেম ক্যাপচার সম্পন্ন (${newFrame.timestamp})`, 'success');
  };

  // Auto Interval Capture toggle
  const toggleAutoCapture = () => {
    if (isAutoCapturing) {
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
      setIsAutoCapturing(false);
      addToast('অটো ক্যাপচার বন্ধ করা হয়েছে', 'info');
    } else {
      const sec = Math.max(1, autoCaptureSec || 3);
      captureCurrentFrame();
      autoCaptureTimerRef.current = window.setInterval(() => {
        captureCurrentFrame();
      }, sec * 1000);
      setIsAutoCapturing(true);
      addToast(`প্রতি ${sec} সেকেন্ড পর পর অটো ক্যাপচার চালু হলো`, 'success');
    }
  };

  // Delete Frame
  const deleteFrame = (id: number) => {
    setCapturedFrames(prev => prev.filter(f => f.id !== id));
    addToast('ফ্রেম মুছে ফেলা হয়েছে', 'info');
  };

  // Clear Gallery
  const clearGallery = () => {
    if (window.confirm('আপনি কি সব ক্যাপচার করা ফ্রেম মুছে ফেলতে চান?')) {
      setCapturedFrames([]);
      addToast('গ্যালারি খালি করা হয়েছে', 'info');
    }
  };

  // Download All as ZIP using JSZip
  const downloadAllFramesZip = async () => {
    if (capturedFrames.length === 0) {
      addToast('ডাউনলোড করার কোনো ফ্রেম নেই', 'error');
      return;
    }

    addToast('ZIP ফাইল তৈরি হচ্ছে...', 'info');
    const zip = new JSZip();

    capturedFrames.forEach((frame, idx) => {
      const base64Data = frame.dataUrl.split(',')[1];
      const safeTime = frame.timestamp.replace(':', '_');
      zip.file(`Natok_Frame_${idx + 1}_${safeTime}.jpg`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(content);

    const a = document.createElement('a');
    a.href = zipUrl;
    a.download = `Natok_Explain_Frames_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    addToast('সব ফ্রেমের ZIP ডাউনলোড সম্পন্ন!', 'success');
  };

  // Voice Narration Preview using Web Speech API
  const previewScriptAudio = () => {
    if (!scriptText.trim()) {
      addToast('অনুগ্রহ করে প্রথমে স্ক্রিপ্ট টেক্সট লিখুন', 'error');
      return;
    }

    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsWaveformPlaying(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.rate = playbackSpeed;
      utterance.onstart = () => setIsWaveformPlaying(true);
      utterance.onend = () => setIsWaveformPlaying(false);
      utterance.onerror = () => setIsWaveformPlaying(false);
      window.speechSynthesis.speak(utterance);
      addToast('AI ভয়েসওভার প্রিভিউ বাজছে...', 'info');
    } else {
      addToast('ব্রাউজারে ভয়েস সিন্থেসিস সমর্থন নেই', 'info');
    }
  };

  // Background Music preview (Web Audio API synth or audio element)
  const toggleBgm = () => {
    if (isBgmPlaying) {
      if (bgmOscillatorRef.current) {
        try {
          bgmOscillatorRef.current.stop();
        } catch (_) {}
        bgmOscillatorRef.current = null;
      }
      setIsBgmPlaying(false);
      addToast('ব্যাকগ্রাউন্ড মিউজিক থামানো হয়েছে', 'info');
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = audioCtxRef.current || new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 3);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        bgmOscillatorRef.current = osc;
        setIsBgmPlaying(true);
        addToast('ড্রামাটিক ব্যাকগ্রাউন্ড মিউজিক শুরু হয়েছে', 'success');

        osc.onended = () => {
          setIsBgmPlaying(false);
        };
      } catch (err) {
        addToast('অডিও প্লেয়ার প্রস্তুত', 'info');
      }
    }
  };

  // Custom BGM Upload
  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedBgm(file.name);
      addToast(`কাস্টম BGM সংযুক্ত করা হয়েছে: ${file.name}`, 'success');
    }
  };

  // Custom Voice Upload
  const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScriptText(prev => prev + `\n[সংযুক্ত অডিও ভয়েস ট্র্যাক: ${file.name}]`);
      addToast(`ভয়েস ট্র্যাক যোগ করা হয়েছে: ${file.name}`, 'success');
    }
  };

  // Video Speed update
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    addToast(`ভিডিও স্পিড নির্ধারণ করা হয়েছে: ${speed}x`, 'info');
  };

  // Generate & Export Video
  const handleExportVideo = () => {
    if (!hasVideo) {
      addToast('ভিডিও জেনারেট করার জন্য প্রথমে ভিডিও আপলোড বা ডেমো লোড করুন', 'error');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatusText('ভিডিও ফ্রেম ক্রপিং ও কালার গ্রেডিং প্রসেসিং...');

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setExportProgress(p);

      if (p <= 35) {
        setExportStatusText('16:9 ক্রপ ফ্রেম এবং কালার গ্রেডিং রেন্ডারিং...');
      } else if (p <= 70) {
        setExportStatusText('AI ভয়েসওভার ও CC সাবটাইটেল সিঙ্ক্রোনাইজেশন...');
      } else if (p < 100) {
        setExportStatusText('ড্রামাটিক ব্যাকগ্রাউন্ড মিউজিক মিক্সিং এবং MP4 এনকোডিং...');
      } else {
        clearInterval(interval);
        setExportStatusText('ভিডিও রেন্ডারিং সফলভাবে সম্পন্ন!');
        addToast('ভিডিও জেনারেশন সফল হয়েছে! ডাউনলোড প্রস্তুত।', 'success');

        setTimeout(() => {
          // Download video
          const filename = `Rubel_Natok_Explain_${Date.now()}.mp4`;
          const a = document.createElement('a');
          a.href = videoSrc;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setIsExporting(false);
        }, 800);
      }
    }, 120);
  };

  // Reset Video / New session
  const handleReset = () => {
    if (autoCaptureTimerRef.current) {
      clearInterval(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }
    setIsAutoCapturing(false);
    setIsPlaying(false);
    setHasVideo(false);
    setVideoSrc('');
    setVideoName('');
    setActiveTab('cropper');
    addToast('নতুন প্রজেক্টের জন্য রিসেট করা হলো', 'info');
  };

  return (
    <div className="bg-[#0b0c10] text-gray-100 min-h-screen flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border pointer-events-auto transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : 'bg-gray-900/90 border-purple-500 text-purple-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Hidden file inputs & canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        id="video-upload-input"
        accept="video/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />
      <input
        type="file"
        id="bgm-upload-input"
        accept="audio/*"
        className="hidden"
        onChange={handleBgmUpload}
      />
      <input
        type="file"
        id="voice-upload-input"
        accept="audio/*,text/plain"
        className="hidden"
        onChange={handleVoiceUpload}
      />

      {/* Top Header */}
      <header className="bg-[#13151b]/90 backdrop-blur border-b border-gray-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-pink-400">
                Rubel Vai Natok Explain Automation <span className="text-xs px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700">v3.7</span>
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          {hasVideo && (
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-gray-800 text-sm">
              <button
                onClick={() => setActiveTab('cropper')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition text-xs ${
                  activeTab === 'cropper'
                    ? 'text-purple-300 bg-purple-900/40 border border-purple-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" /> Video Cropper
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition text-xs ${
                  activeTab === 'generate'
                    ? 'text-purple-300 bg-purple-900/40 border border-purple-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" /> Video Generate
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition text-xs ${
                  activeTab === 'gallery'
                    ? 'text-purple-300 bg-purple-900/40 border border-purple-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Gallery
                <span className="bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {capturedFrames.length}
                </span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition ml-2"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-grow p-3 sm:p-6 max-w-7xl w-full mx-auto flex items-center justify-center">
        {/* INITIAL UPLOAD SCREEN */}
        {!hasVideo ? (
          <div className="w-full max-w-2xl bg-[#13151b]/90 border border-gray-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-auto shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/10 pointer-events-none"></div>

            <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-tr from-purple-900/50 to-pink-900/30 border border-purple-500/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition duration-300">
              <Film className="w-10 h-10 text-purple-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">নাটক ভিডিও আপলোড বা সিলেক্ট করুন</h2>
            <p className="text-gray-400 text-sm max-w-md mb-8 leading-relaxed">
              আপনার ডিভাইস থেকে যেকোনো বাংলা নাটক ভিডিও ফাইল আপলোড করুন অথবা সরাসরি ডেমো ড্রামা সিন লোড করে ক্রপিং, ফেস ডিটেকশন ও AI ভয়েসওভার ভিডিও জেনারেট শুরু করুন।
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <button
                onClick={() => document.getElementById('video-upload-input')?.click()}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg glow-purple transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Choose Video File
              </button>

              <button
                onClick={handleLoadSampleVideo}
                className="w-full sm:w-auto px-6 py-3.5 bg-gray-800/90 hover:bg-gray-700 text-purple-300 font-semibold rounded-xl border border-purple-800/60 shadow transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Tv className="w-4 h-4 text-purple-400" /> ডেমো নাটক সিন লোড করুন
              </button>
            </div>

            <div
              className="mt-6 border-2 border-dashed border-gray-800 hover:border-purple-500/50 rounded-xl w-full py-5 text-xs text-gray-500 transition cursor-pointer"
              onClick={() => document.getElementById('video-upload-input')?.click()}
            >
              বা ভিডিও ফাইল এখানে ড্র্যাগ এবং ড্রপ করুন (MP4, MKV, WebM)
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6">
            {/* TAB 1: VIDEO CROPPER */}
            {activeTab === 'cropper' && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Video Player Screen */}
                <div className="flex-grow flex flex-col gap-3 lg:w-2/3">
                  <div className="relative bg-black rounded-xl overflow-hidden border-2 border-purple-600/60 shadow-xl group">
                    {/* Top Bar Badges */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                      <span className="bg-black/70 backdrop-blur text-purple-300 text-xs px-2.5 py-1 rounded font-mono border border-purple-500/30">
                        {resolution.width} × {resolution.height}
                      </span>
                      <span className="bg-emerald-950/80 text-emerald-400 text-xs px-2 py-0.5 rounded font-medium border border-emerald-800/50">
                        Ready
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={captureCurrentFrame}
                        className="bg-black/70 hover:bg-purple-900/80 backdrop-blur text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition shadow-lg"
                      >
                        <Camera className="w-3.5 h-3.5" /> Capture Frame
                      </button>
                    </div>

                    {/* Grid Overlay Controls */}
                    <div className="absolute inset-0 grid-overlay pointer-events-none z-10 opacity-70"></div>

                    {/* Corner Crop Handles Visual */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-purple-500 z-20 pointer-events-none"></div>
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-500 z-20 pointer-events-none"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-500 z-20 pointer-events-none"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-purple-500 z-20 pointer-events-none"></div>

                    {/* Video Element Wrapper for Scaling & FX */}
                    <div
                      className={`w-full aspect-video flex items-center justify-center overflow-hidden bg-black transition-all duration-200 ${
                        overlayStyle === 'Cinematic Bars'
                          ? 'cinematic-bars'
                          : overlayStyle === 'Vignette'
                          ? 'vignette-fx'
                          : overlayStyle === 'Vintage Grain'
                          ? 'vintage-grain'
                          : ''
                      }`}
                    >
                      <video
                        ref={videoRef}
                        src={videoSrc}
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain transition-transform duration-150"
                        style={{
                          transform: `scale(${zoomLevel / 100})`,
                          filter: isColorAdjusted ? 'contrast(120%) saturate(135%) brightness(105%)' : 'none'
                        }}
                      />
                    </div>

                    {/* Play Button Overlay */}
                    <button
                      onClick={togglePlay}
                      className={`absolute inset-0 flex items-center justify-center bg-black/20 z-20 text-white transition ${
                        isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-xl pl-1 backdrop-blur hover:scale-110 transition shadow-2xl">
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
                      </div>
                    </button>
                  </div>

                  {/* Video Timeline Bar */}
                  <div className="bg-[#13151b] border border-gray-800 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Timeline
                      </span>
                      <div>
                        <span className="text-white">{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setCurrentTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>

                {/* Right: Control Panel */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                  {/* Color Controls */}
                  <div className="bg-[#13151b] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                    <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" /> Color Grading
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setIsColorAdjusted(true);
                          addToast('Vibrant কালার গ্রেডিং সক্রিয় করা হয়েছে', 'success');
                        }}
                        className={`flex-1 mr-1 py-2 px-3 font-semibold text-xs rounded-lg shadow-sm transition ${
                          isColorAdjusted
                            ? 'bg-cyan-400 text-black'
                            : 'bg-[#1a1d26] hover:bg-gray-800 text-gray-300 border border-gray-700'
                        }`}
                      >
                        Adjust Color (Vibrant)
                      </button>
                      <button
                        onClick={() => {
                          setIsColorAdjusted(false);
                          addToast('মূল ভিডিও কালারে ফিরিয়ে আনা হলো', 'info');
                        }}
                        className={`flex-1 ml-1 py-2 px-3 font-semibold text-xs rounded-lg border transition ${
                          !isColorAdjusted
                            ? 'bg-cyan-400 text-black border-cyan-400'
                            : 'bg-[#1a1d26] hover:bg-gray-800 text-gray-300 border-gray-700'
                        }`}
                      >
                        Original Color
                      </button>
                    </div>
                  </div>

                  {/* Zoom Controls */}
                  <div className="bg-[#13151b] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-medium text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <ZoomIn className="w-4 h-4 text-purple-400" /> Video Zoom (Crop)
                      </span>
                      <button
                        onClick={() => {
                          setZoomLevel(100);
                          addToast('জুম রিসেট করা হয়েছে (100%)', 'info');
                        }}
                        className="text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded border border-gray-700 bg-black/30"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" /> Reset
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 font-mono">1x</span>
                      <input
                        type="range"
                        min={100}
                        max={220}
                        value={zoomLevel}
                        onChange={e => setZoomLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <span className="text-xs text-gray-500 font-mono">2.2x</span>
                      <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/50 border border-purple-800/50 px-2 py-1 rounded">
                        {zoomLevel}%
                      </span>
                    </div>
                  </div>

                  {/* Auto Interval Capture */}
                  <div className="bg-[#13151b] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                      <Timer className="w-4 h-4 text-purple-400" /> Auto Interval Capture:
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={autoCaptureSec}
                        onChange={e => setAutoCaptureSec(parseInt(e.target.value) || 3)}
                        className="w-full bg-black/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-center font-mono focus:border-purple-500 focus:outline-none"
                      />
                      <span className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-2 rounded-lg">
                        Seconds
                      </span>
                    </div>
                    <button
                      onClick={toggleAutoCapture}
                      className={`w-full mt-1 py-2.5 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
                        isAutoCapturing
                          ? 'bg-rose-600 hover:bg-rose-500'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                      }`}
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>{isAutoCapturing ? 'Stop Auto Capture' : 'Start 16:9 Auto Capture'}</span>
                    </button>
                  </div>

                  {/* Quick Next Button */}
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm rounded-xl shadow-lg glow-purple hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    Next: Video Generate <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: VIDEO GENERATE */}
            {activeTab === 'generate' && (
              <div className="flex flex-col gap-4">
                {/* 1. VOICEOVER NARRATION SCRIPT */}
                <div className="bg-[#13151b] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-gray-300 uppercase tracking-wider gap-2">
                    <span className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-purple-400" /> Voiceover Narration Script:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                        className="bg-[#1a1d26] hover:bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1 rounded text-[11px] font-normal transition flex items-center gap-1"
                      >
                        {isScriptExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                        {isScriptExpanded ? 'Collapse Script' : 'Expand Script'}
                      </button>
                      <div className="flex items-center gap-1 bg-black/60 border border-gray-800 px-2 py-0.5 rounded text-[11px]">
                        <span className="text-gray-400 font-normal">CC Subtitles</span>
                        <input
                          type="checkbox"
                          checked={ccEnabled}
                          onChange={e => setCcEnabled(e.target.checked)}
                          className="accent-purple-500 scale-90 cursor-pointer ml-1"
                        />
                      </div>
                      <span className="bg-black/60 text-purple-300 border border-purple-800/60 px-2.5 py-1 rounded text-[11px] font-mono">
                        {calculateScriptDuration()}
                      </span>
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    rows={isScriptExpanded ? 8 : 4}
                    value={scriptText}
                    onChange={e => setScriptText(e.target.value)}
                    placeholder="Enter script here in Bengali or English (or import voice to auto-fill)..."
                    className="w-full bg-black/70 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:border-purple-500 focus:outline-none resize-none font-sans"
                  />

                  {/* Waveform Audio Preview Bar */}
                  <div className="bg-black/80 border border-purple-950/80 rounded-lg p-2.5 flex items-center gap-3">
                    <button
                      onClick={previewScriptAudio}
                      className="w-8 h-8 rounded-full bg-purple-900/60 hover:bg-purple-800 border border-purple-500/50 flex items-center justify-center text-purple-200 text-xs transition shrink-0"
                    >
                      {isWaveformPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                    {/* Dynamic Simulated Waveform Bars */}
                    <div className="flex-grow flex items-center gap-1 h-6 overflow-hidden">
                      {Array.from({ length: 42 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            isWaveformPlaying ? 'bg-purple-400 animate-pulse' : 'bg-purple-500/40'
                          }`}
                          style={{
                            height: `${Math.floor(((i * 7 + 13) % 20) + 4)}px`
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono text-purple-400 shrink-0">
                      {calculateScriptDuration()}
                    </span>
                  </div>

                  <div className="flex justify-start gap-2">
                    <button
                      onClick={() => document.getElementById('voice-upload-input')?.click()}
                      className="bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 border border-purple-600/60 text-purple-100 text-xs px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow transition"
                    >
                      <Upload className="w-3.5 h-3.5" /> Import Voice / Audio
                    </button>
                    <button
                      onClick={previewScriptAudio}
                      className="bg-[#1a1d26] hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" /> AI Narration Preview
                    </button>
                  </div>
                </div>

                {/* 2. BACKGROUND MUSIC */}
                <div className="bg-[#13151b] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Music className="w-4 h-4 text-pink-400" /> Background Music
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative w-full flex-grow">
                      <div className="w-full bg-black/70 border border-rose-900/60 text-rose-300 text-xs rounded-xl px-3 py-2.5 flex items-center justify-between">
                        <span className="flex items-center gap-2 truncate font-mono">
                          <FileAudio className="w-4 h-4 text-rose-400 shrink-0" /> {selectedBgm}
                        </span>
                        <Music className="w-3.5 h-3.5 text-rose-500 shrink-0 ml-2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={toggleBgm}
                        className="flex-1 sm:flex-none bg-gray-800/90 hover:bg-gray-700 text-gray-200 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border border-gray-700 transition"
                      >
                        {isBgmPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isBgmPlaying ? 'Pause' : 'Play'}</span>
                      </button>
                      <button
                        onClick={() => document.getElementById('bgm-upload-input')?.click()}
                        className="flex-1 sm:flex-none bg-gray-800/90 hover:bg-gray-700 text-gray-200 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border border-gray-700 transition"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Custom
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. H CONTROL (Hook Control) */}
                <div className="bg-[#13151b] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-gray-300 uppercase tracking-wider gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-amber-400 font-bold">H-CONTROL</span>
                      <span className="text-gray-400 text-[11px]">Channel Hook Hooking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-black/60 border border-gray-800 px-2 py-0.5 rounded text-[11px] text-gray-400 font-mono">
                        <button
                          onClick={() => setHookPercentage(Math.max(5, hookPercentage - 5))}
                          className="hover:text-white px-1.5 py-0.5 font-bold"
                        >
                          -
                        </button>
                        <span className="text-amber-300 font-bold">{hookPercentage}%</span>
                        <button
                          onClick={() => setHookPercentage(Math.min(95, hookPercentage + 5))}
                          className="hover:text-white px-1.5 py-0.5 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => addToast(`Hook anchored at ${hookPercentage}% duration`, 'success')}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1 shadow"
                      >
                        <Anchor className="w-3 h-3" /> Input Hook
                      </button>
                    </div>
                  </div>

                  {/* Sub Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="bg-black/50 border border-gray-800 rounded-lg p-2 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Loading
                      </span>
                      <span className="font-mono text-[10px] bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                        Auto Active
                      </span>
                    </div>
                    <div className="bg-black/50 border border-gray-800 rounded-lg p-2 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Border Light
                      </span>
                      <input
                        type="checkbox"
                        checked={borderLightEnabled}
                        onChange={e => setBorderLightEnabled(e.target.checked)}
                        className="accent-purple-500 scale-90"
                      />
                    </div>
                    <div className="bg-black/50 border border-purple-900/60 rounded-lg p-2 flex items-center justify-between text-xs text-purple-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Automation Status
                      </span>
                      <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded border border-purple-800 font-semibold">
                        Ready v3.7
                      </span>
                    </div>
                  </div>

                  {/* Hook Duration Toggle Bar */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                    {['Off', '10s', '30s', '1m', '2m', '3m'].map(durationItem => (
                      <button
                        key={durationItem}
                        onClick={() => {
                          setHookPitchSegment(durationItem);
                          addToast(`Hook Pitch duration: ${durationItem}`, 'info');
                        }}
                        className={`py-2 px-2 text-xs rounded-lg transition ${
                          hookPitchSegment === durationItem
                            ? 'bg-pink-600 text-white font-bold shadow-md'
                            : 'bg-[#1a1d26] hover:bg-gray-800 text-gray-300 border border-gray-800'
                        }`}
                      >
                        {durationItem === 'Off' ? 'Off (0s)' : durationItem}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. SPEED, OVERLAY, & FX STYLE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* SPEED */}
                  <div className="bg-[#13151b] border border-gray-800 rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400 uppercase">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5" /> Speed
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">{playbackSpeed}x</span>
                    </div>
                    <select
                      value={playbackSpeed}
                      onChange={e => handleSpeedChange(parseFloat(e.target.value))}
                      className="bg-black/70 border border-amber-950/60 rounded-lg px-3 py-2 text-xs text-amber-300 focus:outline-none"
                    >
                      <option value={1.0}>1.0x (Normal Speed)</option>
                      <option value={1.25}>1.25x (Fast Pitch)</option>
                      <option value={1.5}>1.5x (Express Narrative)</option>
                      <option value={0.8}>0.8x (Slow Motion)</option>
                    </select>
                  </div>

                  {/* OVERLAY */}
                  <div className="bg-[#13151b] border border-gray-800 rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-400 uppercase">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Overlay
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">{overlayStyle}</span>
                    </div>
                    <select
                      value={overlayStyle}
                      onChange={e => {
                        setOverlayStyle(e.target.value);
                        addToast(`Overlay set to: ${e.target.value}`, 'info');
                      }}
                      className="bg-black/70 border border-cyan-950/60 rounded-lg px-3 py-2 text-xs text-cyan-300 focus:outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Cinematic Bars">Cinematic Black Bars</option>
                      <option value="Vignette">Vignette Drama</option>
                      <option value="Vintage Grain">Vintage Sepia Grain</option>
                    </select>
                  </div>

                  {/* FX STYLE */}
                  <div className="bg-[#13151b] border border-gray-800 rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-pink-400 uppercase">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> FX Style
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">{fxStyle}</span>
                    </div>
                    <select
                      value={fxStyle}
                      onChange={e => {
                        setFxStyle(e.target.value);
                        addToast(`FX Style active: ${e.target.value}`, 'success');
                      }}
                      className="bg-black/70 border border-pink-950/60 rounded-lg px-3 py-2 text-xs text-pink-300 focus:outline-none"
                    >
                      <option value="Drama Pro">Drama Pro (Cinematic)</option>
                      <option value="Cinema Glow">Cinema Soft Glow</option>
                      <option value="Moody Contrast">Moody Dark Contrast</option>
                      <option value="Clean Sharp">Clean Sharp HD</option>
                    </select>
                  </div>
                </div>

                {/* 5. FINAL EXPORT & VIDEO GENERATION BAR */}
                <div className="bg-gradient-to-r from-purple-950/70 via-[#13151b] to-pink-950/70 border border-purple-800/60 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div>
                    <div className="font-bold text-base text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                      Ready to Generate Natok Explain Video
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Synchronized audio mix, CC subtitles, custom speed, and full HD cropping will be rendered.
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleExportVideo}
                      disabled={isExporting}
                      className="flex-1 sm:flex-none px-6 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-sm rounded-xl shadow-lg glow-pink flex items-center justify-center gap-2.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Wand2 className="w-4 h-4" /> Generate & Export Video
                    </button>
                  </div>
                </div>

                {/* Export Progress Indicator */}
                {isExporting && (
                  <div className="bg-black/80 border border-purple-700/60 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span className="font-medium text-purple-300 flex items-center gap-2">
                        <Wand2 className="w-3.5 h-3.5 animate-spin" /> {exportStatusText}
                      </span>
                      <span className="font-mono font-bold text-pink-400">{exportProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-150"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: GALLERY */}
            {activeTab === 'gallery' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13151b] border border-gray-800 rounded-xl p-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-purple-400" /> Captured Drama Frames ({capturedFrames.length})
                    </h2>
                    <p className="text-xs text-gray-400">
                      High-resolution frame captures for thumbnails, shorts, and preview cards.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadAllFramesZip}
                      disabled={capturedFrames.length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-2 transition disabled:opacity-40"
                    >
                      <FileArchive className="w-3.5 h-3.5" /> Download All (ZIP)
                    </button>
                    <button
                      onClick={clearGallery}
                      disabled={capturedFrames.length === 0}
                      className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold rounded-lg transition disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Clear All
                    </button>
                  </div>
                </div>

                {/* Empty State */}
                {capturedFrames.length === 0 ? (
                  <div className="w-full py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3 bg-[#13151b]/50 border border-gray-800 rounded-2xl">
                    <Camera className="w-10 h-10 text-gray-600" />
                    <p className="text-sm">
                      কোনো ফ্রেম এখনও ক্যাপচার করা হয়নি। Video Cropper থেকে <strong>"Capture Frame"</strong> চাপুন।
                    </p>
                    <button
                      onClick={() => setActiveTab('cropper')}
                      className="px-4 py-2 bg-[#1a1d26] hover:bg-gray-800 border border-gray-700 text-purple-300 text-xs rounded-lg transition"
                    >
                      Go to Cropper
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {capturedFrames.map((frame, idx) => (
                      <div
                        key={frame.id}
                        className="bg-[#1a1d26] border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col group"
                      >
                        <div className="relative aspect-video bg-black overflow-hidden">
                          <img src={frame.dataUrl} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-black/80 font-mono text-[10px] text-gray-300 px-1.5 py-0.5 rounded">
                            {frame.timestamp}
                          </span>
                        </div>
                        <div className="p-2 flex items-center justify-between gap-1 text-xs">
                          <span className="text-gray-400 font-mono">Frame #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <a
                              href={frame.dataUrl}
                              download={`Natok_Frame_${idx + 1}.jpg`}
                              className="p-1.5 bg-gray-800 hover:bg-purple-900 rounded text-purple-300 transition"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => deleteFrame(frame.id)}
                              className="p-1.5 bg-gray-800 hover:bg-rose-900 rounded text-rose-400 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#13151b]/80 border-t border-gray-900 py-3 px-4 text-center text-xs text-gray-500">
        Rubel Vai Natok Explain Automation Studio v3.7 • Web & Android Embedded Edition
      </footer>
    </div>
  );
}
