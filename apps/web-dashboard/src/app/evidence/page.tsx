"use client";

import React, { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/AuthContext";
import { useDemo } from "@/lib/DemoContext";
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Check, 
  FileText,
  Clock,
  Sparkles
} from "lucide-react";

interface UploadedEvidence {
  id: string;
  mealType: string;
  remarks: string;
  status: string;
  uploadTime: string;
  uploadDate: string;
  imageUrl: string;
}

// Preset food images for easy local testing fallback
const DEMO_PRESETS = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=80"
];

export default function EvidencePage() {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();

  const [mealType, setMealType] = useState("afternoon"); // morning, afternoon, evening, dinner
  const [remarks, setRemarks] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<UploadedEvidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const schoolId = user?.schoolId || "demo-school";

  // Load upload history
  useEffect(() => {
    async function loadHistory() {
      if (isDemoMode) {
        const stored = localStorage.getItem(`demo_evidence_history_${schoolId}`);
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } else {
        try {
          const res = await fetch(`http://localhost:4000/api/evidence/school/${schoolId}`, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
          });
          const data = await res.json();
          if (data.success) {
            setHistory(data.data);
          }
        } catch (err) {
          console.error("Failed to load live history:", err);
        }
      }
    }
    loadHistory();
  }, [isDemoMode, schoolId]);

  // Start device camera
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    setCapturedImage(null);
    setCompressedImage(null);
    setImageSize(null);
    
    try {
      const constraints = {
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      setCameraError("Camera access denied or unsupported. Using preset food options instead.");
      setCameraActive(false);
    }
  };

  // Stop device camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture frame & compress to WebP client-side
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/webp", 0.7); // 0.7 WebP compression
      setCapturedImage(dataUrl);
      
      // Calculate file size in KB
      const approxSize = Math.round((dataUrl.length * 3) / 4 / 1024);
      setImageSize(`${approxSize} KB`);
      setCompressedImage(dataUrl);
      stopCamera();
    }
  };

  // Select Preset Food Option
  const selectPreset = (url: string) => {
    setCapturedImage(url);
    setCompressedImage(url);
    setImageSize("145 KB (Simulated WebP)");
    stopCamera();
  };

  // Submit Evidence
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compressedImage) {
      setErrorMsg("Please capture a photo or select a demo preset first.");
      return;
    }

    setUploading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    
    const newUpload = {
      schoolId,
      imageUrl: compressedImage,
      remarks,
      mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1)
    };

    if (isDemoMode) {
      const demoRecord: UploadedEvidence = {
        id: `demo-ev-${Date.now()}`,
        mealType: newUpload.mealType,
        remarks: newUpload.remarks,
        status: "Submitted",
        uploadTime: timeStr,
        uploadDate: now.toDateString(),
        imageUrl: newUpload.imageUrl
      };
      
      const updatedHistory = [demoRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(`demo_evidence_history_${schoolId}`, JSON.stringify(updatedHistory));
      
      setSuccessMsg("Demo Evidence uploaded and logged successfully!");
      setRemarks("");
      setCapturedImage(null);
      setCompressedImage(null);
      setImageSize(null);
      setUploading(false);
    } else {
      try {
        const res = await fetch("http://localhost:4000/api/evidence/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(newUpload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg("Live evidence uploaded. School compliance scores updated!");
          setRemarks("");
          setCapturedImage(null);
          setCompressedImage(null);
          setImageSize(null);
          // Refresh history
          setHistory(prev => [data.data, ...prev]);
        } else {
          setErrorMsg(data.error || "Failed to submit evidence.");
        }
      } catch (err) {
        setErrorMsg("Network error submitting evidence.");
      } finally {
        setUploading(false);
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <AppShell title="Meal Evidence Center" subtitle="Verify and capture mid-day meal logs">
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Upload Form and Camera panel (Left) */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Camera className="text-gov-green" size={18} />
              <span>Evidence Photo Verification Capture</span>
            </h2>

            {/* Success and Error Alerts */}
            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-4 text-xs font-semibold text-green-800">
                <CheckCircle2 className="text-green-600 shrink-0" size={16} />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800">
                <AlertCircle className="text-red-600 shrink-0" size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Meal Slot
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55/50 p-3 text-xs font-bold text-slate-700 outline-none focus:border-gov-green focus:ring-1 focus:ring-gov-green/10"
                >
                  <option value="morning">Morning (Breakfast)</option>
                  <option value="afternoon">Afternoon (Lunch)</option>
                  <option value="evening">Evening (Snack)</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>

              {/* Photo Box */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Meal Photo Evidence (Mandatory WebP format)
                </label>
                
                <div className="relative min-h-[300px] rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden">
                  
                  {cameraActive && (
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {capturedImage && (
                    <img 
                      src={capturedImage} 
                      alt="Captured meal preview" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* Absolute camera controls */}
                  {cameraActive && (
                    <div className="absolute bottom-4 flex justify-center gap-4 z-10 w-full">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="rounded-full bg-gov-green hover:bg-emerald-800 text-white font-bold p-3.5 shadow-lg active:scale-95 transition"
                        title="Capture Frame"
                      >
                        <Check size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-3.5 shadow-lg active:scale-95 transition"
                        title="Cancel Camera"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}

                  {/* Initial state screen */}
                  {!cameraActive && !capturedImage && (
                    <div className="flex flex-col items-center p-6 text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-50 text-gov-green flex items-center justify-center">
                        <Camera size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Capture device photo log</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Device camera feed or demo food presets</p>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="rounded-xl bg-gov-green hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 shadow-sm transition active:scale-95"
                      >
                        Launch Camera
                      </button>
                    </div>
                  )}

                  {/* Preview controls */}
                  {!cameraActive && capturedImage && (
                    <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
                      {imageSize}
                    </div>
                  )}
                  {!cameraActive && capturedImage && (
                    <div className="absolute bottom-4 flex justify-center gap-4 z-10 w-full">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 shadow-md flex items-center gap-1.5 backdrop-blur-sm transition active:scale-95"
                      >
                        <RefreshCw size={13} />
                        Retake Photo
                      </button>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <p className="text-[10px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {cameraError}
                  </p>
                )}
              </div>

              {/* Presets Fallback */}
              {!cameraActive && (
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Demo Presets (No camera fallback)
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {DEMO_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectPreset(url)}
                        className="h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-gov-green transition focus:ring-1 focus:ring-gov-green/10"
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Compliance Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Rice, Dal Tadka and Banana served. Freshly prepared, good quality, warm service."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-gov-green focus:ring-1 focus:ring-gov-green/10"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !compressedImage}
                className="w-full py-3 rounded-xl bg-gov-green hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Compressing & Submitting...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Upload & Commit Evidence
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Upload Timeline (Right) */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-h-[750px] overflow-y-auto">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="text-gov-green" size={18} />
              <span>Evidence Upload Timeline</span>
            </h2>

            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="mx-auto text-slate-350 mb-2" size={32} />
                <p className="text-xs font-bold">No evidence uploads yet</p>
                <p className="text-[10px] mt-0.5">Completed daily logging displays here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3 hover:bg-slate-50/70 transition"
                  >
                    <div className="h-16 w-16 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                      <img src={item.imageUrl} alt={item.mealType} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          {item.mealType}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === "Approved" 
                            ? "bg-green-50 border-green-200 text-green-800" 
                            : item.status === "Reviewed"
                            ? "bg-blue-50 border-blue-200 text-blue-800"
                            : item.status === "Rejected"
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 font-semibold truncate">
                        {item.remarks || "No remarks logged"}
                      </p>

                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                        <Clock size={10} />
                        <span>{item.uploadTime} | {item.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>
    </AppShell>
  );
}
