import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Product, HarvestBatch, User, UserRole, SubscriptionStatus } from '../types';
import { verifyHash } from '../services/blockchain';
import { 
  ScanLine, Camera, Hash, AlertTriangle, CheckCircle2, Search, ArrowRight, 
  Loader2, ShieldCheck, XCircle, Info, Activity, UserCheck, ShieldAlert, Zap 
} from 'lucide-react';

interface QRScannerProps {
  products: Product[];
  batches: HarvestBatch[];
  logView: (id: string) => void;
  user: User | null;
  logScannerUsage: (targetId: string, scanType: 'Product' | 'KYC') => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ products, batches, logView, user, logScannerUsage }) => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'camera' | 'manual'>('camera');
  const [inputId, setInputId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [kycResult, setKycResult] = useState<any>(null);
  const [error, setError] = useState<{ message: string; type: 'warning' | 'error' } | null>(null);
  const [hasScannerSupport, setHasScannerSupport] = useState<boolean>(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const isConsumer = user?.role === UserRole.CONSUMER;
  const isExpired = user?.subscription.status === SubscriptionStatus.EXPIRED;

  // ID Normalization and Validation
  const normalizeId = (id: string) => id.trim().toUpperCase();
  
  const validateIdFormat = (id: string) => {
    const cleanId = normalizeId(id);
    if (cleanId.length < 3) return "ID too short. Please check the label.";
    
    if (isConsumer) {
      if (!cleanId.startsWith('B-') && !cleanId.startsWith('P-')) {
        return "Invalid Product/Batch ID. TrueChain codes start with B- or P-.";
      }
    } else {
      if (!cleanId.startsWith('ID-')) {
        return "Invalid Identity ID. Non-consumer roles must scan Government ID QRs (ID-XXXX).";
      }
    }
    return null;
  };

  const handleVerify = async (id: string) => {
    if (!id || isVerifying) return;
    if (isConsumer && isExpired) return;
    
    setError(null);
    setKycResult(null);
    const formatError = validateIdFormat(id);
    if (formatError) {
      setError({ message: formatError, type: 'warning' });
      return;
    }

    setIsVerifying(true);
    const cleanId = normalizeId(id);

    // Simulate blockchain verification and consensus delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (isConsumer) {
      const product = products.find(p => normalizeId(p.id) === cleanId);
      const batch = batches.find(b => normalizeId(b.id) === cleanId);

      if (product) {
        const isValid = verifyHash(product, product.blockchainHash);
        if (isValid) {
          logScannerUsage(product.id, 'Product');
          logView(product.id);
          stopCamera();
          navigate(`/traceability/${product.id}`);
        } else {
          setError({ message: 'CRITICAL: Blockchain signature mismatch. This product may be counterfeit or tampered with.', type: 'error' });
        }
      } else if (batch) {
        const isValid = verifyHash(batch, batch.blockchainHash);
        if (isValid) {
          logScannerUsage(batch.id, 'Product');
          logView(batch.id);
          stopCamera();
          navigate(`/traceability/${batch.id}`);
        } else {
          setError({ message: 'CRITICAL: Batch provenance hash invalid. Record integrity compromised.', type: 'error' });
        }
      } else {
        setError({ message: `Product/Batch "${cleanId}" is not registered on the TrueChain network.`, type: 'warning' });
      }
    } else {
      // Non-consumer KYC / ID flow
      if (cleanId.startsWith('ID-')) {
        logScannerUsage(cleanId, 'KYC');
        setKycResult({
          id: cleanId,
          status: 'Authenticated',
          verificationLevel: 'Government Tier 1',
          timestamp: new Date().toISOString(),
          details: 'Digital ID signature verified against regulatory node.'
        });
      } else {
        setError({ message: "Access Denied: Product verification is restricted to Consumer accounts.", type: "error" });
      }
    }
    setIsVerifying(false);
  };

  const startCamera = async () => {
    if (isConsumer && isExpired) return;
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          try { await (videoTrack as any).applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch (e) {}
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        if ('BarcodeDetector' in window) {
          // @ts-ignore
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const detect = async () => {
            if (videoRef.current && videoRef.current.readyState === 4 && !isVerifying) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const result = barcodes[0].rawValue;
                  if ('vibrate' in navigator) navigator.vibrate(100);
                  handleVerify(result);
                  return;
                }
              } catch (e) {}
            }
            detectionIntervalRef.current = requestAnimationFrame(detect);
          };
          detectionIntervalRef.current = requestAnimationFrame(detect);
        } else {
          setHasScannerSupport(false);
        }
      }
    } catch (err) {
      setError({ message: "Camera access denied. Please use manual entry.", type: 'warning' });
      setMethod('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      cancelAnimationFrame(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (method === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [method]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300">
        <div className={`p-8 text-white text-center relative overflow-hidden transition-colors ${isConsumer ? 'bg-emerald-600' : 'bg-slate-900'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-md">
              {isConsumer ? <ScanLine className="w-10 h-10" /> : <UserCheck className="w-10 h-10" />}
            </div>
            <h2 className="text-3xl font-black tracking-tight uppercase">
              {isConsumer ? 'Product Authenticator' : 'Identity Validator'}
            </h2>
            <p className="text-white/70 font-bold uppercase text-[10px] tracking-widest mt-2">
              {isConsumer ? 'Verify Supply Chain Integrity' : 'Regulatory KYC & ID Verification'}
            </p>
          </div>
        </div>

        <div className="p-8 relative">
          {isConsumer && isExpired && (
            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-xl border border-red-100">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Scanner Gated</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 max-w-xs">Your consumer subscription has expired. Renew your plan to access blockchain provenance data.</p>
              <Link to="/profile" className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
                <Zap className="w-4 h-4 fill-current" /> Upgrade Access
              </Link>
            </div>
          )}

          <div className="flex gap-4 mb-8 bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => { setMethod('camera'); setError(null); setKycResult(null); }}
              className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-200 ${method === 'camera' ? 'bg-white shadow-md text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Camera className="w-4 h-4" /> Live Scanner
            </button>
            <button 
              onClick={() => { setMethod('manual'); setError(null); setKycResult(null); }}
              className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-200 ${method === 'manual' ? 'bg-white shadow-md text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Hash className="w-4 h-4" /> Manual Entry
            </button>
          </div>

          {method === 'camera' ? (
            <div className="space-y-6">
              <div className="aspect-square bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-inner flex flex-col items-center justify-center">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] contrast-125"
                />
                <div className="absolute inset-0 bg-black/30 pointer-events-none border-[1.5rem] border-slate-900/40"></div>
                
                <div className="relative z-10">
                  <div className="w-56 h-56 border-2 border-white/20 rounded-[2rem] flex items-center justify-center relative bg-white/5 backdrop-blur-[1px]">
                    <div className={`absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 rounded-tl-2xl ${isConsumer ? 'border-emerald-500' : 'border-blue-500'}`}></div>
                    <div className={`absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 rounded-tr-2xl ${isConsumer ? 'border-emerald-500' : 'border-blue-500'}`}></div>
                    <div className={`absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 rounded-bl-2xl ${isConsumer ? 'border-emerald-500' : 'border-blue-500'}`}></div>
                    <div className={`absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 rounded-br-2xl ${isConsumer ? 'border-emerald-500' : 'border-blue-500'}`}></div>
                    
                    {!isVerifying && (
                      <div className={`absolute w-full h-1 opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[scan_2.5s_ease-in-out_infinite] ${isConsumer ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                    )}
                    
                    {isVerifying ? (
                      <div className="flex flex-col items-center gap-3 bg-slate-900/80 p-6 rounded-3xl backdrop-blur-md border border-white/10">
                        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Syncing Chain...</span>
                      </div>
                    ) : (
                      <ScanLine className="w-14 h-14 text-white/30" />
                    )}
                  </div>
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <p className="font-black text-[9px] uppercase tracking-[0.3em] text-white/60 drop-shadow-md">
                      Center QR code in focus area
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  value={inputId}
                  onChange={(e) => { setInputId(e.target.value); setError(null); setKycResult(null); }}
                  placeholder={isConsumer ? "Enter Product/Batch ID (P- or B-)" : "Enter Identity ID (ID-XXXX)"}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition font-mono font-black uppercase text-slate-700 placeholder:text-slate-300"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify(inputId)}
                />
              </div>
              <button 
                onClick={() => handleVerify(inputId)}
                disabled={isVerifying || !inputId.trim() || (isConsumer && isExpired)}
                className="w-full py-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98]"
              >
                {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Confirm Entry
              </button>
            </div>
          )}

          {kycResult && (
            <div className="mt-8 p-8 bg-blue-50 border border-blue-100 rounded-[2rem] animate-in zoom-in-95 duration-300">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">{kycResult.status}</h4>
                    <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">{kycResult.verificationLevel}</p>
                  </div>
               </div>
               <div className="space-y-3 pt-4 border-t border-blue-100">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Identity ID</span>
                    <span className="text-slate-700">{kycResult.id}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Audit Time</span>
                    <span className="text-slate-700">{new Date(kycResult.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic mt-4">"{kycResult.details}"</p>
               </div>
            </div>
          )}

          {error && (
            <div className={`mt-8 p-6 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-300 border ${error.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className={`p-2 rounded-xl bg-white shadow-sm shrink-0 mt-0.5 ${error.type === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                {error.type === 'error' ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <div className={`font-black uppercase text-[10px] tracking-widest ${error.type === 'error' ? 'text-red-800' : 'text-amber-800'}`}>
                  {error.type === 'error' ? 'Security Violation' : 'Verification Warning'}
                </div>
                <div className={`text-xs mt-1 font-medium leading-relaxed ${error.type === 'error' ? 'text-red-600' : 'text-amber-700'}`}>
                  {error.message}
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-4 text-slate-300">
             <div className="flex flex-col items-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/40 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">Blockchain Signed</span>
             </div>
             <div className="h-8 w-px bg-slate-100"></div>
             <div className="flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-emerald-500/40 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">KYC Compliant</span>
             </div>
             <div className="h-8 w-px bg-slate-100"></div>
             <div className="flex flex-col items-center">
                <Activity className="w-5 h-5 text-emerald-500/40 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">Chain Pulse</span>
             </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;