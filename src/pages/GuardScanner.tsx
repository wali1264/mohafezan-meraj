import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import jsQR from 'jsqr';
import { ChevronLeft, CheckCircle2, XCircle, ShieldAlert, History, Upload } from 'lucide-react';
import { useAppStore, User } from '../store';
import { verifySecuredPayload } from '../lib/crypto';

interface ScanResult {
  status: 'valid' | 'invalid' | 'expired' | 'idle';
  user?: User;
  errorStr?: string;
}

export default function GuardScanner() {
  const navigate = useNavigate();
  const { getUserById, addLog } = useAppStore();
  
  const [result, setResult] = useState<ScanResult>({ status: 'idle' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [camError, setCamError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto reset the result after 5 seconds
  useEffect(() => {
    if (result.status !== 'idle') {
      const timer = setTimeout(() => {
        setResult({ status: 'idle' });
        setIsProcessing(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleScan = useCallback((detectedCodes: { rawValue: string }[]) => {
    if (isProcessing) return;
    
    const code = detectedCodes[0]?.rawValue;
    if (!code) return;

    setIsProcessing(true);

    const verification = verifySecuredPayload(code);

    if (!verification.valid) {
      setResult({ 
        status: verification.error?.includes('expired') ? 'expired' : 'invalid',
        errorStr: verification.error
      });
      // Log failed scan
      addLog({
        userId: verification.id || 'unknown',
        time: Date.now(),
        gate: 'Main Gate',
        verified: false,
        error: verification.error
      });
      return;
    }

    const user = getUserById(verification.id!);
    
    if (!user) {
      setResult({ 
        status: 'invalid',
        errorStr: "User not found in local database (Sync needed)"
      });
      addLog({
        userId: verification.id!,
        time: Date.now(),
        gate: 'Main Gate',
        verified: false,
        error: "Not in DB"
      });
      return;
    }

    // Success!
    setResult({ status: 'valid', user });
    addLog({
      userId: user.id,
      time: Date.now(),
      gate: 'Main Gate',
      verified: true
    });
    
  }, [isProcessing, getUserById, addLog]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleScan([{ rawValue: code.data }]);
        } else {
          setCamError("هیچ کد QR در عکس یافت نشد / No QR found in image");
          setTimeout(() => setCamError(""), 3000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="p-4 flex items-center bg-slate-800 text-white shadow-md relative z-10">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-700 rounded-full mr-3">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Guard Scanner Mode</h1>
        
        {/* Connection status indicator (Offline simulator) */}
        <div className="ml-auto flex items-center text-xs font-semibold px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
          OFFLINE READY
        </div>
      </div>

      <div className="flex-1 relative flex flex-col">
        {result.status === 'idle' ? (
          <div className="flex-1 w-full bg-black relative">
            <Scanner
               onScan={handleScan}
               onError={(e) => setCamError((e as Error)?.message || String(e))}
               styles={{ container: { width: '100%', height: '100%' } }}
               components={{ finder: false }}
            />
            {camError && (
              <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-xl text-center z-50 text-sm font-semibold shadow-lg">
                خطای دوربین / Camera Error:<br/>
                {camError}<br/>
                <span className="text-xs font-normal opacity-80 mt-1 block">
                  Please grant camera permissions and ensure the device has a camera.
                </span>
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 border-[40px] border-black/50 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-indigo-500 rounded-3xl relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-3xl"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-3xl"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-3xl"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-3xl"></div>
              </div>
            </div>
            <div className="absolute bottom-12 w-full flex flex-col items-center justify-center text-white/70 font-medium z-50">
              <p className="mb-4 text-center">Point camera at personnel QR code</p>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center font-bold"
              >
                <Upload className="w-5 h-5 mr-2" />
                اسکن از گالری / Scan Image
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                className="hidden" 
                onChange={handleImageUpload}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
            {result.status === 'valid' && result.user && (
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden text-center transform transition-all animate-in zoom-in-95 fade-in">
                <div className="bg-green-500 p-6 pt-10 text-white flex flex-col items-center">
                  <CheckCircle2 className="w-16 h-16 mb-4" />
                  <h2 className="text-3xl font-bold">VERIFIED</h2>
                </div>
                <div className="p-8 -mt-10 relative">
                  <img 
                    src={result.user.photoBase64} 
                    alt={result.user.name} 
                    className="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-lg object-cover bg-slate-200"
                  />
                  <h3 className="mt-6 text-2xl font-bold text-slate-800 flex items-center justify-center">
                    {result.user.name}
                    <CheckCircle2 className="w-6 h-6 text-blue-500 ml-2" />
                  </h3>
                  <p className="inline-block mt-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full font-bold uppercase tracking-wider">
                    {result.user.role}
                  </p>
                </div>
              </div>
            )}

            {result.status === 'invalid' && (
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden text-center border-2 border-red-500 transform transition-all animate-in slide-in-from-bottom-4 fade-in">
                <div className="bg-red-500 p-8 text-white flex flex-col items-center">
                  <XCircle className="w-16 h-16 mb-4" />
                  <h2 className="text-3xl font-bold tracking-tight">ACCESS DENIED</h2>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Fake or Invalid QR</h3>
                  <p className="text-red-500 font-medium bg-red-50 p-4 rounded-xl">
                    {result.errorStr}
                  </p>
                </div>
              </div>
            )}

            {result.status === 'expired' && (
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden text-center border-2 border-orange-500 transform transition-all animate-in bounce-in fade-in">
                <div className="bg-orange-500 p-8 text-white flex flex-col items-center">
                  <ShieldAlert className="w-16 h-16 mb-4" />
                  <h2 className="text-3xl font-bold tracking-tight">EXPIRED QR</h2>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Dynamic Timer Ended</h3>
                  <p className="text-orange-600 font-medium bg-orange-50 p-4 rounded-xl">
                    Please ask the personnel to show their updated QR code.
                  </p>
                </div>
              </div>
            )}
            
            <p className="mt-8 text-slate-400 font-medium animate-pulse">
              Resetting scanner in a few seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
