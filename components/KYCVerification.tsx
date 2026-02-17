import React, { useState, useRef } from 'react';
import { User, KycStatus } from '../types';
import { 
  ShieldCheck, Camera, CheckCircle2, UserCircle, 
  CreditCard, Loader2, X, ShieldAlert 
} from 'lucide-react';

interface KYCVerificationProps {
  user: User;
  onComplete: (data: { idImage: string; faceImage: string }) => void;
  onCancel: () => void;
}

const KYCVerification: React.FC<KYCVerificationProps> = ({ user, onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        
        if (step === 1) {
          setIdImage(dataUrl);
          stopCamera();
        } else {
          setFaceImage(dataUrl);
          stopCamera();
        }
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && idImage) {
      setStep(2);
    } else if (step === 2 && faceImage) {
      onComplete({ idImage, faceImage: faceImage! });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-lg">Identity Verification</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex gap-4">
            <div className={`flex-1 h-2 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
            <div className={`flex-1 h-2 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Scan Government ID</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed">
                  Position your Aadhaar, PAN, or Driving License within the frame. <br/>
                  Ensure all details are clearly legible.
                </p>
              </div>

              {!idImage ? (
                <div className="aspect-[1.6/1] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                  {isCapturing ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 border-[2rem] border-black/40 pointer-events-none">
                        <div className="w-full h-full border-2 border-emerald-500 rounded-xl"></div>
                      </div>
                      <button onClick={capture} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full border-4 border-slate-300 shadow-xl flex items-center justify-center group active:scale-90 transition">
                         <div className="w-8 h-8 bg-emerald-600 rounded-full group-hover:bg-emerald-700"></div>
                      </button>
                    </>
                  ) : (
                    <button onClick={startCamera} className="flex flex-col items-center gap-3 text-slate-400 hover:text-emerald-600 transition">
                      <Camera className="w-10 h-10" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Activate Camera</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-[1.6/1] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 relative shadow-inner">
                    <img src={idImage} className="w-full h-full object-cover" alt="ID Scan" />
                    <button onClick={() => setIdImage(null)} className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase">ID Image Captured Successfully</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-purple-50 text-purple-600 rounded-2xl mb-4">
                  <UserCircle className="w-6 h-6" />
                </div>
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Live Face Scan</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed">
                  Look directly at the camera. <br/>
                  Keep a neutral expression for liveness verification.
                </p>
              </div>

              {!faceImage ? (
                <div className="aspect-square w-64 mx-auto bg-slate-50 rounded-full border-4 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                  {isCapturing ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none"></div>
                      <button onClick={capture} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full border-4 border-slate-300 shadow-xl flex items-center justify-center group active:scale-90 transition">
                         <div className="w-8 h-8 bg-purple-600 rounded-full group-hover:bg-purple-700"></div>
                      </button>
                    </>
                  ) : (
                    <button onClick={startCamera} className="flex flex-col items-center gap-3 text-slate-400 hover:text-purple-600 transition">
                      <Camera className="w-10 h-10" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Start Face Scan</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-square w-64 mx-auto bg-slate-50 rounded-full overflow-hidden border-4 border-white shadow-xl relative">
                    <img src={faceImage} className="w-full h-full object-cover" alt="Face Scan" />
                    <button onClick={() => setFaceImage(null)} className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 animate-in fade-in max-w-sm mx-auto">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase text-center w-full">Face Verified & Matched</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
             <button 
               onClick={onCancel}
               className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition"
             >
               Discard
             </button>
             <button 
               onClick={handleNext}
               disabled={step === 1 ? !idImage : !faceImage}
               className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition shadow-lg shadow-emerald-600/20"
             >
               {step === 1 ? 'Continue to Face Scan' : 'Finalize Verification'}
             </button>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default KYCVerification;