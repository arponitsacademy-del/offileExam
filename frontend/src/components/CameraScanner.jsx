import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Upload, CheckCircle2, AlertCircle, FlipHorizontal, Zap, ZapOff, Image as ImageIcon } from 'lucide-react';

export default function CameraScanner({ onCapture, isProcessing = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // Prefer rear camera
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraActive(false);

    // Stop existing stream if running
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported by your browser. Please use the image upload fallback.");
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }

      // Check if torch/flashlight is supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      setHasTorch(!!capabilities.torch);

    } catch (err) {
      console.error("Camera access error:", err);
      let msg = "Could not access camera. Please check camera permissions or use the upload fallback.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Camera permission denied. Please allow camera access in your browser settings or select an image file.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "No compatible camera found on this device. Please select an image file to scan.";
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Toggle rear/front camera
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn("Torch failed:", e);
    }
  };

  // Capture snapshot from live stream
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Use actual video native dimensions for high recognition precision
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedDataUrl(url);
      }
    }, 'image/jpeg', 0.92);
  };

  // Retake photo
  const retakePhoto = () => {
    if (capturedDataUrl) {
      URL.revokeObjectURL(capturedDataUrl);
    }
    setCapturedBlob(null);
    setCapturedDataUrl(null);
  };

  // Confirm and send image to handler
  const confirmUpload = () => {
    if (capturedBlob && onCapture) {
      onCapture(capturedBlob);
    }
  };

  // Fallback file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedBlob(file);
      const url = URL.createObjectURL(file);
      setCapturedDataUrl(url);
    }
  };

  return (
    <div className="w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
      {/* Viewfinder Header */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-md flex items-center justify-between z-10 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {capturedDataUrl ? "Review Snapshot" : "Live Scanner Viewfinder"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {hasTorch && !capturedDataUrl && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-xl text-xs transition-colors ${
                torchOn ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle Flashlight"
            >
              {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          {!capturedDataUrl && (
            <button
              onClick={toggleFacingMode}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Switch Camera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-colors"
            title="Upload from gallery"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-[11px] hidden sm:inline">Gallery</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Main Camera / Preview Area */}
      <div className="relative aspect-[3/4] sm:aspect-[4/3] w-full bg-black flex items-center justify-center overflow-hidden">
        
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 1. Captured Photo Preview */}
        {capturedDataUrl ? (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <img 
              src={capturedDataUrl} 
              alt="Captured OMR Sheet" 
              className="max-h-full max-w-full object-contain"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-base font-bold text-white">Analyzing OMR Sheet...</p>
                  <p className="text-xs text-slate-400 mt-1">Computer vision perspective warp & bubble evaluation</p>
                </div>
              </div>
            )}
          </div>
        ) : cameraError ? (
          /* 2. Camera Error / Permission Fallback */
          <div className="p-8 text-center max-w-md">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Camera Unavailable</h3>
            <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">{cameraError}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={startCamera}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20"
              >
                <Upload className="w-4 h-4" />
                <span>Upload OMR Photo</span>
              </button>
            </div>
          </div>
        ) : (
          /* 3. Live Video Viewfinder with Visual Reticle */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* OMR Alignment Target Reticle */}
            <div className="absolute inset-6 sm:inset-12 border-2 border-dashed border-emerald-400/60 rounded-3xl pointer-events-none flex flex-col justify-between p-4 transition-all animate-pulse-ring">
              {/* 4 Corner Markers Guide */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              </div>
              <div className="text-center py-2 bg-slate-950/60 rounded-full px-4 mx-auto max-w-xs backdrop-blur-md">
                <span className="text-[11px] font-semibold text-emerald-300">
                  Align all 4 corner markers inside this frame
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Viewfinder Controls Footer */}
      <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-center">
        {capturedDataUrl ? (
          <div className="flex items-center space-x-4 w-full max-w-sm">
            <button
              onClick={retakePhoto}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
            <button
              onClick={confirmUpload}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? "Processing..." : "Evaluate Sheet"}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={captureFrame}
              disabled={!cameraActive}
              className="w-18 h-18 rounded-full border-4 border-white/20 p-1 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              title="Capture OMR Sheet"
            >
              <div className="w-14 h-14 rounded-full bg-white hover:bg-emerald-400 transition-colors shadow-lg flex items-center justify-center text-slate-900">
                <Camera className="w-6 h-6" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

