import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store';
import { generateSecuredPayload } from '../lib/crypto';

export default function UserCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.getUserById(id!));
  
  const [payload, setPayload] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!user) return;

    // Generate immediately
    setPayload(generateSecuredPayload(user.id));
    setTimeLeft(60);

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPayload(generateSecuredPayload(user.id));
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">User not found</h1>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-6 text-white pb-12">
      <div className="w-full max-w-md mt-4 mb-8 flex justify-between items-center">
        <button onClick={() => navigate('/')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-slate-400 font-medium tracking-wide">ID CARD</span>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Dynamic header background based on role */}
        <div className={`h-32 w-full ${user.role === 'Student' ? 'bg-emerald-500' : 'bg-blue-600'} relative`}>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center">
              <img src={user.photoBase64} alt={user.name} className="w-full h-full object-cover" />
            </div>
        </div>

        <div className="pt-20 pb-8 px-6 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            {user.name}
            <ShieldCheck className="w-6 h-6 text-blue-500 ml-2" />
          </h2>
          <span className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold uppercase tracking-wider">
            {user.role}
          </span>
          
          <p className="text-xs text-slate-400 mt-4 text-center">
            Present this code to the guard. <br/> Works offline.
          </p>

          <div className="mt-8 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl relative">
            {payload ? (
              <QRCodeSVG 
                value={payload} 
                size={220}
                bgColor={"#f8fafc"} // slate-50
                fgColor={"#0f172a"} // slate-900
                level={"M"}
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-slate-200 animate-pulse rounded-lg"></div>
            )}
            
            {/* Countdown visualizer */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-md">
              <RefreshCw className={`w-3 h-3 mr-2 ${timeLeft < 10 ? 'animate-spin text-red-400' : ''}`} />
              Updates in {timeLeft}s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
